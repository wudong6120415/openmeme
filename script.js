/* OpenMeme — v2 渲染 + 交互 */

const SITE_URL = 'https://openmeme.art';
const X_HANDLE = 'ruoxi01';

// === 工具函数 ===
function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(2);
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function fmtAge(h) {
  if (!h && h !== 0) return '';
  if (h < 1) return Math.floor(h * 60) + 'm';
  if (h < 24) return h.toFixed(0) + 'h';
  return (h / 24).toFixed(1) + 'd';
}

function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return Math.floor(diff) + 's 前';
  if (diff < 3600) return Math.floor(diff / 60) + 'm 前';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h 前';
  return Math.floor(diff / 86400) + 'd 前';
}

// === 渲染卡片 ===
function cardHTML(item, rank) {
  const tweetText = encodeURIComponent(
    `${item.emoji || '🔥'} ${item.name} ($${item.symbol})\n\n` +
    `${item.desc || 'A new project just popped up on the radar.'}\n\n` +
    `Chain: ${item.chain || '—'} | MC: $${fmtNum(item.mc)} | Vol 24h: $${fmtNum(item.vol24h)}\n\n` +
    `⚠ Not financial advice. DYOR.\n\n` +
    `via @${X_HANDLE} · ${SITE_URL}`
  );
  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;

  const ageStr = item.age_h !== undefined ? ` · ${fmtAge(item.age_h)}` : '';
  return `
    <article class="card">
      <div class="card-rank">${rank}</div>
      <h3 class="card-title">
        <span>${item.emoji || '🔥'} ${item.name}</span>
      </h3>
      <div style="display:flex; gap:6px; margin-bottom: 8px; align-items:center;">
        <span class="card-symbol">$${item.symbol}</span>
        <span class="card-chain">${(item.chain || 'multi').toLowerCase()}</span>
        ${ageStr ? `<span class="card-symbol" style="font-size:11px;">${ageStr}</span>` : ''}
      </div>
      <p class="card-desc">${item.desc || ''}</p>
      <div class="card-stats">
        <div class="stat"><span class="stat-label">市值 MC</span><span class="stat-value">$${fmtNum(item.mc)}</span></div>
        <div class="stat"><span class="stat-label">24h 量</span><span class="stat-value">$${fmtNum(item.vol24h)}</span></div>
        ${item.liquidity ? `<div class="stat"><span class="stat-label">流动性</span><span class="stat-value">$${fmtNum(item.liquidity)}</span></div>` : ''}
        ${item.change24h !== null && item.change24h !== undefined ? `<div class="stat"><span class="stat-label">24h 涨跌</span><span class="stat-value ${item.change24h >= 0 ? 'up' : 'down'}">${fmtPct(item.change24h)}</span></div>` : ''}
      </div>
      <div class="card-risk">⚠ ${item.risk || '高风险 · DYOR'}</div>
      <div class="card-actions">
        <a class="btn btn-primary" href="${tweetUrl}" target="_blank" rel="noopener">𝕏 一键发推</a>
        <a class="btn btn-secondary" href="${item.dexUrl || '#'}" target="_blank" rel="noopener">查看 ↗</a>
      </div>
    </article>
  `;
}

// === Loading skeleton ===
function skeletonHTML(count) {
  let h = '';
  for (let i = 0; i < count; i++) {
    h += '<div class="skeleton"></div>';
  }
  return h;
}

// === Loading dots ===
function loadingHTML(msg = '加载中') {
  return `<div class="loading">
    <div class="loading-dots">${msg}<span>.</span><span>.</span><span>.</span></div>
  </div>`;
}

// === Empty state ===
function emptyHTML(msg = '暂无数据', icon = '📭') {
  return `<div class="empty">
    <div class="empty-icon">${icon}</div>
    <div>${msg}</div>
  </div>`;
}

// === Error state ===
function errorHTML(msg) {
  return `<div class="error">⚠ ${msg}</div>`;
}

// === 加载并渲染 ===
async function loadAndRender(sectionId, file, updatedId) {
  const container = document.getElementById(sectionId);
  const updatedEl = document.getElementById(updatedId);
  if (!container) return;

  // 显示 skeleton
  container.innerHTML = skeletonHTML(6);

  let items = [];
  let updated = null;
  try {
    const res = await fetch(file + '?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      items = data.items || [];
      updated = data.updated_at;
    } else {
      container.innerHTML = errorHTML(`加载 ${file} 失败 (HTTP ${res.status})`);
      return;
    }
  } catch (e) {
    container.innerHTML = errorHTML(`网络错误: ${e.message}`);
    return;
  }

  if (items.length === 0) {
    container.innerHTML = emptyHTML('暂无数据, 等待下次抓取', '⏳');
  } else {
    container.innerHTML = items.map((it, i) => cardHTML(it, i + 1)).join('');
  }

  if (updatedEl && updated) {
    updatedEl.textContent = `更新: ${timeAgo(updated)}`;
  }
}

// === 启动 ===
document.addEventListener('DOMContentLoaded', () => {
  // 加载 3 个板块
  loadAndRender('meme-list', 'data/meme.json', 'meme-updated');
  loadAndRender('ido-list', 'data/ido.json', 'ido-updated');
  loadAndRender('trending-list', 'data/trending.json', 'trending-updated');

  // 更新统计条
  loadStats();

  // Header 滚动效果
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Back to top
  const backBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backBtn.classList.add('visible');
    } else {
      backBtn.classList.remove('visible');
    }
  });
  backBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// === 统计条 ===
async function loadStats() {
  for (const [key, file, el] of [
    ['meme', 'data/meme.json', 'stat-meme'],
    ['ido', 'data/ido.json', 'stat-ido'],
    ['trending', 'data/trending.json', 'stat-trending'],
  ]) {
    try {
      const res = await fetch(file + '?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const elDom = document.getElementById(el);
        if (elDom) elDom.textContent = (data.items || []).length;
      }
    } catch (e) { /* ignore */ }
  }

  // 最新更新时间 (用 meme 的)
  try {
    const res = await fetch('data/meme.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const t = data.updated_at ? timeAgo(data.updated_at) : '—';
      const elDom = document.getElementById('stat-updated');
      if (elDom) elDom.textContent = t;
    }
  } catch (e) { /* ignore */ }
}
