import * as THREE from 'three'
import { GUI } from 'dat.gui'
import { params } from './params'
import { 
    resize, 
    makeRenderer, 
    makeScene, 
    makePerspectiveCamera, 
    makeOrbitControls,
    makeMeshPointer,
    MeshPointer,
} from './utils'
import {
    BoxField,
} from './box_field'
import {
    World
} from 'oimo'
import {
    cubeToPhysicsBody
} from './physics'

// -------------- SETUP ---------------- //

// Canvas
const canvas = document.getElementById('three');
// Scene
const scene = makeScene();

// Camera
const camera = makePerspectiveCamera(75, 1, 100);
camera.position.y = 10;
scene.add(camera);

// Renderer
const renderer = makeRenderer(canvas);

// Resize Handling
window.addEventListener('resize', resize(params, camera, renderer));

// Orbit Controls
const controls = makeOrbitControls(camera, canvas);

const gui = new GUI();

// -------------- TEXTURES, OBJECTS, ETC. ---------------- //

// Textures
// const textureLoader = new THREE.TextureLoader();

const boxField = new BoxField(20, 20, 0.3);

scene.add(boxField.mesh);
boxField.activateLevelControl(canvas, 0.2);

//boxField.moveAppRow(-1, 0);
boxField.moveAppCol(-1, 0);
boxField.moveAppRow(-1, 0);

let meshPointers: MeshPointer[] = []; 

for (let box of boxField.getApparentCol(0)) {
    const meshPointer = new MeshPointer(box, {scale: 0.2});
    meshPointers.push(meshPointer);
    scene.add(meshPointer.pointer);
}

const sphere_geo = new THREE.SphereGeometry(0.2, 32, 32);
const sphere_mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphere = new THREE.Mesh(sphere_geo, sphere_mat);
sphere.position.y = .2;

scene.add(sphere);

// ----------------- PHYSICS ---------------------- //
const physics = new World({
    timestep: 1 / 60,
    iterations: 8,
    broadphase: 2,
    worldscale: 1,
    random: true,
    info: true,
    gravity: [0, -4.8, 0]
});

const ph_sphere = physics.add({
    type: 'sphere',
    size: [0.2, 0.2, 0.2],
    pos: [0, .2, 0],
    rot: [0, 0, 0],
    move: true,
    density: 1,
    friction: 0.2,
    reconstitution: 0.2,
});

boxField.makeOimoBoxes(physics);

console.log(physics);

// ----------------- LIGHTS ---------------------- //

const ambient_light = new THREE.AmbientLight(0xffffff, 0.5);
const directional_light = new THREE.DirectionalLight(0xffffff, 0.4);
directional_light.position.y = 3;
directional_light.position.x = 5;
directional_light.position.z = 1;
scene.add(ambient_light);
scene.add(directional_light);

gui.add(directional_light.position, 'x', -20, 20, 0.2);

// -------------- REFRESH & UPDATE CYCLE ---------------- //

// const clock = new THREE.Clock();

const tick = () => 
{
    // const elapsedTime = clock.getElapsedTime();

    controls.update();

    // Update in order to be able to read child matrixWorlds.
    boxField.mesh.updateMatrixWorld();

    for (const meshPointer of meshPointers) {
        meshPointer.update();
    }
        
    ph_sphere.awake();
    boxField.updateOimoBoxes();
    physics.step();

    sphere.position.copy( ph_sphere.getPosition() );
    sphere.quaternion.copy( ph_sphere.getQuaternion() );

    renderer.render(scene, camera);

    window.requestAnimationFrame(tick);
}

tick();
