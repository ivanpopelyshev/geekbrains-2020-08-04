import { Schema, type, MapSchema } from "@colyseus/schema";

export class ActorTarget extends Schema {
  @type("float64")
  x: number;
  @type("float64")
  y: number;

  constructor() {
    super();
    this.x = 0;
    this.y = 0;
  }
}

export class Actor extends Schema {
  @type("float64")
  x: number;
  @type("float64")
  y: number;
  @type("string")
  name: string;
  @type("int32")
  uid: number;
  @type(ActorTarget)
  target: ActorTarget;
  entity: any;
  changed: boolean;
  ox: number;
  oy: number;
  dead: boolean = false;

  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.name = 'LOCAL_PLAYER';
    this.uid = -1;

    this.target = new ActorTarget();
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
}

export class State extends Schema {
  @type({ map: Actor })
  actorByUid = new MapSchema<Actor>();
}
