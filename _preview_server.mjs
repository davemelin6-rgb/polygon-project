import http        from "http";
import { readFileSync } from "fs";
import path         from "path";
import { fileURLToPath } from "url";

// Load .env manually (no dotenv dependency needed)
try {
  const env = readFileSync(".env", "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const { default: stocksHandler } = await import("./api/stocks.js");
const { default: scoresHandler } = await import("./api/scores.js");
const { default: chartsHandler } = await import("./api/charts.js");

const server = http.createServer((req, res) => {
  const url   = new URL(req.url, "http://localhost:3456");
  const query = {};
  for (const [k, v] of url.searchParams) query[k] = v;

  const fakeReq = { query, method: req.method, url: req.url, headers: req.headers };
  const fakeRes = {
    _status: 200,
    status(code) { this._status = code; return this; },
    json(body) {
      res.writeHead(this._status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body, null, 2));
    },
  };

  if (url.pathname === "/api/stocks") {
    stocksHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/scores") {
    scoresHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/charts") {
    chartsHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3456, () => console.log("Preview server → http://localhost:3456"));
