// Based upon https://github.com/mrdoob/three.js/blob/f0e2b3453f1412b53389beb04add414e3a80023c/examples/webgl_geometry_colors_lookuptable.html
import { Color, MathUtils } from "three";

export const ColorMaps: { [key: string]: number[][] } = {
  "cool-to-warm": [
    [0.0, 0x3c4ec2],
    [0.2, 0x9bbcff],
    [0.5, 0xf0f0f0],
    [0.8, 0xf6a385],
    [1.0, 0xb40426],
  ],
};

export class ColorMap {
  private lookUpTable: Color[] = [];

  constructor(
    private name: string,
    private minValue: number,
    private maxValue: number,
    private intervals: number = 11
  ) {
    this.buildLookUp();
  }

  private buildLookUp() {
    const colorMap = ColorMaps[this.name];

    const step = 1.0 / this.intervals;

    const minColor = new Color();
    const maxColor = new Color();

    this.lookUpTable = [new Color(colorMap[0][1])];

    for (let i = 1; i < this.intervals; i++) {
      const alpha = i * step;

      for (let j = 0; j < colorMap.length - 1; j++) {
        if (alpha <= colorMap[j][0] || alpha > colorMap[j + 1][0]) continue;

        const min = colorMap[j][0];
        const max = colorMap[j + 1][0];

        minColor.set(colorMap[j][1]);
        maxColor.set(colorMap[j + 1][1]);

        const color = new Color().lerpColors(
          minColor,
          maxColor,
          (alpha - min) / (max - min)
        );

        this.lookUpTable.push(color);
      }
    }

    this.lookUpTable.push(new Color(colorMap[colorMap.length - 1][1]));
  }

  public setRange(minValue: number, maxValue: number) {
    this.minValue = minValue;
    this.maxValue = maxValue;

    this.buildLookUp();
  }

  public getColor(alpha: number) {
    alpha = MathUtils.clamp(alpha, this.minValue, this.maxValue);
    alpha = (alpha - this.minValue) / (this.maxValue - this.minValue);

    const colorPosition = Math.round(alpha * (this.lookUpTable.length - 1));
    return this.lookUpTable[colorPosition];
  }

  public createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");

    canvas.width = this.intervals;
    canvas.height = 1;

    this.updateCanvas(canvas);
    return canvas;
  }

  public updateCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) return;

    const colorMap = ColorMaps[this.name];

    const imageData = ctx.getImageData(0, 0, this.intervals, 1);
    const data = imageData.data;

    let k = 0;

    const step = 1.0 / this.intervals;

    const minColor = new Color();
    const maxColor = new Color();
    const finalColor = new Color();

    for (let i = 0; i <= 1; i += step) {
      for (let j = colorMap.length - 1; j >= 0; j--) {
        if (i < colorMap[j][0] && i >= colorMap[j - 1][0]) {
          const min = colorMap[j - 1][0];
          const max = colorMap[j][0];

          minColor.set(colorMap[j - 1][1]);
          maxColor.set(colorMap[j][1]);

          finalColor.lerpColors(minColor, maxColor, (i - min) / (max - min));

          data[k * 4] = Math.round(finalColor.r * 255);
          data[k * 4 + 1] = Math.round(finalColor.g * 255);
          data[k * 4 + 2] = Math.round(finalColor.b * 255);
          data[k * 4 + 3] = 255;

          k += 1;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }
}
