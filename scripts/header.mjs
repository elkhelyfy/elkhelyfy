// Draws the profile header in assets/: one SVG per GitHub theme. Run: node scripts/header.mjs
import { writeFileSync } from 'node:fs';

// GitHub's own font stacks, so the header sits in the page like native text
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const mono = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

// GitHub's palette, including its "success" green
const themes = {
  dark: { fg: '#e6edf3', muted: '#9198a1', grid: '#f0f6fc', gridA: 0.07, pulse: '#3fb950' },
  light: { fg: '#1f2328', muted: '#59636e', grid: '#1f2328', gridA: 0.08, pulse: '#1a7f37' },
};

const W = 1200, H = 320;
const base = 248; // the trace's flat line
const x0 = 0, x1 = W - 16;

/** a heartbeat: flat line, then P wave, QRS spike and T wave, every `beat` px */
function trace(beat = 196) {
  const k = (dx, dy) => `l${dx} ${dy}`;
  let d = `M${x0} ${base}`;
  let x = x0;
  const complex = [
    k(30, 0),
    'q7 -12 14 0', // P
    k(10, 0),
    k(4, 7), // Q
    k(8, -82), // R
    k(9, 104), // S
    k(6, -29),
    k(18, 0),
    'q12 -20 24 0', // T
  ].join('');
  const complexW = 30 + 14 + 10 + 4 + 8 + 9 + 6 + 18 + 24;
  while (x + beat <= x1) {
    d += complex + k(beat - complexW, 0);
    x += beat;
  }
  d += k(x1 - x, 0);
  return d;
}

function header(t) {
  // faint ECG paper behind the trace: small squares, a stronger line every fifth
  let grid = '';
  for (let x = x0; x <= x1; x += 16) {
    const major = (x - x0) % 80 === 0;
    grid += `<line x1="${x}" y1="${base - 96}" x2="${x}" y2="${base + 48}" stroke-opacity="${major ? 1 : 0.45}"/>`;
  }
  for (let y = base - 96; y <= base + 48; y += 16) {
    const major = (y - (base - 96)) % 80 === 0;
    grid += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke-opacity="${major ? 1 : 0.45}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mohammed El Khelyfy, backend engineer in Casablanca. Open to backend roles.">
<defs>
<linearGradient id="fade" x1="0" x2="1">
<stop offset="0" stop-color="#fff" stop-opacity="0"/>
<stop offset=".18" stop-color="#fff"/>
<stop offset=".9" stop-color="#fff"/>
<stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<mask id="edges"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
<linearGradient id="tail" x1="${x0}" x2="${x1}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${t.pulse}" stop-opacity="0"/>
<stop offset=".35" stop-color="${t.pulse}" stop-opacity=".55"/>
<stop offset="1" stop-color="${t.pulse}"/>
</linearGradient>
</defs>
<style>
.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.4s linear .2s forwards}
.dot{opacity:0;animation:in .3s cubic-bezier(.23,1,.32,1) 2.6s forwards}
.ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:ping 2.4s cubic-bezier(.23,1,.32,1) 2.9s infinite}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes in{to{opacity:1}}
@keyframes ping{0%{opacity:.5;transform:scale(1)}80%,100%{opacity:0;transform:scale(3)}}
@media (prefers-reduced-motion:reduce){.draw{animation:none;stroke-dashoffset:0}.dot{animation:none;opacity:1}.ring{animation:none}}
</style>

<text x="${x0}" y="78" font-family="${sans}" font-size="52" font-weight="600" letter-spacing="-1" fill="${t.fg}">Mohammed El Khelyfy</text>
<text x="${x0 + 1}" y="120" font-family="${sans}" font-size="24" fill="${t.muted}">Backend engineer · Casablanca</text>

<circle cx="${x1 - 224}" cy="62" r="5" fill="${t.pulse}"/>
<text x="${x1 - 210}" y="68" font-family="${mono}" font-size="17" fill="${t.muted}">open to backend roles</text>

<g stroke="${t.grid}" stroke-width="1" opacity="${t.gridA}" mask="url(#edges)">${grid}</g>
<path class="draw" pathLength="1" d="${trace()}" fill="none" stroke="url(#tail)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
<circle class="ring" cx="${x1}" cy="${base}" r="5" fill="${t.pulse}"/>
<circle class="dot" cx="${x1}" cy="${base}" r="5" fill="${t.pulse}"/>
</svg>
`;
}

const dir = new URL('../assets/', import.meta.url);
for (const [name, t] of Object.entries(themes)) writeFileSync(new URL(`header-${name}.svg`, dir), header(t));
console.log('assets/header-dark.svg, assets/header-light.svg');
