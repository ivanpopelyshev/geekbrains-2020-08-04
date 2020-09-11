import * as http from "http";
import express from "express";
import * as fs from "fs";

import { Server } from "colyseus";
import basicAuth from "express-basic-auth";
import socialRoutes from "@colyseus/social/express";
import { monitor } from "@colyseus/monitor";

import { BunnyRoom } from "./BunnyRoom";
import {getUser} from "./User";

const app = express();

app.use("/api", express.json());

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
