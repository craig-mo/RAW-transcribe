const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Load API keys
const configText = fs.readFileSync(path.join(__dirname, "config.js"), "utf8");
const CONFIG = {};
configText.replace(
  /(\w+_API_KEY)\s*:\s*"([^"]*)"/g,
  (_, k, v) => (CONFIG[k] = v)
);

const PORT = 3000;
const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

// ── Auto-shutdown when the browser tab/window closes ──
// The page holds an EventSource open to /api/keepalive. When every such
// connection drops (tab closed, window closed, browser quit) and none
// reconnects within the grace window, the server exits on its own. A brief
// grace period lets page reloads/navigation reconnect without killing it.
let liveClients = 0;
let shutdownTimer = null;
const GRACE_MS = 4000;

function scheduleShutdown(graceMs) {
  if (shutdownTimer) clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(() => {
    if (liveClients <= 0) {
      console.log("No active browser clients — shutting down.");
      process.exit(0);
    }
  }, graceMs);
}

function proxyRequest(options, body, res) {
  const req = https.request(options, (upstream) => {
    const chunks = [];
    upstream.on("data", (c) => chunks.push(c));
    upstream.on("end", () => {
      const data = Buffer.concat(chunks);
      res.writeHead(upstream.statusCode, {
        "Content-Type": upstream.headers["content-type"] || "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(data);
    });
  });
  req.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  });
  if (body) req.write(body);
  req.end();
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // ── Keep-alive stream (drives auto-shutdown on browser close) ──
  if (req.method === "GET" && req.url === "/api/keepalive") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write("retry: 1000\n\n"); // tell EventSource to reconnect quickly
    liveClients++;
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
      shutdownTimer = null;
    }
    const ping = setInterval(() => res.write(": ping\n\n"), 25000);
    req.on("close", () => {
      clearInterval(ping);
      liveClients = Math.max(0, liveClients - 1);
      if (liveClients === 0) scheduleShutdown(GRACE_MS);
    });
    return;
  }

  // ── DeepGram proxy ──
  if (req.method === "POST" && req.url.startsWith("/api/deepgram")) {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      // Forward query string from client (model, filler_words, etc.)
      const qs = req.url.includes("?") ? req.url.split("?")[1] : "";
      proxyRequest(
        {
          hostname: "api.deepgram.com",
          path: "/v1/listen" + (qs ? "?" + qs : ""),
          method: "POST",
          headers: {
            Authorization: "Token " + CONFIG.DEEPGRAM_API_KEY,
            "Content-Type": req.headers["content-type"] || "audio/webm",
          },
        },
        body,
        res
      );
    });
    return;
  }

  // ── AssemblyAI upload proxy ──
  if (req.method === "POST" && req.url === "/api/assemblyai/upload") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      proxyRequest(
        {
          hostname: "api.assemblyai.com",
          path: "/v2/upload",
          method: "POST",
          headers: {
            Authorization: CONFIG.ASSEMBLYAI_API_KEY,
            "Content-Type": "application/octet-stream",
          },
        },
        body,
        res
      );
    });
    return;
  }

  // ── AssemblyAI transcribe proxy ──
  if (req.method === "POST" && req.url === "/api/assemblyai/transcribe") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      proxyRequest(
        {
          hostname: "api.assemblyai.com",
          path: "/v2/transcript",
          method: "POST",
          headers: {
            Authorization: CONFIG.ASSEMBLYAI_API_KEY,
            "Content-Type": "application/json",
          },
        },
        body,
        res
      );
    });
    return;
  }

  // ── AssemblyAI poll proxy ──
  if (req.method === "GET" && req.url.startsWith("/api/assemblyai/transcript/")) {
    const id = req.url.split("/").pop();
    proxyRequest(
      {
        hostname: "api.assemblyai.com",
        path: "/v2/transcript/" + id,
        method: "GET",
        headers: { Authorization: CONFIG.ASSEMBLYAI_API_KEY },
      },
      null,
      res
    );
    return;
  }

  // ── Static files ──
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`RAW-transcribe server running at http://localhost:${PORT}`);
  // If the browser never connects (e.g. it failed to open), don't linger forever.
  scheduleShutdown(30000);
});
