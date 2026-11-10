// Dev-only: 2,000 Canvas frames and Chromium heap/cache check. Not a Safari endurance test.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  assert = require("assert/strict");
(async () => {
  const root = path.resolve(__dirname, "..");
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, "." + req.url);
    if (!file.startsWith(root + "/prototypes/"))
      return res.writeHead(404).end();
    res.setHeader(
      "Content-Type",
      file.endsWith(".js") ? "text/javascript" : "text/html",
    );
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const binary = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
  let browser;
  try {
    browser = await chromium.launch({
      ...(fs.existsSync(binary) ? { executablePath: binary } : {}),
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage({
      viewport: { width: 1180, height: 820 },
    });
    await page.goto(
      "http://127.0.0.1:" +
        server.address().port +
        "/prototypes/flug2d/index.html",
    );
    await page.locator("#pause").click();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("HeapProfiler.collectGarbage");
    const before = await cdp.send("Runtime.getHeapUsage");
    const result = await page.evaluate(() => {
      const state = FlugSandbox.zustand(),
        cache = FlugSandbox.grafikCache(),
        t = performance.now();
      for (let i = 0; i < 2000; i++) FlugSandbox.rendern((i % 10) / 10);
      return {
        stateUnchanged: state === FlugSandbox.zustand(),
        cacheBefore: cache,
        cacheAfter: FlugSandbox.grafikCache(),
        msPerFrame: (performance.now() - t) / 2000,
      };
    });
    await cdp.send("HeapProfiler.collectGarbage");
    const after = await cdp.send("Runtime.getHeapUsage");
    assert.equal(result.stateUnchanged, true);
    assert.deepEqual(result.cacheBefore, result.cacheAfter);
    assert.ok(after.usedSize - before.usedSize < 8 * 1024 * 1024);
    console.log(JSON.stringify({ frames: 2000, before, after, ...result }));
    const fallback = await browser.newPage();
    await fallback.route("**/grafik.js", (route) => route.abort());
    await fallback.goto(
      "http://127.0.0.1:" +
        server.address().port +
        "/prototypes/flug2d/index.html",
    );
    await fallback.waitForFunction(
      () =>
        !!window.FlugSandbox &&
        document.querySelector("#hud").textContent.includes("angedockt"),
    );
    assert.equal(await fallback.locator("#grafik").inputValue(), "basis");
    assert.equal(await fallback.locator("#grafik").isDisabled(), true);
    await fallback.locator("#dock").click();
    await fallback.waitForFunction(
      () => JSON.parse(FlugSandbox.zustand()).ships.sp1.flug.lage === "frei",
    );
    console.log("G1_MISSING_MODULE_FALLBACK_OK");
    await fallback.close();
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
