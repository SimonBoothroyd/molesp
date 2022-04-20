import { MolESPApp } from "./mol-esp-app";

const canvas: HTMLCanvasElement = document.getElementById("app") as HTMLCanvasElement;

const app = new MolESPApp(canvas);
app.start();
