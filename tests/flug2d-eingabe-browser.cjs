// Shared Chromium/WebKit regression: deliberately remain inside the initial 700 ms.
const assert = require('node:assert/strict');
module.exports = async function eingabe(browser, url, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
  await context.addInitScript(() => {
    Object.defineProperty(performance, 'now', { value: () => 100 });
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(url);
    await page.waitForFunction(() => !!window.FlugSandbox);
    const pause = page.locator('#pause');
    const pressed = async expected => assert.equal(await pause.getAttribute('aria-pressed'), String(expected));
    // Two real mouse clicks at t=100: neither initial nor reset timestamps may hide one.
    await pause.click(); await pressed(true);
    await pause.click(); await pressed(false);
    await pause.focus(); await page.keyboard.press('Enter'); await pressed(true);
    await page.keyboard.press('Space'); await pressed(false);
    // Native touch produces pointerup AND compatibility click; exactly one action.
    await pause.tap(); await pressed(true);
    // Keyboard and mouse must also work directly after touch, in the suppression window.
    await pause.focus(); await page.keyboard.press('Enter'); await pressed(false);
    await pause.tap(); await pressed(true);
    await pause.click(); await pressed(false);
    await pause.tap(); await pressed(true);
    await pause.tap(); await pressed(false);
    // Explicit non-primary pointer while another finger is down (also on WebKit).
    await page.evaluate(() => {
      const el = document.querySelector('#pause'), r = el.getBoundingClientRect();
      window.i0Ausloesungen = 0;
      new MutationObserver(records => { window.i0Ausloesungen += records.length; })
        .observe(el, { attributes: true, attributeFilter: ['aria-pressed'] });
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch',
        pointerId: 2, isPrimary: false, clientX: r.x + r.width/2, clientY: r.y + r.height/2 }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    });
    await pressed(true);
    assert.equal(await page.evaluate(() => window.i0Ausloesungen), 1);
    assert.deepEqual(errors, []);
    console.log(`FLUG2D_EARLY_INPUT_OK ${width}x${height}`);
  } catch (error) {
    console.error('I0_INPUT_FAILED', JSON.stringify({ width, height, errors,
      pause: await page.locator('#pause').getAttribute('aria-pressed') }));
    throw error;
  } finally { await context.close(); }
};
