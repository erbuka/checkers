let packager = require("electron-packager");
let cp = require("child_process");
let path = require("path");
let archiver = require("archiver");
let fs = require("fs");

let delFolder = (root) => {
    let folder = path.resolve(root);
    let files = fs.readdirSync(folder);
    for (let f of files) {
        f = path.join(folder, f);
        let stats = fs.lstatSync(f);
        if (stats.isFile()) {
            fs.unlinkSync(f);
        } else if (stats.isDirectory()) {
            delFolder(f);
        }
    }
    fs.rmdirSync(folder);
}

let includeFiles = [
    path.resolve("./dist"),
    path.resolve("./electron"),
    path.resolve("./package.json")
];

cp.execSync("ng build --prod --baseHref=./", { stdio: [0, 1, 2] });
packager({
    dir: ".",
    out: "./dist-electron",
    arch: "x64",
    asar: true,
    platform: ["linux", "win32"],
    overwrite: true,
    icon: "./src/favicon.ico",
    ignore: (p) => {
        if (p === "") {
            return false;
        } else {
            p = path.resolve(`.${p}`);
            if (includeFiles.find(v => p.startsWith(v))) {
                return false;
            } else {
                return true;
            }
        }
    }
}).then(values => {
    for (let v of values) {
        let dir = path.resolve(v);
        let dest = path.resolve(v, `../${path.basename(dir)}.zip`);
        let arch = archiver('zip', { zlib: { level: 9 } });
        arch.directory(dir, "/");
        arch.pipe(fs.createWriteStream(dest));

        arch.on("finish", () => {
            delFolder(dir);
            console.log(`Archive created: ${path.basename(dest)}`);
        });

        arch.finalize();
    }
});

