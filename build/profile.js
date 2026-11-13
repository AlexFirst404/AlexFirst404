// Builds the whole profile card as ONE svg (assets/profile.svg) from live GitHub
// data, framed as a terminal session: glitch name, readout strip with the streak
// flame, whoami, arsenal, activity. GitHub strips CSS/JS from READMEs, so everything — fonts, logos,
// animation — is baked into this file.
//
//   node build/profile.js                  # -> assets/profile.svg, README cache-buster
//   node build/profile.js --preview=<dir>  # -> <dir>/profile.svg, README untouched
//
// Token: STATS_TOKEN (a PAT, includes private contributions) or GITHUB_TOKEN.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOGIN = 'AlexFirst404';
const RES = path.join(__dirname, 'res');
const W = 860, PX = 24;
const FF = "ui-monospace,'Cascadia Code','JetBrains Mono',Consolas,monospace";

const C = {
  accent: '#e0143c', ember: '#ff5a3c', dim: '#8b0a20', cyan: '#00e6d6',
  text: '#f2dede', body: '#b89a9e', muted: '#a98a8e', faint: '#7a4a4f',
  line: '#2a1015', border: '#3a1a20', chip: '#180a0d', panel: '#14060a',
};

// ---------------------------------------------------------------- content
// Kept in sync with the landing page; no em dashes in visible copy.
const TAGLINES = [
  'turnkey apps · bots · websites',
  'shipping Remotek &amp; UnitVPN',
  'Unix operator // clearance: RED',
];
const WHOAMI = [
  ['>', 'I build turnkey apps, bots and websites, from the first sketch to production.'],
  [' ', 'Android (Java · Kotlin), Telegram &amp; Discord bots (Python), web (React · TypeScript),'],
  [' ', 'Minecraft mods &amp; plugins (NeoForge · Fabric · Paper) and desktop tools in C#.'],
  ['>', 'I host all of it myself, on Unix servers I run and harden.'],
];

// ---------------------------------------------------------------- resources
const NAME_FONT = fs.readFileSync(path.join(RES, 'name-font.css'), 'utf8');
// Background artwork generated with Higgsfield, optional: the card still builds
// on the plain gradient if the file is missing.
const WALLPAPER = (() => {
  try { return 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RES, 'wallpaper.jpg')).toString('base64'); }
  catch (e) { return null; }
})();
// small pre-blurred copy of the wallpaper, shown through the glass cards
const FROST = (() => {
  if (!WALLPAPER) return null;
  try { return 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RES, 'wallpaper-frost.jpg')).toString('base64'); }
  catch (e) { return null; }
})();
const ARSENAL = JSON.parse(fs.readFileSync(path.join(RES, 'arsenal.json'), 'utf8'));
const EXTRA = JSON.parse(fs.readFileSync(path.join(RES, 'extra-icons.json'), 'utf8'));

// The stack grew with the new projects: Astro (UnitVPN site), FastAPI (Remotek
// hub), Kotlin Multiplatform (Remotek mobile). Insert them into the extracted rows.
(function extendArsenal() {
  const row = l => ARSENAL.find(r => r.label === l);
  const fillIcon = d => ({ attrs: 'fill="currentColor"', svg: `<path d="${d}"/>` });
  const at = (l, after, item) => {
    const r = row(l); const i = r.items.findIndex(x => x.name === after);
    if (!r.items.some(x => x.name === item.name)) r.items.splice(i + 1, 0, item);
  };
  at('mobile', 'Jetpack Compose', { name: 'Kotlin Multiplatform', ...fillIcon(EXTRA.kotlin) });
  at('web', 'React', { name: 'Astro', ...fillIcon(EXTRA.astro) });
  at('web', 'Node.js', { name: 'FastAPI', ...fillIcon(EXTRA.fastapi) });
})();

// ---------------------------------------------------------------- primitives
const esc = s => String(s);
const HALO = 'stroke="#0c0205" stroke-opacity="0.85" stroke-width="4" stroke-linejoin="round" paint-order="stroke"';                       // copy above is pre-escaped
const nf = n => n.toLocaleString('en-US');
const CH12 = 7.22, CH13 = 7.82;                   // mono advance at 12 / 13px





/** HUD corner brackets around a box. */
function brackets(x, y, w, h, len = 12, color = C.accent) {
  const p = (a, b, c2, d2, e, f) => `<path d="M${a} ${b}L${c2} ${d2}L${e} ${f}" fill="none" stroke="${color}" stroke-width="1.6"/>`;
  return p(x, y + len, x, y, x + len, y) + p(x + w - len, y, x + w, y, x + w, y + len)
    + p(x, y + h - len, x, y + h, x + len, y + h) + p(x + w - len, y + h, x + w, y + h, x + w, y + h - len);
}

function chip(x, y, item, h = 26) {
  const w = item.name.length * CH12 + 38;
  const s = 15 / 24;
  return {
    w,
    svg: `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="6" fill="${C.chip}" stroke="${C.border}"/>`
      + `<g transform="translate(${(x + 8).toFixed(1)},${y + (h - 15) / 2}) scale(${s.toFixed(4)})" color="${C.ember}" ${item.attrs}>${item.svg}</g>`
      + `<text class="mono" x="${(x + 29).toFixed(1)}" y="${y + h / 2 + 4.1}" font-size="12" fill="#e6cfd0">${item.name.replace(/&/g, '&amp;')}</text>`,
  };
}

/** Arsenal rows: label column + chips, wrapping onto a second line if needed. */
function arsenal(x, y, w, rowGap = 38) {
  let s = '', yy = y;
  ARSENAL.forEach((r, i) => {
    s += `<text class="mono" x="${x}" y="${yy + 17}" font-size="13" font-weight="bold" fill="${C.accent}">${r.label}</text>`;
    let cx = x + 94;
    for (const it of r.items) {
      const probe = chip(0, 0, it);
      if (cx + probe.w > x + w) { cx = x + 94; yy += 32; }
      const c = chip(cx, yy, it); s += c.svg; cx += c.w + 6;
    }
    if (i < ARSENAL.length - 1) s += `<line x1="${x}" y1="${yy + 32}" x2="${x + w}" y2="${yy + 32}" stroke="${C.line}" stroke-dasharray="1 3"/>`;
    yy += rowGap;
  });
  return { svg: s, h: yy - y };
}

/** Name in the embedded blackletter, with red/cyan split layers that fire rarely. */
function nameBlock(x, y, size, anchor = 'middle') {
  const t = 'AlexFirst404';
  return `<g transform="translate(${x},${y})" text-anchor="${anchor}">`
    + `<text class="nm" font-size="${size}" fill="${C.accent}" opacity="0.4" filter="url(#ng)">${t}</text>`
    + `<text class="nm rd rdA" font-size="${size}">${t}</text>`
    + `<text class="nm cy cyA" font-size="${size}">${t}</text>`
    + `<text class="nm gl" font-size="${size}" fill="url(#name)">${t}</text></g>`;
}

function tagline(x, y, anchor = 'middle', size = 15) {
  return TAGLINES.map((t, i) =>
    `<text class="mono ln l${i + 1}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="#ecdadb" ${HALO}><tspan fill="${C.accent}">&gt; </tspan>${t}<tspan class="cur" fill="${C.accent}"> ▋</tspan></text>`).join('');
}

function whoami(x, y, lineH = 21, size = 13, lines = WHOAMI) {
  const indent = size * 0.6 * 2;                    // width of "> " in the mono face
  return lines.map(([p, t], i) => p === '>'
    ? `<text class="mono" x="${x}" y="${y + i * lineH}" font-size="${size}" fill="${C.body}"><tspan fill="${C.accent}" font-weight="bold">&gt;</tspan> ${t}</text>`
    : `<text class="mono" x="${(x + indent).toFixed(1)}" y="${y + i * lineH}" font-size="${size}" fill="${C.body}">${t}</text>`).join('');
}

/** Streak flame with the count inside; digits shrink as the number grows. */
function flame(cx, top, scale, n) {
  const nd = String(n).length;
  const fs2 = nd >= 3 ? 3.3 : nd === 2 ? 4.3 : 6.4;
  const ny = nd >= 3 ? 15.6 : nd === 2 ? 15.9 : 17;
  return `<g transform="translate(${(cx - 12 * scale).toFixed(1)},${top}) scale(${scale})"><g class="flame">`
    + `<path d="M12 2 C15 8 18 10 18 15 A6 6 0 0 1 6 15 C6 11 9 9 9.5 6 C10.5 8.5 12 8 12 2 Z" fill="url(#flameg)"/>`
    + `<path d="M12 8 C13.5 11 15 12.5 15 15 A3 3 0 0 1 9 15 C9 13 10.5 12 11 10 C11.5 11.5 12 11 12 8 Z" fill="#ffe0b0" opacity="0.9"/>`
    + `<text class="mono" x="12" y="${ny}" text-anchor="middle" font-size="${fs2}" font-weight="bold" fill="url(#numg)">${n}</text>`
    + `</g></g>`;
}


/** Weekly contributions as an area chart, optional month ticks underneath. */
function activity(d, x0, x1, yTop, yBot, ticks = false) {
  const series = d.weeks.map(w => w.contributionDays.reduce((a, b) => a + b.contributionCount, 0));
  const max = Math.max(1, ...series);
  const px = k => x0 + (x1 - x0) * (k / (series.length - 1)), py = v => yBot - (yBot - yTop) * (v / max);
  let ln = '', ar = `M${x0} ${yBot} `;
  series.forEach((v, k) => { ln += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(v).toFixed(1) + ' '; ar += `L${px(k).toFixed(1)} ${py(v).toFixed(1)} `; });
  ar += `L${x1} ${yBot} Z`;
  let s = '';
  for (let g = 1; g <= 3; g++) {
    const yy = yTop + ((yBot - yTop) / 4) * g;
    s += `<line x1="${x0}" y1="${yy.toFixed(1)}" x2="${x1}" y2="${yy.toFixed(1)}" stroke="${C.line}" stroke-dasharray="1 5"/>`;
  }
  s += `<line x1="${x0}" y1="${yBot}" x2="${x1}" y2="${yBot}" stroke="${C.border}"/>`;
  s += `<path d="${ar}" fill="url(#afill)"/><path d="${ln}" fill="none" stroke="${C.accent}" stroke-width="1.8" stroke-linejoin="round"/>`;
  s += `<circle cx="${px(series.length - 1).toFixed(1)}" cy="${py(series[series.length - 1]).toFixed(1)}" r="3.5" fill="${C.ember}" class="pulse"/>`;
  if (ticks) {
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    let last = -1;
    d.weeks.forEach((w, k) => {
      const m = Number(w.contributionDays[0].date.slice(5, 7)) - 1;
      if (m !== last && k > 0 && k < d.weeks.length - 2) {
        s += `<text class="mono" x="${px(k).toFixed(1)}" y="${yBot + 15}" text-anchor="middle" font-size="9.5" fill="${C.faint}">${MON[m]}</text>`;
      }
      last = m;
    });
  }
  return { svg: s, max };
}





function signoff(cx, y) {
  return `<text class="mono" x="${cx}" y="${y}" text-anchor="middle" font-size="12" fill="${C.faint}">// signal lost, connection terminated <tspan class="cur" fill="${C.accent}">▮</tspan></text>`;
}

// ---------------------------------------------------------------- frame
function defs(H) {
  return `<style>
.mono{font-family:${FF}}.nm{font-family:'UF',serif}
.rd{fill:${C.accent};opacity:0}.cy{fill:${C.cyan};opacity:0}
.gl{animation:gl 5s infinite steps(1)}.rdA{animation:rdA 3.6s infinite steps(1)}.cyA{animation:cyA 4.3s infinite steps(1)}
.ln{opacity:0}.l1{animation:l1 9s infinite}.l2{animation:l2 9s infinite}.l3{animation:l3 9s infinite}
.cur{animation:cur 1.05s steps(1) infinite}.pulse{animation:pulse 1.8s ease-in-out infinite}
.flame{transform-origin:12px 21px;animation:flick 1.7s ease-in-out infinite}
.gb{opacity:0}.g1{animation:g1 8.5s infinite steps(1)}.g2{animation:g2 11s infinite steps(1)}.g3{animation:g3 13s infinite steps(1)}
.sweep{animation:sweep 9s linear infinite}
.wp{transform-box:fill-box;transform-origin:50% 40%;animation:drift 28s ease-in-out infinite alternate}
@keyframes drift{from{transform:scale(1)}to{transform:scale(1.07) translate(-1%,.8%)}}
@keyframes gl{0%,89%,100%{opacity:1}90%{opacity:.6}91%{opacity:1}95%{opacity:.82}96%{opacity:1}}
@keyframes rdA{0%,86%,100%{opacity:0}87%{opacity:.7;transform:translate(4px,2px)}90%{opacity:0}93%{opacity:.55;transform:translate(-3px,-2px)}94%{opacity:0}}
@keyframes cyA{0%,88%,100%{opacity:0}89%{opacity:.6;transform:translate(-4px,-2px)}91%{opacity:0}94%{opacity:.5;transform:translate(3px,2px)}95%{opacity:0}}
@keyframes l1{0%{opacity:0}2%{opacity:1}30%{opacity:1}33%{opacity:0}100%{opacity:0}}
@keyframes l2{0%,33%{opacity:0}35%{opacity:1}63%{opacity:1}66%{opacity:0}100%{opacity:0}}
@keyframes l3{0%,66%{opacity:0}68%{opacity:1}96%{opacity:1}98%{opacity:0}100%{opacity:0}}
@keyframes cur{50%{opacity:0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes flick{0%,100%{transform:scaleY(1) scaleX(1)}45%{transform:scaleY(1.09) scaleX(0.95)}70%{transform:scaleY(0.97) scaleX(1.03)}}
@keyframes g1{0%,92%,100%{opacity:0;transform:translateY(${Math.round(H * .08)}px)}93%{opacity:.45;transform:translateY(${Math.round(H * .3)}px)}94%{opacity:0}}
@keyframes g2{0%,88%,100%{opacity:0;transform:translateY(${Math.round(H * .55)}px)}89%{opacity:.4;transform:translateY(${Math.round(H * .22)}px)}90%{opacity:0}}
@keyframes g3{0%,95%,100%{opacity:0;transform:translateY(${Math.round(H * .72)}px)}96%{opacity:.35;transform:translateY(${Math.round(H * .86)}px)}97%{opacity:0}}
@keyframes sweep{from{transform:translateY(-140px)}to{transform:translateY(${H + 140}px)}}
@media (prefers-reduced-motion:reduce){.gl,.rdA,.cyA,.l1,.l2,.l3,.cur,.pulse,.flame,.g1,.g2,.g3,.sweep,.wp{animation:none}.rd,.cy,.gb{opacity:0}.ln{opacity:1}.l2,.l3{display:none}}
${NAME_FONT}</style>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0409"/><stop offset="0.5" stop-color="#120407"/><stop offset="1" stop-color="#0c0205"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.16"/><stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="glow2" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.08"/><stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/></radialGradient>
<linearGradient id="name" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe4e4"/><stop offset="55%" stop-color="#f0aeae"/><stop offset="100%" stop-color="#cc2333"/></linearGradient>
<linearGradient id="flameg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb04d"/><stop offset="0.5" stop-color="#ff4d2e"/><stop offset="1" stop-color="#c8102a"/></linearGradient>
<linearGradient id="numg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050203"/><stop offset="1" stop-color="#3a0810"/></linearGradient>
<linearGradient id="afill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.32"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0.02"/></linearGradient>
<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0205" stop-opacity="0.18"/><stop offset="0.24" stop-color="#0c0205" stop-opacity="0.42"/><stop offset="0.5" stop-color="#0c0205" stop-opacity="0.7"/><stop offset="1" stop-color="#0c0205" stop-opacity="0.78"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e080d" stop-opacity="0.42"/><stop offset="1" stop-color="#0c0205" stop-opacity="0.78"/></linearGradient>
<filter id="starglow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.8"/></filter>
<linearGradient id="sweepg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.accent}" stop-opacity="0"/><stop offset="0.5" stop-color="${C.accent}" stop-opacity="0.05"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></linearGradient>
<pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H26 M0 0 V26" stroke="${C.accent}" stroke-width="0.7" fill="none" opacity="0.06"/></pattern>
<pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.22"/></pattern>
<filter id="ng"><feGaussianBlur stdDeviation="6"/></filter>
<clipPath id="clip"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>`;
}

function frame(H, inner, aria) {
  const back = `<g clip-path="url(#clip)">`
    + `<rect width="${W}" height="${H}" fill="url(#bg)"/>`
    // wallpaper under a scrim: light behind the name, dark where the text is dense
    + (WALLPAPER ? `<image class="wp" href="${WALLPAPER}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/><rect width="${W}" height="${H}" fill="url(#scrim)"/>` : '')
    + `<rect width="${W}" height="${H}" fill="url(#grid)"/>`
    + `<ellipse cx="${W / 2}" cy="0" rx="560" ry="260" fill="url(#glow)"/><ellipse cx="${W / 2}" cy="${H}" rx="560" ry="260" fill="url(#glow2)"/>`
    + `<rect class="sweep" x="0" y="0" width="${W}" height="140" fill="url(#sweepg)"/>`
    + `<rect width="${W}" height="${H}" fill="url(#scan)"/>`
    + `<rect class="gb g1" width="${W}" height="5" fill="${C.accent}"/><rect class="gb g2" width="${W}" height="3" fill="${C.cyan}"/><rect class="gb g3" width="${W}" height="7" fill="${C.dim}"/>`
    + `</g><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${C.border}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${aria}"><defs>${defs(H)}</defs>${back}${inner}</svg>`;
}

// ---------------------------------------------------------------- layouts


// ---------------------------------------------------------------- readout strip
// Four glass cards. The frosted look is a pre-blurred copy of the wallpaper,
// clipped to the card shapes and drifting in step with the real one, so the silk
// shows through each card without an SVG blur filter re-running every frame.

const cardPath = (x, y, w, h, c = 14) => `M${x} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h}H${x}Z`;

/** Small deterministic hash, so the constellation keeps its shape between runs. */
function hash01(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

function cardLabel(x, y, glyph, text, right) {
  let s = glyph + `<text class="mono" x="${x + 16}" y="${y}" font-size="10" font-weight="bold" letter-spacing="2" fill="${C.accent}">${text}</text>`;
  if (right) s += `<text class="mono" x="${right.x}" y="${y}" text-anchor="end" font-size="9.5" letter-spacing="1.5" fill="${C.faint}">${right.t}</text>`;
  return s;
}

function readout(d, y) {
  const n = 4, gap = 12, ch = 112, cw = (W - PX * 2 - gap * (n - 1)) / n;
  const xs = [...Array(n)].map((_, i) => PX + i * (cw + gap));
  let s = `<defs><clipPath id="glasscut">${xs.map(x => `<path d="${cardPath(x, y, cw, ch)}"/>`).join('')}</clipPath></defs>`;
  if (FROST) {
    s += `<g clip-path="url(#glasscut)"><image class="wp" href="${FROST}" x="0" y="0" width="${W}" height="${d.H}" preserveAspectRatio="xMidYMid slice"/></g>`;
  }
  xs.forEach(x => {
    s += `<path d="${cardPath(x, y, cw, ch)}" fill="url(#glass)"/>`;
    s += `<line x1="${x + 1}" y1="${y + 0.75}" x2="${x + cw - 15}" y2="${y + 0.75}" stroke="#ffd9df" stroke-opacity="0.16"/>`;
    s += `<path d="${cardPath(x, y, cw, ch)}" fill="none" stroke="${C.accent}" stroke-opacity="0.32"/>`;
    s += `<path d="M${x + cw - 14} ${y}L${x + cw} ${y + 14}" stroke="${C.accent}" stroke-width="1.6"/>`;
  });
  const L = 14, LY = y + 24, NY = y + 62, VY = y + 72, CY = y + 103;
  const caption = (x, t) => `<text class="mono" x="${x + L}" y="${CY}" font-size="10" fill="${C.muted}">${t}</text>`;
  const big = (x, v, fill = C.text) => `<text class="mono" x="${x + L}" y="${NY}" font-size="30" font-weight="bold" fill="${fill}">${v}</text>`;

  // 1 · streak: glowing count, flame, the last 14 days as tiles
  {
    const x = xs[0], v = String(d.streak);
    s += cardLabel(x + L, LY, `<circle class="pulse" cx="${x + L + 4}" cy="${LY - 3.5}" r="3.2" fill="${C.ember}"/>`, 'STREAK');
    s += `<text class="mono" x="${x + L}" y="${NY}" font-size="30" font-weight="bold" fill="${C.ember}" opacity="0.6" filter="url(#ng)">${v}</text>`;
    s += big(x, v, C.ember);
    s += `<text class="mono" x="${x + L + v.length * 18 + 5}" y="${NY}" font-size="11" fill="${C.muted}">days</text>`;
    s += flame(x + cw - 30, y + 14, 2.2, d.streak);
    const last = d.days.slice(-14), T = 9, G = 3;
    last.forEach((day, i) => {
      const tx = x + L + i * (T + G), lit = day.contributionCount > 0, today = i === last.length - 1;
      s += `<rect x="${tx}" y="${VY + 6}" width="${T}" height="${T}" rx="2" fill="${lit ? (day.contributionCount > 20 ? C.accent : '#a50e2a') : C.line}"${today ? ` stroke="${C.ember}" stroke-width="1.4"` : ''}/>`;
    });
    s += caption(x, `record ${d.longest}d · today +${d.todayCount}`);
  }

  // 2 · contributions: number plus a 26-week sparkline
  {
    const x = xs[1];
    s += cardLabel(x + L, LY, `<rect x="${x + L + 1}" y="${LY - 7}" width="6" height="6" fill="${C.accent}" transform="rotate(45 ${x + L + 4} ${LY - 4})"/>`, 'CONTRIB', { x: x + cw - 22, t: '1Y' });
    s += big(x, nf(d.contrib));
    const wk = d.weeks.slice(-26).map(w => w.contributionDays.reduce((a, b) => a + b.contributionCount, 0));
    const max = Math.max(1, ...wk), x0 = x + L, x1 = x + cw - L, y0 = VY + 2, y1 = VY + 22;
    const px = k => x0 + (x1 - x0) * (k / (wk.length - 1)), py = v2 => y1 - (y1 - y0) * (v2 / max);
    let ln = '', ar = `M${x0} ${y1} `;
    wk.forEach((v2, k) => { ln += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(v2).toFixed(1) + ' '; ar += `L${px(k).toFixed(1)} ${py(v2).toFixed(1)} `; });
    ar += `L${x1} ${y1} Z`;
    s += `<path d="${ar}" fill="url(#afill)"/><path d="${ln}" fill="none" stroke="${C.accent}" stroke-width="1.4" stroke-linejoin="round"/>`;
    s += `<circle class="pulse" cx="${px(wk.length - 1).toFixed(1)}" cy="${py(wk[wk.length - 1]).toFixed(1)}" r="2.6" fill="${C.ember}"/>`;
    s += caption(x, `peak ${max} a week · 6 months`);
  }

  // 3 · repositories: one dot per repo, public bright, private dim
  {
    const x = xs[2];
    s += cardLabel(x + L, LY, `<rect x="${x + L}" y="${LY - 8}" width="8" height="8" rx="1.5" fill="none" stroke="${C.accent}" stroke-width="1.6"/>`, 'REPOS');
    s += big(x, nf(d.repos));
    const list = [...d.repoList].sort((a, b) => (a.private - b.private) || (b.stars - a.stars));
    const rows = 2, cols = Math.ceil(list.length / rows), step = (cw - L * 2) / cols, r = Math.min(2, step * 0.36);
    list.forEach((rp, i) => {
      const cx = x + L + step * (i % cols) + step / 2, cy = VY + 9 + Math.floor(i / cols) * 9;
      s += `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r.toFixed(2)}" fill="${rp.private ? '#5e0716' : C.ember}"/>`;
    });
    const pub = list.filter(rp => !rp.private).length;
    s += caption(x, `${pub} public · ${list.length - pub} private`);
  }

  // 4 · stars: every starred repo is a star, sized by its count, joined up
  {
    const x = xs[3];
    s += cardLabel(x + L, LY, `<path d="M${x + L + 4} ${LY - 9}l1.2 3.2 3.4.2-2.6 2.1.9 3.3-2.9-1.9-2.9 1.9.9-3.3-2.6-2.1 3.4-.2z" fill="${C.accent}"/>`, 'STARS');
    s += big(x, nf(d.starsTotal));
    const starred = d.repoList.filter(rp => rp.stars > 0).sort((a, b) => a.name.localeCompare(b.name));
    // A jittered grid instead of free placement: with ~40 starred repos, free
    // positions clumped into one pink blob in the corner.
    const bx = x + 74, bw = cw - 74 - 14, by = y + 30, bh = 60;
    const cols = Math.max(1, Math.ceil(Math.sqrt(starred.length * bw / bh))), rowsN = Math.max(1, Math.ceil(starred.length / cols));
    const pts = starred.map((rp, i) => ({
      x: bx + ((i % cols) + 0.15 + 0.7 * hash01(rp.name, 7)) * (bw / cols),
      y: by + (Math.floor(i / cols) + 0.15 + 0.7 * hash01(rp.name, 13)) * (bh / rowsN),
      n: rp.stars, h: hash01(rp.name, 29),
    }));
    // the brightest few form the constellation, the rest stay a faint field
    const lead = [...pts].sort((a, b) => (b.n - a.n) || (b.h - a.h)).slice(0, Math.min(6, pts.length)).sort((a, b) => a.x - b.x);
    pts.filter(p => !lead.includes(p)).forEach(p => {
      s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(0.75 + Math.sqrt(p.n) * 0.35).toFixed(2)}" fill="#ffd3da" opacity="0.42"/>`;
    });
    for (let i = 1; i < lead.length; i++) {
      s += `<line x1="${lead[i - 1].x.toFixed(1)}" y1="${lead[i - 1].y.toFixed(1)}" x2="${lead[i].x.toFixed(1)}" y2="${lead[i].y.toFixed(1)}" stroke="${C.accent}" stroke-opacity="0.5" stroke-width="0.9"/>`;
    }
    lead.forEach((p, i) => {
      const r = 1.5 + Math.sqrt(p.n) * 0.5;
      s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(r * 2.4).toFixed(1)}" fill="${C.accent}" opacity="0.4" filter="url(#starglow)"/>`;
      s += `<circle${i === 0 ? ' class="pulse"' : ''} cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff0f2"/>`;
    });
    s += caption(x, `across ${starred.length} repos`);
  }
  return { svg: s, h: ch };
}

// Terminal session: HUD frame round the name, readout strip, then commands.
function build(d) {
  let s = '';
  s += brackets(PX, 22, W - PX * 2, 156, 16);
  s += `<text class="mono" x="${PX + 12}" y="40" font-size="10" letter-spacing="2" fill="${C.muted}" ${HALO}>SIGNAL // 404</text>`;
  s += `<text class="mono" x="${W - PX - 12}" y="40" text-anchor="end" font-size="10" letter-spacing="2" fill="${C.muted}" ${HALO}>NODE ${LOGIN.toUpperCase()}</text>`;
  s += nameBlock(W / 2, 112, 92); s += tagline(W / 2, 152);
  const ro = readout(d, 196);
  s += ro.svg;
  let y = 196 + ro.h + 28;
  const prompt = (yy, cmd) => `<text class="mono" x="${PX}" y="${yy}" font-size="13"><tspan fill="${C.accent}" font-weight="bold">alex@404</tspan><tspan fill="${C.faint}">:</tspan><tspan fill="#ff8fa3">~</tspan><tspan fill="${C.faint}">$ </tspan><tspan fill="${C.text}">${cmd}</tspan></text>`;
  s += prompt(y, 'whoami'); s += whoami(PX, y + 26); y += 26 + WHOAMI.length * 21 + 14;
  s += prompt(y, 'ls ~/arsenal');
  const ar = arsenal(PX, y + 14, W - PX * 2); s += ar.svg; y += 14 + ar.h + 16;
  s += prompt(y, 'git log --since=1.year | graph');
  const a = activity(d, PX, W - PX, y + 22, y + 118, true);
  s += `<text class="mono" x="${W - PX}" y="${y}" text-anchor="end" font-size="11" fill="${C.muted}">peak ${a.max}/wk · record streak ${d.longest}d</text>` + a.svg;
  y += 150;
  s += signoff(W / 2, y);
  return frame(y + 24, s, 'AlexFirst404 terminal profile');
}


// ---------------------------------------------------------------- data
const QUERY = `query($login:String!){ user(login:$login){ contributionsCollection{ totalCommitContributions restrictedContributionsCount totalPullRequestContributions contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } } repositories(first:100, ownerAffiliations:OWNER, isFork:false){ totalCount nodes{ name stargazerCount isPrivate } } } }`;

async function fetchData() {
  const token = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) { console.error('No STATS_TOKEN or GITHUB_TOKEN in env'); process.exit(1); }
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: 'bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': 'alexfirst404-profile' },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (!json.data || !json.data.user) { console.error('Bad GraphQL response:', JSON.stringify(json).slice(0, 400)); process.exit(1); }
  const u = json.data.user, cc = u.contributionsCollection, weeks = cc.contributionCalendar.weeks;
  const days = weeks.flatMap(w => w.contributionDays);
  let streak = 0, i = days.length - 1;
  if (days[i].contributionCount === 0) i--;
  while (i >= 0 && days[i].contributionCount > 0) { streak++; i--; }
  let longest = 0, run = 0;
  for (const dd of days) { if (dd.contributionCount > 0) { run++; if (run > longest) longest = run; } else run = 0; }
  const stars = {}; u.repositories.nodes.forEach(r => { stars[r.name] = r.stargazerCount; });
  return {
    weeks, days, streak, longest, stars,
    todayCount: days[days.length - 1].contributionCount,
    repoList: u.repositories.nodes.map(r => ({ name: r.name, stars: r.stargazerCount, private: r.isPrivate })),
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    prs: cc.totalPullRequestContributions,
    contrib: cc.contributionCalendar.totalContributions,
    repos: u.repositories.totalCount,
    starsTotal: u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
  };
}

(async () => {
  const arg = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
  const d = await fetchData();
  // The glass cards place the blurred wallpaper with the card's final height, which
  // is only known once the layout is built — so build, measure, and build again.
  d.H = 900;
  let svg = build(d);
  const H = Number(svg.match(/viewBox="0 0 \d+ (\d+)"/)[1]);
  if (H !== d.H) { d.H = H; svg = build(d); }
  const preview = arg('preview');
  if (preview) {
    fs.mkdirSync(preview, { recursive: true });
    fs.writeFileSync(path.join(preview, 'profile.svg'), svg);
    console.log(`profile.svg  ${(svg.length / 1024).toFixed(0)} KB  ${svg.match(/viewBox="0 0 (\d+ \d+)"/)[1]}`);
    return;
  }
  // assets/ can be absent: git drops a folder once every file in it is removed
  fs.mkdirSync('assets', { recursive: true });
  fs.writeFileSync('assets/profile.svg', svg);
  // GitHub's camo cache keeps old images; bump ?v=<hash> whenever the svg changes.
  const v = crypto.createHash('md5').update(svg).digest('hex').slice(0, 8);
  const rd = fs.readFileSync('README.md', 'utf8');
  const rd2 = rd.replace(/assets\/profile\.svg(\?v=[a-z0-9]+)?/g, `assets/profile.svg?v=${v}`);
  if (rd2 !== rd) fs.writeFileSync('README.md', rd2);
  console.log(`profile.svg: commits ${d.commits}, prs ${d.prs}, stars ${d.starsTotal}, repos ${d.repos}, streak ${d.streak}/${d.longest}, contrib ${d.contrib}, v=${v}`);
})();
