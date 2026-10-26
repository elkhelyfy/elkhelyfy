// Pixel art for the profile README, drawn from code. Run: node scripts/pixel.mjs
// Every sprite is a list of rows; each character is one pixel, looked up in a palette.
import { writeFileSync, rmSync, mkdirSync, readdirSync } from 'node:fs';

/* ───────── palette ───────── */
const C = {
  wall: '#2a1f3d', wallLine: '#30244a', shadow: '#130e1f',
  cream: '#fff1d6', lavender: '#b8a9d9', dim: '#7d6fa3', green: '#3fb950', greenHi: '#7ee787',
  wood: '#6b4a35', woodHi: '#8a6247', desk: '#9a6236', deskHi: '#b9773f', deskFront: '#5c3a22', deskDark: '#432914',
  sky1: '#0c1230', sky2: '#141d45', sky3: '#1e2b63', star: '#fff6d5', moon: '#ffe9a8',
  city: '#0f1530', cityLit: '#ffcf6b', sea: '#12204a', seaHi: '#5a7bd6', minaret: '#18213f', tile: '#2f9e6e', beam: '#4cff9a',
  rack: '#262634', rackHi: '#363648', rackDark: '#18181f', amber: '#f0b429', red: '#e5534b',
  lid: '#c7cad4', lidEdge: '#9a9eab', lamp: '#f0b429', lampDark: '#b37f12', glow: '#ffd27a',
  panel: '#1b1626', panelLine: '#3d3354', panelHi: '#4b3f68', gold: '#f0b429',
};

/* ───────── drawing helpers ───────── */
const R = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;

/** rows of characters → merged rects. `pal` maps a character to a colour; '.' is empty */
function sprite(rows, pal, ox = 0, oy = 0, s = 1) {
  const w = rows[0].length;
  let out = '';
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`sprite row ${y} is ${row.length} wide, expected ${w}: "${row}"`);
    for (let x = 0; x < w; ) {
      const ch = row[x];
      let run = 1;
      while (x + run < w && row[x + run] === ch) run++;
      if (ch !== '.' && pal[ch]) out += R(ox + x * s, oy + y * s, run * s, s, pal[ch]);
      x += run;
    }
  });
  return out;
}

/* ───────── a 5×7 pixel font ───────── */
const FONT = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.####|#....|#....|#....|#....|#....|.####', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.####|#....|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '#####|..#..|..#..|..#..|..#..|..#..|#####', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '####.|....#|....#|.###.|....#|....#|####.',
  4: '#...#|#...#|#...#|#####|....#|....#|....#', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
  ' ': '.....|.....|.....|.....|.....|.....|.....', '.': '.....|.....|.....|.....|.....|.....|..#..',
  ',': '.....|.....|.....|.....|.....|..#..|.#...', '-': '.....|.....|.....|.###.|.....|.....|.....',
  ':': '.....|..#..|.....|.....|.....|..#..|.....', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
  '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...', '_': '.....|.....|.....|.....|.....|.....|#####',
  "'": '..#..|..#..|.....|.....|.....|.....|.....', '/': '....#|....#|...#.|..#..|.#...|#....|#....',
  '@': '.###.|#...#|#.###|#.#.#|#.###|#....|.####', '·': '.....|.....|.....|..#..|.....|.....|.....',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
};
const textWidth = (str, s = 1) => (str.length * 6 - 1) * s;
function text(str, x, y, fill, s = 1) {
  let out = '';
  [...str.toUpperCase()].forEach((ch, i) => {
    const g = FONT[ch];
    if (!g) throw new Error(`no glyph for "${ch}"`);
    out += sprite(g.split('|'), { '#': fill }, x + i * 6 * s, y, s);
  });
  return out;
}
/** text with a one-pixel drop shadow, like old game titles */
const title = (str, x, y, fill, s = 1) => text(str, x + s, y + s, C.shadow, s) + text(str, x, y, fill, s);

/** a seeded random, so the skyline is the same on every run */
function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

/** wrap pixel art in an SVG at `s` real pixels per art pixel */
function svg(w, h, s, body, { label, css = '', clip = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * s} ${h * s}" width="${w * s}" height="${h * s}" shape-rendering="crispEdges" role="img" aria-label="${label}">
<style>
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${clip}<g transform="scale(${s})">${body}</g>
</svg>
`;
}

/** a panel with stepped (pixel) corners */
function steppedPath(w, h, r = 2) {
  return `M${r} 0H${w - r}V1H${w - 1}V${r}H${w}V${h - r}H${w - 1}V${h - 1}H${w - r}V${h}H${r}V${h - 1}H1V${h - r}H0V${r}H1V1H${r}Z`;
}

/* ───────── sprites ───────── */
const ME = {
  pal: { H: '#2e1b10', h: '#4a2c1a', S: '#f2c9a5', s: '#d99c78', E: '#1e1420', B: '#6b4127', b: '#8a5634', M: '#3a1f17', K: '#17161d', k: '#2a2833' },
  rows: [
    '....HH.HHH.H............', // tousled, like the avatar
    '..HHHHHHHHHHHH..........',
    '.HHhHHHHhHHHhHH.........',
    '.HHHHhHHHHHHHHH.........',
    'HHHHHHSHHHSHHHHH........',
    'HHSSSSSSSSSSSSHH........',
    '.HSSSSSSSSSSSSH.........',
    '.HSSSESSSSESSSH.........',
    '.SSSSESSSSESSSS.........',
    '..SSSSSssSSSSS..........',
    '..BSSSSSSSSSSB..........',
    '..BBBSMMMMSBBB..........',
    '..BBBBBBBBBBBB..........',
    '...BbBBBBBBbB...........',
    '.....BBBBBB.............',
    '......ssss..............',
  ].map((r) => '....' + r.slice(0, 16) + '....'),
  body: [
    '......KKKKKKKKKKKK......',
    '....KKKKKKKKKKKKKKKK....',
    '..KKKKKKKKKKKKKKKKKKKK..',
    '.KKKKkKKKKKKKKKKKKkKKKK.',
    'KKKKKkKKKKKKKKKKKKkKKKKK',
    'KKKKKkKKKKKKKKKKKKkKKKKK',
    'KKKKKkKKKKKKKKKKKKkKKKKK',
    'KKKKKkKKKKKKKKKKKKkKKKKK',
  ],
};

const CAT_LOAF = [
  '..o...o.......',
  '..oo.oo.......',
  '..ooooo.......',
  '.oodoodo......',
  '.ooooooooooo..',
  '..oOoooOoooooo',
  '..oooooooooooo',
  '..OOOOOOOOOOO.',
];
const CAT_PAL = { o: '#e0913f', O: '#b8672a', d: '#3b2416' };

const CAT_WALK = [
  [
    '............o.o.',
    'o...........ooo.',
    'o...........odoo',
    '.o.oooooooooooo.',
    '..ooooooooooooo.',
    '..oOooOooOoooo..',
    '..oooooooooooo..',
    '..o.o......o.o..',
    '..o..o....o..o..',
  ],
  [
    '............o.o.',
    '.o..........ooo.',
    'o...........odoo',
    'o..oooooooooooo.',
    '.ooooooooooooooo'.slice(0, 16),
    '..oOooOooOoooo..',
    '..oooooooooooo..',
    '...oo......oo...',
    '...oo......oo...',
  ],
];

const MUG = ['wDDDDw..', 'wwwwwww.', 'cccccc.w', 'wwwwww.w', 'cccccc.w', 'wwwwwww.', 'wwwwww..', '.wwww...'];
const MUG_PAL = { w: '#ece6da', D: '#4a2c1a', c: '#3e4fd6' };
const STEAM = [
  ['..#..', '.#...', '.#...', '..#..', '...#.', '..#..', '.....'],
  ['.....', '..#..', '.#...', '.#...', '..#..', '...#.', '..#..'],
  ['.#...', '..#..', '...#.', '..#..', '.#...', '.....', '.....'],
];

const PLANT = [
  '......l.......', '....l.ll.l....', '...ll.lL.ll...', '..lLl.lL.lLl..', '..lL..lL..Ll..', '.lLl..lL..lLl.',
  '.lL...lL...Ll.', '......lL......', '..tttttttttt..', '..TTTTTTTTTT..', '...tttttttt...', '...tttttttt...',
  '...tttttttt...', '....TTTTTT....',
];
const PLANT_PAL = { l: '#3fa66b', L: '#2f7d5b', t: '#c4532f', T: '#9b3e22' };

const HEART5 = ['##.##', '#####', '.###.', '..#..'];
const DUCK = ['...yyy...', '..yyyEy..', '..yyyyyoo', 'y..yyyy..', 'yyyyyyyy.', 'yyyyyyyy.', '.yyyyyy..'];
const DUCK_PAL = { y: '#ffd23f', E: '#1b1626', o: '#f08a24' };

/* ───────── hero: a night shift in Casablanca ───────── */
function hero() {
  const W = 240, H = 110;
  let b = '';

  // wall, with faint wallpaper stripes
  b += R(0, 0, W, H, C.wall);
  for (let x = 4; x < W; x += 8) b += R(x, 0, 1, H, C.wallLine);

  // name and status
  b += title('MOHAMMED', 10, 8, C.cream, 2);
  b += title('EL KHELYFY', 10, 26, C.cream, 2);
  b += text('BACKEND ENGINEER', 10, 46, C.lavender);
  b += text('CASABLANCA, MOROCCO', 10, 55, C.dim);
  b += text('> OPEN TO WORK', 10, 64, C.green);
  b += `<g class="cursor">${R(10 + textWidth('> OPEN TO WORK') + 3, 64, 5, 7, C.green)}</g>`;

  // window onto the city
  const ix = 134, iy = 8, iw = 74, ih = 52;
  b += R(ix - 2, iy - 2, iw + 4, ih + 4, C.wood);
  let scene = '';
  scene += R(ix, iy, iw, ih, C.sky1);
  scene += R(ix, iy + 16, iw, ih - 16, C.sky2);
  scene += R(ix, iy + 30, iw, ih - 30, C.sky3);
  for (let x = ix; x < ix + iw; x += 2) {
    scene += R(x, iy + 15, 1, 1, C.sky2) + R(x + 1, iy + 29, 1, 1, C.sky3); // dithered band edges
  }
  // stars, three twinkle groups
  const rand = rng(7);
  const stars = [[], [], [], []];
  for (let i = 0; i < 26; i++) stars[i % 4].push([ix + 2 + Math.floor(rand() * (iw - 4)), iy + 2 + Math.floor(rand() * 26)]);
  stars.forEach((group, i) => {
    const px = group.map(([x, y]) => R(x, y, 1, 1, C.star)).join('');
    scene += i === 0 ? px : `<g class="tw${i}">${px}</g>`;
  });
  scene += R(ix + 20, iy + 6, 1, 3, C.star) + R(ix + 19, iy + 7, 3, 1, C.star); // one bright cross star
  // crescent moon
  for (let y = -4; y <= 4; y++)
    for (let x = -4; x <= 4; x++) {
      if (x * x + y * y > 18) continue;
      if ((x - 2) * (x - 2) + (y + 1) * (y + 1) <= 13) continue;
      scene += R(ix + 12 + x, iy + 10 + y, 1, 1, C.moon);
    }
  // shooting star, every few seconds
  scene += `<g class="shoot">${R(ix + 30, iy + 6, 1, 1, C.star)}${R(ix + 29, iy + 5, 1, 1, C.star, ' opacity=".6"')}${R(ix + 28, iy + 4, 1, 1, C.star, ' opacity=".3"')}</g>`;
  // skyline
  const horizon = iy + 42;
  let lit = '', flick = '';
  for (let x = ix; x < ix + iw - 22; ) {
    const bw = 4 + Math.floor(rand() * 6), bh = 5 + Math.floor(rand() * 13);
    scene += R(x, horizon - bh, bw, bh, C.city);
    for (let wy = horizon - bh + 2; wy < horizon - 1; wy += 3)
      for (let wx = x + 1; wx < x + bw - 1; wx += 2) {
        const r = rand();
        if (r < 0.28) lit += R(wx, wy, 1, 1, C.cityLit);
        else if (r < 0.33) flick += R(wx, wy, 1, 1, C.cityLit);
      }
    x += bw;
  }
  scene += lit + `<g class="flick">${flick}</g>`;
  // Hassan II minaret by the sea, with its green beam
  const mx = ix + iw - 16;
  scene += `<g class="beam">`;
  for (let i = 0; i < 18; i++) scene += R(mx + 3 + i, iy + 7 - Math.floor(i / 3.2), 1, 1, C.beam);
  scene += `</g>`;
  scene += R(mx, iy + 10, 6, horizon - iy - 10, C.minaret);
  scene += R(mx + 1, iy + 7, 4, 3, C.minaret) + R(mx + 2, iy + 5, 2, 2, C.minaret) + R(mx + 2, iy + 3, 1, 2, C.tile);
  for (let y = iy + 13; y < horizon - 4; y += 6) scene += R(mx + 1, y, 4, 1, C.tile);
  scene += R(mx - 4, horizon - 4, 14, 4, C.minaret);
  // sea, shimmering
  scene += R(ix, horizon, iw, iy + ih - horizon, C.sea);
  const wave = (shift) => {
    let w = '';
    for (let y = horizon + 2; y < iy + ih; y += 3)
      for (let x = ix + ((y + shift) % 7); x < ix + iw - 2; x += 7) w += R(x, y, 2, 1, C.seaHi);
    return w;
  };
  scene += `<g class="seaA">${wave(0)}</g><g class="seaB">${wave(3)}</g>`;
  b += `<g clip-path="url(#win)">${scene}</g>`;
  b += R(ix - 5, iy + ih + 2, iw + 10, 2, C.woodHi) + R(ix - 5, iy + ih + 4, iw + 10, 1, C.shadow); // sill

  // wall clock above the rack, ticking
  const cx = 225, cy = 16;
  for (let y = -6; y <= 6; y++)
    for (let x = -6; x <= 6; x++) {
      const d = x * x + y * y;
      if (d <= 36) b += R(cx + x, cy + y, 1, 1, d > 26 ? C.woodHi : C.cream);
    }
  b += R(cx, cy - 4, 1, 4, '#2a1f3d');
  b += `<g class="tick" style="transform-origin:${cx + 0.5}px ${cy + 0.5}px">${R(cx, cy, 1, 1, '#2a1f3d')}${R(cx + 1, cy, 3, 1, C.red)}</g>`;

  // server rack, with blinking LEDs
  const rx = 214, ry = 40;
  b += R(rx, ry, 22, H - ry, C.rack) + R(rx, ry, 22, 1, C.rackHi) + R(rx, ry, 1, H - ry, C.rackHi);
  for (let u = 0; u < 8; u++) {
    const y = ry + 3 + u * 8;
    b += R(rx + 2, y, 18, 6, C.rackDark) + R(rx + 2, y, 18, 1, C.rackHi);
    for (let v = 0; v < 4; v++) b += R(rx + 10 + v * 2, y + 3, 1, 1, '#2f2f3f');
    b += R(rx + 4, y + 2, 1, 1, C.green);
    b += `<g class="led${u % 4}">${R(rx + 6, y + 2, 1, 1, u % 3 ? C.green : C.amber)}</g>`;
  }
  // the cat asleep on top, its tail flicking
  b += sprite(CAT_LOAF, CAT_PAL, rx + 2, ry - 8);
  b += `<g class="tailDown">${R(rx + 15, ry - 2, 1, 4, CAT_PAL.o)}${R(rx + 16, ry + 2, 1, 2, CAT_PAL.o)}</g>`;
  b += `<g class="tailUp">${R(rx + 15, ry - 5, 1, 3, CAT_PAL.o)}${R(rx + 16, ry - 7, 1, 2, CAT_PAL.o)}</g>`;

  // me, blinking, in front of the window
  const px = 158, py = 46;
  b += sprite(ME.rows, ME.pal, px, py);
  b += sprite(ME.body, ME.pal, px, py + 16);
  b += `<g class="blink">${R(px + 9, py + 7, 1, 2, ME.pal.S)}${R(px + 14, py + 7, 1, 2, ME.pal.S)}${R(px + 8, py + 8, 2, 1, ME.pal.E)}${R(px + 14, py + 8, 2, 1, ME.pal.E)}</g>`;
  // the screen lights my face a little
  b += R(px + 6, py + 5, 12, 9, '#8fd3ff', ' opacity=".07"');

  // desk
  const dy = 86;
  b += R(0, dy, 210, 2, C.deskHi) + R(0, dy + 2, 210, 1, C.desk) + R(0, dy + 3, 210, H - dy - 3, C.deskFront);
  b += R(0, dy + 3, 210, 1, C.deskDark);
  for (const dx of [16, 120]) b += R(dx, dy + 8, 60, 14, C.deskDark) + R(dx + 1, dy + 9, 58, 12, C.deskFront) + R(dx + 26, dy + 14, 8, 1, C.woodHi);

  // laptop, lid towards us, with an ECG heart sticker
  const lx = 155;
  b += R(lx, dy - 18, 30, 17, C.lidEdge) + R(lx + 1, dy - 17, 28, 15, C.lid) + R(lx - 2, dy - 1, 34, 1, C.lidEdge);
  b += sprite(HEART5, { '#': C.green }, lx + 13, dy - 11);

  // desk lamp, light pooling on the desk
  const lampX = 116;
  b += `<polygon points="${lampX + 1},68 ${lampX + 9},68 ${lampX + 22},${dy} ${lampX - 12},${dy}" fill="${C.glow}" opacity=".1" shape-rendering="auto"/>`;
  b += R(lampX, 64, 10, 1, C.lampDark) + R(lampX - 1, 65, 12, 3, C.lamp) + R(lampX + 3, 68, 4, 1, '#fff3c4');
  for (let i = 0; i < 12; i++) b += R(lampX + 10 + Math.floor(i / 2), 65 + Math.floor(i * 1.6), 1, 2, C.lampDark);
  b += R(lampX + 14, dy - 2, 10, 2, C.lampDark);

  // plant, a rubber duck for debugging, and books
  b += sprite(DUCK, DUCK_PAL, 80, dy - 7);
  b += sprite(PLANT, PLANT_PAL, 44, dy - 14);
  [['#3e4fd6', 22], ['#c4532f', 20], ['#2f7d5b', 24], ['#ece0c2', 18]].forEach(([c, w], i) => {
    b += R(12, dy - 3 - i * 3, w, 3, c) + R(12, dy - 3 - i * 3, w, 1, '#ffffff22');
  });

  // mug, steaming
  b += sprite(MUG, MUG_PAL, 192, dy - 8);
  STEAM.forEach((f, i) => (b += `<g class="steam s${i}" opacity="${i ? 0 : 1}">${sprite(f, { '#': '#ffffff66' }, 192, dy - 16)}</g>`));

  const clip = `<defs><clipPath id="win"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}"/></clipPath><clipPath id="round"><path d="${steppedPath(W, H, 3)}"/></clipPath></defs>`;
  const css = `
.cursor{animation:cursor 1.06s steps(1) infinite}
@keyframes cursor{50%{opacity:0}}
.tw1{animation:tw 2.3s steps(1) infinite}.tw2{animation:tw 3.1s steps(1) -1s infinite}.tw3{animation:tw 4.3s steps(1) -2s infinite}
@keyframes tw{50%{opacity:.15}}
.shoot{opacity:0;animation:shoot 9s linear 2s infinite}
@keyframes shoot{0%{opacity:0;transform:translate(0,0)}1%{opacity:1}9%{opacity:0;transform:translate(34px,14px)}100%{opacity:0;transform:translate(34px,14px)}}
.flick{animation:flick 6s steps(1) infinite}
@keyframes flick{40%{opacity:0}55%{opacity:1}80%{opacity:0}85%{opacity:1}}
.beam{animation:beam 4s ease-in-out infinite;opacity:.45}
@keyframes beam{50%{opacity:.85}}
.seaB{opacity:0}.seaA,.seaB{animation:sea 1.6s steps(1) infinite}.seaB{animation-delay:-.8s}
@keyframes sea{0%{opacity:1}50%{opacity:0}}
.tick{animation:tick 12s steps(12) infinite}
@keyframes tick{to{transform:rotate(360deg)}}
.led0{animation:led .7s steps(1) infinite}.led1{animation:led 1.3s steps(1) -.4s infinite}.led2{animation:led 2.1s steps(1) -1s infinite}.led3{animation:led .9s steps(1) -.2s infinite}
@keyframes led{50%{opacity:.15}}
.tailUp{opacity:0;animation:tailUp 3.6s steps(1) infinite}.tailDown{animation:tailDown 3.6s steps(1) infinite}
@keyframes tailUp{0%,84%{opacity:0}85%,95%{opacity:1}96%{opacity:0}}
@keyframes tailDown{0%,84%{opacity:1}85%,95%{opacity:0}96%{opacity:1}}
.blink{opacity:0;animation:blink 4.4s steps(1) 1s infinite}
@keyframes blink{0%,95%{opacity:0}96%,99%{opacity:1}100%{opacity:0}}
.steam{animation:steam 1.5s steps(1) infinite}.s1{animation-delay:-1s}.s2{animation-delay:-.5s}
@keyframes steam{0%{opacity:1}33.3%,100%{opacity:0}}`;
  return svg(W, H, 5, `<g clip-path="url(#round)">${b}</g>`, {
    label: 'Pixel art: Mohammed El Khelyfy, backend engineer in Casablanca, open to work, at a laptop at night beside a server rack with a sleeping cat, the city and the Hassan II minaret through the window',
    css,
    clip,
  });
}

/* ───────── repo icons, 16 × 16 ───────── */
const ICONS = {
  opencheck: {
    label: 'A pixel monitor showing a heartbeat',
    pal: { F: '#4a4a5e', f: '#6b6b85', s: '#0f1f17', g: C.green, t: '#4a4a5e' },
    rows: [
      '................', '.ffffffffffffff.', '.FssssssssssssF.', '.FssssssgsssssF.', '.FsssssgsgssssF.', '.FsssssgsgssssF.',
      '.FsssssgsgssssF.', '.FgggggssgsgggF.', '.FsssssssggsssF.', '.FssssssssssssF.', '.ffffffffffffff.', '......tttt......',
      '......tttt......', '....tttttttt....', '................', '................',
    ],
    extra: () => `<g class="scan">${R(2, 2, 1, 8, C.greenHi, ' opacity=".35"')}</g><g class="on">${R(13, 10, 1, 1, C.greenHi)}</g>`,
    css: `.scan{animation:scan 1.8s steps(12) infinite}@keyframes scan{to{transform:translateX(12px)}}.on{animation:on 1s steps(1) infinite}@keyframes on{50%{opacity:0}}`,
  },
  'event-microservice': {
    label: 'A pixel event ticket',
    pal: { y: C.gold, Y: '#b8860b', d: '#7a5a0a' },
    rows: [
      '................', '................', '................', '.yyyyyyyyyyyyyy.', '.yyyyyyyydyyyyy.', '.yyYYYYYyyyYYyy.',
      '.yyyyyyyydyyyyy.', '..yYYYyyyyyyyy..', '..yyyyyyydyyyy..', '.yyYYYYyyyyYYyy.', '.yyyyyyyydyyyyy.', '.yyyyyyyyyyyyyy.',
      '................', '................', '................', '................',
    ],
    extra: () => `<g class="spark">${R(13, 0, 1, 3, '#fff6d5')}${R(12, 1, 3, 1, '#fff6d5')}</g><g class="spark s2">${R(1, 13, 1, 1, '#fff6d5')}</g>`,
    css: `.spark{animation:spark 1.6s steps(1) infinite}.s2{animation-delay:-.8s}@keyframes spark{50%{opacity:0}}`,
  },
  ECG: {
    label: 'A beating pixel heart',
    pal: { r: '#e5534b', R: '#b62324', h: '#ff9e97' },
    rows: [
      '................', '................', '...rrr....rrr...', '..rrrrr..rrrrr..', '.rrhrrrrrrrrrrR.', '.rhrrrrrrrrrrrR.',
      '.rrrrrrrrrrrrrR.', '.rrrrrrrrrrrrRR.', '..rrrrrrrrrrRR..', '...rrrrrrrrRR...', '....rrrrrrRR....', '.....rrrrRR.....',
      '......rrRR......', '.......RR.......', '................', '................',
    ],
    wrap: 'beat',
    css: `.beat{transform-origin:8px 8px;animation:beat 1.2s infinite}@keyframes beat{0%,40%,100%{transform:scale(1)}10%{transform:scale(1.14)}25%{transform:scale(1.06)}}`,
  },
  the_girlies_club: {
    label: 'A pixel ball of yarn with a knitting needle',
    pal: { p: '#e86f9a', P: '#b44a74', D: '#8f3a5c', n: '#c9c3b6', t: '#e86f9a' },
    rows: [
      '..............n.', '.............n..', '.....pppppp.n...', '...ppPpppppPnp..', '..ppPppppppPppp.', '..pPppppppPpppp.',
      '.ppPpppppPppppp.', '.pPpppppPpppppD.', '.PpppppPppppppD.', '.ppppPpppppppDD.', '..pppPppppppDD..', '..ppPpppppDDD...',
      '...pppppDDD.....', '.....DDDD.......', '................', '................',
    ],
    extra: () => `<g class="th0">${R(9, 13, 2, 1, '#e86f9a')}${R(11, 14, 3, 1, '#e86f9a')}</g><g class="th1">${R(9, 13, 1, 1, '#e86f9a')}${R(10, 14, 2, 1, '#e86f9a')}${R(12, 13, 2, 1, '#e86f9a')}</g>`,
    css: `.th1{opacity:0}.th0,.th1{animation:th 1.4s steps(1) infinite}.th1{animation-delay:-.7s}@keyframes th{0%{opacity:1}50%{opacity:0}}`,
  },
  portfolio: {
    label: 'A pixel punched card',
    pal: { m: '#ece0c2' },
    rows: [
      '................', '................', '...mmmmmmmmmmmm.', '..mmmmmmmmmmmmm.', '.mmmmmmmmmmmmmm.', '.mmmmmmmmmmmmmm.',
      '.mmmmmmmmmmmmmm.', '.mmmmmmmmmmmmmm.', '.mmmmmmmmmmmmmm.', '.mmmmmmmmmmmmmm.', '.mmmmmmmmmmmmmm.', '.mmmmmmmmmmmmmm.',
      '................', '................', '................', '................',
    ],
    // holes punched one at a time, then the card resets
    extra: () =>
      [[3, 4], [6, 4], [10, 4], [3, 5], [8, 5], [12, 5], [5, 6], [8, 6], [2, 7], [11, 7], [4, 8], [7, 8], [13, 8], [7, 9], [10, 9], [3, 10]]
        .map(([x, y], i) => `<g class="hole" style="animation-delay:${i * 0.18}s">${R(x, y, 1, 1, '#1b1a17')}</g>`)
        .join(''),
    css: `.hole{animation:hole 4.5s steps(1) backwards infinite}@keyframes hole{0%{opacity:0}1%,75%{opacity:1}76%,100%{opacity:0}}`,
  },
};

function icon(name) {
  const ic = ICONS[name];
  let body = sprite(ic.rows, ic.pal) + (ic.extra ? ic.extra() : '');
  if (ic.wrap) body = `<g class="${ic.wrap}">${body}</g>`;
  return svg(16, 16, 4, body, { label: ic.label, css: ic.css });
}

/* ───────── inventory: the stack as an RPG hotbar ───────── */
const ITEMS = [
  ['JAVA', { w: '#ece6da', b: '#6b4127', s: '#9a8fb5', r: '#e5534b' }, [
    '...s..s.....', '....s..s....', '...s..s.....', '............', '.wwwwwwww...', '.wbbbbbbwww.',
    '.wwwwwwww.w.', '.wwwwwwww.w.', '.wwwwwwwwww.', '..wwwwww....', 'rrrrrrrrrr..', '............']],
  ['SPRING', { g: '#6db33f', G: '#3d7a1f' }, [
    '........ggg.', '......gggggg', '.....gggggGg', '....ggggGggg', '...gggGggggg', '...ggGgggggg',
    '..ggGggggg..', '..gGgggg....', '.gGggg......', '.G..........', 'G...........', '............']],
  ['PHP', { p: '#8892bf', P: '#4f5b93', E: '#1b1626' }, [
    '............', '..pppppp....', '.pppppppp...', 'pppppppPPpp.', 'ppppppPPPpEp', 'ppppppPPPppp',
    'pppppppPPp.p', 'pppppppppp.p', 'pp.pp.pp.p..', 'pp.pp.pp....', '............', '............']],
  ['LARAVEL', { r: '#ff2d20', R: '#b3170e' }, [
    '............', '.rr.........', '.rR.........', '.rR.........', '.rR.........', '.rR...rr....',
    '.rR...rR....', '.rRrrrrRrr..', '.rRRRRRRRR..', '............', '............', '............']],
  ['POSTGRES', { D: '#5b8fc7', d: '#336791' }, [
    '............', '..DDDDDDDD..', '.DddddddddD.', '.DDDDDDDDDD.', '.dddddddddd.', '.DDDDDDDDDD.',
    '.dddddddddd.', '.DDDDDDDDDD.', '.dddddddddd.', '..DDDDDDDD..', '............', '............']],
  ['KAFKA', { k: '#d0d0d8' }, [
    'kk........kk', 'kk........kk', '..k......k..', '...k....k...', '....kkkk....', '....k..k....',
    '....k..k....', '....kkkk....', '...k....k...', '..k......k..', 'kk........kk', 'kk........kk']],
  ['DOCKER', { b: '#2496ed', c: '#86c8f5', w: '#ffffff' }, [
    '............', '......cc....', '...cc.cc....', '.cc.cc.cc...', '.cc.cc.cc..b', 'bbbbbbbbbbb.',
    'bbbbbbbbbwbb', 'bbbbbbbbbbb.', '.bbbbbbbbb..', '..bbbbbbb...', '............', '............']],
  ['TS', { t: '#3178c6', w: '#ffffff' }, [
    'tttttttttttt', 'tttttttttttt', 'tttttttttttt', 'tttttttttttt', 'tttttttttttt', 'tttwwwttwwtt',
    'ttttwttwtttt', 'ttttwtttwttt', 'ttttwttttwtt', 'ttttwttwwttt', 'tttttttttttt', 'tttttttttttt']],
];

function inventory() {
  const slot = 48, gap = 4, pad = 8, top = 16;
  const W = pad * 2 + ITEMS.length * slot + (ITEMS.length - 1) * gap;
  const box = 40;
  const H = top + box + 18;
  let b = `<path d="${steppedPath(W, H, 3)}" fill="${C.panel}"/>`;
  b += R(3, 1, W - 6, 1, C.panelHi);
  b += text('INVENTORY', pad, 5, C.cream) + text(`${ITEMS.length}/${ITEMS.length}`, W - pad - textWidth('8/8'), 5, C.dim);
  ITEMS.forEach(([label, pal, rows], i) => {
    const x = pad + i * (slot + gap), y = top;
    b += R(x, y, slot, box, C.panelLine) + R(x + 1, y + 1, slot - 2, box - 2, '#140f1e');
    b += sprite(rows, pal, x + (slot - 36) / 2, y + 2, 3);
    b += text(label, x + Math.round((slot - textWidth(label)) / 2), y + box + 4, C.lavender);
  });
  // the selection frame walks along the bar
  const sel = `<g class="sel">${R(pad - 1, top - 1, slot + 2, 1, C.gold)}${R(pad - 1, top + box, slot + 2, 1, C.gold)}${R(pad - 1, top - 1, 1, box + 2, C.gold)}${R(pad + slot, top - 1, 1, box + 2, C.gold)}</g>`;
  const step = slot + gap;
  const css = `.sel{animation:sel ${ITEMS.length * 1.1}s steps(${ITEMS.length}) infinite}@keyframes sel{to{transform:translateX(${step * ITEMS.length}px)}}`;
  return svg(W, H, 2, b + sel, { label: `Tech stack: ${ITEMS.map((i) => i[0]).join(', ')}`, css });
}

/* ───────── section headings and buttons ───────── */
function heading(label, glyph) {
  const W = textWidth(label) + 26, H = 15;
  let b = `<path d="${steppedPath(W, H, 2)}" fill="${C.panel}"/>` + R(2, 1, W - 4, 1, C.panelHi);
  b += sprite(glyph.rows, glyph.pal, 5, 4);
  b += title(label, 17, 4, C.cream);
  return svg(W, H, 3, b, { label });
}

function button(label, glyph) {
  const W = textWidth(label) + 28, H = 17;
  let b = R(1, 1, W - 1, H - 1, C.shadow); // drop shadow
  b += `<path d="${steppedPath(W - 1, H - 1, 2)}" fill="${C.panelHi}"/>`;
  b += R(2, 1, W - 5, 1, '#6a5a92') + R(1, 2, 1, H - 5, '#6a5a92'); // bevel light
  b += R(2, H - 3, W - 5, 1, C.panel) + R(W - 3, 2, 1, H - 5, C.panel); // bevel dark
  b += sprite(glyph.rows, glyph.pal, 6, 4);
  b += text(label, 19, 4, C.cream);
  return svg(W, H, 3, b, { label });
}

const GLYPHS = {
  folder: { pal: { y: C.gold, Y: '#b8860b' }, rows: ['yyy.....', 'yyyyyyyy', 'YYYYYYYY', 'yyyyyyyy', 'yyyyyyyy', 'yyyyyyyy', 'YYYYYYYY'] },
  sword: { pal: { s: '#d0d0d8', h: '#b8672a' }, rows: ['......ss', '.....sss', '....sss.', 'h..sss..', '.hsss...', '..hh....', '.h.h....'] },
  heart: { pal: { r: '#e5534b' }, rows: ['.rr.rr..', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....', '........'] },
  mail: { pal: { w: '#ece6da', d: '#7d6fa3' }, rows: ['wwwwwwwww', 'wdwwwwwdw', 'wwdwwwdww', 'wwwdwdwww', 'wwwwdwwww', 'wwwwwwwww', '.........'] },
  linkedin: { pal: { b: '#0a66c2', w: '#ffffff' }, rows: ['bbbbbbbbb', 'bwbbbbbbb', 'bbbbbbbbb', 'bwbwwbwbb', 'bwbwbbbwb', 'bwbwbbbwb', 'bbbbbbbbb'] },
};

/* ───────── footer: the cat goes for a walk ───────── */
function footer() {
  const W = 240, H = 14;
  let b = '';
  for (let x = 0; x < W; x += 3) b += R(x, H - 1, 2, 1, '#7d6fa355');
  const cat = CAT_WALK.map((f, i) => `<g class="leg${i}">${sprite(f, CAT_PAL, 0, H - 10)}</g>`).join('');
  b += `<g class="walk">${cat}</g>`;
  const css = `.walk{animation:walk 16s linear infinite;transform:translateX(112px)}
@keyframes walk{from{transform:translateX(-20px)}to{transform:translateX(${W + 4}px)}}
.leg1{opacity:0}.leg0,.leg1{animation:leg .36s steps(1) infinite}.leg1{animation-delay:-.18s}
@keyframes leg{0%{opacity:1}50%{opacity:0}}`;
  return svg(W, H, 4, b, { label: 'A pixel cat walking along the bottom of the page', css });
}

/* ───────── write everything ───────── */
const dir = new URL('../assets/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) if (f.endsWith('.svg')) rmSync(new URL(f, dir));
const out = (name, content) => writeFileSync(new URL(name, dir), content);
out('hero.svg', hero());
for (const name of Object.keys(ICONS)) out(`icon-${name}.svg`, icon(name));
out('inventory.svg', inventory());
out('h-projects.svg', heading('PROJECTS', GLYPHS.folder));
out('h-stack.svg', heading('STACK', GLYPHS.sword));
out('h-contact.svg', heading('CONTACT', GLYPHS.heart));
out('btn-email.svg', button('EMAIL', GLYPHS.mail));
out('btn-linkedin.svg', button('LINKEDIN', GLYPHS.linkedin));
out('footer.svg', footer());
console.log('assets written');
