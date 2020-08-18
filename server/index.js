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

const players = [];
let playerCounter = 0;

let dataChanged = false;
const TICK = 0.1;

class WSUser {
    constructor(user, socket) {
        this.user = user;
        this.socket = socket;
        socket.wsUser = this;
    }

    onJoin() {
        const uid = ++playerCounter;
        this.player = {x: 0, y: 0, name: `user${uid}`, uid};

        this.player.x = (Math.random() * 520 | 0) + 100;
        this.player.y = (Math.random() * 1080 | 0) + 100;
        this.target = { x: this.player.x, y: this.player.y };

        // this.socket.emit('game', {players});
        //TODO: init packet?

        for (let i=0;i<players.length;i++) {
            this.socket.emit('player_add', players[i]);
        }
        broadcastEvent('player_add', this.player);

        players.push(this.player);

        this.socket.on('click', (data) => {
            this.target.x = data.x || 0;
            this.target.y = data.y || 0;
            broadcast();
        });
    }

    // 1. ADD / REMOVE events
    // 2. interpolation

    update() {
        const { player, target } = this;

        const dx = target.x - player.x, dy = target.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1e-3) {
            return;
        }

        const speed = 300; // per second
        const dd = speed * TICK;// per tick
        if (dist <= dd) {
            player.x = target.x;
            player.y = target.y;
        } else {
            player.x += dx / dist * dd;
            player.y += dy / dist * dd;
        }
        dataChanged = true;
    }

    onDisconnect() {
        if (!this.socket) {
            return;
        }
        this.socket.wsUser = null;
        this.socket = null;
        delete wsByToken[this.user.token];

        const ind = players.indexOf(this.player);
        players.splice(ind, 1);
        broadcastEvent('player_remove', this.player);
    }
}

function broadcast() {
    for (let key in wsByToken) {
        const wsUser = wsByToken[key];
        wsUser.socket.emit('game', {players});
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
        wsUser.update();
    }
    if (dataChanged) {
        broadcast();
    }
}, 1000 * TICK);
