(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EDifficulty;
(function (EDifficulty) {
    EDifficulty[EDifficulty["VeryEasy"] = 1] = "VeryEasy";
    EDifficulty[EDifficulty["Easy"] = 2] = "Easy";
    EDifficulty[EDifficulty["Medium"] = 3] = "Medium";
    EDifficulty[EDifficulty["Hard"] = 4] = "Hard";
    EDifficulty[EDifficulty["VeryHard"] = 5] = "VeryHard";
})(EDifficulty = exports.EDifficulty || (exports.EDifficulty = {}));
var EColor;
(function (EColor) {
    EColor[EColor["White"] = 0] = "White";
    EColor[EColor["Black"] = 1] = "Black";
})(EColor = exports.EColor || (exports.EColor = {}));
/* Here we define all the AIs which will be in the game.
They'll be different in how far they can see (search depth),
have slightly different heuristics (so they'll play different
tactics/prioritize different aspects of the board), and have
a different value of clear tought which will give the game
some randomness */
var AIDefinitions;
(function (AIDefinitions) {
    var Names;
    (function (Names) {
        Names["VeryEasy"] = "Very easy";
        Names["Easy"] = "Easy";
        Names["Medium"] = "Medium";
        Names["Hard"] = "Hard";
        Names["VeryHard"] = "Very hard";
    })(Names = AIDefinitions.Names || (AIDefinitions.Names = {}));
    var aiConfigs = [
        /* Provides almost no challage */
        {
            name: Names.VeryEasy,
            config: {
                name: Names.VeryEasy,
                difficulty: EDifficulty.VeryEasy,
                maxSearchDepth: 2,
                heuristic: function (g, c) {
                    var score = 0;
                    for (var _i = 0, _a = g.data; _i < _a.length; _i++) {
                        var p = _a[_i];
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
                heuristic: function (g, c) {
                    var score = 0;
                    for (var _i = 0, _a = g.data; _i < _a.length; _i++) {
                        var p = _a[_i];
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
                heuristic: function (g, c) {
                    var score = 0;
                    for (var _i = 0, _a = g.data; _i < _a.length; _i++) {
                        var p = _a[_i];
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
                heuristic: function (g, c) {
                    var score = 0;
                    for (var _i = 0, _a = g.data; _i < _a.length; _i++) {
                        var p = _a[_i];
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
                heuristic: function (g, c) {
                    var score = 0;
                    for (var _i = 0, _a = g.data; _i < _a.length; _i++) {
                        var p = _a[_i];
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
    function getByName(name) {
        return aiConfigs.find(function (c) { return c.name === name; }).config;
    }
    AIDefinitions.getByName = getByName;
})(AIDefinitions = exports.AIDefinitions || (exports.AIDefinitions = {}));
var Utility = /** @class */ (function () {
    function Utility() {
    }
    Utility.moveEquals = function (a, b) {
        if (a.piece.index !== b.piece.index || a.steps.length !== b.steps.length)
            return false;
        for (var i = 0; i < a.steps.length; i++) {
            if (a.steps[i].x !== b.steps[i].x || a.steps[i].y !== b.steps[i].y)
                return false;
        }
        return true;
    };
    Utility.moveContainsPath = function (p, m) {
        if (p.length > m.steps.length)
            return false;
        for (var i = 0; i < p.length; i++) {
            if (p[i].x !== m.steps[i].x || p[i].y !== m.steps[i].y)
                return false;
        }
        return true;
    };
    Utility.opposite = function (c) {
        return c === EColor.White ? EColor.Black : EColor.White;
    };
    return Utility;
}());
exports.Utility = Utility;
var Grid = /** @class */ (function () {
    function Grid() {
        this._grid = new Array(64);
        this._grid.fill(null);
        this._uuid = Grid.nextUUID++;
    }
    Grid.fromJson = function (data) {
        var g = new Grid();
        g._grid = data;
        return g;
    };
    Grid.prototype.toJson = function () {
        return this._grid;
    };
    Object.defineProperty(Grid.prototype, "uuid", {
        get: function () { return this._uuid; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "data", {
        get: function () { return this._grid; },
        enumerable: true,
        configurable: true
    });
    Grid.prototype.computePossibleMoves = function (player) {
        /*
        So for a given player we compute all the possibile moves in the current board state.
        Let's do with mandatory capture with multiple jumps allowed (and mandatory).. So:
        - foreach piece we look for capture moves
        - if and only if there aren't any capture moves, we look for simple moves
        */
        var _this = this;
        // Some utility vars
        var dirY = player === EColor.White ? 1 : -1; // allowed move direction for non-king pieces
        var opposite = player === EColor.White ? EColor.Black : EColor.White; // opposite player color
        var findCaptureMoves = function (currentPos, currentMove, directions, outMoves) {
            var positions = [];
            // Capture moves are 2 steps long and there has to be an opponent's piece
            // in between
            for (var _i = 0, directions_1 = directions; _i < directions_1.length; _i++) {
                var d = directions_1[_i];
                positions.push({ x: currentPos.x - 2, y: currentPos.y + 2 * d });
                positions.push({ x: currentPos.x + 2, y: currentPos.y + 2 * d });
            }
            var endOfPath = true;
            var _loop_1 = function (p) {
                // Check if it's a valid capture move
                // we have to check for loops, which can occur if the piece is a king
                if (currentMove.steps.find(function (s) { return s.x === p.x && s.y === p.y; }))
                    return "continue";
                var bw = Grid.between(currentPos, p); // position in between
                var pc = _this.get(bw); // piece in between        
                if (Grid.isValidPosition(p) && Grid.isValidPosition(bw) && pc !== null && pc.color === opposite && _this.get(p) === null) {
                    // Valid capture position. So we recurse here too see if we can make more jumps from the next position
                    findCaptureMoves(p, { piece: currentMove.piece, steps: currentMove.steps.concat([p]), removePieces: currentMove.removePieces.concat([pc]) }, directions, outMoves);
                    // So if there's a valid position, it's not the end of the path
                    endOfPath = false;
                }
            };
            for (var _a = 0, positions_1 = positions; _a < positions_1.length; _a++) {
                var p = positions_1[_a];
                _loop_1(p);
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
        var pieces = this._grid.filter(function (p) { return p !== null && p.color === player; });
        // Initialize our result
        var moves = [];
        // Look for capture moves first
        for (var _i = 0, pieces_1 = pieces; _i < pieces_1.length; _i++) {
            var piece = pieces_1[_i];
            var pos = this.getPiecePosition(piece);
            if (piece.king) { // more possibilities if the piece is a king (opposite direction search)
                findCaptureMoves(pos, { piece: piece, steps: [], removePieces: [] }, [dirY, -dirY], moves);
            }
            else {
                findCaptureMoves(pos, { piece: piece, steps: [], removePieces: [] }, [dirY], moves);
            }
        }
        // So if there aren't capture moves, we look for simple moves for each piece
        if (moves.length === 0) {
            for (var _a = 0, pieces_2 = pieces; _a < pieces_2.length; _a++) {
                var piece = pieces_2[_a];
                var pos = this.getPiecePosition(piece);
                var simple = [{ x: pos.x - 1, y: pos.y + dirY }, { x: pos.x + 1, y: pos.y + dirY }];
                // if it's a king, can go even in opposite direction
                if (piece.king) {
                    simple = simple.concat([{ x: pos.x - 1, y: pos.y - dirY }, { x: pos.x + 1, y: pos.y - dirY }]);
                }
                for (var _b = 0, simple_1 = simple; _b < simple_1.length; _b++) {
                    var s = simple_1[_b];
                    if (Grid.isValidPosition(s) && this.get(s) === null) {
                        moves.push({ piece: piece, steps: [s], removePieces: [] });
                    }
                }
            }
        }
        return moves;
    };
    Grid.prototype.set = function (p, piece) {
        this._grid[this.parsePos(p)] = piece;
    };
    Grid.prototype.get = function (p) {
        return Grid.isValidPosition(p) ? this._grid[this.parsePos(p)] : null;
    };
    Grid.prototype.parsePos = function (p) {
        return p.y * 8 + p.x;
    };
    Grid.prototype.apply = function (move) {
        /* To apply we only need to put the piece in the final location */
        var finalPos = move.steps[move.steps.length - 1];
        var piece = this.getPieceByIndex(move.piece.index);
        this.set(this.getPiecePosition(move.piece), null);
        this.set(finalPos, piece);
        for (var _i = 0, _a = move.removePieces; _i < _a.length; _i++) {
            var r = _a[_i];
            var pos = this.getPiecePosition(r);
            this.set(pos, null);
        }
        /* Here we check if the piece becomes a king */
        var kingPos = move.piece.color === EColor.White ? 7 : 0;
        if (!piece.king && kingPos === finalPos.y) {
            this.set(finalPos, { index: piece.index, color: piece.color, king: true });
        }
        return this;
    };
    Grid.prototype.copy = function () {
        var g = new Grid();
        g._grid = this._grid.map(function (p) { return p !== null ? { king: p.king, color: p.color, index: p.index } : null; });
        return g;
    };
    Grid.prototype.getPieceByIndex = function (idx) {
        for (var _i = 0, _a = this._grid; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c !== null && c.index === idx)
                return c;
        }
        console.error("Piece not found(" + idx + ")");
        return null;
    };
    Grid.prototype.getPiecePosition = function (piece) {
        return this.getPiecePositionByIndex(piece.index);
    };
    Grid.prototype.getPiecePositionByIndex = function (idx) {
        for (var x = 0; x < 8; x++) {
            for (var y = 0; y < 8; y++) {
                var p = this.get({ x: x, y: y });
                if (p && p.index === idx)
                    return { x: x, y: y };
            }
        }
        console.error("Piece not found(" + idx + ")");
        return null;
    };
    Grid.create = function () {
        var r = new Grid();
        var idx = 0;
        for (var i = 0; i < 12; i++) {
            var flag = Math.floor(i / 4) === 1;
            r._grid[i * 2 + (flag ? 1 : 0)] = { index: idx, color: EColor.White, king: false };
            r._grid[63 - i * 2 + (flag ? -1 : 0)] = { index: idx + 12, color: EColor.Black, king: false };
            idx++;
        }
        return r;
    };
    Grid.isValidPosition = function (pos) { return pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8; };
    Grid.between = function (a, b) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    Grid.nextUUID = 0;
    return Grid;
}());
exports.Grid = Grid;
var State = /** @class */ (function () {
    function State(grid, turn, depth, move) {
        if (move === void 0) { move = null; }
        this.grid = grid;
        this.turn = turn;
        this.depth = depth;
        this.move = move;
    }
    State.prototype.children = function () {
        var _this = this;
        if (this.depth === 0)
            return [];
        var opposite = this.turn === EColor.White ? EColor.Black : EColor.White;
        var moves = this.grid.computePossibleMoves(this.turn);
        return moves.map(function (m) {
            var g = _this.grid.copy().apply(m);
            return new State(g, opposite, _this.depth - 1, m);
        });
    };
    return State;
}());
var Engine = /** @class */ (function () {
    function Engine() {
    }
    Engine.evalInWorker = function (initialGrid, player, aiName) {
        return new Promise(function (resolve, reject) {
            var worker = new Worker("assets/scripts/checkers-worker.js");
            worker.addEventListener("message", function (e) {
                resolve(e.data);
            });
            worker.postMessage({
                player: player,
                gridData: initialGrid.toJson(),
                aiName: aiName
            });
        });
    };
    Engine.prototype.eval = function (initialGrid, player, aiName) {
        var aiConfig = AIDefinitions.getByName(aiName);
        var initialState = new State(initialGrid, player, aiConfig.maxSearchDepth);
        // So we're a applying a minimax aglorithm to find the best move
        //let mmr = this.alphaBeta(initialState, player, aiConfig);
        var mmr = this.alphaBeta(initialState, player, aiConfig);
        return mmr.move;
    };
    /* MinMax algorithm with alpha-beta pruning */
    Engine.prototype.alphaBeta = function (state, player, aiConfig, alpha, beta) {
        if (alpha === void 0) { alpha = Number.NEGATIVE_INFINITY; }
        if (beta === void 0) { beta = Number.POSITIVE_INFINITY; }
        var children = state.children();
        var clearToughtFactor = 1 + (1 - aiConfig.clearThought) * (Math.random() * 2 - 1);
        // if we reached the maximum search depth or we can't make any further moves, just return
        // the current board heuristic
        if (state.depth === 0 || children.length === 0)
            return { value: aiConfig.heuristic(state.grid, player) * clearToughtFactor, move: state.move };
        var value, move;
        // Our turn -> choose the maximizing move
        if (state.turn === player) {
            value = Number.NEGATIVE_INFINITY;
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var s = children_1[_i];
                var mmr = this.alphaBeta(s, player, aiConfig, alpha, beta);
                if (mmr.value > value) {
                    value = mmr.value;
                    move = s.move;
                }
                alpha = Math.max(alpha, value);
                if (alpha >= beta) {
                    break;
                }
            }
        }
        else { // Opponent's turn -> choose the minimizing move
            value = Number.POSITIVE_INFINITY;
            for (var _a = 0, children_2 = children; _a < children_2.length; _a++) {
                var s = children_2[_a];
                var mmr = this.alphaBeta(s, player, aiConfig, alpha, beta);
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
    };
    /* MinMax algorithm */
    Engine.prototype.minMax = function (state, player, aiConfig) {
        var children = state.children();
        var clearToughtFactor = 1 + (1 - aiConfig.clearThought) * (Math.random() * 2 - 1);
        // if we reached the maximum search depth or we can't make any further moves, just return
        // the current board heuristic
        if (state.depth === 0 || children.length === 0)
            return { value: aiConfig.heuristic(state.grid, player) * clearToughtFactor, move: state.move };
        var value, move;
        // Our turn -> choose the maximizing move
        if (state.turn === player) {
            value = Number.NEGATIVE_INFINITY;
            for (var _i = 0, children_3 = children; _i < children_3.length; _i++) {
                var s = children_3[_i];
                var mmr = this.minMax(s, player, aiConfig);
                if (mmr.value > value) {
                    value = mmr.value;
                    move = s.move;
                }
            }
        }
        else { // Opponent's turn -> choose the minimizing move
            value = Number.POSITIVE_INFINITY;
            for (var _a = 0, children_4 = children; _a < children_4.length; _a++) {
                var s = children_4[_a];
                var mmr = this.minMax(s, player, aiConfig);
                if (mmr.value < value) {
                    value = mmr.value;
                    move = s.move;
                }
            }
        }
        return { value: value, move: move };
    };
    return Engine;
}());
exports.Engine = Engine;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var checkers_1 = require("../classes/checkers");
/* So this is needed beacuse self has type "Window", and
the method postMessage has a different signature than the one of
the worker's global scope. This is a typescript bug, and his temporary
work around */
var sendMessage = self.postMessage;
self.onmessage = function (e) {
    var engine = new checkers_1.Engine();
    var data = (e.data);
    var move = engine.eval(checkers_1.Grid.fromJson(data.gridData), data.player, data.aiName);
    sendMessage(move);
};

},{"../classes/checkers":1}]},{},[2]);
