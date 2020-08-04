import * as PIXI from "./pixi";

export class Preloader {
  constructor(app) {
    this.app = app;

    this.shown = false;
  }

  setPreload(flag) {
    if (flag !== this.shown) {
      this.shown = flag;
      if (flag) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  show() {
    this.shown = true;

    const tex = PIXI.Texture.from(
      "https://pixijs.io/examples/examples/assets/bunny.png"
    );

    const bunny = (this.bunny = new PIXI.Sprite(tex));
    const { app } = this;

    bunny.anchor.set(0.5);

    // Move the sprite to the center of the screen
    bunny.x = app.renderer.width / 2;
    bunny.y = app.renderer.height / 2;

    bunny.scale.set(5);

    app.stage.addChild(bunny);

    // Listen for animate update
    app.ticker.add(function(delta) {
      // Rotate mr rabbit clockwise
      bunny.rotation += 0.01 * delta;
    });
  }

  hide() {
    this.shown = false;

    this.app.stage.removeChild(this.bunny);
  }
}
