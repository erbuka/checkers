/// <reference lib="webworker" />

import { Engine, IWorkerInput, Grid } from '../classes/checkers';

/* So this is needed beacuse self has type "Window", and
the method postMessage has a different signature than the one of
the worker's global scope. This is a typescript bug, and his temporary
work around */
let sendMessage : any = self.postMessage;

self.onmessage = function (e) {
    let engine = new Engine();
    let data = <IWorkerInput>(e.data);

    let move = engine.eval(Grid.fromJson(data.gridData), data.player, data.aiName);

    sendMessage(move);
}