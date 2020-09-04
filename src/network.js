import { Room, Client } from "colyseus.js";
import { Actor, State } from "./shared/Actor";
import PIXI from "pixi.js";

export class Network {
  constructor(app) {
    this.app = app;
    this.active = 0;
    this.sid = 0;
    this.client = new Client();

    this.sprites = [];
    this.room = null;
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
    this.authenticate();

    const { pixiRoot } = this.app;

    pixiRoot.on("pointerdown", e => {
      const point = pixiRoot.toLocal(e.data.global);

      if (this.room && this.active === 2) {
        this.room.send('click', { x: Math.round(point.x), y: Math.round(point.y) });
      }
    });
  }

  async authenticate() {
    this.active = 1;
    // anonymous auth
    //await this.client.auth.login();
    console.log("Success!", this.client.auth);

    this.room = await this.client.joinOrCreate("bunnies");

    this.active = 2;

    this.room.state.actorByUid.onAdd = (actor, uid) => {
      actor.physUpdate = Actor.prototype.physUpdate;
      actor.ox = 0;
      actor.oy = 0;
      this.actors.push(actor);

      this.app.game.add({ actor } , {
        bunny: 1,
        text: actor.name
      });

      actor.onChange = (changes) => {
        for (let i=0;i<changes.length;i++) {
          const change = changes[i];
          if (change.field==='x') {
            actor.ox += change.previousValue - change.value;
          }
          if (change.field==='y') {
            actor.oy += change.previousValue - change.value;
          }
        }
      }
    };

    this.room.state.actorByUid.onRemove = (actor, uid) => {
      this.actors.splice(this.actors.indexOf(actor), 1);
      this.app.game.remove(actor.entity);
    };
  }

  disconnect() {
    this.room.leave();
    this.room = null;
  }

  loop(deltaFrame) {
    const { actors } = this;

    //goto label;

    for (let i=0;i<actors.length;i++) {
      const actor = actors[i];
      const {entity} = actor;
      const {pixi} = entity;

      actor.physUpdate(deltaFrame / 60);

      if (Math.abs(actor.ox) < 0.1) actor.ox = 0;
      else actor.ox *= 0.85;

      if (Math.abs(actor.oy) < 0.1) actor.oy = 0;
      else actor.oy *= 0.85;

      pixi.x = actor.x + actor.ox;
      pixi.y = actor.y + actor.oy;
    }
  }
}
