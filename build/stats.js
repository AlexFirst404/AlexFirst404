// Rebuilds assets/bottom.svg (stats + activity + contacts) from live GitHub data.
// Token: STATS_TOKEN (a PAT for private-inclusive numbers) or GITHUB_TOKEN (public only).
const fs = require('fs');
const LOGIN = 'AlexFirst404';
const A = 'assets/';
const W = 860, PADX = 24, FF = "ui-monospace,'Cascadia Code','JetBrains Mono',Consolas,monospace";

function bg(H) {
  return {
    defs: `
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0409"/><stop offset="0.55" stop-color="#120407"/><stop offset="1" stop-color="#0c0205"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#e0143c" stop-opacity="0.14"/><stop offset="100%" stop-color="#e0143c" stop-opacity="0"/></radialGradient>
<pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H26 M0 0 V26" stroke="#e0143c" stroke-width="0.7" fill="none" opacity="0.06"/></pattern>
<clipPath id="clip"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>`,
    body: `
<g clip-path="url(#clip)">
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#grid)"/>
<ellipse cx="${W / 2}" cy="0" rx="520" ry="220" fill="url(#glow)"/>
<rect class="gb g1" width="${W}" height="5" fill="#e0143c"/>
<rect class="gb g2" width="${W}" height="3" fill="#00e6d6"/>
<rect class="gb g3" width="${W}" height="7" fill="#8b0a20"/>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#3a1a20"/>`
  };
}
const CSS = `
.mono{font-family:${FF}}
.cur{animation:cur 1.05s steps(1) infinite}
.gb{opacity:0}.g1{animation:g1 8.5s infinite steps(1)}.g2{animation:g2 11s infinite steps(1)}.g3{animation:g3 13s infinite steps(1)}
@keyframes cur{50%{opacity:0}}
@keyframes g1{0%,92%,100%{opacity:0;transform:translateY(30px)}93%{opacity:.45;transform:translateY(120px)}94%{opacity:0}}
@keyframes g2{0%,88%,100%{opacity:0;transform:translateY(200px)}89%{opacity:.4;transform:translateY(80px)}90%{opacity:0}}
@keyframes g3{0%,95%,100%{opacity:0;transform:translateY(260px)}96%{opacity:.35;transform:translateY(300px)}97%{opacity:0}}
@media (prefers-reduced-motion:reduce){.cur,.g1,.g2,.g3{animation:none}.gb{opacity:0}}`;

function sep(label, y) {
  const cy = y - 4, xL = 16, xR = W - 16, cx = W / 2;
  const L = label.toUpperCase(), half = L.length * 4.9 + 6;
  const le = cx - half - 12, rs = cx + half + 12;
  let s = '';
  s += `<path d="M${xL} ${cy} L${xL + 13} ${cy - 4.5} L${xL + 13} ${cy + 4.5} Z" fill="#e0143c"/>`;
  s += `<path d="M${xR} ${cy} L${xR - 13} ${cy - 4.5} L${xR - 13} ${cy + 4.5} Z" fill="#e0143c"/>`;
  s += `<line x1="${xL + 15}" y1="${cy}" x2="${le.toFixed(1)}" y2="${cy}" stroke="#8b0a20" stroke-width="1.4"/>`;
  s += `<line x1="${rs.toFixed(1)}" y1="${cy}" x2="${xR - 15}" y2="${cy}" stroke="#8b0a20" stroke-width="1.4"/>`;
  s += `<rect x="${(le - 3).toFixed(1)}" y="${cy - 3}" width="6" height="6" fill="#e0143c" transform="rotate(45 ${le.toFixed(1)} ${cy})"/>`;
  s += `<rect x="${(rs - 3).toFixed(1)}" y="${cy - 3}" width="6" height="6" fill="#e0143c" transform="rotate(45 ${rs.toFixed(1)} ${cy})"/>`;
  s += `<text class="mono" x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" letter-spacing="2.5" fill="#e0143c">${L}</text>`;
  return s;
}

function buildBottom(d) {
  const cc = d.contributionsCollection, weeks = cc.contributionCalendar.weeks, days = weeks.flatMap(w => w.contributionDays);
  const commits = cc.totalCommitContributions + cc.restrictedContributionsCount;
  const prs = cc.totalPullRequestContributions, stars = d.repositories.nodes.reduce((a, b) => a + b.stargazerCount, 0), repos = d.repositories.totalCount, contrib = cc.contributionCalendar.totalContributions;
  let cur = 0, i = days.length - 1; if (days[i].contributionCount === 0) i--; while (i >= 0 && days[i].contributionCount > 0) { cur++; i--; }
  let lon = 0, run = 0; for (const dd of days) { if (dd.contributionCount > 0) { run++; if (run > lon) lon = run; } else run = 0; }
  const nf = n => n.toLocaleString('en-US');
  const row = (x, w, y, l, v) => `<text class="mono" x="${x}" y="${y}" font-size="13" fill="#a98a8e">${l}</text><text class="mono" x="${x + w}" y="${y}" text-anchor="end" font-size="13" fill="#f2dede" font-weight="bold">${v}</text><line x1="${x}" y1="${y + 8}" x2="${x + w}" y2="${y + 8}" stroke="#2a1015" stroke-dasharray="1 3"/>`;
  let c = '', y = 30;
  c += sep('stats', y); y += 22;
  const midX = 470;
  c += `<line x1="${midX}" y1="${y - 4}" x2="${midX}" y2="${y + 116}" stroke="#2a1015"/>`;
  c += `<text class="mono" x="${PADX}" y="${y + 10}" font-size="13" fill="#e6cfd0"><tspan fill="#e0143c">◆ </tspan>combat_log · AlexFirst404</text>`;
  c += row(PADX, midX - PADX - 20, y + 40, 'commits', nf(commits));
  c += row(PADX, midX - PADX - 20, y + 66, 'pull requests', nf(prs));
  c += row(PADX, midX - PADX - 20, y + 92, 'stars earned', nf(stars));
  c += row(PADX, midX - PADX - 20, y + 118, 'repositories', nf(repos));
  const rx = midX + 30, rw = W - PADX - rx;
  c += `<text class="mono" x="${rx}" y="${y + 10}" font-size="13" fill="#e6cfd0"><tspan fill="#e0143c">◆ </tspan>contribution streak</text>`;
  c += `<text class="mono" x="${rx + rw / 2}" y="${y + 62}" text-anchor="middle" font-size="46" font-weight="bold" fill="#ff5a3c">${cur}</text>`;
  c += `<text class="mono" x="${rx + rw / 2}" y="${y + 82}" text-anchor="middle" font-size="10" fill="#a98a8e" letter-spacing="2">CURRENT · DAYS</text>`;
  c += row(rx, rw, y + 110, 'longest streak', lon + 'd');
  c += row(rx, rw, y + 132, 'contributions (1y)', nf(contrib));
  y += 156;
  c += sep('activity', y); y += 18;
  const series = weeks.map(w => w.contributionDays.reduce((a, b) => a + b.contributionCount, 0));
  const x0 = PADX, x1 = W - PADX, yTop = y + 8, yBot = y + 108, max = Math.max(1, ...series);
  const px = k => x0 + (x1 - x0) * (k / (series.length - 1)), py = v => yBot - (yBot - yTop) * (v / max);
  let ln = '', ar = `M${x0} ${yBot} `;
  series.forEach((v, k) => { ln += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(v).toFixed(1) + ' '; ar += `L${px(k).toFixed(1)} ${py(v).toFixed(1)} `; });
  ar += `L${x1} ${yBot} Z`;
  c += `<defs><linearGradient id="afill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0143c" stop-opacity="0.32"/><stop offset="1" stop-color="#e0143c" stop-opacity="0.02"/></linearGradient></defs>`;
  c += `<line x1="${x0}" y1="${yBot}" x2="${x1}" y2="${yBot}" stroke="#3a1a20"/>`;
  c += `<path d="${ar}" fill="url(#afill)"/><path d="${ln}" fill="none" stroke="#e0143c" stroke-width="1.8" stroke-linejoin="round"/>`;
  c += `<circle cx="${px(series.length - 1).toFixed(1)}" cy="${py(series[series.length - 1]).toFixed(1)}" r="3.5" fill="#ff5a3c"/>`;
  c += `<text class="mono" x="${x1}" y="${y}" text-anchor="end" font-size="11" fill="#a98a8e">peak ${max}/wk</text>`;
  y = yBot + 26;
  c += sep('contacts', y); y += 16;
  const chips = [{ t: '◈ undernetvpn.com', bg: '#180a0d', bd: '#3a1a20', fg: '#ff5a3c' }, { t: '◈ Telegram · @AlexFirst404', bg: '#e0143c', bd: '#e0143c', fg: '#0a0506' }, { t: '◈ Discord · alexfirst', bg: '#180a0d', bd: '#3a1a20', fg: '#e0143c' }];
  const FS = 12.5, CW = 7.6, PAD = 13, HCH = 30, GAP = 10;
  const ws = chips.map(ch => ch.t.length * CW + PAD * 2), total = ws.reduce((a, b) => a + b, 0) + GAP * (chips.length - 1);
  let cxp = (W - total) / 2;
  chips.forEach((ch, k) => { c += `<rect x="${cxp.toFixed(1)}" y="${y}" width="${ws[k].toFixed(1)}" height="${HCH}" rx="7" fill="${ch.bg}" stroke="${ch.bd}"/><text class="mono" x="${(cxp + ws[k] / 2).toFixed(1)}" y="${y + HCH / 2 + FS * 0.34}" text-anchor="middle" font-size="${FS}" font-weight="bold" fill="${ch.fg}">${ch.t}</text>`; cxp += ws[k] + GAP; });
  y += HCH + 22;
  c += `<text class="mono" x="${W / 2}" y="${y}" text-anchor="middle" font-size="12" fill="#7a4a4f">// signal lost — connection terminated <tspan class="cur" fill="#e0143c">▮</tspan></text>`;
  const H = Math.ceil(y + 16);
  const b = bg(H);
  fs.writeFileSync(A + 'bottom.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="stats, activity and contacts"><defs><style>${CSS}</style>${b.defs}</defs>${b.body}${c}</svg>`);
  console.log(`bottom.svg: commits ${commits}, prs ${prs}, stars ${stars}, repos ${repos}, streak ${cur}/${lon}, contrib ${contrib}`);
}

const QUERY = `query($login:String!){ user(login:$login){ contributionsCollection{ totalCommitContributions restrictedContributionsCount totalPullRequestContributions contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } } repositories(first:100, ownerAffiliations:OWNER, isFork:false){ totalCount nodes{ stargazerCount } } } }`;

(async () => {
  const token = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) { console.error('No STATS_TOKEN or GITHUB_TOKEN in env'); process.exit(1); }
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: 'bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': 'alexfirst404-stats' },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (!json.data || !json.data.user) { console.error('Bad GraphQL response:', JSON.stringify(json).slice(0, 400)); process.exit(1); }
  buildBottom(json.data.user);
})();
