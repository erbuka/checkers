import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  CubeCamera,
  Geometry,
  BufferGeometry,
  BoxBufferGeometry,
  PlaneBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  Vector2,
  Vector3,
  Color,
  Raycaster,
  Clock,
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  Texture,
  CubeTexture,
  TextureLoader,
  CubeTextureLoader,
  Euler
} from 'three'

import { Grid, IPosition, IMove, IPiece, Utility } from './checkers';
import { PieceGeometry } from './piece-gemoetry';

const CameraDistance = 10;

const TableSize = 20;
const TableDivisions = 2;

const PieceRadius = 0.4;
const PieceHeight = 0.2;

const BoardCellSize = 1.0;
const BoardSize = BoardCellSize * 8;
const BoardDisplacementX = BoardSize / 2;
const BoardDisplacementZ = BoardSize / 2;
const BoardHeight = 0.2;

const MovePieceAnimationTime = 0.5;
const DisplacePiecesAnimationTime = 0.2;

const NormalPieceRot = new Euler(0, 0, 0);
const KingPieceRot = new Euler(Math.PI, 0, 0);

const HighlightColor = 0x336633;



interface ITextures {
  skyBox: CubeTexture,
  pieceNormal: Texture,
  pieceDisplacement: Texture,
  pieceBlackColor: Texture,
  pieceWhiteColor: Texture,
  wood: Texture,
  woodNormal: Texture,
  woodBump: Texture
}

interface IGameGeometry {
  piece: BufferGeometry;
  boardCell: BufferGeometry;
}

interface IGameMaterials {
  table: MeshStandardMaterial
}

interface IMouse {
  currPos: Vector2;
  prevPos: Vector2;
  held: boolean;
}

abstract class Animation {
  private _time: number = 0;
  protected _next: Animation = null;
  protected _ended: ((Animation) => void) = null;

  get finished(): boolean { return this._time === this.duration; }
  get time(): number { return this._time; }

  constructor(readonly duration: number) {  }

  advance(dt: number): Animation {
    this._time = Math.min(this.duration, this.time + dt);
    this.update();
    if (this.finished && this._ended)
      this._ended(this);
    return (this.finished && this._next) ? this._next : this;
  }

  abstract update(): void

  then(next: Animation): Animation {
    this._next = next;
    return next;
  }

  ended(e: ((Animation) => void)): Animation {
    this._ended = e;
    return this;
  }
}

class MoveAnimation extends Animation {

  private _up: Vector3 = new Vector3();

  private static lerpEuler(target: Euler, a: Euler, b: Euler, k: number) {
    target.x = a.x * (1 - k) + b.x * k;
    target.y = a.y * (1 - k) + b.y * k;
    target.z = a.z * (1 - k) + b.z * k;
  }

  constructor(duration: number,
    public targetPos: Vector3, readonly startPos: Vector3, readonly endPos: Vector3,
    public targetRot: Euler = null, readonly startRot: Euler = new Euler(0, 0, 0), readonly endRot: Euler = new Euler(0, 0, 0)) {
    super(duration);
    let height = Math.max(1, new Vector3().subVectors(startPos, endPos).length() / 2);
    this._up.set(0, 1, 0).multiplyScalar(height);
  }

  update(): void {
    let t = this.time / this.duration;
    let k = -Math.pow(2 * t - 1, 4) + 1;
    this.targetPos.lerpVectors(this.startPos, this.endPos, t).add(new Vector3().copy(this._up).multiplyScalar(k));

    if (this.targetRot) {
      MoveAnimation.lerpEuler(this.targetRot, this.startRot, this.endRot, t);
    }

  }
}

class NullAnimation extends Animation {
  constructor() { super(0); }
  update(): void { }
}

class AnimationManager {
  private _animations: Animation[] = [];
  constructor() { }

  add(a: Animation): void {
    this._animations.push(a);
  }

  update(dt: number): void {
    for (let i = this._animations.length - 1; i >= 0; i--) {
      this._animations[i] = this._animations[i].advance(dt);
      if (this._animations[i].finished) {
        this._animations.splice(i, 1);
      }
    }
  }
}


class HighlightMesh extends Mesh {

  private static _clock: Clock = new Clock(true);

  constructor(geom: Geometry | BufferGeometry,
    public material: MeshStandardMaterial,
    public highlightColor: number) {
    super(geom, material);
  }

  setBlinking(enabled: boolean): void {
    let t = (Math.sin(HighlightMesh._clock.getElapsedTime() * 20) + 1) / 2;
    let color = enabled ? new Color(0).lerp(new Color(this.highlightColor), t) : new Color(0);
    this.material.emissive = color;
  }

  setHighlight(enabled: boolean): void {
    this.material.emissive = enabled ? new Color(this.highlightColor) : new Color(0);
  }
}

class PieceMesh extends HighlightMesh {


  constructor(geom: Geometry | BufferGeometry,
    material: MeshStandardMaterial,
    highlightColor: number,
    readonly pieceIndex: number,
    public king: boolean = false) {
    super(geom, material, highlightColor);
  }
}

class BoardCellMesh extends HighlightMesh {
  constructor(geom: Geometry | BufferGeometry,
    material: MeshStandardMaterial,
    highlightColor: number,
    readonly boardPosition: IPosition) {
    super(geom, material, highlightColor);
  }
}

export class GameRenderer {

  // Clock
  private clock: Clock = null;

  private webglRenderer: WebGLRenderer = null;

  private scene: Scene = null;
  private camera: PerspectiveCamera = null;
  private animationManager: AnimationManager = null;
  private raycaster: Raycaster = null;

  // Player move selection
  private msActive: boolean = false;
  private msLegitMoves: IMove[] = null;
  private msCallback: (Move) => void = null;
  private msSelectedPiece: IPiece = null;
  private msCurrentPath: IPosition[] = [];

  // Camera position;
  private cameraAlpha: number = Math.PI / 2;
  private cameraBeta: number = Math.PI / 6;

  // Screen size
  private width: number = 800;
  private height: number = 600;

  // Mouse in NDC space
  private mouse: IMouse = {
    currPos: new Vector2(),
    prevPos: new Vector2(),
    held: false
  }

  private textures: ITextures = {
    pieceNormal: null,
    pieceDisplacement: null,
    pieceBlackColor: null,
    pieceWhiteColor: null,
    skyBox: null,
    wood: null,
    woodNormal: null,
    woodBump: null
  }

  private geometry: IGameGeometry = {
    piece: null,
    boardCell: null
  }

  private materials: IGameMaterials = {
    table: null
  }


  private boardCellsMeshes: BoardCellMesh[] = [];
  private pieceMeshes: PieceMesh[] = [];
  private pieceRestPositions: Vector3[] = [];

  constructor(private canvas: HTMLCanvasElement) { }

  start(): Promise<void> {

    // Load resources first
    return new Promise((resolve, reject) => {
      let promises = []


      promises.push(this.loadTexture("assets/textures/wood.jpg").then(t => this.textures.wood = t));
      promises.push(this.loadTexture("assets/textures/wood_normal.jpg").then(t => this.textures.woodNormal = t));
      promises.push(this.loadTexture("assets/textures/wood_bump.jpg").then(t => this.textures.woodBump = t));
      promises.push(this.loadTexture("assets/textures/piece_normal.jpg").then(t => this.textures.pieceNormal = t));
      promises.push(this.loadTexture("assets/textures/piece_displacement.jpg").then(t => this.textures.pieceDisplacement = t));
      promises.push(this.loadTexture("assets/textures/piece-color-02.jpg").then(t => this.textures.pieceWhiteColor = t));
      promises.push(this.loadTexture("assets/textures/piece-color-01.jpg").then(t => this.textures.pieceBlackColor = t));

      promises.push(this.loadCubeTexture("assets/textures/", "zp.jpg", "zn.jpg", "xp.jpg", "xn.jpg", "yp.jpg", "yn.jpg")
        .then(t => this.textures.skyBox = t)
      )

      Promise.all(promises).then(() => {
        this.load();
        this.loop();
        resolve();
      });
    });
  }


  loadCubeTexture(path: string, front: string, back: string, left: string, right: string, up: string, down: string): Promise<CubeTexture> {
    return new Promise((resolve, reject) => {
      new CubeTextureLoader()
        .setPath(path)
        .load([right, left, up, down, front, back],
          resolve,
          reject
        );
    });
  }

  loadTexture(url: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      new TextureLoader().load(url, (t: Texture) => {
        t.anisotropy = 4;
        resolve(t);
      }, reject);
    });
  }

  mouseToScreen(e: MouseEvent): Vector2 {
    return new Vector2(e.offsetX / this.canvas.width * 2 - 1, (this.canvas.height - e.offsetY) / this.canvas.height * 2 - 1);
  }

  mouseDown(e: MouseEvent): void {
    this.mouse.held = true;
    this.mouse.prevPos.copy(this.mouse.currPos);
    this.mouse.currPos = this.mouseToScreen(e);
  }

  mouseUp(e: MouseEvent): void {
    this.mouse.held = false;
    this.mouse.prevPos.copy(this.mouse.currPos);
    this.mouse.currPos = this.mouseToScreen(e);
  }

  mouseMoved(e: MouseEvent): void {
    this.mouse.prevPos.copy(this.mouse.currPos);
    this.mouse.currPos = this.mouseToScreen(e);
  }
  click(e: MouseEvent): void {

    if (this.msActive) {

      if (e.button === 0) {

        if (this.msSelectedPiece) {
          // Piece is selected, need to select a valid path

          let cell = this.raycastPositionSelection(this.mouseToScreen(e));
          if (cell) {
            this.msCurrentPath.push(cell.boardPosition);

            let completeMove = this.msLegitMoves.find(m => Utility.moveEquals(m, {
              piece: this.msSelectedPiece,
              steps: this.msCurrentPath,
              removePieces: []
            }));

            if (completeMove) {
              this.resetPieceSelection();
              this.msActive = false;
              this.msCallback(completeMove);
            }

          }

        } else {
          // We don't have a selected piece, raycast clicked location
          let result = this.raycastPieceSelection(this.mouseToScreen(e));
          if (result) { // Valid piece
            this.msSelectedPiece = result;
          }
        }
      } else if (e.button === 2) {
        // If right button is clicked, reset the move selection
        this.resetPieceSelection();
      }
    }

    e.stopPropagation();
    e.preventDefault();

  }

  resetPieceSelection(): void {
    this.msSelectedPiece = null;
    this.msCurrentPath = [];
  }

  raycastPositionSelection(v: Vector2): BoardCellMesh {
    this.raycaster.setFromCamera(v, this.camera);

    let intersections = this.raycaster.intersectObjects(this.boardCellsMeshes);

    if (intersections.length === 0)
      return null;

    let moves = this.msLegitMoves.filter(m => m.piece.index === this.msSelectedPiece.index);

    for (let intersection of intersections) {
      let mesh = (<BoardCellMesh>intersection.object);
      let newPath = [...this.msCurrentPath, mesh.boardPosition];

      for (let m of moves) {
        if (Utility.moveContainsPath(newPath, m)) {
          return (<BoardCellMesh>intersection.object);
        }
      }
    }

    return null;
  }

  raycastPieceSelection(v: Vector2): IPiece {
    this.raycaster.setFromCamera(v, this.camera);

    let intersections = this.raycaster.intersectObjects(this.pieceMeshes);

    if (intersections.length > 0) {
      for (let m of this.msLegitMoves) {
        if (m.piece.index === (<PieceMesh>intersections[0].object).pieceIndex) {
          // Raycast hit on valid piece
          return m.piece;
        }
      }
    }

    return null;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  loop(): void {
    requestAnimationFrame(this.loop.bind(this));

    let dt = this.clock.getDelta();
    let elapsed = this.clock.getElapsedTime();

    // Resize screen
    this.webglRenderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();


    // Update materials for meshes that can be highlighted
    this.pieceMeshes.forEach(p => p.setHighlight(false));
    this.boardCellsMeshes.forEach(p => p.setHighlight(false));

    if (this.mouse.held) {
      let c = new Vector2().subVectors(this.mouse.currPos, this.mouse.prevPos);
      this.cameraAlpha += c.x;
      this.cameraBeta = Math.max(Math.PI / 8, Math.min(this.cameraBeta + c.y, Math.PI / 2.5));
    }


    if (this.msActive) {
      if (this.msSelectedPiece === null) {
        let p = this.raycastPieceSelection(this.mouse.currPos);
        if (p !== null) {
          this.pieceMeshes[p.index].setBlinking(true);
        }
      } else {

        this.boardCellsMeshes.filter(cell => {
          for (let p of this.msCurrentPath) {
            if (p.x === cell.boardPosition.x && p.y === cell.boardPosition.y)
              return true;
          }
          return false;
        }).forEach(mesh => mesh.setHighlight(true));

        this.pieceMeshes[this.msSelectedPiece.index].setHighlight(true);

        let cell = this.raycastPositionSelection(this.mouse.currPos);

        if (cell) {
          cell.setBlinking(true);
        }
      }
    }


    // Update animations
    this.animationManager.update(dt);

    // Update main camera
    this.camera.position.set(
      CameraDistance * Math.cos(this.cameraBeta) * Math.cos(this.cameraAlpha),
      CameraDistance * Math.sin(this.cameraBeta),
      CameraDistance * Math.cos(this.cameraBeta) * Math.sin(this.cameraAlpha)
    );
    this.camera.lookAt(0, 0, 0);

    this.webglRenderer.render(this.scene, this.camera);
  }

  load(): void {


    // Init renderer
    this.webglRenderer = new WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.webglRenderer.setClearColor(new Color(0x0000ff));
    this.webglRenderer.shadowMap.enabled = true;
    this.webglRenderer.shadowMap.type = PCFSoftShadowMap; // default THREE.PCFShadowMap


    // Init scene and camera and other basic stuff
    this.scene = new Scene();
    this.scene.background = this.textures.skyBox;

    this.camera = new PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 10, 10);
    this.camera.lookAt(0, 0, 0);

    this.raycaster = new Raycaster();

    this.clock = new Clock(true);

    // Init geometry
    this.geometry.piece = new PieceGeometry(new Vector3(PieceRadius, PieceHeight / 2, PieceRadius), 20);
    this.geometry.boardCell = new BoxBufferGeometry(BoardCellSize, BoardHeight, BoardCellSize);

    // Init materials
    this.materials.table = new MeshStandardMaterial({
      map: this.textures.wood,
      normalMap: this.textures.woodNormal,
      bumpMap: this.textures.woodBump,
      roughness: 0.5
    });

    this.materials.table.metalness = 0;

    // Create pieces meshes
    for (let i = 0; i < 24; i++) {

      let white = i < 12;

      let material = new MeshStandardMaterial({
        map: white ? this.textures.pieceWhiteColor : this.textures.pieceBlackColor,
        normalMap: this.textures.pieceNormal,
        bumpMap: this.textures.pieceDisplacement,
        roughness: 0.5,
        metalness: 0
      });

      let m = new PieceMesh(this.geometry.piece, material, HighlightColor, i);


      this.pieceMeshes.push(m);
      this.scene.add(m);

      let k = i < 12 ? -1 : 1;
      let x = (i % 12 - 6) * BoardCellSize;
      this.pieceRestPositions.push(new Vector3(x + BoardCellSize / 2, PieceHeight / 2, k * (BoardDisplacementZ + BoardCellSize)));

      m.position.copy(this.pieceRestPositions[i]);
      m.castShadow = true;

    }

    // Create table
    let s = TableSize / TableDivisions;
    for (let x = 0; x < TableDivisions; x++) {
      for (let y = 0; y < TableDivisions; y++) {
        let table = new Mesh(new PlaneBufferGeometry(s, s), this.materials.table);
        table.position.set(x * s - TableSize / 2 + s / 2, 0, y * s - TableSize / 2 + s / 2);
        table.rotation.x = -Math.PI / 2;
        table.receiveShadow = true;
        this.scene.add(table);
      }
    }



    // Create board
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {

        let black = ((x % 2) + (y % 2)) % 2 == 0;

        let material = new MeshStandardMaterial({
          color: black ? 0x929aa8 : 0xe0ecff,
          roughness: 0,
          metalness: 1,
          envMap: this.textures.skyBox
        });

        let m = new BoardCellMesh(this.geometry.boardCell, material, HighlightColor, { x: x, y: y });

        m.position.copy(this.getBoardPosition({ x: x, y: y }));
        m.receiveShadow = true;
        m.castShadow = true;
        this.boardCellsMeshes.push(m);
        this.scene.add(m);
      }
    }

    // Lighting
    let light = new DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, -20);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    this.scene.add(light);

    let ambient = new AmbientLight(0x222222)
    this.scene.add(ambient);

    // Init animation manager
    this.animationManager = new AnimationManager();

    this.resize(window.innerWidth, window.innerHeight);
    this.canvas.addEventListener("mousemove", this.mouseMoved.bind(this));
    this.canvas.addEventListener("mousedown", this.mouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", () => this.mouse.held = false);
    this.canvas.addEventListener("click", this.click.bind(this));
    this.canvas.addEventListener("contextmenu", this.click.bind(this));
  }

  displacePieces(grid: Grid, ended: () => void): void {
    let entry = new NullAnimation();
    let animation = entry;

    let intEquals = (a: Vector3 | Euler, b: Vector3 | Euler): boolean => {
      let f = Math.floor;
      return f(a.x) === f(b.x) && f(a.y) === f(b.y) && f(a.z) === f(b.z);
    }

    for (let i = 0; i < 24; i++) {
      let piece = grid.getPieceByIndex(i);
      let pos = grid.getPiecePositionByIndex(i);
      let mesh = this.pieceMeshes[i];


      let startRot = mesh.king ? KingPieceRot : NormalPieceRot;
      let endRot = piece.king ? KingPieceRot : NormalPieceRot;
      let startPos = mesh.position.clone();
      let endPos = this.getPiecePositionOnBoard(pos);

      if (!intEquals(startRot, endRot) || !intEquals(startPos, endPos)) {
        animation = animation.then(new MoveAnimation(DisplacePiecesAnimationTime,
          mesh.position, startPos, endPos,
          mesh.rotation, startRot, endRot
        ));
      }

      mesh.king = piece.king;
    }

    if (ended) {
      animation.ended(ended);
    }

    this.animationManager.add(entry);
  }

  moveSelection(legitMoves: IMove[], select: (Move) => void) {
    this.msActive = true;
    this.msLegitMoves = legitMoves;
    this.msCallback = select;
    this.msSelectedPiece = null;
    this.msCurrentPath = [];
  }

  apply(move: IMove, grid: Grid, ended: (() => void)) {

    let entry = new NullAnimation();
    let animation = entry;

    let pieceMesh: PieceMesh = this.pieceMeshes[move.piece.index];
    let piece: IPiece = grid.getPieceByIndex(move.piece.index);

    let positions: Vector3[] = [pieceMesh.position.clone()];

    for (let pos of move.steps) {
      positions.push(this.getPiecePositionOnBoard(pos));
    }

    for (let i = 0; i < positions.length - 1; i++) {
      let startPos = positions[i];
      let endPos = positions[i + 1];

      animation = animation.then(new MoveAnimation(MovePieceAnimationTime, pieceMesh.position, startPos, endPos));
    }

    // So here we check if the piece became a king. If so, we're adding
    // a move animation at the end of the sequence
    if (piece.king && !pieceMesh.king) {
      let pos = positions[positions.length - 1];
      animation = animation.then(new MoveAnimation(MovePieceAnimationTime,
        pieceMesh.position, pos, pos,
        pieceMesh.rotation, NormalPieceRot, KingPieceRot
      ));
      pieceMesh.king = true;
    }

    for (let rp of move.removePieces) {
      let removePieceMesh = this.pieceMeshes[rp.index];
      let startPos = removePieceMesh.position.clone();
      let endPos = this.pieceRestPositions[rp.index];

      animation = animation.then(new MoveAnimation(MovePieceAnimationTime, removePieceMesh.position, startPos, endPos));
    }

    if (ended) {
      animation.ended(ended);
    }

    this.animationManager.add(entry);

  }



  getBoardPosition(posBoard: IPosition): Vector3 {
    return new Vector3(
      posBoard.x * BoardCellSize - BoardDisplacementX + BoardCellSize / 2,
      0,
      posBoard.y * BoardCellSize - BoardDisplacementZ + BoardCellSize / 2);
  }

  getPiecePositionOnBoard(posBoard: IPosition): Vector3 {
    return new Vector3(
      posBoard.x * BoardCellSize - BoardDisplacementX + BoardCellSize / 2,
      BoardHeight,
      posBoard.y * BoardCellSize - BoardDisplacementZ + BoardCellSize / 2);
  }
}