import * as http from "http";
import express from "express";
import * as fs from "fs";
import md5 from "md5";
import uuid from "uuid";

import { Server } from "colyseus";
import basicAuth from "express-basic-auth";
import socialRoutes from "@colyseus/social/express";
import { monitor } from "@colyseus/monitor";

import { BunnyRoom } from "./BunnyRoom";

const api_secret = 'VmGsge58F2kL6TOCoHnq';

const app = express();

app.use("/api", express.json());

class User {
    token: string;
    viewer_id: number;
    constructor(options: any) {
        const {token, viewer_id} = options || {};
        this.token = token || uuid();
        this.viewer_id = +viewer_id || 0;
    }
}

const userByViewer = {}, userByToken = {};

function getUser(req: any) {
    const {viewer_id, api_id, auth_key} = req.query;
    const check_auth_key = md5(api_id + '_' + viewer_id + '_' + api_secret);

    if (auth_key !== check_auth_key) {
        return false;
    }

    let usr = userByViewer[viewer_id];
    if (usr) {
        return usr;
    }
    usr = new User({viewer_id});
    userByViewer[usr.viewer_id] = userByToken[usr.token] = usr;

    return usr;
}


app.get("/api", (req, res) => {
    res.send({
        VERSION: 10
    })
});

function uglyTemplate(req, res) {
    const usr = getUser(req);
    if (!usr) {
        res.send(403);
        return;
    }

    const jsCode = `
    window.config = {
        token: '${usr.token}',
    };
    `;

    fs.readFile(__dirname + '/../dist/index.html', 'utf8', (err, data) => {
        const result = data.replace('/* AUTH */', jsCode)
            .replace('<script></script>', `<script>${jsCode}</script>`);
        res.send(result);
    });
}

app.get("/", uglyTemplate);
app.get("/index.html", uglyTemplate);

app.use("/", express.static(__dirname + "/../dist"));
//app.use("/", socialRoutes);

const gameServer = new Server({
    server: http.createServer(app),
    express: app
});

gameServer.define("bunnies", BunnyRoom);

const auth = basicAuth({ users: { 'admin': 'admin' }, challenge: true });
app.use("/colyseus", auth, monitor());

const port = 2345;
gameServer.listen(port);
console.log(`Listening on ${port}`);

// https://localhost:2345/?api_id=7558520&viewer_id=1787423&auth_key=ef85ea88588c32d3dd4230d7ac040c05
