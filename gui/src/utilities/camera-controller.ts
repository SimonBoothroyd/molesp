import * as THREE from "three";

const EPSILON = 0.0001;

enum CameraState {
  NONE,
  ORBIT,
  TWIST,
}

export class CameraControls {
  private state: CameraState = CameraState.NONE;

  private twistCursorOld: number = 0.0;
  private twistCursorNew: number = 0.0;

  private readonly orbitCursorOld: THREE.Vector2 = new THREE.Vector2();
  private readonly orbitCursorNew: THREE.Vector2 = new THREE.Vector2();
  private readonly orbitCursorDelta: THREE.Vector2 = new THREE.Vector2();

  private target: THREE.Vector3 = new THREE.Vector3();

  private readonly eye: THREE.Vector3 = new THREE.Vector3();
  private readonly eyeDirection: THREE.Vector3 = new THREE.Vector3();

  private readonly cameraUp: THREE.Vector3 = new THREE.Vector3();
  private readonly cameraRight: THREE.Vector3 = new THREE.Vector3();
  private readonly cameraDelta: THREE.Vector3 = new THREE.Vector3();

  private readonly rotationAxis = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();

  private readonly oldRotationAxis = new THREE.Vector3();
  private oldRotationAngle = 0.0;

  private radiusScale: number = 1.0;

  public rotateSpeed: number = 7.0;
  public zoomSpeed: number = 0.97;
  public twistSpeed: number = 10.0;

  public minDistance: number = 0;
  public maxDistance: number = Infinity;

  public dampingFactor = 0.25;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private domElement: HTMLElement
  ) {
    this.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
    this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.domElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.addEventListener("wheel", this.onMouseWheel.bind(this), {
      passive: false,
    });

    this.update(0.0);
  }

  private setOrbitCursorPosition(cursor: THREE.Vector2, event: MouseEvent) {
    const width = this.domElement.clientWidth;
    const height = this.domElement.clientHeight;

    const radius = width * 0.5;

    cursor.set(
      (event.clientX - width * 0.5) / radius,
      (height * 0.5 - event.clientY) / radius
    );
  }
  private setTwistCursorPosition(event: MouseEvent): number {
    const width = this.domElement.clientWidth;
    return event.clientX / width;
  }

  private onMouseDown(event: MouseEvent) {
    this.radiusScale = 1.0;
    this.oldRotationAngle = 0.0;

    if (event.button == 0) {
      this.state = CameraState.ORBIT;
    } else if (event.button == 2) {
      this.state = CameraState.TWIST;
    }

    this.setOrbitCursorPosition(this.orbitCursorNew, event);
    this.orbitCursorOld.copy(this.orbitCursorNew);

    this.twistCursorNew = this.setTwistCursorPosition(event);
    this.twistCursorOld = this.twistCursorNew;
  }
  private onMouseMove(event: MouseEvent) {
    if (this.state == CameraState.ORBIT) {
      this.orbitCursorOld.copy(this.orbitCursorNew);
      this.setOrbitCursorPosition(this.orbitCursorNew, event);
    } else if (this.state == CameraState.TWIST) {
      this.twistCursorOld = this.twistCursorNew;
      this.twistCursorNew = this.setTwistCursorPosition(event);
    }
  }
  private onMouseUp() {
    this.state = CameraState.NONE;
    this.orbitCursorOld.copy(this.orbitCursorNew);
    this.twistCursorOld = this.twistCursorNew;
  }
  private onMouseWheel(event: WheelEvent) {
    event.preventDefault();

    if (this.state != CameraState.NONE) return;

    if (event.deltaY < 0) {
      this.radiusScale *= this.zoomSpeed;
    } else if (event.deltaY > 0) {
      this.radiusScale /= this.zoomSpeed;
    }
  }

  private zoomCamera(): boolean {
    if (Math.abs(1.0 - this.radiusScale) < EPSILON) return false;

    let radius = this.eye.length();
    this.eyeDirection.copy(this.eye).divideScalar(radius);

    radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, radius * this.radiusScale)
    );

    this.eye.copy(this.eyeDirection).multiplyScalar(radius);

    return true;
  }
  private orbitCamera(delta: number): boolean {
    this.orbitCursorDelta.subVectors(this.orbitCursorNew, this.orbitCursorOld);
    const rotationDelta = this.orbitCursorDelta.length();

    this.oldRotationAngle *= Math.sqrt(1.0 - this.dampingFactor);

    if (Math.abs(rotationDelta) < EPSILON && this.oldRotationAngle < EPSILON)
      return false;

    this.eyeDirection.copy(this.eye).normalize();

    if (rotationDelta >= EPSILON && this.state == CameraState.ORBIT) {
      this.cameraUp.copy(this.camera.up).normalize();
      this.cameraRight.crossVectors(this.cameraUp, this.eyeDirection);

      this.cameraUp.multiplyScalar(this.orbitCursorDelta.y);
      this.cameraRight.multiplyScalar(this.orbitCursorDelta.x);

      this.cameraDelta.addVectors(this.cameraUp, this.cameraRight);

      this.rotationAxis.crossVectors(this.cameraDelta, this.eyeDirection).normalize();
      const newRotationAngle = rotationDelta * this.rotateSpeed * delta * 100.0;

      this.rotation.setFromAxisAngle(this.rotationAxis, newRotationAngle);

      this.eye.applyQuaternion(this.rotation);
      this.camera.up.applyQuaternion(this.rotation);

      this.oldRotationAxis.copy(this.rotationAxis);
      this.oldRotationAngle = newRotationAngle;
    } else if (this.oldRotationAngle >= EPSILON && this.state == CameraState.NONE) {
      this.rotation.setFromAxisAngle(this.oldRotationAxis, this.oldRotationAngle);

      this.eye.applyQuaternion(this.rotation);
      this.camera.up.applyQuaternion(this.rotation);
    }

    return true;
  }
  private twistCamera(delta: number): boolean {
    const twistCursorDelta = this.twistCursorNew - this.twistCursorOld;
    const rotationDelta = twistCursorDelta * this.twistSpeed * delta * 100.0;

    if (Math.abs(rotationDelta) < EPSILON) return false;

    this.eyeDirection.copy(this.eye).normalize();
    this.rotation.setFromAxisAngle(this.eyeDirection, rotationDelta);

    this.camera.up.applyQuaternion(this.rotation);

    return true;
  }

  public update(delta: number): boolean {
    this.eye.subVectors(this.camera.position, this.target);

    const hasZoomed = this.zoomCamera();
    const hasOrbited = this.orbitCamera(delta);
    const hasTwisted = this.twistCamera(delta);

    this.camera.position.addVectors(this.target, this.eye);
    this.camera.lookAt(this.target);

    this.orbitCursorDelta.set(0, 0);
    this.orbitCursorOld.copy(this.orbitCursorNew);

    this.twistCursorOld = this.twistCursorNew;

    this.radiusScale = 1.0;

    return hasZoomed || hasOrbited || hasTwisted;
  }

  public setLookAt(
    positionX: number,
    positionY: number,
    positionZ: number,
    targetX: number,
    targetY: number,
    targetZ: number
  ) {
    this.camera.position.set(positionX, positionY, positionZ);
    this.target.set(targetX, targetY, targetZ);

    this.camera.lookAt(targetX, targetY, targetZ);
  }
}
