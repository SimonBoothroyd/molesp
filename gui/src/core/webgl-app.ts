import * as THREE from "three";
import { CameraControls } from "../utilities/camera-controller";

export interface WebGLAppOptions {
  backgroundColor: string;

  maxPixelRatio: number;
}

export const DefaultWebGLAppOptions: WebGLAppOptions = {
  backgroundColor: "#f5f5f5",
  maxPixelRatio: 2,
};

export abstract class WebGLApp {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _options: WebGLAppOptions = DefaultWebGLAppOptions;

  protected readonly renderer: THREE.WebGLRenderer;

  private _frameId?: number = undefined;
  private _clock: THREE.Clock;

  protected readonly camera: THREE.PerspectiveCamera;
  protected readonly controls: CameraControls;

  protected readonly scene: THREE.Scene;

  protected constructor(
    canvas: HTMLCanvasElement,
    options: WebGLAppOptions = DefaultWebGLAppOptions
  ) {
    this._canvas = canvas;
    this._options = options;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
    });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(this._options.backgroundColor, 1.0);

    this._clock = new THREE.Clock();

    const fov = 45.0,
      near = 0.01,
      far = 1000.0;
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);

    this.controls = new CameraControls(this.camera, this._canvas);

    this.scene = new THREE.Scene();

    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => this.resize());

    this.resize();
  }

  private _loop() {
    if (!this._frameId) return;

    const delta = this._clock.getDelta();
    const hasControlsUpdated = this.controls.update(delta);

    window.requestAnimationFrame(() => this._loop());

    if (hasControlsUpdated) {
      this.update();
      this.draw();
    }
  }

  protected update() {}

  protected draw() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }

  public start() {
    if (this._frameId) return;

    this._frameId = window.requestAnimationFrame(() => this._loop());
  }

  public stop() {
    if (!this._frameId) return;

    window.cancelAnimationFrame(this._frameId);
    this._frameId = undefined;
  }

  public resize(width?: number, height?: number, pixelRatio?: number) {
    width = width ? width : window.innerWidth;
    height = height ? height : window.innerHeight;

    pixelRatio = pixelRatio
      ? pixelRatio
      : Math.min(this._options.maxPixelRatio, window.devicePixelRatio);

    if (this.renderer.getPixelRatio() != pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio);
    }
    this.renderer.setSize(width, height);

    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height;
    }
    this.camera.updateProjectionMatrix();

    this.draw();
  }
}
