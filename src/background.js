import * as PIXI from "./pixi";

export class Background {
  constructor(app) {
    this.app = app;
  }

  initLevel() {
    const { app } = this;
    this.bg2 = this.createBg(app.loader.resources["bg_tiled_layer2"].texture);
    this.bg1 = this.createBg(app.loader.resources["bg_tiled_layer1"].texture);

    this.backgroundY = 0;
    this.bgSpeed = 1;
  }

  loop(delta) {
    const { bgSpeed } = this;
    this.backgroundY = (this.backgroundY + delta * bgSpeed) % 2048;
    this.bg1.tilePosition.y = this.backgroundY / 2;
    this.bg2.tilePosition.y = this.backgroundY;
  }

  createBg(tex) {
    let tiling = new PIXI.TilingSprite(tex, 720, 1280);
    tiling.anchor.set(0.5);
    tiling.position.copyFrom(this.app.level.bgPosition);
    this.app.pixiRoot.addChildAt(tiling, 0);
    return tiling;
  }
}
