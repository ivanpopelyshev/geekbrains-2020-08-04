import * as p2 from "../lib/p2";
import { Level } from "./level";

export class LevelMP extends Level {
  constructor(json) {
    super(json);
    this.network = true;
    this.bgPosition = { x: 720 / 2, y: 1280 / 2 };
  }

  init(app) {
    this.app = app;
    app.game.pixiRoot.position.set(0, 0);
  }
}
