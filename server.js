const http = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

const logFile = path.resolve(__dirname, 'server.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (_) {}
  console.log(msg);
}

log('[EduPulse AI] server.js starting up...');

process.on('unhandledRejection', (reason) => {
  log(`[EduPulse AI] Unhandled Rejection: ${reason && reason.stack ? reason.stack : reason}`);
});
process.on('uncaughtException', (err) => {
  log(`[EduPulse AI] Uncaught Exception: ${err && err.stack ? err.stack : err}`);
});

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

log(`[EduPulse AI] Instantiating Next.js (dev=${dev}, hostname=${hostname}, port=${port})...`);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

log('[EduPulse AI] Calling app.prepare()...');
app.prepare().then(() => {
  log('[EduPulse AI] app.prepare() resolved! Creating HTTP server...');
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, hostname, (err) => {
    if (err) {
      log(`[EduPulse AI] Server failed to listen: ${err}`);
      process.exit(1);
    }
    log(`[EduPulse AI] Ready on http://localhost:${port}`);
  });
}).catch((err) => {
  log(`[EduPulse AI] app.prepare() rejected: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
