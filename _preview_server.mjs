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

const { default: stocksHandler }     = await import("./api/stocks.js");
const { default: scoresHandler }     = await import("./api/scores.js");
const { default: chartsHandler }     = await import("./api/charts.js");
const { default: historyHandler }    = await import("./api/history.js");
const { default: techHandler }       = await import("./api/technicals.js");
const { default: newsHandler }       = await import("./api/news.js");
const { default: ratiosHandler }     = await import("./api/ratios.js");
const { default: briefHandler }      = await import("./api/brief.js");
const { default: adminHandler }      = await import("./api/admin.js");
const { default: contactHandler }    = await import("./api/contact.js");
const { default: analystHandler }    = await import("./api/analyst.js");
const { default: insiderHandler }    = await import("./api/insider.js");
const { default: matchHandler }      = await import("./api/match.js");

const server = http.createServer((req, res) => {
  const url   = new URL(req.url, "http://localhost:3456");
  const query = {};
  for (const [k, v] of url.searchParams) query[k] = v;

  function dispatch(handler, body) {
    const fakeReq2 = { query, method: req.method, url: req.url, headers: req.headers, body };
    handler(fakeReq2, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  }

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
  } else if (url.pathname === "/api/history") {
    historyHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/technicals") {
    techHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/news") {
    newsHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/ratios") {
    ratiosHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/brief") {
    briefHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/analyst") {
    analystHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/insider") {
    insiderHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
  } else if (url.pathname === "/api/match") {
    if (req.method === "POST") {
      let raw = "";
      req.on("data", c => raw += c);
      req.on("end", () => dispatch(matchHandler, raw));
    } else {
      matchHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
    }
  } else if (url.pathname === "/api/contact") {
    let raw = "";
    req.on("data", c => raw += c);
    req.on("end", () => dispatch(contactHandler, raw));
  } else if (url.pathname === "/api/admin") {
    if (req.method === "POST") {
      let raw = "";
      req.on("data", c => raw += c);
      req.on("end", () => dispatch(adminHandler, raw));
    } else {
      adminHandler(fakeReq, fakeRes).catch((err) => { res.writeHead(500); res.end(String(err)); });
    }
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3456, () => console.log("Preview server → http://localhost:3456"));
