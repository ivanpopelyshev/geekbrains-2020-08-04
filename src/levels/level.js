export class Level {
  constructor(json) {
    this.data = json;
    this.bgPosition = { x: 0, y: 0 };

    this.warp = false;
  }

  init(app) {}
}
