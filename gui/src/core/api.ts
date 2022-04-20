import { Observable } from "rxjs";
import * as THREE from "three";
import { ESPMolecule } from "./models";

declare var baseAPIUrl: string;
export const BASE_API_URL = baseAPIUrl;

export function getESPMolecule(): Observable<ESPMolecule> {
  return new Observable<ESPMolecule>((observer) => {
    const loader = new THREE.FileLoader();

    loader.load(
      `${BASE_API_URL}/molecule`,
      function (data) {
        observer.next(JSON.parse(data.toString()));
        observer.complete();
      },
      undefined,
      function (err) {
        throw err;
      }
    );
  });
}
