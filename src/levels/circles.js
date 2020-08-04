import * as p2 from "../lib/p2";
import { Level } from "./level";

export class LevelCircles extends Level {
  constructor(json) {
    super(json);
    this.data.scale = 250;
    this.data.gravity = -5;
  }

  init(app) {
    app.game.pixiRoot.position.set(360, 640);

    var enablePositionNoise = true, // Add some noise in circle positions
      N = 15, // Number of circles in x direction
      M = 15, // and in y
      r = 0.07, // circle radius
      d = 2.2; // Distance between circle centers

    const { world } = app.phys;
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

    // Create circle bodies
    for (var i = 0; i < N; i++) {
      for (var j = M - 1; j >= 0; j--) {
        var x =
          (i - N / 2) * r * d + (enablePositionNoise ? Math.random() * r : 0);
        var y = (j - M / 2) * r * d;
        var p = new p2.Body({
          mass: 1,
          position: [x, y]
        });
        p.addShape(new p2.Circle({ radius: r }));
        p.allowSleep = true;
        p.sleepSpeedLimit = 1; // Body will feel sleepy if speed<1 (speed is the norm of velocity)
        p.sleepTimeLimit = 1; // Body falls asleep after 1s of sleepiness

        const vis = {};
        if (Math.random() < 0.2) {
          vis.bunny = true;
          vis.size = 1;
        }

        game.add({ body: p }, vis);
      }
    }

    // Compute max/min positions of circles
    var xmin = (-N / 2) * r * d,
      xmax = (N / 2) * r * d,
      ymin = (-M / 2) * r * d,
      ymax = (M / 2) * r * d;

    // Create bottom plane
    var plane = new p2.Body({
      position: [0, ymin]
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
  }
}
