var browserify = require("browserify");
var tsify = require("tsify");
var fs = require("fs");

browserify()
    .add("./src/app/web-workers/checkers-worker.ts")
    .plugin("tsify", { module: "es5", target: "es5" })
    .bundle()
    .pipe(fs.createWriteStream("./src/assets/scripts/checkers-worker.js"));