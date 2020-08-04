import * as PIXI from "pixi.js";
import { Convex } from "./lib/p2";

export class Visual {
  constructor(app) {
    this.app = app;

    this.bunnyTex = null;

    const vert = `
    precision highp float;
    attribute vec2 aVertexPosition;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 centerRelative;

    void main() {
        vec3 worldCoord = translationMatrix * vec3(aVertexPosition, 1.0);
        vec3 center= translationMatrix * vec3(0.0, 0.0, 1.0);

        gl_Position = vec4((projectionMatrix * worldCoord).xy, 0.0, 1.0);
        centerRelative = (worldCoord - center).xy;
    }
    `;
    const frag = `
    precision highp float;

    uniform vec4 uColor;
    uniform vec2 velocity;

    varying vec2 centerRelative;

    void main() {

      float coeff = dot(velocity, centerRelative);
      coeff = coeff / 1000.0;

      gl_FragColor = uColor + vec4(coeff * vec3(1.0, 1.0, 1.0), 1.0);
    }    
    `;

    this.prog = new PIXI.Program(vert, frag, "vanya");
  }

  initLevel(lvl) {
    this.bunnyTex = this.app.loader.resources.bunny.texture;
    if (lvl.warp) {
      //this.initFilter();
    }
  }

  addEntity(entity) {
    const vis = entity.visual;
    const stage = this.app.pixiRoot;

    if (vis.bunny) {
      entity.pixi = new PIXI.Sprite(this.bunnyTex);
      entity.pixi.scale.set(vis.size || 2);
      entity.pixi.anchor.set(0.5);
      stage.addChild(entity.pixi);
    }

    if (vis.shaderColor && entity.body) {
      const clr = new Float32Array(4);
      clr[3] = 1.0;
      PIXI.utils.hex2rgb(PIXI.utils.string2hex(vis.shaderColor), clr);

      //shaderColor = [1, 0, 0, 1]
      const geom = new PIXI.Geometry();
      if (this.fillGeom(geom, entity.body)) {
        const shader = new PIXI.Shader(this.prog, {
          uColor: clr,
          velocity: new Float32Array(2)
        });

        const mesh = (entity.pixi = new PIXI.Mesh(geom, shader));
        stage.addChild(mesh);
      }
    }
  }

  removeEntity(entity) {
    if (entity.pixi) {
      this.pixiRoot.removeChild(entity.pixi);
    }
    if (entity.pixiDebug) {
      this.pixiRoot.removeChild(entity.pixiDebug);
    }
  }

  fillGeom(geom, body) {
    const { METER_TO_PIXEL } = this.app.phys;

    const { shapes } = body;

    const points = [];
    const indices = [];

    let firstPoint = 0;
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      if (shape instanceof Convex) {
        const pos = shape.position;
        const vertices = shape.vertices;

        let n = vertices.length;
        for (let i = 0; i < n; i++) {
          points.push(-(vertices[i][0] + pos[0]) * METER_TO_PIXEL);
          points.push(-(vertices[i][1] + pos[1]) * METER_TO_PIXEL);
        }
        for (let i = 0; i < n - 2; i++) {
          indices.push(firstPoint);
          indices.push(firstPoint + i + 1);
          indices.push(firstPoint + i + 2);
        }
        firstPoint += n;
      }
    }
    geom.addAttribute("aVertexPosition", points).addIndex(indices);
    return firstPoint > 0;
    //true если что-то есть
  }

  initFilter() {
    // create filter
    const fragSrc = `precision highp float;
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform vec4 inputSize;
  uniform vec4 outputFrame;

  vec2 warpAmount = vec2( 2.0 / 34.0, 1.0 / 16.0 );

  vec2 warp(vec2 pos)
  {
    // warping by the center of filterArea
    pos = pos * 2.0 - 1.0;
    pos *= vec2(
      1.0 + (pos.y * pos.y) * warpAmount.x,
      1.0 + (pos.x * pos.x) * warpAmount.y
    );
    return pos * 0.5 + 0.5;;
  }
   
  void main() {
    vec2 coord = vTextureCoord;
    coord = coord * inputSize.xy / outputFrame.zw;
    coord = warp( coord );
    coord = coord * inputSize.zw * outputFrame.zw;
    gl_FragColor = texture2D( uSampler, coord );
  }
`
      .split("\n")
      .reduce((c, a) => c + a.trim() + "\n");

    const filter = new PIXI.Filter(undefined, fragSrc);
    this.app.game.pixiRoot.filters = [filter];
  }
}
