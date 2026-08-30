'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.DUCK_PLAYWRIGHT);

const root = path.resolve(__dirname, '..', 'html-offline');
const chrome = process.env.DUCK_CHROME;
const failures = [];
const results = {};

function check(condition, message) {
  if (!condition) failures.push(message);
}

function fileUrl(name) {
  return pathToFileURL(path.join(root, name)).href;
}

async function run() {
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const browserErrors = [];
  const externalRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(`console:${message.text()}`);
  });
  page.on('pageerror', error => browserErrors.push(`page:${error.message}`));
  page.on('requestfailed', request => browserErrors.push(`request:${request.url()}:${request.failure()?.errorText || 'failed'}`));
  page.on('request', request => {
    if (/^https?:/i.test(request.url())) externalRequests.push(request.url());
  });

  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  check((await page.title()).includes('DUCK Studio'), 'index:title');
  check(await page.locator('nav.main-nav a').count() === 6, 'index:navigation_count');
  await page.fill('#project-title', 'Teste DUCK Local');
  await page.fill('#project-bpm', '132');
  await page.fill('#project-key', 'Dm');
  await page.selectOption('#project-stage', 'mix');
  await page.click('#project-form button[type="submit"]');
  const project = await page.evaluate(() => JSON.parse(localStorage.getItem('duck.project.v1')));
  check(project.title === 'Teste DUCK Local' && project.bpm === 132 && project.key === 'Dm' && project.stage === 'mix', 'index:project_persistence');
  results.index = { title: project.title, bpm: project.bpm, navigation: 6 };

  await page.goto(fileUrl('mixer.html'), { waitUntil: 'load' });
  check((await page.locator('[data-project-title]').first().textContent()) === 'Teste DUCK Local', 'mixer:shared_context');
  check(await page.locator('#mixer article.channel').count() === 17, 'mixer:16_plus_master');
  check(await page.locator('#mixer input.fader').count() === 17, 'mixer:fader_count');
  const firstFader = page.locator('#mixer input.fader').first();
  await firstFader.focus();
  await page.keyboard.press('ArrowUp');
  const mixer = await page.evaluate(() => JSON.parse(localStorage.getItem('duck.mixer.v1')));
  check(Array.isArray(mixer.channels) && mixer.channels.length === 16, 'mixer:storage_channels');
  check(Boolean(await firstFader.getAttribute('aria-valuetext')), 'mixer:aria_value');
  await page.click('#enable-audio');
  await page.waitForTimeout(150);
  check((await page.locator('#audio-status').textContent()).includes('Áudio ativo'), 'mixer:audio_activation');
  await page.click('#test-mix');
  await page.waitForTimeout(250);
  await page.click('#stop-audio');
  results.mixer = { strips: 17, channels: mixer.channels.length, audio: 'gesture-tested' };

  await page.goto(fileUrl('instrumentos.html'), { waitUntil: 'load' });
  check(await page.locator('#step-grid button.step').count() === 64, 'instruments:4x16');
  await page.locator('#step-grid button.step').first().click();
  const pattern = await page.evaluate(() => JSON.parse(localStorage.getItem('duck.pattern.v1')));
  check(pattern.tracks.length === 4 && pattern.tracks.every(track => track.steps.length === 16), 'instruments:pattern_schema');
  await page.click('#play');
  await page.waitForTimeout(300);
  check((await page.locator('#play').getAttribute('aria-pressed')) === 'true', 'instruments:play');
  await page.click('#stop');
  check((await page.locator('#play').getAttribute('aria-pressed')) === 'false', 'instruments:stop');
  results.instruments = { tracks: 4, steps: 64, audio: 'gesture-tested' };

  await page.goto(fileUrl('agente.html'), { waitUntil: 'load' });
  check(await page.locator('script[src*="puter"]').count() === 0, 'agent:puter_loaded_at_boot');
  await page.evaluate(() => localStorage.setItem('duck.settings.v1', JSON.stringify({ ollamaOptIn: true, ollamaModel: 'qwen2.5:7b-instruct' })));
  await page.reload({ waitUntil: 'load' });
  check(!(await page.isChecked('#ollama-optin')), 'agent:ollama_optin_persisted');
  const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('duck.settings.v1')));
  check(!Object.prototype.hasOwnProperty.call(settings, 'ollamaOptIn') && settings.ollamaModel === 'qwen2.5:7b-instruct', 'agent:settings_scope');
  await page.fill('#agent-query', 'Como abrir espaço para a voz sem deixar o beat magro?');
  await page.click('#agent-form button[type="submit"]');
  check(await page.locator('#chat-log article.message').count() >= 3, 'agent:local_response');
  check((await page.locator('#chat-log').textContent()).includes('Base'), 'agent:source_label');
  check(await page.locator('script[src*="puter"]').count() === 0, 'agent:puter_after_local_query');
  results.agent = { local: true, ollamaOptIn: false, puterAtBoot: false };

  await page.evaluate(() => {
    localStorage.setItem('duck.userMemory.v1', JSON.stringify({ text: 'preferência preservada' }));
    localStorage.setItem('duck.temp.local-test', 'remover');
    localStorage.setItem('foreign.keep', 'preservar');
    sessionStorage.setItem('duck.temp.session-test', 'remover');
    sessionStorage.setItem('foreign.session.keep', 'preservar');
  });
  await page.goto(fileUrl('memoria.html'), { waitUntil: 'load' });
  page.once('dialog', dialog => dialog.accept());
  await page.click('#clean-temp');
  const storage = await page.evaluate(() => ({
    project: localStorage.getItem('duck.project.v1'),
    mixer: localStorage.getItem('duck.mixer.v1'),
    pattern: localStorage.getItem('duck.pattern.v1'),
    userMemory: localStorage.getItem('duck.userMemory.v1'),
    tempLocal: localStorage.getItem('duck.temp.local-test'),
    tempSession: sessionStorage.getItem('duck.temp.session-test'),
    foreignLocal: localStorage.getItem('foreign.keep'),
    foreignSession: sessionStorage.getItem('foreign.session.keep')
  }));
  check(Boolean(storage.project && storage.mixer && storage.pattern && storage.userMemory), 'memory:persistent_preservation');
  check(storage.tempLocal === null && storage.tempSession === null, 'memory:temp_cleanup');
  check(storage.foreignLocal === 'preservar' && storage.foreignSession === 'preservar', 'memory:foreign_preservation');
  check((await page.locator('#temporary-count').textContent()) === '0', 'memory:count_after_cleanup');
  results.memory = { duckTempRemoved: 2, persistentPreserved: 4, foreignPreserved: 2 };

  await page.goto(fileUrl('recursos.html'), { waitUntil: 'load' });
  const resourceCount = await page.locator('#resource-list article').count();
  check(resourceCount >= 20, 'resources:count');
  await page.fill('#resource-search', 'guitarra');
  check(await page.locator('#resource-list article').count() > 0, 'resources:search');
  results.resources = { embedded: resourceCount, search: true };

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ['index.html', 'mixer.html', 'instrumentos.html', 'agente.html', 'recursos.html', 'memoria.html']) {
      await page.goto(fileUrl(name), { waitUntil: 'load' });
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      check(dimensions.scroll <= dimensions.width, `responsive:${name}:${width}:${dimensions.scroll}`);
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(fileUrl('index.html'), { waitUntil: 'load' });
  check(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'accessibility:reduced_motion');
  check(await page.locator('.skip-link').count() === 1, 'accessibility:skip_link');
  results.responsive = { widths: [390, 320], reducedMotion: true };

  check(externalRequests.length === 0, `privacy:external_boot_requests:${externalRequests.join(',')}`);
  check(browserErrors.length === 0, `browser:errors:${browserErrors.join('|')}`);
  results.privacy = { externalRequests: externalRequests.length, browserErrors: browserErrors.length };

  await context.close();
  await browser.close();
  if (failures.length) {
    console.error(JSON.stringify({ status: 'FAIL', failures, results }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ status: 'PASS', results }, null, 2));
}

run().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
