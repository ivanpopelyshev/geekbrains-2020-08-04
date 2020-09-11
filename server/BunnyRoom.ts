import { Room, Client } from "colyseus";

import {Actor, State} from '../src/shared/Actor';
import {TestBot} from './TestBot';
import {userByToken} from "./User";

let roomCounter = 0;

interface MouseMessage {
    x: number;
    y: number;
}

export class BunnyRoom extends Room<State> {
    uid: number;
    actorCounter: number;
    TICK: number;
    wsUsers: Array<any>;
    intervalId: any;
    actors: Array<Actor>;
    deadActors: Array<Actor>;

    constructor() {
        super();
        this.uid = ++roomCounter;

        this.actors = [];
        this.deadActors = [];
        this.actorCounter = 0;

        this.TICK = 0.1;

        this.wsUsers = [];

        this.intervalId = 0;

        // for (let i=0;i<8;i++) {
        //     new TestBot().connect(this);
        // }
    }

    onCreate() {
        this.setState(new State());

        //TODO: remove if user joins another room?
        this.onMessage("click",
            (client, data: MouseMessage) => {
            const actor = (client as any).actor;
            actor.target.x = data.x || 0;
            actor.target.y = data.y || 0;
        });

        this.setSimulationInterval(() => {
            this.loop();
        }, this.TICK * 1000);
    }

    onJoin(wsUser) {
        this.wsUsers.push(wsUser);

        const {actors} = this;

        const actor = wsUser.actor = new Actor();
        actor.uid = ++this.actorCounter;
        actor.name =
            wsUser.user.nickname || ((wsUser.isBot ? `bot` : `player`) + actor.uid);
        actor.x = (Math.random() * 520 | 0) + 100;
        actor.y = (Math.random() * 1080 | 0) + 100;
        actor.target.x = actor.x;
        actor.target.y = actor.y;

        actors.push(actor);

        this.state.actorByUid[actor.uid] = actor;
    }

    //1. бот как игрок onJoin
    //2. botJoin

    onLeave(wsUser) {
        const actor: Actor = (wsUser as any).actor;

        this.wsUsers.splice(this.wsUsers.indexOf(wsUser), 1);

        if (actor) {
            const ind = this.actors.indexOf(wsUser.actor);
            this.actors.splice(ind, 1);
            actor.dead = true;
            this.deadActors.push(actor);
            wsUser.actor = null;
        }
    }

    onAuth (wsUser, options, request): Promise<any> {
        return new Promise((resolve, reject) => {
            const usr = userByToken[options.accessToken];
            if (!usr) {
                reject(new Error("bad token"));
            }
            const {wsUsers} = this;
            const oldWsUser: Client = wsUsers.filter((x) => {return x.usr === usr })[0];

            if (oldWsUser) {
                oldWsUser.close(0, "duplicate connection");
            }

            if (options.nickname) {
                usr.nickname = options.nickname;
            }
            wsUser.user = usr;

            resolve({});
        });
    }

    loop() {
        const {actors, deadActors, state} = this;

        for (let i=0;i<deadActors.length;i++) {
            const actor = deadActors[i];
            delete state.actorByUid[actor.uid];
        }
        deadActors.length = 0;

        for (let i=0;i<actors.length;i++) {
            const actor = actors[i];
            actor.physUpdate(this.TICK);
        }
    }
}
