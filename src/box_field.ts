import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshStandardMaterial,
    MeshBasicMaterial,
    Vector3,
    Quaternion,
    Group,
    MathUtils
} from 'three'
import {
    params
} from './params'
import {
    intDiv,
    arrayGet2D
} from './utils'
import {
    cubeToPhysicsBody
} from './physics'

export class BoxField {

    rows: number;
    cols: number;
    boxSize: number;
    mesh: THREE.Group;
    physicsBoundsSize: number;
    physicsBoundsBoxArray: Array<THREE.Mesh>;
    oimoBoxes: Array<OimoBox>;
    oimoWorld: Object;
    boxArray: Array<THREE.Mesh>;
    centerIndex: number;
    centerRow: number;
    centerColumn: number;
    appOriginCol: number;
    appOriginRow: number;

    constructor(rows: number, cols: number, boxSize: number = 1, physicsBoundsSize: number = 5) {
        this.rows = rows;
        this.cols = cols;
        this.boxSize = boxSize;
        this.physicsBoundsSize = physicsBoundsSize;
        this.mesh = BoxField.makeBoxField(this.rows, this.cols, this.boxSize);
        this.boxArray = this.mesh.children as Array<THREE.Mesh>;
        this.centerIndex = intDiv(rows, 2) * cols + intDiv(cols, 2);
        this.centerColumn = intDiv(cols, 2);
        this.centerRow = intDiv(rows, 2);
        this.appOriginCol = 0;
        this.appOriginRow = 0;
        this.physicsBoundsBoxArray = this.getPhysicsBoundsBoxes();
    }

    static makeBoxField(rows: number, cols: number, boxSize: number): THREE.Group {
        const mat = new MeshStandardMaterial();
        const geo = makeThreeSidedBoxGeometry(boxSize);
        const group = new Group();

        for (let y = -(cols / 2); y < (cols / 2); y++) {

            for (let i = -(rows / 2); i < (rows / 2); i++) {
                const semi_box = new Mesh(geo, mat);

                semi_box.rotateOnWorldAxis(new Vector3(0, 0, 1), Math.PI * .25);
                semi_box.rotateOnWorldAxis(new Vector3(1, 0, 0), -Math.PI * .20);

                // TODO: FIX ALGO
                semi_box.position.x = i * diag(boxSize, boxSize) + ((y % 2 == 0 ? 1 : -1) * diag(boxSize, boxSize) * .25);
                semi_box.position.z = y * (diag(boxSize, boxSize) * .85);

                // TODO: NOT WORKING
                semi_box.userData.boxSize = boxSize;

                group.add(semi_box);
            }
        }
        return group;
    }

    activateLevelControl(canvas: Element, maxRot: number = 0.1): void {

        canvas.addEventListener('mousemove', (event: MouseEvent) => {

            this.mesh.rotation.z =
                (Math.PI * maxRot) * 
                MathUtils.mapLinear(
                    event.clientX - params.width / 2,
                    -params.width / 2,
                    params.width / 2,
                    - 1.0, 1.0);
                    
            this.mesh.rotation.x =
                (Math.PI * maxRot) * 
                MathUtils.mapLinear(
                    event.clientY - params.height / 2,
                    -params.height / 2,
                    params.height / 2,
                    - 1.0, 1.0);

        });
    
    }

    makeOimoBoxes(world: {add:Function}): Array<Object> {
        this.oimoWorld = world;
        const numBoxes = this.physicsBoundsSize * this.physicsBoundsSize;
        this.oimoBoxes = new Array<OimoBox>(numBoxes);
        for (let i = 0; i < numBoxes; i++) {
            this.oimoBoxes[i] = world.add(cubeToPhysicsBody(this.physicsBoundsBoxArray[i]));
        }
        return this.oimoBoxes;
    }

    updateOimoBoxes(): Array<Object> {
        const numBoxes = this.physicsBoundsSize * this.physicsBoundsSize;
        for (let i = 0; i < numBoxes; i++) {
            this.oimoBoxes[i].setPosition(new Vector3().setFromMatrixPosition(this.physicsBoundsBoxArray[i].matrixWorld));
            this.oimoBoxes[i].setQuaternion(new Quaternion().setFromRotationMatrix(this.physicsBoundsBoxArray[i].matrixWorld));
            //this.oimoBoxes[i].setPosition(this.physicsBoundsBoxArray[i].position);
            //this.oimoBoxes[i].setQuaternion(this.physicsBoundsBoxArray[i].quaternion);
        }
        return this.oimoBoxes;
    }

    getRow(rowIndex: number): Array<THREE.Mesh> {
        rowIndex = rowIndex < 0 ? this.rows + rowIndex : rowIndex;
        const result = new Array<THREE.Mesh>(this.cols);
        for (let i = 0; i < this.cols; i++) {
            result[i] = this.boxArray[rowIndex * this.cols + i];
        }
        return result;
    }

    getApparentRow(rowIndex: number): Array<THREE.Mesh> {
        rowIndex = rowIndex < 0 ? this.rows + rowIndex : rowIndex;
        const result = new Array<THREE.Mesh>(this.cols);
        for (let x = this.appOriginCol, i = 0; x < this.cols + this.appOriginCol; x++, i++) {

            result[i] = this.boxArray[this.safeRowIndex(this.appOriginRow + rowIndex/* + this.safeColIndexOffset(x) */) * this.cols + this.safeColIndex(x)];

        }
        return result;
    }

    getCol(colIndex: number): Array<THREE.Mesh> {
        colIndex = colIndex < 0 ? this.cols + colIndex : colIndex;
        const result = new Array<THREE.Mesh>(this.rows);
        for (let i = 0; i < this.cols; i++) {
            result[i] = this.boxArray[i * this.cols + colIndex];
        }
        return result;
    }

    getApparentCol(colIndex: number): Array<THREE.Mesh> {
        colIndex = colIndex < 0 ? this.rows + colIndex : colIndex;
        const result = new Array<THREE.Mesh>(this.cols);
        for (let y = this.appOriginRow, i = 0; y < this.rows + this.appOriginRow; y++, i++) {
            result[i] = this.boxArray[this.safeRowIndex(y) * this.cols + this.safeColIndex(this.appOriginCol + colIndex/* + this.safeColIndexOffset(y)*/)];
        }
        return result;
    }

    moveAppRow(rowToMove: number, destination: 0 | -1 = -1) {
        if (destination == 0) { this.moveAppRowToBeginning(rowToMove); }
        else if (destination == -1) { this.moveAppRowToEnd(rowToMove); }
    }
    
    private moveAppRowToBeginning(rowIndex: number) {
        const currentBeginningRow = this.getRow(this.appOriginRow);
        const rowToMove = this.getApparentRow(rowIndex);
        console.log(rowToMove);
        const scaleMult = 1 + diag(this.boxSize, this.boxSize) / (diag(this.boxSize, this.boxSize) * this.rows);

        for (let i = 0; i < this.cols; i++) {
            const movementVector = currentBeginningRow[i].position.clone().sub(rowToMove[i].position).multiplyScalar(scaleMult);
            rowToMove[i].position.add(movementVector);
        }

        this.appOriginRow--;
        this.appOriginRow = this.appOriginRow < 0 ? this.rows + this.appOriginRow : this.appOriginRow;
    }

    private moveAppRowToEnd(rowIndex: number) {
        const currentEndRow = this.getRow(this.appOriginRow - 1);
        const rowToMove = this.getApparentRow(rowIndex);
        const scaleMult = 1 + diag(this.boxSize, this.boxSize) / (diag(this.boxSize, this.boxSize) * this.rows);

        for (let i = 0; i < this.cols; i++) {
            const movementVector = currentEndRow[i].position.clone().sub(rowToMove[i].position).multiplyScalar(scaleMult);
            rowToMove[i].position.add(movementVector);
        }

        this.appOriginRow++;
    }

    moveAppCol(colToMove: number, destination: 0 | -1 = -1) {
        if (destination == 0) { this.moveAppColToBeginning(colToMove); }
        else if (destination == -1) { this.moveAppColToEnd(colToMove); }
    }
    
    private moveAppColToBeginning(colIndex: number) {
        const currentBeginningCol = this.getCol(this.appOriginCol);
        const colToMove = this.getApparentCol(colIndex);
        console.log(colToMove);
        const scaleMult = 1 + diag(this.boxSize, this.boxSize) / (diag(this.boxSize, this.boxSize) * this.rows);

        for (let i = 0; i < this.cols; i++) {
            const movementVector = currentBeginningCol[i].position.clone().sub(colToMove[i].position).multiplyScalar(scaleMult);
            colToMove[i].position.add(movementVector);
        }

        this.appOriginCol--;
        this.appOriginCol = this.appOriginCol < 0 ? this.cols + this.appOriginCol : this.appOriginCol;
    }

    private moveAppColToEnd(colIndex: number) {
        const currentEndCol = this.getCol(this.appOriginCol - 1);
        const colToMove = this.getApparentCol(colIndex);
        const scaleMult = 1 + diag(this.boxSize, this.boxSize) / (diag(this.boxSize, this.boxSize) * this.rows);

        for (let i = 0; i < this.cols; i++) {
            const movementVector = currentEndCol[i].position.clone().sub(colToMove[i].position).multiplyScalar(scaleMult);
            colToMove[i].position.add(movementVector);
        }

        this.appOriginCol++;
    }

    private safeRowIndex(rownum: number) { return rownum % this.rows; }
    //private safeRowIndexOffset(rownum: number) { return intDiv(rownum, this.rows); }
    private safeColIndex(colnum: number) { return colnum % this.cols; }
    //private safeColIndexOffset(colnum: number) { return intDiv(colnum, this.cols); }

    private getPhysicsBoundsBoxes() {
        let result = new Array<THREE.Mesh>(this.physicsBoundsSize * this.physicsBoundsSize);
        let minCol = this.centerColumn - intDiv(this.physicsBoundsSize, 2);
        let minRow = this.centerRow - intDiv(this.physicsBoundsSize, 2);

        for (let row = minRow, i = 0; row < minRow + this.physicsBoundsSize; row++, i++) {
            for (let col = minCol, z = 0; col < minCol + this.physicsBoundsSize; col++, z++) {

                result[(i * this.physicsBoundsSize) + z] = arrayGet2D(this.boxArray, row, col, this.cols);

            }
        }

        return result;
    }

}

const makeThreeSidedBoxGeometry = (size: number) => {

    const c = - (size / 2);
    const s = size / 2;

    const points = new BufferAttribute(new Float32Array(
        [c,s,c, c,s,s, s,s,s, c,s,c, s,s,s, s,s,c,
         c,c,s, s,c,s, s,s,s, c,c,s, s,s,s, c,s,s,
         s,c,c, s,s,c, s,s,s, s,c,c, s,s,s, s,c,s]
    ), 3);

    const geo = new BufferGeometry();
    geo.setAttribute('position', points);
    geo.computeVertexNormals();

    return geo;

}

const diag = (side_1: number, side_2: number) => {

    return Math.sqrt(Math.pow(side_1, 2) + Math.pow(side_2, 2));

}
