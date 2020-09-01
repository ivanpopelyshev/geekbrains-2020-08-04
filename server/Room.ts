import {Actor} from './shared/Actor';
import {TestBot} from './TestBot';

let roomCounter = 0;

export class Room {
    uid: number;
    actors: Array<Actor>;
    actorCounter: number;
    TICK: number;
    wsUsers: Array<any>;
    intervalId: any;

    constructor() {
        this.uid = ++roomCounter;

        this.actors = [];
        this.actorCounter = 0;

        this.TICK = 0.1;

        this.wsUsers = [];

        this.intervalId = 0;

        for (let i=0;i<8;i++) {
            new TestBot().connect(this);
        }
    }

    onJoin(wsUser) {
        if (wsUser.roomUid === this.uid) {
            return;
        }

        wsUser.roomUid = this.uid;
        this.wsUsers.push(wsUser);

        const {actors} = this;

        const actor = wsUser.actor = new Actor();
        actor.uid = ++this.actorCounter;
        actor.name = (wsUser.isBot ? `bot` : `player`) + actor.uid;
        actor.x = (Math.random() * 520 | 0) + 100;
        actor.y = (Math.random() * 1080 | 0) + 100;
        actor.target = {x: actor.x, y: actor.y};

        // this.socket.emit('game', {players});
        //TODO: init packet?

        for (let i = 0; i < actors.length; i++) {
            wsUser.socket.emit('actor_add', actors[i].toJson());
        }
        this.broadcastEvent('actor_add', actor.toJson());

        actors.push(actor);

        //TODO: remove if user joins another room?
        wsUser.socket.on('click', (data) => {
            actor.target.x = data.x || 0;
            actor.target.y = data.y || 0;
        });
    }

    //1. бот как игрок onJoin
    //2. botJoin

    onLeave(wsUser) {
        if (wsUser.roomUid !== this.uid) {
            return;
        }
        wsUser.roomUid = -1;
        this.wsUsers.splice(this.wsUsers.indexOf(wsUser), 1);

        if (wsUser.actor) {
            const ind = this.actors.indexOf(wsUser.actor);
            this.actors.splice(ind, 1);
            this.broadcastEvent('actor_remove', wsUser.actor.uid);
            wsUser.actor = null;
        }
    }

    broadcast() {
        const {actors, wsUsers} = this;

        for (let i=0;i<wsUsers.length;i++) {
            const wsUser = wsUsers[i];
            wsUser.socket.emit('game', {
                players: actors.map((x) => x.toDeltaJson())
            });
        }
    }

    broadcastEvent(ev, data) {
        const {actors, wsUsers} = this;

        for (let i=0;i<wsUsers.length;i++) {
            const wsUser = wsUsers[i];
            wsUser.socket.emit(ev, data);
        }
    }

    loop() {
        const {actors} = this;
        let dataChanged = false;

        for (let i=0;i<actors.length;i++) {
            const actor = actors[i];
            actor.physUpdate(this.TICK);
            dataChanged = dataChanged || actor.changed;
        }
        if (dataChanged) {
            this.broadcast();
        }
    }

    start() {
        if (this.intervalId !== 0) {
            return;
        }

        this.intervalId = setInterval(() => {
            this.loop();
        }, 1000 * this.TICK);
    }

    stop() {
        if (this.intervalId === 0) {
            return;
        }

        clearInterval(this.intervalId);
    }
}
