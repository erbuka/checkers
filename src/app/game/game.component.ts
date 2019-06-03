import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { GameRenderer } from '../classes/game-renderer';
import { Grid, EColor, Engine, IMove, Utility, IAIConfig, AIDefinitions } from '../classes/checkers';
import {  fadeAnimation } from '../animations';
enum EGameState {
  Loading = "loading", 
  MainMenu = "main-menu", 
  AISelection = "ai-selection", 
  Playing = "playing", 
  Surrender = 'surrender',
  GameOver = "game-over"
}

enum EPlayerType {
  Human = 0, CPU = 1
}

interface IPlayer {
  type: EPlayerType;
  color: EColor;
}

class Timer {

  private _currentTime: number = 0;
  private _timer: any = null;

  constructor() { }

  restart(): void {
    this._currentTime = 0;
    if (this._timer !== null) {
      clearInterval(this._timer);
    }
    this._timer = setInterval(() => {
      this._currentTime += 1;
    }, 1000);
  }

  getDigit(index: number = 0) {
    return (this.formattedMinutes + this.formattedSeconds).charAt(index);
  }

  get formattedTime(): string { return this.formattedMinutes + ":" + this.formattedSeconds; }

  get formattedMinutes(): string {
    let m = Math.floor(this._currentTime / 60)
    return (m < 10 ? "0" + m : m + "");
  }

  get formattedSeconds(): string {
    let s = this._currentTime % 60;
    return (s < 10 ? "0" + s : s + "");
  }

}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  animations: [fadeAnimation]
})
export class GameComponent implements OnInit {

  players: IPlayer[];

  gameOverText: string = "PlaceHolder";

  aiConfigs: IAIConfig[] = [
    AIDefinitions.getByName(AIDefinitions.Names.VeryEasy),
    AIDefinitions.getByName(AIDefinitions.Names.Easy),
    AIDefinitions.getByName(AIDefinitions.Names.Medium),
    AIDefinitions.getByName(AIDefinitions.Names.Hard),
    AIDefinitions.getByName(AIDefinitions.Names.VeryHard),
  ]
  selectedAi: IAIConfig = null;

  timer: Timer = null;
  currentPlayer: IPlayer;
  grid: Grid = null;
  gameRenderer: GameRenderer = null;
  gameState: EGameState = EGameState.Loading;
  @ViewChild("renderCanvas", { static: true }) private canvasRef: ElementRef;


  constructor() { }

  ngOnInit() {
    this.gameRenderer = new GameRenderer(this.canvasRef.nativeElement);
    this.gameRenderer.start().then(()=>{
      this.gameState = EGameState.MainMenu;
    });
  }

  newGame(p1: EPlayerType, p2: EPlayerType) {
    this.timer = new Timer();
    this.grid = Grid.create();
    this.gameState = EGameState.Playing;
    this.players = [
      { type: p1, color: EColor.Black },
      { type: p2, color: EColor.White }
    ];
    this.currentPlayer = this.players[0];
    this.gameRenderer.displacePieces(this.grid, this.nextMove.bind(this));
  }

  surrender() {
    this.gameOver(Utility.opposite(this.currentPlayer.color));
  }

  gameOver(winner: EColor): void {
    this.gameState = EGameState.GameOver;
    this.gameOverText = `${winner === EColor.White ? "White" : "Black"} wins`;
  }

  endTurn(): void {
    this.currentPlayer = this.currentPlayer === this.players[0] ? this.players[1] : this.players[0];
  }

  nextMove() {
    this.timer.restart();
    if (this.currentPlayer.type === EPlayerType.CPU) {
      /*
      If the player is an AI, we just run our engine to find
      the best move. If there are no moves, the oppenent wins,
      otherwise we just play that move.
      */

      Engine.evalInWorker(this.grid, this.currentPlayer.color, this.selectedAi.name).then((move: IMove) => {
        if (move) {
          this.grid.apply(move);
          this.gameRenderer.apply(move, this.grid, () => {
            this.endTurn();
            this.nextMove();
          });
        } else {
          this.gameOver(Utility.opposite(this.currentPlayer.color));
        }
      });
    } else {
      /* 
      So for a human player we calculate all the possibile moves using the
      same function the CPU uses. So we know all the legit moves in advance.
      */

      let legitMoves = this.grid.computePossibleMoves(this.currentPlayer.color);

      /*
      Now the player must move a piece using his mouse. The event handling must be
      done by the renderer.
      */
      if (legitMoves.length > 0) {
        this.gameRenderer.moveSelection(legitMoves, (m: IMove) => {
          this.grid.apply(m);
          this.gameRenderer.apply(m, this.grid, () => {
            this.endTurn();
            this.nextMove();
          });
        });
      } else {
        this.gameOver(Utility.opposite(this.currentPlayer.color));
      }

    }
  }

  @HostListener("window:resize", ["$event.target"])
  onResize(target: any) {
    this.gameRenderer.resize(target.innerWidth, target.innerHeight);
  }

}