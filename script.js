const szinBetuk = {
  'piros': ['a', 'j', 's', 'á', '1'],
  'narancssárga': ['b', 'k', 't', '2'],
  'sárga': ['c', 'l', 'u', 'ú', 'ü', 'ű', '3'],
  'zöld': ['d', 'm', 'v', '4'],
  'kék': ['e', 'n', 'w', 'é', '5'],
  'indigo': ['f', 'o', 'x', 'ó', 'ö', 'ő', '6'],
  'lila': ['g', 'p', 'y', '7'],
  'rózsapiros': ['h', 'q', 'z', '8'],
  'arany': ['i', 'r', 'í', '9']
};

const szinHex = {
  'piros': '#ff4d4d', 'narancssárga': '#ff9f43', 'sárga': '#ffd93d',
  'zöld': '#4cd137', 'kék': '#3c91ff', 'indigo': '#7b5cf0',
  'lila': '#b66fd6', 'rózsapiros': '#ff6bcb', 'arany': '#fbc531'
};

const szinSorrend = Object.keys(szinBetuk);
const betuSzin = {};
for (const [szin, betuk] of Object.entries(szinBetuk)) for (const b of betuk) betuSzin[b] = szin;

const $ = id => document.getElementById(id);
const form = $('form'), input = $('nameInput'), results = $('results'), hint = $('hint');
const nameEl = $('name'), summary = $('summary'), strip = $('strip'), rowsEl = $('rows');
const warning = $('warning'), wash = $('wash'), shareBtn = $('shareBtn'), themeBtn = $('themeBtn');

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ---------- Theme ---------- */
const root = document.documentElement;
function applyTheme(t) {
  root.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]').content = t === 'light' ? '#f3eef8' : '#0f0f0f';
}
applyTheme(root.dataset.theme || 'dark');
themeBtn.addEventListener('click', () => {
  const t = root.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(t);
  try { localStorage.setItem('theme', t); } catch (e) {}
});

/* ---------- Static UI (built once so changes animate) ---------- */
const blobPos = [[15,12],[85,8],[50,30],[10,55],[90,50],[40,75],[80,88],[18,92],[60,60]];
const blobs = {}, segs = {}, rows = {};

szinSorrend.forEach((szin, i) => {
  const c = szinHex[szin];

  const b = el('i');
  const [x, y] = blobPos[i];
  b.style.cssText = `--c:${c};--x:${x}%;--y:${y}%;--d:${22 + i * 3}s;--dx:${(i % 2 ? -1 : 1) * (6 + i)}vw;--dy:${(i % 3 - 1) * 7}vh`;
  wash.appendChild(b); blobs[szin] = b;

  const s = el('i'); s.style.setProperty('--c', c);
  strip.appendChild(s); segs[szin] = s;

  const row = el('li', 'row zero'); row.style.setProperty('--c', c);
  const label = el('span', 'label');
  label.append(el('span', 'dot'), el('span', '', szin));
  const letters = el('span', 'letters');
  const letterEls = {};
  for (const b of szinBetuk[szin]) { letterEls[b] = el('span', '', b); letters.appendChild(letterEls[b]); }
  const info = el('div', 'info'); info.append(label, letters);
  const count = el('span', 'count', '0');
  row.append(info, count);
  rowsEl.appendChild(row); rows[szin] = { row, count, letterEls };
});

function paintWash(shares) {
  for (const szin of szinSorrend) {
    const s = shares ? shares[szin] : null;
    blobs[szin].style.setProperty('--o', s === null ? .12 : s ? Math.min(.2 + s * 1.2, .85) : .03);
  }
}

/* ---------- Analysis ---------- */
let last = null;

form.addEventListener('submit', e => { e.preventDefault(); input.blur(); });
input.addEventListener('input', analyze);

function analyze() {
  const raw = input.value.trim();
  if (!raw) { last = null; results.hidden = true; hint.hidden = false; paintWash(null); return; }

  const counts = Object.fromEntries(szinSorrend.map(s => [s, 0]));
  const unknown = new Set(), present = new Set();
  nameEl.replaceChildren();
  nameEl.setAttribute('aria-label', raw);

  for (const ch of raw) {
    const lc = ch.toLowerCase();
    const szin = betuSzin[lc];
    const span = el('span', szin ? '' : 'none', ch);
    if (szin) { counts[szin]++; present.add(lc); span.style.setProperty('--c', szinHex[szin]); }
    else if (ch !== ' ') unknown.add(ch);
    nameEl.appendChild(span);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(counts));
  const shares = {};

  for (const szin of szinSorrend) {
    const n = counts[szin];
    shares[szin] = total ? n / total : 0;
    segs[szin].style.setProperty('--n', n);
    const r = rows[szin];
    r.count.textContent = n;
    r.row.classList.toggle('zero', !n);
    r.row.style.setProperty('--w', (max ? n / max * 100 : 0) + '%');
    for (const [b, s] of Object.entries(r.letterEls)) s.classList.toggle('hit', present.has(b));
  }

  summary.replaceChildren();
  if (total) {
    const top = szinSorrend.filter(s => counts[s] === max);
    summary.append(`${total} betű · leggyakoribb: `, el('b', '', top.join(', ')));
  } else {
    summary.textContent = 'Ebben a névben nincs színes betű.';
  }

  warning.hidden = !unknown.size;
  if (unknown.size) warning.textContent = 'Ismeretlen karakterek: ' + [...unknown].join(', ');

  last = { raw, counts, total, max, shares };
  hint.hidden = true;
  results.hidden = false;
  paintWash(total ? shares : null);
}

/* ---------- Share as image ---------- */
const bgImg = new Image();
bgImg.src = 'hatter.png';

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

async function renderImage(d) {
  const W = 1080, H = 1350, serif = '"Iowan Old Style", Palatino, Georgia, serif', sans = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  try { await bgImg.decode(); } catch (e) {}
  ctx.fillStyle = '#150f20'; ctx.fillRect(0, 0, W, H);
  if (bgImg.naturalWidth) {
    const k = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const w = bgImg.naturalWidth * k, h = bgImg.naturalHeight * k;
    ctx.drawImage(bgImg, (W - w) / 2, (H - h) / 2, w, h);
  }
  ctx.fillStyle = 'rgba(14,11,24,.45)'; ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = 'screen';
  szinSorrend.forEach((szin, i) => {
    const s = d.shares[szin]; if (!s) return;
    const x = blobPos[i][0] / 100 * W, y = blobPos[i][1] / 100 * H, r = W * .75;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, szinHex[szin]); g.addColorStop(.62, 'rgba(0,0,0,0)');
    ctx.globalAlpha = Math.min(.2 + s * 1.2, .85) * .9;
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

  // Name: fit into a 920 x 380 box, wrapping by words
  const words = d.raw.split(/\s+/), maxW = 920, boxH = 380;
  let size = 150, lines;
  for (; size >= 40; size -= 6) {
    ctx.font = `600 ${size}px ${serif}`;
    lines = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW || !cur) { cur = t; } else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
    if (lines.length * size * 1.15 <= boxH && lines.every(l => ctx.measureText(l).width <= maxW)) break;
  }
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const lh = size * 1.15, top = 90 + (boxH - lines.length * lh) / 2;
  lines.forEach((line, li) => {
    let x = (W - ctx.measureText(line).width) / 2;
    for (const ch of line) {
      const szin = betuSzin[ch.toLowerCase()];
      ctx.fillStyle = szin ? szinHex[szin] : 'rgba(246,243,251,.6)';
      ctx.fillText(ch, x, top + li * lh + size * .85);
      x += ctx.measureText(ch).width;
    }
  });

  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(246,243,251,.7)'; ctx.font = `400 32px ${sans}`;
  const topNames = szinSorrend.filter(s => d.counts[s] === d.max).join(', ');
  ctx.fillText(d.total ? `${d.total} betű · leggyakoribb: ${topNames}` : 'Nincs színes betű', W / 2, 520);

  // strip
  let sx = 80; const sw = W - 160;
  for (const szin of szinSorrend) {
    const n = d.counts[szin]; if (!n) continue;
    const w = n / d.total * sw;
    ctx.fillStyle = szinHex[szin]; rrect(ctx, sx, 556, Math.max(w - 4, 4), 16, 8); ctx.fill(); sx += w;
  }

  // rows
  szinSorrend.forEach((szin, i) => {
    const y = 640 + i * 62, n = d.counts[szin];
    ctx.globalAlpha = n ? 1 : .45;
    ctx.fillStyle = szinHex[szin]; ctx.beginPath(); ctx.arc(110, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = '#f6f3fb'; ctx.font = `500 32px ${sans}`;
    ctx.fillText(szin, 140, y + 11);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(ctx, 520, y - 7, 380, 14, 7); ctx.fill();
    if (n) { ctx.fillStyle = szinHex[szin]; rrect(ctx, 520, y - 7, Math.max(380 * n / d.max, 14), 14, 7); ctx.fill(); }
    ctx.textAlign = 'right'; ctx.fillStyle = '#f6f3fb'; ctx.font = `700 32px ${sans}`;
    ctx.fillText(String(n), 970, y + 11);
    ctx.globalAlpha = 1;
  });

  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(246,243,251,.55)'; ctx.font = `600 28px ${serif}`;
  ctx.fillText('Szín Elemző', W / 2, 1290);
  return c;
}

shareBtn.addEventListener('click', async () => {
  if (!last) return;
  const original = shareBtn.textContent;
  const canvas = await renderImage(last);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'szin-elemzo.png';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  shareBtn.textContent = 'Kép mentve';
  setTimeout(() => { shareBtn.textContent = original; }, 1800);
});
