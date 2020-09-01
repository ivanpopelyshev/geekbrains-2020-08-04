export class Actor {
  x: number;
  y: number;
  name: string;
  uid: number;
  target: {x: number, y: number};
  entity: any;
  changed: boolean;
  ox: number;
  oy: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.name = 'LOCAL_PLAYER';
    this.uid = -1;

    this.target = { x: 0, y: 0 };
    this.entity = null;

    // local vars
    this.changed = false;
    this.ox = 0;
    this.oy = 0;
  }

  physUpdate(deltaS) {
    const { target } = this;

    this.changed = false;

    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1e-3) {
      return;
    }
    this.changed = true;

    const speed = 300; // per second
    const dd = speed * deltaS;// per tick
    if (dist <= dd) {
      this.x = target.x;
      this.y = target.y;
    } else {
      this.x += dx / dist * dd;
      this.y += dy / dist * dd;
    }
  }

  toJson() {
    return {
      uid: this.uid,
      x: Math.round(this.x * 1000) / 1000,
      y: Math.round(this.y * 1000) / 1000,
      name: this.name,
      target: this.target
    };
  }

  toDeltaJson() {
    return {
      uid: this.uid,
      x: Math.round(this.x * 1000) / 1000,
      y: Math.round(this.y * 1000) / 1000,
      target: this.target
    };
  }

  applyJson(json) {
    this.x = json.x;
    this.y = json.y;
    if (json.name) {
      this.name = json.name;
    }
    if (json.uid !== this.uid) {
      this.uid = json.uid;
    }
    if (json.target) {
      this.target = json.target;
    }
  }
}
