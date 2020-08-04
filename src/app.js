import * as PIXI from "./pixi";
import { Preloader } from "./preloader";
import { Game } from "./game";
import { Background } from "./background";
import { Phys } from "./phys";
import { MouseController } from "./mouse";
import { Visual } from "./visual";

export class App {
  constructor() {
    this.renderer = new PIXI.Renderer({
      width: 720,
      height: 1280
    });
    this.ticker = new PIXI.Ticker();
    this.stage = new PIXI.Container();
    this.loader = new PIXI.Loader();

    this.ticker.add(this.render.bind(this), PIXI.UPDATE_PRIORITY.LOW);
    this.ticker.start();

    this.runners = {
      onStartup: new PIXI.Runner("onStartup"),
      initLevel: new PIXI.Runner("initLevel"),
      addEntity: new PIXI.Runner("addEntity"),
      removeEntity: new PIXI.Runner("removeEntity"),
      earlyLoop: new PIXI.Runner("earlyLoop"),
      loop: new PIXI.Runner("loop"),
      lateLoop: new PIXI.Runner("lateLoop")
    };

    this.addSystem("preloader", new Preloader(this));
    this.addSystem("game", new Game(this));
    this.addSystem("background", new Background(this));
    this.addSystem("visual", new Visual(this));
    this.addSystem("phys", new Phys(this));
    this.addSystem("mouse", new MouseController(this));
  }

  addSystem(name, inst) {
    this[name] = inst;
    for (let key in this.runners) {
      const runner = this.runners[key];
      runner.add(inst);
    }
  }

  render() {
    this.renderer.render(this.stage);
  }

  get view() {
    return this.renderer.view;
  }

  get screen() {
    return this.renderer.screen;
  }

  get pixiRoot() {
    return this.game.pixiRoot;
  }

  get level() {
    return this.game.level;
  }

  destroy() {
    this.renderer.destroy();
    this.ticker.stop();
  }
}
