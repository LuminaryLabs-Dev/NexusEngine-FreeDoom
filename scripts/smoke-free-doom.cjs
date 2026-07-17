const { chromium } = require('playwright');

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node scripts/smoke-free-doom.cjs <url>');
  process.exit(2);
}

const consoleLines = [];
const pageErrors = [];
const fatalPatterns = [
  /prboomx\.wad not found/i,
  /freedoom2\.wad not found/i,
  /can't continue/i,
  /runtime exited.*-1/i,
  /runtime aborted/i,
  /required runtime files are missing/i,
  /failed to asynchronously prepare wasm/i,
  /out of memory/i
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(180_000);

  page.on('console', message => {
    const line = `[browser:${message.type()}] ${message.text()}`;
    consoleLines.push(line);
    console.log(line);
  });

  page.on('pageerror', error => {
    const line = error.stack || String(error);
    pageErrors.push(line);
    console.error('[browser:pageerror]', line);
  });

  page.on('requestfailed', request => {
    console.warn('[browser:requestfailed]', request.url(), request.failure()?.errorText || 'unknown');
  });

  try {
    console.log(`[smoke] Opening ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 180_000 });

    await page.waitForFunction(() => typeof FS !== 'undefined' && typeof FS.stat === 'function');

    const filesystem = await page.evaluate(() => {
      const inspect = path => {
        try {
          const stat = FS.stat(path);
          const header = Array.from(FS.readFile(path).subarray(0, 4))
            .map(code => String.fromCharCode(code))
            .join('');
          return { path, exists: true, size: stat.size, header };
        } catch (error) {
          return { path, exists: false, error: String(error) };
        }
      };

      return {
        rootEntries: FS.readdir('/'),
        freedoom: inspect('/freedoom2.wad'),
        support: inspect('/prboomx.wad')
      };
    });

    console.log('[smoke] Filesystem:', JSON.stringify(filesystem, null, 2));

    if (!filesystem.freedoom.exists || filesystem.freedoom.header !== 'IWAD' || filesystem.freedoom.size < 1_000_000) {
      throw new Error(`Invalid /freedoom2.wad: ${JSON.stringify(filesystem.freedoom)}`);
    }
    if (!filesystem.support.exists || filesystem.support.header !== 'PWAD' || filesystem.support.size < 400_000) {
      throw new Error(`Invalid /prboomx.wad: ${JSON.stringify(filesystem.support)}`);
    }

    await page.waitForFunction(() => {
      const state = document.getElementById('runtime-state')?.textContent?.trim() || '';
      return state === 'playing' || /^(stopped|failed|aborted)/.test(state);
    });

    await page.waitForTimeout(3_000);

    const snapshot = await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      return {
        title: document.title,
        state: document.getElementById('runtime-state')?.textContent?.trim() || '',
        status: document.getElementById('status')?.textContent?.trim() || '',
        output: document.getElementById('output')?.value || '',
        canvas: canvas ? {
          width: canvas.width,
          height: canvas.height,
          display: getComputedStyle(canvas).display,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        } : null,
        phase: window.NexusFreeDoom?.phase || null
      };
    });

    console.log('[smoke] Final snapshot:', JSON.stringify(snapshot, null, 2));

    const combined = [...consoleLines, ...pageErrors, snapshot.output].join('\n');
    const fatal = fatalPatterns.find(pattern => pattern.test(combined));

    if (fatal) throw new Error(`Fatal runtime pattern observed: ${fatal}`);
    if (pageErrors.length) throw new Error(`Browser page errors observed: ${pageErrors.length}`);
    if (snapshot.state !== 'playing') throw new Error(`Runtime state is ${snapshot.state || '<empty>'}, expected playing`);
    if (!snapshot.canvas || snapshot.canvas.display === 'none' || snapshot.canvas.width < 320 || snapshot.canvas.height < 200) {
      throw new Error(`Playable canvas is invalid: ${JSON.stringify(snapshot.canvas)}`);
    }

    console.log('[smoke] PASS: both WADs are mounted and FreeDoom reached a playable frame.');
  } catch (error) {
    console.error('[smoke] FAIL:', error.stack || String(error));
    console.error('[smoke] Captured browser output:\n' + consoleLines.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
