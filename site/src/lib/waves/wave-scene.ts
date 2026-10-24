import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, type WebGLRenderer } from "three";
import { simplexNoise3d } from "@/src/lib/waves/simplex-noise";
import type { WaveFrame } from "@/src/lib/waves/types";

export class WaveScene {
  static readonly maxPixelRatio = 1;

  private static readonly vertexShader = `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

  private static readonly fragmentShader = `
uniform float uTime;
uniform float uLift;
uniform float uHue;
uniform vec2 uResolution;
uniform vec2 uPointer;

${simplexNoise3d}

const vec3 INK = vec3(0.067, 0.055, 0.106);
const vec3 INDIGO = vec3(0.1, 0.13, 0.7);
const vec3 AZURE = vec3(0.14, 0.42, 1.0);
const vec3 CYAN = vec3(0.3, 0.76, 1.0);
const vec3 MAGENTA = vec3(0.98, 0.34, 0.7);
const vec3 ORANGE = vec3(1.0, 0.54, 0.28);
const vec3 PEACH = vec3(1.0, 0.82, 0.62);
const vec2 FLOW = vec2(0.83, 0.56);
const float SCALE = 1.2;
const float WARP = 0.9;
const float BANDS = 2.4;
const float SHARPNESS = 0.9;
const float PRESENCE = -0.55;

vec3 sheen(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.3) {
    return mix(INDIGO, AZURE, t / 0.3);
  }
  if (t < 0.5) {
    return mix(AZURE, CYAN, (t - 0.3) / 0.2);
  }
  if (t < 0.68) {
    return mix(CYAN, MAGENTA, (t - 0.5) / 0.18);
  }
  if (t < 0.86) {
    return mix(MAGENTA, ORANGE, (t - 0.68) / 0.18);
  }
  return mix(ORANGE, PEACH, (t - 0.86) / 0.14);
}

// Hash without Sine by Dave Hoskins, MIT License: https://www.shadertoy.com/view/4djSRW
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float fbm(vec3 p) {
  return 0.65 * snoise(p) + 0.35 * snoise(p * 2.1 + vec3(1.7, 9.2, 3.1));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  vec2 offset = uv - uPointer;
  float pull = exp(-dot(offset, offset) * 7.0);
  vec2 p = uv * SCALE + pull * 0.25 * vec2(-offset.y, offset.x);

  float drift = uTime * 0.05;
  vec2 stretched = vec2(dot(p, FLOW), 0.4 * dot(p, vec2(-FLOW.y, FLOW.x)));
  vec2 q = vec2(fbm(vec3(stretched * 0.9, drift)), fbm(vec3(stretched * 0.9 + 4.1, drift)));
  vec2 warped = p + WARP * (1.0 + 0.25 * uLift) * q;
  float across = dot(warped, FLOW);
  float along = dot(warped, vec2(-FLOW.y, FLOW.x));
  float phase = across * BANDS + 0.45 * fbm(vec3(across * 1.1, along * 0.45, drift * 1.4));

  float ribbon = 0.5 + 0.5 * sin(phase * 6.2831853);
  float presence = smoothstep(PRESENCE - 0.22, PRESENCE + 0.22, snoise(vec3(warped * 0.5 + 9.0, drift * 0.6)));
  float profile = pow(ribbon, SHARPNESS);
  float envelope = smoothstep(0.02, 0.32, profile) * presence;
  float tint = 0.16 * snoise(vec3(warped * 0.4 - 3.0, drift));
  float brush = snoise(vec3(phase * 24.0, along * 1.4, drift));
  float lines = 0.5 + 0.5 * sin(phase * 6.2831853 * 6.0 + 2.5 * snoise(vec3(warped * 2.5, drift)));

  vec3 color = sheen(profile * (0.94 + tint) + uHue) * envelope;
  color *= 0.72 + 0.2 * brush + 0.2 * lines;
  color += PEACH * pow(ribbon, SHARPNESS * 16.0) * presence * 0.3;

  float grain = hash(gl_FragCoord.xy) - 0.5;
  color += grain * 0.12 * (0.25 + envelope);
  float sparkle = step(0.9975, hash(gl_FragCoord.xy * 0.731 + 17.0)) * (1.0 - envelope);
  color += sparkle * 0.5 * mix(MAGENTA, AZURE, hash(gl_FragCoord.yx));

  gl_FragColor = vec4(INK + color, 1.0);
}
`;

  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly geometry = new PlaneGeometry(2, 2);
  private readonly material = new ShaderMaterial({
    vertexShader: WaveScene.vertexShader,
    fragmentShader: WaveScene.fragmentShader,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uLift: { value: 0 },
      uHue: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2(0, 0) },
    },
  });

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
    this.scene.add(new Mesh(this.geometry, this.material));
  }

  resize(width: number, height: number): void {
    const pixelRatio = this.renderer.getPixelRatio();
    this.material.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
  }

  render({ time, pointer, focus }: WaveFrame): void {
    const uniforms = this.material.uniforms;
    uniforms.uTime.value = time;
    uniforms.uLift.value = Math.max(...focus);
    uniforms.uHue.value = focus[0] * 0.06 + focus[1] * 0.12 + focus[2] * 0.18;
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
