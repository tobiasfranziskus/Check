// Called while F0 is paused, in Chromium and WebKit. No test-only world writes.
const assert = require("node:assert/strict");
module.exports = async function (page, width, height) {
  const state = await page.evaluate(() => FlugSandbox.zustand());
  const draw = () =>
    page.evaluate(() => {
      FlugSandbox.rendern();
      const c = document.querySelector("#raum");
      return { pixels: c.toDataURL(), cache: FlugSandbox.grafikCache() };
    });
  const ux = await draw();
  assert.equal(ux.cache.schichten, 3);
  await page.locator("#grafik").selectOption("basis");
  const base = await draw();
  assert.notEqual(
    ux.pixels,
    base.pixels,
    "UX08 must visibly differ from F0 fallback",
  );
  await page.locator("#grafik").selectOption("ux08");
  assert.equal(
    (await draw()).pixels,
    ux.pixels,
    "stable render after mode switch",
  );
  const result = await page.evaluate(() => {
    const before = FlugSandbox.grafikCache(),
      samples = [];
    for (let batch = 0; batch < 6; batch++) {
      const t = performance.now();
      for (let i = 0; i < 60; i++) FlugSandbox.rendern((i % 10) / 10);
      samples.push((performance.now() - t) / 60);
    }
    return { before, after: FlugSandbox.grafikCache(), ms: samples };
  });
  assert.deepEqual(
    result.before,
    result.after,
    "repeated rendering must not grow caches",
  );
  assert.ok(
    result.after.sprites <= 12 &&
      result.after.teile <= 12 &&
      result.after.schichten === 3,
  );
  // Rotate the same page/context; state, center projection and cached resources remain intact.
  await page.setViewportSize({ width: height, height: width });
  await draw();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "no overflow after rotation",
  );
  await page.setViewportSize({ width, height });
  await draw();
  assert.equal(
    await page.evaluate(() => FlugSandbox.zustand()),
    state,
    "render/mode/resize cannot change Core",
  );
  console.log(
    "G1_RENDER_OK " + width + "x" + height + " " + JSON.stringify(result),
  );
};
