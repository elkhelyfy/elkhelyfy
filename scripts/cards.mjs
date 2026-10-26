// Draws the two punched cards in assets/. Run: node scripts/cards.mjs
// Same IBM 029 encoding as the portfolio (src/lib/punch.ts), same palette.
import { writeFileSync } from 'node:fs';

const ink = '#1b1a17';
const card = '#ece0c2'; // manila card stock
const print = '#8f7f5c'; // the digits printed on a card
const blue = '#3e4fd6';
const mono = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/* ───────── IBM 029 ───────── */
const ROWS = ['12', '11', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SYMBOLS = {
  '&': ['12'], '-': ['11'], '/': ['0', '1'], '.': ['12', '3', '8'], ',': ['0', '3', '8'],
  ':': ['2', '8'], '#': ['3', '8'], '@': ['4', '8'], "'": ['5', '8'], '=': ['6', '8'],
};
function punches(ch) {
  const c = ch.toUpperCase();
  if (c >= '0' && c <= '9') return [c];
  const code = c.charCodeAt(0);
  if (c >= 'A' && c <= 'I') return ['12', String(code - 64)];
  if (c >= 'J' && c <= 'R') return ['11', String(code - 73)];
  if (c >= 'S' && c <= 'Z') return ['0', String(code - 81)];
  return SYMBOLS[c] ?? [];
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&apos;');
const n = (v) => +v.toFixed(2);

/** card outline: rounded corners, the classic cut on the top left */
function stock(w, h, r = 10, cut = 34) {
  return `<path d="M0 ${cut * 1.35}L${cut} 0H${w - r}Q${w} 0 ${w} ${r}V${h - r}Q${w} ${h} ${w - r} ${h}H${r}Q0 ${h} 0 ${h - r}Z" fill="${card}"/>`;
}

/* ───────── hero: the holes spell the text, punched in one column at a time ───────── */
function hero(text) {
  const W = 1200, H = 529; // 7⅜″ × 3¼″
  const inch = W / 7.375;
  const pitchX = 0.087 * inch, pitchY = 0.25 * inch;
  const x0 = (W - 80 * pitchX) / 2;
  const holeW = 0.055 * inch, holeH = 0.125 * inch;
  const cx = (i) => x0 + pitchX * (i + 0.5);
  const cy = (r) => pitchY * (r + 1);

  let digits = '', numbers = '', cols = '';
  for (let i = 0; i < 80; i++) {
    for (let r = 2; r < 12; r++) digits += `<text x="${n(cx(i))}" y="${n(cy(r) + 4.5)}">${ROWS[r]}</text>`;
    numbers += `<text x="${n(cx(i))}" y="${n(cy(2) + 23)}">${i + 1}</text><text x="${n(cx(i))}" y="${n(cy(11) + 23)}">${i + 1}</text>`;
  }
  [...text.toUpperCase().slice(0, 80)].forEach((ch, i) => {
    const rows = punches(ch);
    if (!rows.length) return;
    const holes = rows
      .map((row) => `<rect x="${n(cx(i) - holeW / 2)}" y="${n(cy(ROWS.indexOf(row)) - holeH / 2)}" width="${n(holeW)}" height="${n(holeH)}" rx="1.5"/>`)
      .join('');
    cols += `<g class="k" style="animation-delay:${400 + i * 22}ms"><text x="${n(cx(i))}" y="22">${esc(ch)}</text>${holes}</g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(text)}">
<style>
.k{animation:punch 90ms cubic-bezier(.23,1,.32,1) both}
@keyframes punch{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.k{animation:none}}
</style>
${stock(W, H)}
<g font-family="${mono}" font-size="12" fill="${print}" text-anchor="middle">${digits}</g>
<g font-family="${mono}" font-size="6.5" fill="${print}" text-anchor="middle" opacity=".8">${numbers}</g>
<g font-family="${mono}" font-size="15" font-weight="600" fill="${ink}" text-anchor="middle">${cols}</g>
</svg>
`;
}

/* ───────── skills × projects: a hole where the skill shipped ───────── */
function matrix(projects, rows) {
  const W = 1000;
  const left = 48, labelW = 200;
  const pitchX = (W - left - labelW - 24) / projects.length;
  const top = 146, pitchY = 32;
  const H = top + rows.length * pitchY + 18;
  const cx = (j) => left + labelW + pitchX * (j + 0.5);
  const cy = (i) => top + pitchY * i;

  let head = '', grid = '', holes = '', labels = '';
  projects.forEach((p, j) => {
    head += `<text x="${n(cx(j))}" y="100" font-weight="600" fill="${ink}">${esc(p.name)}</text>`;
    head += `<text x="${n(cx(j))}" y="120" fill="${p.kind === 'work' ? blue : print}">${p.kind}</text>`;
  });
  rows.forEach((row, i) => {
    labels += `<text x="${left}" y="${n(cy(i) + 6)}">${esc(row.skill)}</text>`;
    projects.forEach((p, j) => {
      if (row.in.includes(p.slug)) holes += `<rect x="${n(cx(j) - 5.5)}" y="${n(cy(i) - 11)}" width="11" height="22" rx="1.5"/>`;
      else grid += `<text x="${n(cx(j))}" y="${n(cy(i) + 4)}">${i % 10}</text>`;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skills by project, punched where each skill was used">
${stock(W, H)}
<text x="${left}" y="58" font-family="${mono}" font-size="18" font-weight="600" fill="${ink}" letter-spacing=".04em">SKILLS.CARD</text>
<text x="${left}" y="82" font-family="${sans}" font-size="15" fill="${print}">a hole where it shipped</text>
<g font-family="${mono}" font-size="14" text-anchor="middle" letter-spacing=".02em">${head}</g>
<g font-family="${sans}" font-size="17" font-weight="500" fill="${ink}">${labels}</g>
<g font-family="${mono}" font-size="12" fill="${print}" text-anchor="middle" opacity=".7">${grid}</g>
<g fill="${ink}">${holes}</g>
</svg>
`;
}

/* ───────── data, mirrored from the portfolio ───────── */
const projects = [
  { slug: 'e-lma', name: 'E-LMA', kind: 'work' },
  { slug: 'igodar', name: 'IGODAR', kind: 'work' },
  { slug: 'e-lma-cosec', name: 'COSEC', kind: 'work' },
  { slug: 'smartview', name: 'SMARTVIEW', kind: 'work' },
  { slug: 'marechal', name: 'MARECHAL', kind: 'side' },
  { slug: 'event-platform', name: 'EVENTS', kind: 'side' },
  { slug: 'rihla', name: 'RIHLA', kind: 'side' },
  { slug: 'tripi', name: 'TRIPI', kind: 'side' },
];
const rows = [
  { skill: 'PHP', in: ['e-lma', 'igodar', 'e-lma-cosec', 'smartview', 'rihla'] },
  { skill: 'Laravel', in: ['igodar', 'smartview', 'rihla'] },
  { skill: 'Laminas · Doctrine', in: ['e-lma', 'e-lma-cosec'] },
  { skill: 'MySQL', in: ['e-lma', 'igodar', 'e-lma-cosec'] },
  { skill: 'PostgreSQL', in: ['marechal', 'event-platform', 'rihla', 'tripi'] },
  { skill: 'Java · Spring', in: ['event-platform'] },
  { skill: 'Kafka', in: ['event-platform'] },
  { skill: 'Python · FastAPI', in: ['marechal'] },
  { skill: 'Redis', in: ['marechal'] },
  { skill: 'Docker', in: ['marechal', 'event-platform'] },
  { skill: 'AWS', in: ['event-platform'] },
  { skill: 'Auth · RBAC · JWT', in: ['e-lma', 'e-lma-cosec', 'marechal', 'event-platform'] },
  { skill: 'Automated tests', in: ['e-lma', 'igodar', 'marechal'] },
  { skill: 'LLM / AI APIs', in: ['igodar', 'e-lma-cosec', 'marechal', 'rihla', 'tripi'] },
  { skill: 'Frontend', in: ['e-lma', 'smartview', 'marechal', 'event-platform', 'tripi'] },
];

const dir = new URL('../assets/', import.meta.url);
writeFileSync(new URL('card.svg', dir), hero('MOHAMMED EL KHELYFY - BACKEND ENGINEER - PHP JAVA SQL - CASABLANCA'));
writeFileSync(new URL('skills.svg', dir), matrix(projects, rows));
console.log('assets/card.svg, assets/skills.svg');
