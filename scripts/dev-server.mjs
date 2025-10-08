#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { watch } from 'node:fs';
import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';

const projectRoot = process.cwd();
const publicDir = join(projectRoot, 'public');
const distDir = join(projectRoot, 'dist');
const host = process.env.HOST ?? 'localhost';
const port = Number.parseInt(process.env.PORT ?? process.env.DEV_SERVER_PORT ?? '5173', 10);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

const watcherMap = new Map();
let tscProcess;
let server;
let copyScheduled = false;

function log(message) {
  const timestamp = new Date().toISOString().split('T')[1]?.replace('Z', '') ?? '';
  console.log(`[dev ${timestamp}] ${message}`);
}

async function copyPublic(reason = 'sync') {
  try {
    await mkdir(distDir, { recursive: true });
    await cp(publicDir, distDir, { recursive: true });
    log(`Public assets synced (${reason})`);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      log('Public directory not found; skipping asset sync');
      return;
    }
    log(`Failed to copy public assets: ${error.message ?? error}`);
  }
}

function scheduleCopy(reason) {
  if (copyScheduled) {
    return;
  }

  copyScheduled = true;
  setTimeout(async () => {
    copyScheduled = false;
    await copyPublic(reason);
  }, 100);
}

async function ensureWatchers(dir) {
  const normalizedDir = normalize(dir);

  if (watcherMap.has(normalizedDir)) {
    return;
  }

  try {
    const watcher = watch(normalizedDir, { persistent: true }, async (eventType, fileName) => {
      const readableName = fileName ? fileName.toString() : eventType;
      scheduleCopy(readableName);

      if (!fileName) {
        return;
      }

      const fullPath = join(normalizedDir, fileName.toString());

      try {
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
          await ensureWatchers(fullPath);
        }
      } catch (error) {
        if (error?.code === 'ENOENT' && watcherMap.has(fullPath)) {
          watcherMap.get(fullPath).close();
          watcherMap.delete(fullPath);
        }
      }
    });

    watcherMap.set(normalizedDir, watcher);

    const entries = await readdir(normalizedDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter(entry => entry.isDirectory())
        .map(entry => ensureWatchers(join(normalizedDir, entry.name))),
    );
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

function closeWatchers() {
  for (const watcher of watcherMap.values()) {
    watcher.close();
  }
  watcherMap.clear();
}

function startTypeScriptWatcher() {
  const require = createRequire(import.meta.url);
  const tscBin = require.resolve('typescript/lib/tsc.js');
  const args = [tscBin, '-p', 'tsconfig.json', '--watch', '--preserveWatchOutput'];

  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('exit', code => {
    if (code !== null && code !== 0) {
      log(`TypeScript watcher exited with code ${code}`);
      process.exit(code);
    }
  });

  child.on('error', error => {
    log(`Failed to start TypeScript watcher: ${error.message ?? error}`);
    process.exitCode = 1;
  });

  return child;
}

function resolveContentType(filePath) {
  return contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function resolveRequestPath(pathname) {
  if (!pathname || pathname === '/') {
    return join(distDir, 'index.html');
  }

  const decoded = decodeURIComponent(pathname);
  const candidate = resolve(distDir, `.${decoded}`);

  if (!candidate.startsWith(distDir)) {
    return null;
  }

  return candidate;
}

async function sendFile(res, filePath) {
  try {
    let stats = await stat(filePath);
    let resolvedPath = filePath;

    if (stats.isDirectory()) {
      resolvedPath = join(resolvedPath, 'index.html');
      stats = await stat(resolvedPath);
    }

    const stream = createReadStream(resolvedPath);
    res.writeHead(200, {
      'Content-Type': resolveContentType(resolvedPath),
      'Cache-Control': 'no-cache',
    });
    stream.pipe(res);
  } catch (error) {
    throw error;
  }
}

function startServer() {
  const httpServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const filePath = resolveRequestPath(url.pathname);

      if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      try {
        await sendFile(res, filePath);
      } catch {
        const fallback = join(distDir, 'index.html');
        await sendFile(res, fallback);
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Internal server error: ${error?.message ?? error}`);
    }
  });

  httpServer.on('error', error => {
    log(`Dev server error: ${error.message ?? error}`);
    process.exitCode = 1;
  });

  httpServer.listen(port, host, () => {
    log(`Dev server running at http://${host}:${port}`);
  });

  return httpServer;
}

async function main() {
  await copyPublic('startup');
  await ensureWatchers(publicDir);
  scheduleCopy('initial');

  tscProcess = startTypeScriptWatcher();
  server = startServer();
}

async function shutdown(signal) {
  log(`Received ${signal}; shutting down.`);

  if (server) {
    server.close(() => {
      log('HTTP server closed');
    });
  }

  closeWatchers();

  if (tscProcess && !tscProcess.killed) {
    tscProcess.kill('SIGINT');
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', () => {
  closeWatchers();
  if (tscProcess && !tscProcess.killed) {
    tscProcess.kill('SIGINT');
  }
});

main().catch(error => {
  log(`Failed to start dev server: ${error?.message ?? error}`);
  process.exitCode = 1;
});
