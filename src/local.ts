import { chromium, type BrowserContext, type Page } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = path.join(root, '.local');
const entry = 'https://www.ana.co.jp/en/gb/amc/international-flight-awards/';
const rl = createInterface({ input: stdin, output: stdout });
let context: BrowserContext | undefined;
let closing = false;

async function close() {
  if (closing) return;
  closing = true;
  rl.close();
  await context?.close().catch(() => {});
}
process.once('SIGINT', () => { void close(); });
process.once('SIGTERM', () => { void close(); });

async function choosePage(): Promise<Page> {
  const pages = context!.pages().filter(p => !p.isClosed());
  if (!pages.length) throw new Error('No browser tabs remain. Quit and restart.');
  for (const [i, page] of pages.entries()) {
    // Only show hostnames; booking URLs may carry session identifiers.
    let host = 'blank page';
    try { host = new URL(page.url()).hostname || host; } catch {}
    console.log(`${i + 1}. ${host}`);
  }
  const answer = await rl.question('Tab number: ');
  const index = Number(answer) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= pages.length) {
    throw new Error('Choose a tab number from the list.');
  }
  return pages[index];
}

async function capture() {
  const page = await choosePage();
  const url = new URL(page.url());
  if (url.protocol !== 'https:' || !(url.hostname === 'ana.co.jp' || url.hostname.endsWith('.ana.co.jp'))) {
    throw new Error('Capture is limited to ANA pages.');
  }
  for (const frame of page.frames()) {
    if (await frame.locator('input[type="password"]:visible').count()) {
      throw new Error('Login page detected. Finish signing in manually before capturing.');
    }
  }
  console.log('Capture saves a local screenshot only. It may include account or passenger details.');
  const consent = await rl.question('Save this results page locally? Type yes: ');
  if (consent.trim().toLowerCase() !== 'yes') return;
  const folder = path.join(data, 'captures', new Date().toISOString().replace(/[:.]/g, '-'));
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const screenshot = path.join(folder, 'results.png');
  await page.screenshot({
    path: screenshot, fullPage: true, timeout: 15000,
    mask: page.frames().map(frame => frame.locator('input, textarea, [contenteditable="true"]')),
  });
  await writeFile(path.join(folder, 'metadata.json'), JSON.stringify({
    capturedAt: new Date().toISOString(),
    host: url.hostname,
    availability: 'unverified',
    note: 'User-requested screenshot. No automatic interpretation or booking validation.',
  }, null, 2), { mode: 0o600 });
  console.log(`Saved: ${screenshot}\nReview and redact before sharing. Nothing was uploaded.`);
}

try {
  await mkdir(data, { recursive: true, mode: 0o700 });
  context = await chromium.launchPersistentContext(path.join(data, 'chrome-profile'), {
    channel: 'chrome', headless: false, viewport: null,
  });
  context.once('close', () => { closing = true; rl.close(); });
  const page = context.pages()[0] ?? await context.newPage();
  console.log('Sign into ANA directly in Chrome. Do not enter credentials in Terminal.');
  console.log('This starter does not submit searches, reserve seats, or issue tickets.');
  try {
    await page.goto(entry, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch {
    console.log('Navigation timed out. Check the browser; login and availability remain unknown.');
  }
  console.log('Run a search manually, then return here. Commands: capture, help, quit.');
  while (!closing) {
    const command = (await rl.question('ana> ')).trim().toLowerCase();
    if (command === 'quit' || command === 'q') break;
    try {
      if (command === 'capture') await capture();
      else console.log('capture: save an ANA results screenshot locally. quit: close this dedicated browser.');
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Action failed.');
    }
  }
} catch (error) {
  if (!closing) {
    console.error('Could not continue. Ensure Chrome and Node.js 22+ are installed, and only one assistant instance is running.');
    console.error(error instanceof Error ? error.message : 'Unknown error.');
    process.exitCode = 1;
  }
} finally {
  await close();
}
