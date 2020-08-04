import { Body } from "./lib/p2";
import * as PIXI from "pixi.js";

export class Entity {
  constructor(dict, visual) {
    this.dict = dict || {};
    this.visual = visual || {};

    this.pixi = null; // Container
    this.body = null;
    this.pixiDebug = null;

    this.dead = false;

    if (dict.body) {
      if (dict.body instanceof Body) {
        this.body = dict.body;
      } else {
        this.body = new Body(dict.body);
      }
    }
  }
}
