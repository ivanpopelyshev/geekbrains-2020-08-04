import * as p2 from "../lib/p2";
import { Level } from "./level";

export class LevelTiled extends Level {
  constructor(json) {
    super(json);
    this.data.scale = 30;
    this.data.gravity = -60;
    this.app = null;
    this.bgPosition = { x: 720 / 2, y: 1280 / 2 };

    this.warp = false;
  }

  init(app) {
    this.app = app;
    app.game.pixiRoot.position.set(0, 0);

    const { world, PIXEL_TO_METER } = app.phys;
    const { game } = app;

    // Pre-fill object pools. Completely optional but good for performance!
    world.overlapKeeper.recordPool.resize(16);
    world.narrowphase.contactEquationPool.resize(1024);
    world.narrowphase.frictionEquationPool.resize(1024);

    // Set stiffness of all contacts and constraints
    world.setGlobalStiffness(1e8);

    // Max number of solver iterations to do
    world.solver.iterations = 20;

    // Solver error tolerance
    world.solver.tolerance = 0.02;

    // Enables sleeping of bodies
    world.sleepMode = p2.World.BODY_SLEEPING;

    // Compute max/min positions of circles
    var xmin = 720 * -PIXEL_TO_METER,
      xmax = 0,
      ymax = 1280 * -PIXEL_TO_METER;

    // Create bottom plane
    var plane = new p2.Body({
      position: [0, ymax]
    });
    plane.addShape(new p2.Plane());
    game.add({ body: plane });

    // Left plane
    var planeLeft = new p2.Body({
      angle: -Math.PI / 2,
      position: [xmin, 0]
    });
    planeLeft.addShape(new p2.Plane());
    game.add({ body: planeLeft });

    // Right plane
    var planeRight = new p2.Body({
      angle: Math.PI / 2,
      position: [xmax, 0]
    });
    planeRight.addShape(new p2.Plane());
    game.add({ body: planeRight });

    this.parseJson(app.loader.resources["my-map"].data);
  }

  parseJson(data) {
    const bodies = [],
      vises = [];

    const { PIXEL_TO_METER } = this.app.phys;

    data.layers
      .find(x => {
        return x.id === 2;
      })
      .objects.forEach(obj => {
        if (!obj.polygon) {
          return;
        }

        let angularVelocity = 0;
        let physType = p2.Body.DYNAMIC;
        if (obj.type === "1") {
          physType = p2.Body.STATIC;
        }
        if (obj.type === "3") {
          physType = p2.Body.KINEMATIC;
          angularVelocity = 2;
        }

        let body = new p2.Body({
          type: physType,
          mass: 1,
          position: [-obj.x * PIXEL_TO_METER, -obj.y * PIXEL_TO_METER],
          angularVelocity
        });
        let vertices = obj.polygon.map(p => {
          return [-p.x * PIXEL_TO_METER, -p.y * PIXEL_TO_METER];
        });

        body.fromPolygon(vertices);
        bodies.push(body);

        const vis = {};

        obj.properties.forEach(x => {
          if (x.name === "color") {
            vis.shaderColor = x.value;
          }
        });

        vises.push(vis);
      });

    const { game } = this.app;
    for (let i = 0; i < bodies.length; i++) {
      game.add({ body: bodies[i] }, vises[i]);
    }
  }
}
