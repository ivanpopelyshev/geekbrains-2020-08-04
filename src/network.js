import * as io from "socket.io-client";
import * as PIXI from "pixi.js";

const style = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 20,
  fill: "#ffffff",
});

export class Network {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.sid = 0;
    this.socket = null;

    this.data = { players: [] };

    this.sprites = [];
  }

  initLevel(lvl) {
    this.sprites = [];
    this.data = { players: [] };
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
      this.data = data;
      console.log(data);
    }).on('player_add', (player) => {
      this.active = 2;
      const sprite = new PIXI.Sprite(this.app.loader.resources.bunny.texture);
      sprite.anchor.set(0.5);
      sprite.uid = player.uid;

      const text = new PIXI.Text(player.name, style);
      text.position.set(0, -30);
      text.anchor.set(0.5, 1.0);
      sprite.addChild(text);

      this.sprites.push(sprite);

      this.app.pixiRoot.addChild(sprite);

      this.data.players.push(player);
    }).on('player_remove', (player) => {
      const { sprites } = this;
      for (let j=0;j<sprites.length;j++) {
        const sprite = sprites[j];
        if (player.uid === sprite.uid) {
          sprites.splice(j, 1);
          sprite.destroy();
          break;
        }
      }

      const { players } = this.data;
      for (let j=0;j<players.length;j++) {
        if (player.uid === players[j].uid) {
          players.splice(j, 1);
          break;
        }
      }
    });

    this.active = 1;
  }

  loop() {
    const { players } = this.data;
    const { sprites } = this;

    cycle2:for (let i=0;i<players.length;i++) {
      const player = players[i];
      for (let j=0;j<sprites.length;j++) {
        const sprite = sprites[j];
        if (sprite.uid === player.uid) {
          sprite.x = player.x;
          sprite.y = player.y;
          continue cycle2;
        }
      }
      console.log('desync!');
    }
  }
}
