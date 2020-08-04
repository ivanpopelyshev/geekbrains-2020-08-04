import * as PIXI from "./pixi";
import { Circle, Convex, Plane, World } from "./lib/p2";

export class Phys {
  constructor(app) {
    this.app = app;
    this.setScale(30);
    this.world = null;
  }

  setScale(meterPerPixel) {
    this.METER_TO_PIXEL = meterPerPixel;
    this.PIXEL_TO_METER = 1 / meterPerPixel;
  }

  initLevel(lvl) {
    this.setScale(lvl.data.scale || 30);

    this.world = new World({ gravity: [0, lvl.data.gravity || -1] });
  }

  loop(delta) {
    const fixedTimeStep = 1 / 60; // seconds
    const maxSubSteps = 10; // Max sub steps to catch up with the wall clock

    this.world.step(fixedTimeStep, delta / 60, maxSubSteps);

    const { entities } = this.app.game;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (entity.body) {
        this.syncBody(entity);

        this.syncVel(entity);
      }
    }
  }

  addEntity(entity) {
    if (!entity.body) return;

    this.world.addBody(entity.body);
    entity.body.entity = entity;

    const stage = this.app.game.pixiRoot;

    entity.pixiDebug = this.initDebugPixi(entity.body);
    stage.addChild(entity.pixiDebug);
  }

  removeEntity(e) {
    if (e.body) {
      this.world.removeBody(e.body);
    }
  }

  syncVel(entity) {
    const { pixi, body } = entity;
    if (pixi && pixi.shader && pixi.shader.uniforms.velocity) {
      const vel = pixi.shader.uniforms.velocity;
      vel[0] = body.velocity[0];
      vel[1] = body.velocity[1];
    }
  }

  syncBody(entity) {
    let { body, pixi, pixiDebug } = entity;

    const { METER_TO_PIXEL } = this;

    if (!pixi) {
      pixi = pixiDebug;
      pixiDebug = null;
    }

    if (!pixi) {
      return;
    }
    if (body.type === 1) {
      pixi.position.set(
        -body.interpolatedPosition[0] * METER_TO_PIXEL,
        -body.interpolatedPosition[1] * METER_TO_PIXEL
      );
      pixi.rotation = body.interpolatedAngle;
    } else {
      pixi.position.set(
        -body.position[0] * METER_TO_PIXEL,
        -body.position[1] * METER_TO_PIXEL
      );
      pixi.rotation = body.angle;
    }

    if (pixiDebug) {
      pixiDebug.position.copyFrom(pixi.position);
      pixiDebug.rotation = pixi.rotation;
    }
  }

  initDebugPixi(body) {
    const { METER_TO_PIXEL } = this;
    const { shapes } = body;

    const debug = (this.debug = new PIXI.Graphics());
    const color = (Math.random() * 0xffffff) | 0;
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      if (shape instanceof Circle) {
        debug.lineStyle(3.0, color, 1.0);
        //debug.beginFill(color, 1.0);
        debug.drawCircle(
          -shape.position[0] * METER_TO_PIXEL,
          -shape.position[1] * METER_TO_PIXEL,
          shape.radius * METER_TO_PIXEL
        );
        //debug.endFill();
        debug.lineStyle(0.0);
      }
      if (shape instanceof Plane) {
        debug.lineStyle(10.0, 0x808080, 1.0);
        debug.moveTo(-2000, 0);
        debug.lineTo(2000, 0);
      } else if (shape instanceof Convex) {
        const pos = shape.position;
        const vertices = shape.vertices;

        debug.lineStyle(3.0, color, 1.0);
        //debug.beginFill(color, 1.0);
        debug.moveTo(
          -(vertices[0][0] + pos[0]) * METER_TO_PIXEL,
          -(vertices[0][1] + pos[1]) * METER_TO_PIXEL
        );
        let n = vertices.length;
        for (let i = 1; i < n; i++) {
          debug.lineTo(
            -(vertices[i][0] + pos[0]) * METER_TO_PIXEL,
            -(vertices[i][1] + pos[1]) * METER_TO_PIXEL
          );
        }
        debug.closePath();
        //debug.endFill();

        debug.lineStyle(2.0, color, 1.0);
        // lets add normals!
        const normals = shape.normals;

        for (let i = 0; i < n; i++) {
          const p1 = vertices[i];
          const p2 = vertices[(i + 1) % n];
          const n1 = normals[i];

          debug.moveTo(
            (-(p1[0] + p2[0]) / 2) * METER_TO_PIXEL,
            (-(p1[1] + p2[1]) / 2) * METER_TO_PIXEL
          );
          debug.lineTo(
            -((p1[0] + p2[0]) / 2 + n1[0] * 0.5) * METER_TO_PIXEL,
            -((p1[1] + p2[1]) / 2 + n1[1] * 0.5) * METER_TO_PIXEL
          );
        }

        debug.lineStyle(0.0);
      }
    }
    debug.body = this;

    return debug;
  }
}
