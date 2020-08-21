const http = require("http");
const express = require("express");
const uuid = require("uuid");
const md5 = require("md5");
const fs = require('fs');

const api_secret = 'VmGsge58F2kL6TOCoHnq';

const app = express();

app.use("/api", express.json());

class User {
    constructor(options) {
        const {token, viewer_id} = options || {};
        this.token = token || uuid();
        this.viewer_id = viewer_id || 0;
    }
}

const userByViewer = {}, userByToken = {};

function getUser(req) {
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

const io = require("socket.io");
const websocket = io.listen(server, {log: false, transports: ['websocket']});
const wsByToken = {};

const actors = [];
let actorCounter = 0;

let dataChanged = false;
const TICK = 0.1;

const { Actor } = require('../src/shared/Actor');

class WSUser {
    constructor(user, socket) {
        this.user = user;
        this.socket = socket;
        socket.wsUser = this;
    }

    onJoin() {
        const actor = this.actor = new Actor();
        actor.uid = ++actorCounter;
        actor.name = `user${actor.uid}`;
        actor.x = (Math.random() * 520 | 0) + 100;
        actor.y = (Math.random() * 1080 | 0) + 100;
        actor.target = { x: actor.x, y: actor.y };

        // this.socket.emit('game', {players});
        //TODO: init packet?

        for (let i=0;i<actors.length;i++) {
            this.socket.emit('actor_add', actors[i].toJson());
        }
        broadcastEvent('actor_add', actor.toJson());

        actors.push(actor);

        this.socket.on('click', (data) => {
            actor.target.x = data.x || 0;
            actor.target.y = data.y || 0;
            broadcast();
        });
    }

    // 2. interpolation

    onDisconnect() {
        if (!this.socket) {
            return;
        }
        this.socket.wsUser = null;
        this.socket = null;
        delete wsByToken[this.user.token];

        const ind = actors.indexOf(this.actor);
        actors.splice(ind, 1);
        broadcastEvent('actor_remove', this.actor.uid);
    }
}

function broadcast() {
    for (let key in wsByToken) {
        const wsUser = wsByToken[key];
        wsUser.socket.emit('game', {
            players: actors.map((x) => x.toDeltaJson())
        });
    }
}

function broadcastEvent(ev, data) {
    for (let key in wsByToken) {
        const wsUser = wsByToken[key];
        wsUser.socket.emit(ev, data);
    }
}

websocket.on('connection', function (socket) {
    const regHandler = (data) => {
        if (data.token && userByToken[data.token]) {
            let wsUser = wsByToken[data.token];
            if (wsUser) {
                wsUser.socket.disconnect();
                wsUser.onDisconnect();
            }

            wsUser = new WSUser(userByToken[data.token], socket);
            wsByToken[data.token] = wsUser;
            wsUser.onJoin();

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

setInterval(() => {
    dataChanged = false;
    for (let key in wsByToken) {
        const wsUser = wsByToken[key];
        wsUser.actor.physUpdate(TICK);
        dataChanged |= wsUser.actor.changed;
    }
    if (dataChanged) {
        broadcast();
    }
}, 1000 * TICK);
