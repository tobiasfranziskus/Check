/* G1: isolierte UX08-Grafik aus void-echoes a8e2e36.
 * Herkunft und bewusste Abweichungen: docs/FLUG2D_G1_GRAFIK.md.
 * Keine Core-Imports, keine Uhr, keine Befehle oder serialisierten Renderfelder. */
(function (scope) {
  "use strict";
  const GX_MODELS = {
    rookie: {
      body: [
        [25, 0],
        [9, -7],
        [2, -6],
        [-7, -13],
        [-17, -12],
        [-12, -4],
        [-21, -3],
        [-21, 3],
        [-12, 4],
        [-17, 12],
        [-7, 13],
        [2, 6],
        [9, 7],
      ],
      role: "scout",
      engines: [[-20, 0]],
      scale: 0.92,
    },
    hauler: {
      body: [
        [24, -4],
        [19, -10],
        [8, -10],
        [8, -16],
        [-20, -16],
        [-25, -10],
        [-23, -5],
        [-23, 5],
        [-25, 10],
        [-20, 16],
        [8, 16],
        [8, 10],
        [19, 10],
        [24, 4],
      ],
      role: "cargo",
      engines: [
        [-23, -9],
        [-23, 9],
      ],
      scale: 1.04,
    },
    miner: {
      body: [
        [22, 0],
        [9, -5],
        [3, -17],
        [-17, -17],
        [-21, -10],
        [-7, -9],
        [-9, -4],
        [-20, 0],
        [-9, 4],
        [-7, 9],
        [-21, 10],
        [-17, 17],
        [3, 17],
        [9, 5],
      ],
      role: "mining",
      engines: [
        [-18, -6],
        [-18, 6],
      ],
      scale: 0.94,
    },
    hunter: {
      body: [
        [27, 0],
        [7, -8],
        [-7, -17],
        [-21, -15],
        [-12, -3],
        [-23, 0],
        [-12, 3],
        [-21, 15],
        [-7, 17],
        [7, 8],
      ],
      role: "combat",
      engines: [
        [-19, -8],
        [-19, 8],
      ],
      scale: 0.96,
    },
  };

  // Nur vier kanonische Modelle und drei feste Farbtöne: maximal zwölf Sprites/Teilesätze.
  function gxModel(kind) {
    return GX_MODELS[kind] || GX_MODELS.rookie;
  }
  function sgPolygon(h, p) {
    h.beginPath();
    h.moveTo(...p[0]);
    for (let i = 1; i < p.length; i++) h.lineTo(...p[i]);
    h.closePath();
  }
  function modell(klasse) {
    return klasse === "miner"
      ? "miner"
      : klasse === "frachter"
        ? "hauler"
        : klasse === "jaeger"
          ? "hunter"
          : "rookie";
  }
  // Kopiert ausschließlich Skalare; keine Referenz auf schiff.flug verlässt den Adapter.
  function adapter(s, vorher, anteil = 1) {
    const b = s.flug,
      t = Math.max(0, Math.min(1, Number.isFinite(anteil) ? anteil : 1));
    const v = vorher || [b.x, b.y];
    return {
      id: s.id,
      modell: modell(s.klasse),
      x: v[0] + (b.x - v[0]) * t,
      y: v[1] + (b.y - v[1]) * t,
      winkel: (b.kurs / 256) * Math.PI * 2,
      vx: b.vx,
      vy: b.vy,
      bewegt: b.lage !== "angedockt" && (b.vx !== 0 || b.vy !== 0),
    };
  }
  function projektion(x, y, cx, cy, z, w, h) {
    return [w / 2 + (x - cx) * z, h / 2 + (y - cy) * z];
  }
  function erstellen(g, createCanvas = () => document.createElement("canvas")) {
    const parts = new Map(),
      sprites = new Map(),
      TILE = 1536;
    let layers = null;
    function gxParts(kind, tint) {
      const key = kind + tint;
      if (parts.has(key)) return parts.get(key);
      const m = gxModel(kind),
        ops = [
          { t: "poly", p: m.body, fill: "metal", stroke: "#abc1ce", w: 0.65 },
          {
            t: "poly",
            p: [
              [21, 0],
              [5, -3],
              [-13, -3],
              [-16, 0],
              [-13, 3],
              [5, 3],
            ],
            fill: "#243c50",
            stroke: "#7898ac",
            w: 0.5,
          },
        ];
      const rect = (x, y, w, h, fill, stroke) =>
        ops.push({ t: "rect", x, y, w, h, fill, stroke });
      for (const e of m.engines) {
        rect(e[0] - 2, e[1] - 2, 5, 4, "#142333", "#7d9dad");
        rect(e[0] - 2, e[1] - 1, 1.5, 2, tint);
      }
      rect(6, -1.6, 4, 3.2, tint);
      rect(-5, -1, 8, 2, "#829daf");
      if (m.role === "cargo") {
        for (let x = -17; x < 6; x += 7) {
          rect(x, -12, 5.5, 8, "#7792a0", "#b0c2c6");
          rect(x, 4, 5.5, 8, "#3c596b", "#8ba4ad");
          rect(x + 1, -10, 3, 0.7, "#d1b979");
        }
      } else if (m.role === "mining") {
        for (const y of [-16, 13]) {
          rect(-16, y, 18, 3, "#b7a378", "#d5c7a5");
          rect(-9, y, 1.5, 3, "#344b5c");
          rect(-4, y, 1.5, 3, "#344b5c");
        }
        rect(-4, -7, 9, 3, "#677e8f");
        rect(-4, 4, 9, 3, "#425d71");
      } else if (m.role === "combat") {
        for (const y of [-7, 6]) {
          rect(0, y, 10, 1.4, "#c2ced1");
          rect(-5, y - 1, 4, 3, "#334a60", "#91a8b5");
        }
        rect(-14, -10, 7, 2, "#6c899c");
        rect(-14, 8, 7, 2, "#3c5b72");
      } else if (m.role === "courier") {
        rect(-13, -5, 14, 1, "#b4c7d0");
        rect(-13, 4, 14, 1, "#607f95");
      } else {
        rect(-8, -7, 6, 2, "#a3b9c8");
        rect(-8, 5, 6, 2, "#607f96");
      }
      parts.set(key, ops);
      return ops;
    }
    function gxCanvas(h, kind, tint) {
      const gradient = h.createLinearGradient(0, -24, 0, 24);
      gradient.addColorStop(0, "#9bb2c1");
      gradient.addColorStop(0.42, "#58768c");
      gradient.addColorStop(1, "#22394c");
      for (const op of gxParts(kind, tint)) {
        h.fillStyle = op.fill === "metal" ? gradient : op.fill;
        if (op.t === "poly") {
          sgPolygon(h, op.p);
          h.fill();
          if (op.stroke) {
            h.strokeStyle = op.stroke;
            h.lineWidth = op.w;
            h.stroke();
          }
        } else {
          h.fillRect(op.x, op.y, op.w, op.h);
          if (op.stroke) {
            h.lineWidth = 0.45;
            h.strokeStyle = op.stroke;
            h.strokeRect(op.x, op.y, op.w, op.h);
          }
        }
      }
    }
    function sgRandom(seed) {
      let x = seed >>> 0;
      return () => {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return (x >>> 0) / 4294967296;
      };
    }
    function sgStars(seed, layer) {
      const r = sgRandom(seed + layer * 991),
        count = [340, 160, 64][layer],
        stars = [];
      for (let i = 0; i < count; i++) {
        let x = r(),
          y = r();
        if (r() < 0.28) {
          const c = i % 2 === 0 ? 0.28 : 0.76;
          x = (c + (r() + r() + r() - 1.5) * 0.22 + 1) % 1;
          y = (0.2 + c * 0.6 + (r() + r() - 1) * 0.19 + 1) % 1;
        }
        stars.push([
          x * TILE,
          y * TILE,
          0.35 + r() * [0.75, 1.15, 1.75][layer],
          0.2 + r() * 0.62,
          r(),
        ]);
      }
      return stars;
    }
    function skyInit() {
      if (layers) return;
      layers = [];
      for (let l = 0; l < 3; l++) {
        const c = createCanvas();
        c.width = c.height = TILE;
        const h = c.getContext("2d"),
          stars = sgStars(0x8e02cafe, l);
        if (l === 0) {
          for (const a of [
            [0.23, 0.35, 0.3, "rgba(37,65,91,.13)"],
            [0.72, 0.57, 0.26, "rgba(63,49,87,.1)"],
          ])
            for (let dx = -1; dx <= 1; dx++)
              for (let dy = -1; dy <= 1; dy++) {
                const x = (a[0] + dx) * TILE,
                  y = (a[1] + dy) * TILE,
                  r = a[2] * TILE,
                  t = h.createRadialGradient(x, y, 0, x, y, r);
                t.addColorStop(0, a[3]);
                t.addColorStop(1, "rgba(6,10,20,0)");
                h.fillStyle = t;
                h.fillRect(x - r, y - r, r * 2, r * 2);
              }
        }
        for (const [x, y, r, a, col] of stars) {
          const color =
            col < 0.14
              ? "171,199,235"
              : col > 0.88
                ? "235,213,178"
                : "206,216,229";
          if (r > 1.6) {
            const t = h.createRadialGradient(x, y, 0, x, y, r * 3);
            t.addColorStop(0, "rgba(" + color + "," + a * 0.22 + ")");
            t.addColorStop(1, "rgba(" + color + ",0)");
            h.fillStyle = t;
            h.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
          }
          h.fillStyle = "rgba(" + color + "," + a + ")";
          h.beginPath();
          h.arc(x, y, r, 0, Math.PI * 2);
          h.fill();
        }
        layers.push({ canvas: c, pattern: g.createPattern(c, "repeat") });
      }
    }
    function sprite(kind, tint) {
      const key = kind + tint;
      if (sprites.has(key)) return sprites.get(key);
      const c = createCanvas();
      c.width = c.height = 128;
      const h = c.getContext("2d");
      h.translate(64, 64);
      h.scale(2, 2);
      gxCanvas(h, kind, tint);
      sprites.set(key, c);
      return c;
    }
    function schiff(view, x, y, farbe = 0) {
      const kind = Object.hasOwn(GX_MODELS, view.modell)
          ? view.modell
          : "rookie",
        m = gxModel(kind);
      const tint = ["#8de4ed", "#7fb08a", "#d98c5f"][farbe] || "#8de4ed";
      g.save();
      try {
        g.translate(x, y);
        g.rotate(view.winkel);
        g.scale(m.scale * 0.8, m.scale * 0.8);
        if (view.bewegt)
          for (const e of m.engines) {
            g.fillStyle = "#71cde7";
            g.globalAlpha = 0.4;
            g.beginPath();
            g.moveTo(e[0] - 2, e[1] - 2);
            g.lineTo(e[0] - 7, e[1]);
            g.lineTo(e[0] - 2, e[1] + 2);
            g.fill();
            g.globalAlpha = 0.85;
            g.fillStyle = "#d9f8ff";
            g.fillRect(e[0] - 3, e[1] - 0.6, 3, 1.2);
          }
        g.globalAlpha = 1;
        g.drawImage(sprite(kind, tint), -32, -32, 64, 64);
      } finally {
        g.restore();
      }
    }
    function himmel(cx, cy, z, w, h) {
      skyInit();
      for (let l = 0; l < 3; l++) {
        const q = [0.025, 0.065, 0.14][l],
          x = (-cx * z * q) % TILE,
          y = (-cy * z * q) % TILE;
        g.save();
        try {
          g.translate(x, y);
          g.fillStyle = layers[l].pattern;
          g.fillRect(-x, -y, w, h);
        } finally {
          g.restore();
        }
      }
    }
    return Object.freeze({
      schiff,
      himmel,
      cache: () => ({
        sprites: sprites.size,
        teile: parts.size,
        schichten: layers ? layers.length : 0,
        pixel: sprites.size * 128 * 128 + (layers ? 3 * TILE * TILE : 0),
      }),
      leeren: () => {
        sprites.clear();
        parts.clear();
        layers = null;
      },
    });
  }
  const api = Object.freeze({ adapter, modell, projektion, erstellen });
  if (typeof module === "object" && module.exports) module.exports = api;
  else scope.FlugGrafik = api;
})(globalThis);
