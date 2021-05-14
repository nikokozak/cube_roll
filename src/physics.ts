
export const cubeToPhysicsBody = (cube: THREE.Mesh) => {
    return {
        type: 'box',
        size: [0.3, 0.3, 0.3],
        pos: [cube.position.x, cube.position.y, cube.position.z],
        rot: [euToDeg(cube.rotation.x), euToDeg(cube.rotation.y), euToDeg(cube.rotation.z)],
        move: false,
        density: 1,
    }
}

const euToDeg = (euler: number) => {
    const result = euler * 180.0 / Math.PI;
    return result < 0 ? result + 360 : result;
}
