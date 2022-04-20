export interface Surface {
  vertices: number[];
  indices: number[];
}

export interface ESPMolecule {
  atomic_numbers: number[];

  conformer: number[];

  surface: Surface;

  esp: { [key: string]: number[] };
}
