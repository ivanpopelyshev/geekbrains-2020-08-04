import * as io from "socket.io-client";
import { Actor } from "./shared/Actor";

export class Network {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.sid = 0;
    this.socket = null;

    this.sprites = [];
    this.actorByUid = {};
    this.actors = [];
  }

  initLevel(lvl) {
    this.sprites = [];
    if (!lvl.network) {
      if (this.active) {
        this.disconnect();
        this.active = 0;
      }
      return;
    }
    this.sid++;
    this.connect();

    const { pixiRoot } = this.app;

    pixiRoot.on("pointerdown", e => {
      const point = pixiRoot.toLocal(e.data.global);

      if (this.socket && this.active === 2) {
        this.socket.emit('click', { x: point.x, y: point.y });
      }
    });
  }

  disconnect() {
    if (!this.active) {
      return;
    }
    this.socket.close();
    this.socket = null;
    this.active = 0;
    this.sid++;
  }

  connect() {
    const {sid} = this;

    let socket = this.socket = io.connect(`${window.location.protocol}//${window.location.host}`, {transports: ['websocket']});
    socket.on('connect', (data) => {
      if (this.sid !== sid) {
        socket.close();
        return;
      }
      this.active = 1;
      socket.emit('reg', {token: window.config.token});
    }).on('disconnect', (data) => {
      if (this.sid !== sid) {
        return;
      }
      this.active = 0;
    }).on('game', (data) => {
      if (this.sid !== sid) {
        return;
      }
      this.active = 2;

      for (let i=0;i<data.players.length;i++) {
        const player = data.players[i];
        this.actorByUid[player.uid].applyJson(player);
      }

      console.log(data);
    }).on('actor_add', (player) => {
      this.active = 2;

      const actor = new Actor();
      actor.applyJson(player);

      this.app.game.add({ actor } , {
        bunny: 1,
        text: player.name
      })

      this.actorByUid[player.uid] = actor;
      this.actors.push(actor);

    }).on('actor_remove', (uid) => {
      const actor = this.actorByUid[uid];
      this.actorByUid[uid] = null;
      this.actors.splice(this.actors.indexOf(actor), 1);

      this.app.game.remove(actor.entity);
    });

    this.active = 1;
  }

  loop(deltaFrame) {
    const { actors } = this;

    //goto label;

    for (let i=0;i<actors.length;i++) {
      const actor = actors[i];
      const {entity} = actor;
      const {pixi} = entity;

      actor.physUpdate(deltaFrame / 60);

      if (actor.teleport) {
        actor.teleport = false;
        pixi.x = actor.x;
        pixi.y = actor.y;
      } else {
        pixi.x = actor.x;
        pixi.y = actor.y;
      }
    }
  }
}
