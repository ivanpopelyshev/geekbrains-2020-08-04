import * as http from "http";
import * as express from "express";
import * as fs from "fs";
import * as md5 from "md5";
import * as uuid from "uuid";
import * as io from "socket.io";

import { Room } from "./Room";

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

const server = http.createServer(app);
server.listen(2345, "0.0.0.0", () => {
    console.log("Server started on:", 2345);
});

// https://localhost:2345/?api_id=7558520&viewer_id=1787423&auth_key=ef85ea88588c32d3dd4230d7ac040c05

// ********* NETWORK ********

const websocket = io.listen(server, {log: false, transports: ['websocket']});
const wsByToken = {};
const room = new Room();

class WSUser {
    user: User;
    socket: any;
    constructor(user: User, socket: any) {
        this.user = user;
        this.socket = socket;
        socket.wsUser = this;
    }

    // 2. interpolation
    onDisconnect() {
        if (!this.socket) {
            return;
        }
        this.socket.wsUser = null;
        this.socket = null;
        delete wsByToken[this.user.token];

        room.onLeave(this);
    }
}

websocket.on('connection', function (socket: any) {
    const regHandler = (data) => {
        if (data.token && userByToken[data.token]) {
            let wsUser = wsByToken[data.token];
            if (wsUser) {
                wsUser.socket.disconnect();
                wsUser.onDisconnect();
            }

            wsUser = new WSUser(userByToken[data.token], socket);
            wsByToken[data.token] = wsUser;
            room.onJoin(wsUser);

            socket.off('reg', regHandler);
        }
    }

    socket.on('reg', regHandler);

    socket.on('disconnect', () => {
        if (socket.wsUser) {
            socket.wsUser.onDisconnect();
        }
    })
});

room.start();
