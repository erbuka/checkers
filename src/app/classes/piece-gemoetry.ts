import { BufferGeometry, Vector3, Float32BufferAttribute } from 'three';


export class PieceGeometry extends BufferGeometry {
    constructor(scale: Vector3 = new Vector3(1, 1, 1), divisions: number = 10) {
        super();

        let vertices = [];
        let normals = [];
        let texCoords = [];

        let angleStep = (2 * Math.PI) / divisions;

        // Top cap
        for (let i = 0; i < divisions; i++) {
            let x0 = Math.cos(i * angleStep);
            let z0 = Math.sin(i * angleStep);
            let x1 = Math.cos((i + 1) * angleStep);
            let z1 = Math.sin((i + 1) * angleStep);

            let tu0 = (x0 + 1) / 4;
            let tu1 = (x1 + 1) / 4;
            let tv0 = (z0 + 1) / 2;
            let tv1 = (z1 + 1) / 2;

            vertices.push(0, 1, 0); normals.push(0, 1, 0); texCoords.push(0.25, 0.5);
            vertices.push(x1, 1, z1); normals.push(0, 1, 0); texCoords.push(tu1, tv1);
            vertices.push(x0, 1, z0); normals.push(0, 1, 0); texCoords.push(tu0, tv0);

        }

        // Body
        for (let i = 0; i < divisions; i++) {
            let x0 = Math.cos(i * angleStep);
            let z0 = Math.sin(i * angleStep);
            let x1 = Math.cos((i + 1) * angleStep);
            let z1 = Math.sin((i + 1) * angleStep);


            vertices.push(x0, 1, z0); normals.push(x0, 0, z0); texCoords.push(0, 0);
            vertices.push(x1, 1, z1); normals.push(x1, 0, z1); texCoords.push(0, 0);
            vertices.push(x0, -1, z0); normals.push(x0, 0, z0); texCoords.push(0, 0);

            vertices.push(x0, -1, z0); normals.push(x0, 0, z0); texCoords.push(0, 0);
            vertices.push(x1, 1, z1); normals.push(x1, 0, z1); texCoords.push(0, 0);
            vertices.push(x1, -1, z1); normals.push(x1, 0, z1); texCoords.push(0, 0);

        }

        // Bottom cap
        for (let i = 0; i < divisions; i++) {
            let x0 = Math.cos(i * angleStep);
            let z0 = Math.sin(i * angleStep);
            let x1 = Math.cos((i + 1) * angleStep);
            let z1 = Math.sin((i + 1) * angleStep);


            let tu0 = 0.5 + (x0 + 1) / 4;
            let tu1 = 0.5 + (x1 + 1) / 4;
            let tv0 = (z0 + 1) / 2;
            let tv1 = (z1 + 1) / 2;


            vertices.push(0, -1, 0); normals.push(0, -1, 0); texCoords.push(.75, .5);
            vertices.push(x0, -1, z0); normals.push(0, -1, 0); texCoords.push(tu0, tv0);
            vertices.push(x1, -1, z1); normals.push(0, -1, 0); texCoords.push(tu1, tv1);

        }
        // Create geometry

        this.addAttribute("position", new Float32BufferAttribute(vertices, 3));
        this.addAttribute("normal", new Float32BufferAttribute(normals, 3, true));
        this.addAttribute("uv", new Float32BufferAttribute(texCoords, 2, true));
        this.scale(scale.x, scale.y, scale.z);

    }
}