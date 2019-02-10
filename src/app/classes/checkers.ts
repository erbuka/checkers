export type FHeuristic = (g: Grid, c: EColor) => number;

interface IMinMaxResult {
  value: number;
  move: IMove;
}

export enum EDifficulty {
  VeryEasy = 1, Easy = 2, Medium = 3, Hard = 4, VeryHard = 5
}

/* 
  So the following interface defines the AI charactertistics.
  "Name" and "difficulty" are just metadata for the user interface.
  The other parameters defines how the minMax algorithm will operate.
  So "maxSearchDepth" and "heuristic" are just what their name suggests.
  "ClearTought" is something I have added to make games more interesting I hope.
  So basically a clear tought of 80% (0.8) means that the heuristic function
  has an error with range [-20%,20%] of its real value, which means that if there are moves
  which have close heuristic rating, sometimes the AI will not pick the best one.
*/
export interface IAIConfig {
  name: string;
  difficulty: EDifficulty;
  maxSearchDepth: number;
  heuristic: FHeuristic;
  clearThought: number;
}

export interface IWorkerInput {
  gridData: IPiece[],
  player: EColor,
  aiName: string
}

export enum EColor {
  White = 0, Black = 1
}
/* We mark all members as readonly to be sure
that accidentally we don't change the state of the wrong board (it actually happened 
a few times while coding this thing, so better late than ever). This can happen
since during the AI search we're copying a lot of values(grid,pieces..), and in Javascript 
there are no value types except the primitive ones. This wouldn't be necessary in C/C++
since we could use structs. Here we have to take some preemptive measures to avoid errors
*/
export interface IPiece {
  readonly index: number,
  readonly color: EColor,
  readonly king: boolean
}

export interface IPosition {
  readonly x: number;
  readonly y: number;
}

export interface IMove {
  piece: IPiece;
  steps: IPosition[];
  removePieces: IPiece[];
}


/* Here we define all the AIs which will be in the game.
They'll be different in how far they can see (search depth),
have slightly different heuristics (so they'll play different 
tactics/prioritize different aspects of the board), and have
a different value of clear tought which will give the game
some randomness */
export namespace AIDefinitions {

  export enum Names {
    VeryEasy = "Very easy",
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
    VeryHard = "Very hard",
  }

  type TAIMap = Array<{ name: Names, config: IAIConfig }>;

  const aiConfigs: TAIMap = [
    /* Provides almost no challage */
    {
      name: Names.VeryEasy,
      config: {
        name: Names.VeryEasy,
        difficulty: EDifficulty.VeryEasy,
        maxSearchDepth: 2,
        heuristic: (g: Grid, c: EColor) => {
          let score: number = 0;
          for (let p of g.data) {
            if (p !== null) {
              score += (p.color === c ? 1 : -1) * (p.king ? 2 : 1);
            }
          }
          return score;
        },
        clearThought: 0.5
      }
    },
    /* Easy challange */
    {
      name: Names.Easy,
      config: {
        name: Names.Easy,
        difficulty: EDifficulty.Easy,
        maxSearchDepth: 2,
        heuristic: (g: Grid, c: EColor) => {
          let score: number = 0;
          for (let p of g.data) {
            if (p !== null) {
              score += (p.color === c ? 1 : -1) * (p.king ? 2 : 1);
            }
          }
          return score;
        },
        clearThought: 0.8
      }
    },
    /* Average challange */
    {
      name: Names.Medium,
      config: {
        name: Names.Medium,
        difficulty: EDifficulty.Medium,
        maxSearchDepth: 4,
        heuristic: (g: Grid, c: EColor) => {
          let score: number = 0;
          for (let p of g.data) {
            if (p !== null) {
              score += (p.color === c ? 1 : -1) * (p.king ? 2 : 1);
            }
          }
          return score;
        },
        clearThought: 0.8
      }
    },
    /* Hard challange */
    {
      name: Names.Hard,
      config: {
        name: Names.Hard,
        difficulty: EDifficulty.Hard,
        maxSearchDepth: 6,
        heuristic: (g: Grid, c: EColor) => {
          let score: number = 0;
          for (let p of g.data) {
            if (p !== null) {
              score += (p.color === c ? 1 : -1) * (p.king ? 2 : 1);
            }
          }
          return score;
        },
        clearThought: 1
      }
    },
    /* Very hard challange. He cheats */
    {
      name: Names.VeryHard,
      config: {
        name: Names.VeryHard,
        difficulty: EDifficulty.VeryHard,
        maxSearchDepth: 10,
        heuristic: (g: Grid, c: EColor) => {
          let score: number = 0;
          for (let p of g.data) {
            if (p !== null) {
              score += (p.color === c ? 1 : -1) * (p.king ? 2 : 1);
            }
          }
          return score;
        },
        clearThought: 1
      }
    }
  ];

  export function getByName(name: string): IAIConfig {
    return aiConfigs.find(c => c.name === name).config;
  }
}

export class Utility {
  static moveEquals(a: IMove, b: IMove): boolean {
    if (a.piece.index !== b.piece.index || a.steps.length !== b.steps.length)
      return false;

    for (let i = 0; i < a.steps.length; i++) {
      if (a.steps[i].x !== b.steps[i].x || a.steps[i].y !== b.steps[i].y)
        return false;
    }

    return true;
  }

  static moveContainsPath(p: IPosition[], m: IMove): boolean {
    if (p.length > m.steps.length)
      return false;

    for (let i = 0; i < p.length; i++) {
      if (p[i].x !== m.steps[i].x || p[i].y !== m.steps[i].y)
        return false;
    }

    return true;
  }

  static opposite(c: EColor): EColor {
    return c === EColor.White ? EColor.Black : EColor.White;
  }

}


export class Grid {
  private static nextUUID = 0;
  private _uuid: number;
  private _grid: IPiece[];

  static fromJson(data: any): Grid {
    let g = new Grid();
    g._grid = data;
    return g;
  }

  constructor() {
    this._grid = new Array<IPiece>(64);
    this._grid.fill(null);
    this._uuid = Grid.nextUUID++;
  }

  toJson(): any {
    return this._grid;
  }


  get uuid(): number { return this._uuid; }
  get data(): IPiece[] { return this._grid; }

  computePossibleMoves(player: EColor): IMove[] {
    /* 
    So for a given player we compute all the possibile moves in the current board state.
    Let's do with mandatory capture with multiple jumps allowed (and mandatory).. So:
    - foreach piece we look for capture moves
    - if and only if there aren't any capture moves, we look for simple moves
    */


    // Some utility vars
    let dirY = player === EColor.White ? 1 : -1; // allowed move direction for non-king pieces
    let opposite: EColor = player === EColor.White ? EColor.Black : EColor.White; // opposite player color


    let findCaptureMoves = (currentPos: IPosition, currentMove: IMove, directions: number[], outMoves: IMove[]) => {
      let positions: IPosition[] = [];

      // Capture moves are 2 steps long and there has to be an opponent's piece
      // in between
      for (let d of directions) {
        positions.push({ x: currentPos.x - 2, y: currentPos.y + 2 * d });
        positions.push({ x: currentPos.x + 2, y: currentPos.y + 2 * d });
      }

      let endOfPath = true;

      for (let p of positions) {
        // Check if it's a valid capture move

        // we have to check for loops, which can occur if the piece is a king
        if (currentMove.steps.find(s => s.x === p.x && s.y === p.y))
          continue;

        let bw = Grid.between(currentPos, p); // position in between
        let pc = this.get(bw);     // piece in between        
        if (Grid.isValidPosition(p) && Grid.isValidPosition(bw) && pc !== null && pc.color === opposite && this.get(p) === null) {
          // Valid capture position. So we recurse here too see if we can make more jumps from the next position
          findCaptureMoves(p, { piece: currentMove.piece, steps: [...currentMove.steps, p], removePieces: [...currentMove.removePieces, pc] }, directions, outMoves);
          // So if there's a valid position, it's not the end of the path
          endOfPath = false;
        }
      }
      /* 
      if we can't capture anything from the current position, but we have a valid
      move (it has at least one step), we add it the result array
      */
      if (endOfPath && currentMove.steps.length > 0) {
        outMoves.push(currentMove);
      }

    };

    // Get all the player's pieces
    let pieces = this._grid.filter(p => p !== null && p.color === player);

    // Initialize our result
    let moves: IMove[] = [];

    // Look for capture moves first
    for (let piece of pieces) {
      let pos = this.getPiecePosition(piece);

      if (piece.king) { // more possibilities if the piece is a king (opposite direction search)
        findCaptureMoves(pos, { piece: piece, steps: [], removePieces: [] }, [dirY, -dirY], moves);
      } else {
        findCaptureMoves(pos, { piece: piece, steps: [], removePieces: [] }, [dirY], moves);
      }
    }

    // So if there aren't capture moves, we look for simple moves for each piece
    if (moves.length === 0) {
      for (let piece of pieces) {
        let pos = this.getPiecePosition(piece);

        let simple: IPosition[] = [{ x: pos.x - 1, y: pos.y + dirY }, { x: pos.x + 1, y: pos.y + dirY }];

        // if it's a king, can go even in opposite direction
        if (piece.king) {
          simple = [...simple, { x: pos.x - 1, y: pos.y - dirY }, { x: pos.x + 1, y: pos.y - dirY }]
        }

        for (let s of simple) {
          if (Grid.isValidPosition(s) && this.get(s) === null) {
            moves.push({ piece: piece, steps: [s], removePieces: [] });
          }
        }

      }
    }

    return moves;

  }

  set(p: IPosition, piece: IPiece) {
    this._grid[this.parsePos(p)] = piece;
  }


  get(p: IPosition): IPiece {
    return Grid.isValidPosition(p) ? this._grid[this.parsePos(p)] : null;
  }

  private parsePos(p: IPosition): number {
    return p.y * 8 + p.x;
  }

  apply(move: IMove): Grid {
    /* To apply we only need to put the piece in the final location */

    let finalPos = move.steps[move.steps.length - 1];
    let piece = this.getPieceByIndex(move.piece.index);

    this.set(this.getPiecePosition(move.piece), null);
    this.set(finalPos, piece);
    for (let r of move.removePieces) {
      let pos = this.getPiecePosition(r);
      this.set(pos, null);
    }

    /* Here we check if the piece becomes a king */
    let kingPos = move.piece.color === EColor.White ? 7 : 0;

    if (!piece.king && kingPos === finalPos.y) {
      this.set(finalPos, { index: piece.index, color: piece.color, king: true });
    }

    return this;
  }

  copy(): Grid {
    let g = new Grid();
    g._grid = this._grid.map(p => p !== null ? { king: p.king, color: p.color, index: p.index } : null);
    return g;
  }

  getPieceByIndex(idx: number): IPiece {
    for (let c of this._grid) {
      if (c !== null && c.index === idx)
        return c;
    }
    console.error(`Piece not found(${idx})`);
    return null;
  }

  getPiecePosition(piece: IPiece): IPosition {
    return this.getPiecePositionByIndex(piece.index);
  }

  getPiecePositionByIndex(idx: number): IPosition {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        let p = this.get({ x: x, y: y });
        if (p && p.index === idx)
          return { x: x, y: y };
      }
    }
    console.error(`Piece not found(${idx})`);
    return null;
  }

  static create(): Grid {
    let r = new Grid();
    let idx = 0;

    for (let i = 0; i < 12; i++) {
      let flag = Math.floor(i / 4) === 1;
      r._grid[i * 2 + (flag ? 1 : 0)] = { index: idx, color: EColor.White, king: false };
      r._grid[63 - i * 2 + (flag ? -1 : 0)] = { index: idx + 12, color: EColor.Black, king: false };
      idx++;
    }



    return r;
  }

  static isValidPosition(pos: IPosition) { return pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8; }

  static between(a: IPosition, b: IPosition): IPosition {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

}


class State {


  constructor(public grid: Grid, public turn: EColor, public depth: number, public move: IMove = null) {

  }


  children(): State[] {

    if (this.depth === 0)
      return [];

    let opposite: EColor = this.turn === EColor.White ? EColor.Black : EColor.White;

    let moves = this.grid.computePossibleMoves(this.turn);

    return moves.map(m => {
      let g = this.grid.copy().apply(m);
      return new State(g, opposite, this.depth - 1, m);
    });

  }

}



export class Engine {
  constructor() {

  }

  static evalInWorker(initialGrid: Grid, player: EColor, aiName: string): Promise<IMove> {

    return new Promise((resolve, reject) => {
      let worker = new Worker("assets/scripts/checkers-worker.js");

      worker.addEventListener("message", (e: MessageEvent) => {
        resolve(<IMove>e.data);
      });

      worker.postMessage(<IWorkerInput>{
        player: player,
        gridData: initialGrid.toJson(),
        aiName: aiName
      });
    });

  }

  eval(initialGrid: Grid, player: EColor, aiName: string): IMove {

    let aiConfig = AIDefinitions.getByName(aiName);

    let initialState = new State(initialGrid, player, aiConfig.maxSearchDepth);

    // So we're a applying a minimax aglorithm to find the best move
    //let mmr = this.alphaBeta(initialState, player, aiConfig);
    let mmr = this.alphaBeta(initialState, player, aiConfig);

    return mmr.move;
  }

  /* MinMax algorithm with alpha-beta pruning */
  private alphaBeta(state: State, player: EColor, aiConfig: IAIConfig, alpha: number = Number.NEGATIVE_INFINITY, beta: number = Number.POSITIVE_INFINITY): IMinMaxResult {

    let children = state.children();

    let clearToughtFactor = 1 + (1 - aiConfig.clearThought) * (Math.random() * 2 - 1);

    // if we reached the maximum search depth or we can't make any further moves, just return
    // the current board heuristic
    if (state.depth === 0 || children.length === 0)
      return { value: aiConfig.heuristic(state.grid, player) * clearToughtFactor, move: state.move };

    let value: number, move: IMove;

    // Our turn -> choose the maximizing move
    if (state.turn === player) {
      value = Number.NEGATIVE_INFINITY;

      for (let s of children) {
        let mmr = this.alphaBeta(s, player, aiConfig, alpha, beta);
        if (mmr.value > value) {
          value = mmr.value;
          move = s.move;
        }
        alpha = Math.max(alpha, value);
        if (alpha >= beta) {
          break;
        }
      }
    } else { // Opponent's turn -> choose the minimizing move
      value = Number.POSITIVE_INFINITY;

      for (let s of children) {
        let mmr = this.alphaBeta(s, player, aiConfig, alpha, beta);
        if (mmr.value < value) {
          value = mmr.value;
          move = s.move;
        }
        beta = Math.min(beta, value);
        if (alpha >= beta) {
          break;
        }
      }
    }

    return { value: value, move: move };
  }

  /* MinMax algorithm */
  private minMax(state: State, player: EColor, aiConfig: IAIConfig): IMinMaxResult {

    let children = state.children();

    let clearToughtFactor = 1 + (1 - aiConfig.clearThought) * (Math.random() * 2 - 1);

    // if we reached the maximum search depth or we can't make any further moves, just return
    // the current board heuristic
    if (state.depth === 0 || children.length === 0)
      return { value: aiConfig.heuristic(state.grid, player) * clearToughtFactor, move: state.move };

    let value: number, move: IMove;

    // Our turn -> choose the maximizing move
    if (state.turn === player) {
      value = Number.NEGATIVE_INFINITY;

      for (let s of children) {
        let mmr = this.minMax(s, player, aiConfig);
        if (mmr.value > value) {
          value = mmr.value;
          move = s.move;
        }
      }
    } else { // Opponent's turn -> choose the minimizing move
      value = Number.POSITIVE_INFINITY;

      for (let s of children) {
        let mmr = this.minMax(s, player, aiConfig);
        if (mmr.value < value) {
          value = mmr.value;
          move = s.move;
        }
      }
    }

    return { value: value, move: move };

  }

}
