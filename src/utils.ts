import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { params } from './params'

/**
 * Factory: returns a function that can be added to an EventListener in order
 * to properly handle window resizing.
 */
export const resize = (
    size: {width: number, height: number},
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer ) => {
    return () => { 
        size.width = window.innerWidth;
        size.height = window.innerHeight;

        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();

        renderer.setSize(size.width, size.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}

/**
 * Returns a new THREE.Renderer, appended to a given HTML element as a child.
 */
export const makeRenderer = (container: HTMLElement) => {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(params.width, params.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    return renderer;
}

/**
 * Returns a new THREE.Scene
 */
export const makeScene = () => {
    return new THREE.Scene();
}

/**
 * Returns a new THREE.PerspectiveCamera
 */
export const makePerspectiveCamera = (viewAngle: number, near: number, far: number) => {
    return new THREE.PerspectiveCamera(viewAngle, params.width / params.height, near, far);
}

/**
 * Activates Orbit Controls for this camera.
 */
export const makeOrbitControls = (camera: THREE.PerspectiveCamera, container: HTMLElement) => {
    const orbitControls = new OrbitControls(camera, container);    
    orbitControls.enableDamping = true;
    return orbitControls;
}

/**
 * Creates a line representing a given Raycaster.
 */
export const makeRayCasterHelper = (raycaster: THREE.Raycaster, color: number) => {
    const startPoint = raycaster.ray.origin;
    const endPoint = new THREE.Vector3();
    endPoint.addVectors(startPoint, raycaster.ray.direction.multiplyScalar(raycaster.far));
    const geo = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
    const mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.Line(geo, mat);
}

interface MeshPointerOptions {
    offset?: THREE.Vector3;
    color?: number;
    scale?: number;
}

export class MeshPointer 
{
    pointsTo: THREE.Mesh;
    pointer: THREE.Mesh;
    offset: THREE.Vector3;
    scale: number;
    color: number;
    
    constructor(mesh: THREE.Mesh, options: MeshPointerOptions = {}) 
    {
        this.pointsTo = mesh;
        this.offset = options.offset || new THREE.Vector3(0, 0.5, 0);
        this.color = options.color || 0xff0000;
        this.scale = options.scale || 1;
        this.pointer = new THREE.Mesh(
            new THREE.ConeGeometry(0.5 * this.scale, 1 * this.scale, 4, 2, false),
            new THREE.MeshBasicMaterial({ color: this.color }));
        this.pointer.position.setFromMatrixPosition(this.pointsTo.matrixWorld); 
        this.pointer.rotateZ(Math.PI);
        this.pointer.position.add(this.offset);
    }

    update()
    {
        this.pointer.position.setFromMatrixPosition(this.pointsTo.matrixWorld);
        this.pointer.position.add(this.offset);
    }

}

/**
 * Creates a line pointing at a given Mesh.
 */
export const makeMeshPointer = (mesh: THREE.Mesh, axis: THREE.Vector3, length: number, distanceFrom: number, color: number = 0xff0000): THREE.Mesh => {
    const cone_geo = new THREE.ConeGeometry(length / 30, length / 15, 4, 2);
    const cone_mat = new THREE.MeshBasicMaterial({color: color});
    const cone_mesh = new THREE.Mesh(cone_geo, cone_mat);
    cone_mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.multiplyScalar(-1));
    cone_mesh.position.copy(mesh.position.clone().add(axis.multiplyScalar(-distanceFrom)));
    return cone_mesh;
}

/**
 * Retrieves an item in a given 2D Iterable by row, col, given a width.
 */
export const arrayGet2D = (array: Array<THREE.Mesh>, row: number, col: number, width: number) => {
    return array[(width * row) + col];
}

/**
 * Integer division with floor rounding. 
 */
export const intDiv = (a: number, b: number): number => ~~( a / b );


