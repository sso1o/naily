const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".css": "text/css",
};
http
  .createServer((req, res) => {
    let target;
    try {
      target = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory())
      target = path.join(root, "index.html");
    res.setHeader(
      "Content-Type",
      mime[path.extname(target)] || "application/octet-stream",
    );
    fs.createReadStream(target)
      .on("error", () =>
        res.writeHead(404).end("Build first: npm run build:web"),
      )
      .pipe(res);
  })
  .listen(Number(process.env.PORT || 9081), "127.0.0.1", () =>
    console.log("Naily preview http://127.0.0.1:" + (process.env.PORT || 9081)),
  );
