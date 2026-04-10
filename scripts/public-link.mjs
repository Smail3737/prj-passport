import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import localtunnel from 'localtunnel';

const DEFAULT_WEB_PORT = 4173;
const PORT_SCAN_LIMIT = 40;
const HEALTH_TIMEOUT_MS = 90_000;
const HEALTH_POLL_INTERVAL_MS = 700;

function parsePort(rawValue, fallback) {
  const parsed = Number(rawValue);
  if (Number.isFinite(parsed) && parsed > 0 && parsed < 65_536) {
    return Math.floor(parsed);
  }

  return fallback;
}

function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.listen(port, '127.0.0.1', () => {
      server.close(() => {
        resolve(true);
      });
    });
  });
}

async function findAvailablePort(preferredPort) {
  for (let offset = 0; offset < PORT_SCAN_LIMIT; offset += 1) {
    const candidate = preferredPort + offset;
    // eslint-disable-next-line no-await-in-loop
    const available = await checkPortAvailability(candidate);
    if (available) {
      return candidate;
    }
  }

  throw new Error(`No free port found from ${preferredPort} to ${preferredPort + PORT_SCAN_LIMIT - 1}`);
}

function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', scriptName], {
      stdio: 'inherit',
      env: process.env,
    });

    child.once('error', (error) => {
      reject(error);
    });

    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`npm run ${scriptName} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function ensureFrontendBuild() {
  const distIndex = path.resolve(process.cwd(), 'frontend', 'dist', 'index.html');
  const shouldForce = process.env.FORCE_BUILD === '1';

  if (!shouldForce && fs.existsSync(distIndex)) {
    return;
  }

  await runNpmScript('frontend:build');
}

async function waitForHealthReady(port) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < HEALTH_TIMEOUT_MS) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Wait and retry until timeout.
    }

    // eslint-disable-next-line no-await-in-loop
    await delay(HEALTH_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for /health on port ${port}`);
}

async function main() {
  const preferredPort = parsePort(process.env.WEB_PORT, DEFAULT_WEB_PORT);
  const webPort = await findAvailablePort(preferredPort);

  await ensureFrontendBuild();

  const webEnv = {
    ...process.env,
    PORT: String(webPort),
    WEB_PORT: String(webPort),
  };

  let tunnel = null;
  let stopping = false;

  const webServerProcess = spawn('npm', ['run', 'web:serve'], {
    stdio: 'inherit',
    env: webEnv,
  });

  const stopAll = async () => {
    if (stopping) {
      return;
    }

    stopping = true;

    if (tunnel) {
      try {
        await tunnel.close();
      } catch {
        // Ignore close errors.
      }
      tunnel = null;
    }

    if (!webServerProcess.killed) {
      webServerProcess.kill('SIGTERM');
    }
  };

  process.on('SIGINT', () => {
    void stopAll();
  });
  process.on('SIGTERM', () => {
    void stopAll();
  });

  webServerProcess.once('error', async (error) => {
    console.error(`Failed to start web server: ${error.message}`);
    await stopAll();
    process.exit(1);
  });

  webServerProcess.once('exit', async (code) => {
    if (stopping) {
      process.exit(0);
      return;
    }

    console.error(`Web server exited unexpectedly with code ${code ?? 'unknown'}`);
    await stopAll();
    process.exit(1);
  });

  try {
    await waitForHealthReady(webPort);

    tunnel = await localtunnel({
      port: webPort,
      local_host: '127.0.0.1',
    });

    console.log('');
    console.log(`Local URL: http://127.0.0.1:${webPort}`);
    console.log(`Public demo URL: ${tunnel.url}`);
    console.log('Keep this process running while demoing. Press Ctrl+C to stop.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    console.error(`Failed to start public demo link: ${message}`);
    await stopAll();
    process.exit(1);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(`Failed to start public demo link: ${message}`);
  process.exit(1);
});
