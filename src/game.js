import * as PIXI from "./pixi";
import { LevelTiled, LevelCircles } from "./levels";
import { Entity } from "./entity";

const lvl1 = new LevelCircles({});
const lvl2 = new LevelTiled({});

const style = new PIXI.TextStyle({
  fontFamily: "Arial",
  fontSize: 36,
  fontStyle: "italic",
  fontWeight: "bold",
  fill: ["#ffffff", "#00ff99"], // gradient
  stroke: "#4a1850",
  strokeThickness: 5,
  dropShadow: true,
  dropShadowColor: "#000000",
  dropShadowBlur: 4,
  dropShadowAngle: Math.PI / 6,
  dropShadowDistance: 6,
  wordWrap: true,
  wordWrapWidth: 440
});

export class Game {
  constructor(app) {
    this.app = app;

    this.levels = [lvl1, lvl2];

    this.entities = [];

    this.started = false;
  }

  initLevel() {
    this.started = true;
    if (this.pixiRoot) {
      this.pixiRoot.destroy({ children: true });
    }
    this.entities = [];
    this.pixiRoot = new PIXI.Container();
    this.app.stage.addChildAt(this.pixiRoot, 0);
  }

  add(dict, model) {
    let entity = null;
    if (dict instanceof Entity) {
      entity = dict;
    } else {
      entity = new Entity(dict, model);
    }

    this.entities.push(entity);
    this.app.runners.addEntity.run(entity);
  }

  remove(entity) {
    entity.dead = true;
  }

  lateLoop() {
    const { entities, app } = this;
    let j = 0;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];

      if (entity.dead) {
        app.runners.removeEntity.emit(entity);
      } else {
        entities[j++] = entity;
      }
    }
    entities.length = j;
  }

  onStartup() {
    const { app, levels } = this;

    app.preloader.show();

    app.ticker.add(delta => {
      if (this.started) {
        app.runners.earlyLoop.run(delta);
        app.runners.loop.run(delta);
        app.runners.lateLoop.run(delta);
      }
    });

    const options = { crossOrigin: "*" };
    app.loader.baseUrl = "../assets";
    app.loader
      .add("bg_tiled_layer1", "bg_tiled_layer1.png", options)
      .add("bg_tiled_layer2", "bg_tiled_layer2_stars.png", options)
      .add(
        "bunny",
        "https://pixijs.io/examples/examples/assets/bunny.png",
        options
      )
      .add("my-map", "my-map.json", options);

    app.loader.load(() => {
      setTimeout(() => {
        app.preloader.hide();

        this.level = lvl1;
        app.runners.initLevel.run(this.level);
        this.level.init(app);

        for (let i = 0; i < levels.length; i++) {
          const lvl = levels[i];
          const btn = new PIXI.Text(`Level ${i + 1}`, style);
          btn.x = ((i + 1) * app.screen.width) / (levels.length + 1);
          btn.y = 1200;
          btn.anchor.set(0.5);
          app.stage.addChild(btn);

          btn.interactive = true;
          btn.click = () => {
            if (lvl !== this.level) {
              this.level = lvl;
              app.runners.initLevel.run(this.level);
              this.level.init(app);
            }
          };
        }
      }, 3000);
    });
  }
}
