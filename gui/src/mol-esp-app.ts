import * as THREE from "three";
import { getESPMolecule } from "./core/api";
import { ESPMolecule } from "./core/models";
import { DefaultWebGLAppOptions, WebGLApp, WebGLAppOptions } from "./core/webgl-app";
import { MolESPControls } from "./mol-esp-controls";
import { ColorMap } from "./utilities/color-map";
import { AtomColors, CovalentRadii } from "./utilities/elements";

export class MolESPApp extends WebGLApp {
  protected gui: MolESPControls;

  protected uiScene: THREE.Scene;
  protected uiCamera: THREE.OrthographicCamera;

  protected readonly light: THREE.DirectionalLight;

  protected molecule?: ESPMolecule;

  protected surfaceMesh?: THREE.Mesh;
  protected moleculeObject?: THREE.Object3D;

  protected colorMap: ColorMap;
  protected colorBar?: THREE.Sprite;

  protected minESPLabel?: HTMLDivElement;
  protected maxESPLabel?: HTMLDivElement;

  protected get espName(): string | undefined {
    if (!this.molecule) return;
    return Object.keys(this.molecule.esp).sort()[this.controlsState.espName];
  }

  protected readonly defaultControlsState = {
    espName: 0,
    minESP: 0.0,
    maxESP: 1.0,
    showMolecule: true,
    showSurface: true,
    surfaceOpacity: 0.7,

    resetESP: () => {
      const [minESP, maxESP] = this.computeESPRange();
      this.setESPRange(minESP, maxESP);

      this.draw();
    },
    resetESPLocal: () => {
      if (!this.molecule) return;

      const [minESP, maxESP] = this.computeESPRange(this.espName);
      this.setESPRange(minESP, maxESP);

      this.draw();
    },
  };
  protected controlsState = { ...this.defaultControlsState };

  public constructor(
    canvas: HTMLCanvasElement,
    options: WebGLAppOptions = DefaultWebGLAppOptions
  ) {
    super(canvas, options);

    this.controls.minDistance = 4.0;
    this.controls.maxDistance = 200.0;

    this.controls.setLookAt(20.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    this.light = new THREE.DirectionalLight(0xffffff, 0.5);

    this.scene.add(this.light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    this.colorMap = new ColorMap("cool-to-warm", 0.0, 1.0, 24);

    this.uiScene = new THREE.Scene();
    this.uiCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2);
    this.uiCamera.position.set(0, 0.85, 1);

    this.initializeESPColorBar();

    const self = this;

    this.gui = new MolESPControls(
      this.controlsState,
      () => self.onESPChanged(),
      (minValue: number, maxValue: number) =>
        self.onESPRangeChanged(minValue, maxValue),
      (value: boolean) => self.onShowMoleculeChanged(value),
      (value: boolean) => self.onShowSurfaceChanged(value),
      (value: number) => self.onSurfaceOpacityChanged(value)
    );

    getESPMolecule().subscribe((value?: ESPMolecule) => {
      self.setMolecule(value);
    });
  }

  private initializeESPColorBar() {
    this.colorBar = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(this.colorMap.createCanvas()),
      })
    );
    this.colorBar.scale.y = 0.075;
    this.uiScene.add(this.colorBar);

    this.minESPLabel = document.createElement("div");
    this.minESPLabel.setAttribute(
      "style",
      "position: absolute; left: 25%; top: 85%; text-align: center; display: block; z-index: 100;"
    );
    this.minESPLabel.innerText = "0.0000";
    document.body.appendChild(this.minESPLabel);

    this.maxESPLabel = document.createElement("div");
    this.maxESPLabel.setAttribute(
      "style",
      "position: absolute; right: 25%; top: 85%; text-align: left; display: block; z-index: 100;"
    );
    this.maxESPLabel.innerText = "1.0000";
    document.body.appendChild(this.maxESPLabel);
  }

  private clearMolecule() {
    if (this.surfaceMesh !== undefined) {
      this.scene.remove(this.surfaceMesh);
      this.surfaceMesh = undefined;
    }
    if (this.moleculeObject !== undefined) {
      this.scene.remove(this.moleculeObject);
      this.moleculeObject = undefined;
    }

    this.molecule = undefined;
    Object.assign(this.controlsState, this.defaultControlsState);
  }

  private setMolecule(molecule?: ESPMolecule) {
    this.clearMolecule();

    if (!molecule) return;

    this.molecule = molecule;

    this.buildSurfaceMesh();
    this.buildMoleculeObject();

    this.gui.initialize(molecule);

    const [minESP, maxESP] = this.computeESPRange();
    this.setESPRange(minESP, maxESP);

    this.update();
    this.draw();
  }

  private computeESPRange(espName?: string): [number, number] {
    if (!this.molecule) return [0.0, 1.0];

    let minValue = Infinity;
    let maxValue = -Infinity;

    if (!espName) {
      Object.values(this.molecule.esp).forEach((espArray) => {
        minValue = Math.min(minValue, ...espArray);
        maxValue = Math.max(maxValue, ...espArray);
      });
    } else {
      minValue = Math.min(minValue, ...this.molecule.esp[espName]);
      maxValue = Math.max(maxValue, ...this.molecule.esp[espName]);
    }

    return [minValue, maxValue];
  }
  private setESPRange(minValue: number, maxValue: number) {
    if (!this.molecule) return;

    this.gui.setESPRange(minValue, maxValue);
    this.colorMap.setRange(minValue, maxValue);

    if (this.colorBar) {
      const colorBarMap = this.colorBar.material.map as THREE.Texture;
      this.colorMap.updateCanvas(colorBarMap.image);
      colorBarMap.needsUpdate = true;
    }
    if (this.minESPLabel) this.minESPLabel.innerText = minValue.toFixed(4);
    if (this.maxESPLabel) this.maxESPLabel.innerText = maxValue.toFixed(4);

    if (this.espName) this.updateSurfaceColorMap(this.espName);
  }

  private buildMoleculeObject() {
    if (!this.molecule) return;

    const moleculeObject = new THREE.Object3D();
    const conformer = this.molecule.conformer;

    this.molecule.atomic_numbers.map((atomicNumber, index) => {
      const atomRadii = CovalentRadii[atomicNumber];
      const atomColor = AtomColors[atomicNumber];

      const atomGeometry = new THREE.SphereGeometry(atomRadii * 0.5);
      const atomMaterial = new THREE.MeshPhongMaterial({ color: atomColor });

      const atomMesh = new THREE.Mesh(atomGeometry, atomMaterial);

      atomMesh.position.copy(
        new THREE.Vector3(
          conformer[index * 3],
          conformer[index * 3 + 1],
          conformer[index * 3 + 2]
        )
      );

      moleculeObject.add(atomMesh);
    });

    this.moleculeObject = moleculeObject;
    this.scene.add(this.moleculeObject);
  }
  private buildSurfaceMesh() {
    if (!this.molecule) return;

    const geometry = new THREE.BufferGeometry();

    const vertices = this.molecule.surface.vertices;
    const indices = this.molecule.surface.indices;

    const colors = this.computeSurfaceVertexColors(this.espName as string);

    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      opacity: this.controlsState.surfaceOpacity,
      transparent: true,
    });

    this.surfaceMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.surfaceMesh);
  }

  private computeSurfaceVertexColors(espName: string): number[] {
    if (!this.molecule) return [];

    return this.molecule.esp[espName]
      .map((value: number) => this.colorMap.getColor(value).toArray())
      .flat();
  }
  private updateSurfaceColorMap(espName: string) {
    if (!this.molecule || !this.surfaceMesh) return;

    const colors = this.computeSurfaceVertexColors(espName);
    const colorAttribute = this.surfaceMesh.geometry.attributes[
      "color"
    ] as THREE.BufferAttribute;

    colorAttribute.set(colors);
    colorAttribute.needsUpdate = true;
  }

  private onESPChanged() {
    if (!this.molecule) return;

    this.updateSurfaceColorMap(this.espName as string);
    this.draw();
  }
  private onESPRangeChanged(minValue: number, maxValue: number) {
    if (!this.molecule) return;

    this.setESPRange(minValue, maxValue);
    this.draw();
  }

  private onShowMoleculeChanged(value: boolean) {
    if (!this.moleculeObject) return;

    this.moleculeObject.visible = value;
    this.draw();
  }
  private onShowSurfaceChanged(value: boolean) {
    if (!this.surfaceMesh) return;

    this.surfaceMesh.visible = value;
    this.draw();
  }
  private onSurfaceOpacityChanged(value: number) {
    if (!this.surfaceMesh) return;

    const material = this.surfaceMesh.material as THREE.MeshStandardMaterial;
    material.opacity = value;

    this.draw();
  }

  protected update() {
    super.update();
    this.light.position.copy(this.camera.position);
  }

  protected draw() {
    super.draw();
    if (!this.uiScene || !this.uiCamera) return;

    this.renderer.render(this.uiScene, this.uiCamera);
  }
}
