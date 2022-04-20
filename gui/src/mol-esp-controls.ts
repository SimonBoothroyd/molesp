import GUI from "lil-gui";
import { ESPMolecule } from "./core/models";

export interface MolESPControlsState {
  espName: number;
  minESP: number;
  maxESP: number;
  showMolecule: boolean;
  showSurface: boolean;
  surfaceOpacity: number;

  resetESP: () => void;
}

export class MolESPControls {
  private gui?: GUI;

  constructor(
    private state: MolESPControlsState,
    private onESPChanged: (value: number) => void,
    private onESPRangeChanged: (minValue: number, maxValue: number) => void,
    private onShowMoleculeChanged: (value: boolean) => void,
    private onShowSurfaceChanged: (value: boolean) => void,
    private onSurfaceOpacityChanged: (value: number) => void
  ) {}

  public clear() {
    if (this.gui === undefined) return;

    this.gui.destroy();
    this.gui = undefined;
  }

  public initialize(molecule?: ESPMolecule) {
    this.clear();

    if (!molecule) return;

    this.gui = new GUI().title("MolESP");

    const espNames = Object.keys(molecule.esp).sort();
    const espOptions: { [key: string]: number } = {};

    espNames.map((name, index) => {
      espOptions[name] = index;
    });

    const self = this;

    this.gui
      .add(this.state, "espName", espOptions)
      .name("Type")
      .onChange(self.onESPChanged);

    const espFolder = this.gui.addFolder("ESP Settings");

    espFolder
      .add(this.state, "minESP")
      .name("Min ESP")
      .onFinishChange((value: number) =>
        self.onESPRangeChanged(value, this.state.maxESP)
      );
    espFolder
      .add(this.state, "maxESP")
      .name("Max ESP")
      .onFinishChange((value: number) =>
        self.onESPRangeChanged(this.state.minESP, value)
      );

    espFolder.add(this.state, "resetESP").name("Reset to Series");
    espFolder.add(this.state, "resetESPLocal").name("Reset to Current");

    const moleculeFolder = this.gui.addFolder("Molecule Settings");

    moleculeFolder
      .add(this.state, "showMolecule")
      .name("Show Molecule")
      .onChange(this.onShowMoleculeChanged);

    const surfaceFolder = this.gui.addFolder("Surface Settings");

    surfaceFolder
      .add(this.state, "showSurface")
      .name("Show Surface")
      .onChange(this.onShowSurfaceChanged);
    surfaceFolder
      .add(this.state, "surfaceOpacity", 0.0, 1.0)
      .name("Surface Opacity")
      .onChange(this.onSurfaceOpacityChanged);
  }

  public setESPRange(minValue: number, maxValue: number) {
    this.state.minESP = minValue;
    this.state.maxESP = maxValue;

    this.gui?.controllersRecursive().map((controller) => controller.updateDisplay());
  }
}
