const EventEmitter = require('events');
const {Actor} = require('../src/shared/Actor');

let botCounter = 0;

class TestBot {
    constructor() {
        this.socket = null;
        this.sid = ++botCounter;

        this.actorByUid = {};
        this.actors = [];
        this.active = 0;

        //bot data
        this.moveTicks = 0;
        this.isBot = true;
    }

    connect(room) {
        const sid = this.sid = ++botCounter;

        this.active = 1;
        const socket = this.socket = new EventEmitter();
        socket.on('game', (data) => {
            if (this.sid !== sid) {
                return;
            }

            this.active = 2;
            for (let i=0;i<data.players.length;i++) {
                const player = data.players[i];
                const actor = this.actorByUid[player.uid];
                actor.applyJson(player);
            }

            setTimeout(() => {
                this.updateLogic();
            }, 10 + (Math.random()*50|0));
        }).on('actor_add', (player) => {
            this.active = 2;

            const actor = new Actor();
            actor.applyJson(player);

            this.actorByUid[player.uid] = actor;
            this.actors.push(actor);
        }).on('actor_remove', (uid) => {
            const actor = this.actorByUid[uid];
            this.actorByUid[uid] = null;
            this.actors.splice(this.actors.indexOf(actor), 1);
        });

        this.active = 1;
        room.onJoin(this);
    }

    updateLogic() {
        if (this.moveTicks === 0) {
            const x = Math.random()*720|0;
            const y = Math.random()*1280|0;
            this.socket.emit('click', {x, y});

            this.moveTicks = (Math.random() * 10 + 5) | 0;
        } else {
            this.moveTicks--;
        }
    }
}

module.exports = {
    TestBot
}
