import * as p2 from "./lib/p2";

export class MouseController {
  constructor(app) {
    this.app = app;
    this.state = 1;
    this.mouseConstraint = null;
    this.mousePosition = p2.vec2.create();
    this.world = null;
    this.nullBody = null;
  }
  initLevel() {
    const { pixiRoot } = this.app.game;
    const { phys } = this.app;
    this.world = phys.world;
    this.nullBody = new p2.Body();

    pixiRoot.interactive = true;
    pixiRoot.on("pointerdown", e => {
      const point = pixiRoot.toLocal(e.data.global);
      point.x = -point.x * phys.PIXEL_TO_METER;
      point.y = -point.y * phys.PIXEL_TO_METER;

      this.handleMouseDown([point.x, point.y], e.data.originalEvent.shiftKey);
    });
    pixiRoot.on("pointermove", e => {
      const point = pixiRoot.toLocal(e.data.global);
      point.x = -point.x * phys.PIXEL_TO_METER;
      point.y = -point.y * phys.PIXEL_TO_METER;

      this.handleMouseMove([point.x, point.y]);
    });
    pixiRoot.on("pointerup", e => {
      const point = pixiRoot.toLocal(e.data.global);
      point.x = -point.x * phys.PIXEL_TO_METER;
      point.y = -point.y * phys.PIXEL_TO_METER;

      this.handleMouseUp([point.x, point.y]);
    });
    pixiRoot.on("pointerupoutside", e => {
      const point = pixiRoot.toLocal(e.data.global);
      point.x = -point.x * phys.PIXEL_TO_METER;
      point.y = -point.y * phys.PIXEL_TO_METER;

      this.handleMouseUp([point.x, point.y]);
    });

    this.mouseConstraint = null;
    this.state = 1;
  }

  setState(state) {
    this.state = state;
  }

  handleMouseDown(physicsPosition, shiftKey) {
    switch (this.state) {
      case MouseController.DEFAULT:
        // Check if the clicked point overlaps bodies
        var result = this.world.hitTest(
          physicsPosition,
          this.world.bodies,
          this.pickPrecision
        );

        // Remove static bodies
        var b;
        while (result.length > 0) {
          b = result.shift();
          if (b.type === p2.Body.STATIC) {
            b = null;
          } else {
            break;
          }
        }

        if (shiftKey && b) {
          b.wakeUp();
          //b.entity.dead = true;
          b.position[1] += 1;
          return;
        }

        if (b) {
          b.wakeUp();
          this.setState(MouseController.DRAGGING);
          // Add mouse joint to the body
          var localPoint = p2.vec2.create();
          b.toLocalFrame(localPoint, physicsPosition);
          this.world.addBody(this.nullBody);
          this.mouseConstraint = new p2.RevoluteConstraint(this.nullBody, b, {
            localPivotA: physicsPosition,
            localPivotB: localPoint,
            maxForce: 1000 * b.mass
          });
          this.world.addConstraint(this.mouseConstraint);
        } else {
          this.setState(MouseController.PANNING);
        }
        break;
      default:
    }
  }

  handleMouseMove(physicsPosition) {
    p2.vec2.copy(this.mousePosition, physicsPosition);

    switch (this.state) {
      case MouseController.DEFAULT:
      case MouseController.DRAGGING:
        if (this.mouseConstraint) {
          p2.vec2.copy(this.mouseConstraint.pivotA, physicsPosition);
          this.mouseConstraint.bodyA.wakeUp();
          this.mouseConstraint.bodyB.wakeUp();
        }
        break;
      default:
    }
  }

  handleMouseUp(physicsPosition) {
    switch (this.state) {
      case MouseController.DEFAULT:
        break;
      case MouseController.DRAGGING:
        // Drop constraint
        this.world.removeConstraint(this.mouseConstraint);
        this.mouseConstraint = null;
        this.world.removeBody(this.nullBody);
        this.setState(MouseController.DEFAULT);
        break;

      case MouseController.PANNING:
        this.setState(MouseController.DEFAULT);
        break;
      default:
    }
  }
}

MouseController.DEFAULT = 1;
MouseController.PANNING = 2;
MouseController.DRAGGING = 3;
