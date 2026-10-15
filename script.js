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

// === IDO 卡片 (严谨版) ===
function idoCardHTML(item) {
  const ai = item.ai_analysis || {};
  const trust = item.trust || {};
  const social = item.social_metrics || {};
  const links = item.official_links || {};
  const part = item.participation || {};
  const risk = item.risk || {};

  const initial = (item.name || '?')[0].toUpperCase();

  // 推文内容
  const tweetText = encodeURIComponent(
    `${item.name} ($${item.symbol}) — ${item.status_label}\n\n` +
    `${ai.summary || item.name + ' 打新项目'}\n\n` +
    `参与: ${part.method_label || '—'}\n` +
    `AI 评分: ${ai.score || '—'}/100 (${ai.verdict || '—'})\n\n` +
    `via @${X_HANDLE} · ${SITE_URL}`
  );
  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;

  // 关注度 (24h 变化)
  const ch24 = social.twitter_24h_change;
  const chClass = ch24 >= 0 ? 'up' : 'down';
  const chStr = ch24 !== undefined && ch24 !== null ?
    `<span class="${chClass}">${ch24 >= 0 ? '+' : ''}${ch24 >= 1000 ? (ch24/1000).toFixed(1)+'K' : ch24}</span>` : '';

  // 信任图标
  const kyc = trust.team_kyc ? '<span class="ido-trust-icon">✅</span>KYC' : '<span class="ido-trust-icon">❌</span>无 KYC';
  const aud = trust.audited ? `<span class="ido-trust-icon">✅</span>已审计` : '<span class="ido-trust-icon">⚠</span>未审计';

  // 风险标签
  const riskTags = (risk.tags || []).map(t => `<span class="ido-risk-tag">${t}</span>`).join('');

  return `
    <article class="ido-card">
      <div class="ido-header">
        <div class="ido-logo">${item.logo ? `<img src="${item.logo}" alt="${item.name}" onerror="this.outerHTML='<span>${initial}</span>'">` : initial}</div>
        <div class="ido-titles">
          <div class="ido-name">
            <span>${item.name}</span>
            <span class="ido-symbol">$${item.symbol}</span>
            <span class="ido-chain-tag">${(item.chain || 'multi').toLowerCase()}</span>
          </div>
          <div class="ido-stage">${item.stage_label} · ${item.status_label}</div>
        </div>
        <div class="ido-verdict ${ai.verdict_color || 'yellow'}">${ai.verdict || '待分析'}</div>
      </div>

      <div class="ido-body">
        <!-- 时间和参与 -->
        <div>
          <div class="ido-row">
            <div class="ido-row-label">📅 时间</div>
            <div class="ido-row-value">
              ${item.ido_date ? `IDO: ${item.ido_date}<br>` : ''}
              ${item.launch_date ? `主网: ${item.launch_date}` : ''}
              ${item.days_since_launch ? ` · 已上线 ${item.days_since_launch} 天` : ''}
            </div>
          </div>
          <div class="ido-row">
            <div class="ido-row-label">💰 参与</div>
            <div class="ido-row-value">
              ${part.method_label || '—'}<br>
              <span style="color:var(--text-dim);font-size:12px;">
                ${part.platform ? '平台: ' + part.platform + ' · ' : ''}
                ${part.cost_label || ''} · ${part.vesting_label || ''}
              </span>
            </div>
          </div>
        </div>

        <!-- 项目方链接 -->
        <div>
          <div class="ido-section-title">🔗 官方渠道</div>
          <div class="ido-social">
            ${links.website ? `<a href="${links.website}" target="_blank" rel="noopener">🌐 官网</a>` : ''}
            ${links.twitter ? `<a href="${links.twitter}" target="_blank" rel="noopener">𝕏 ${links.twitter_handle || '推特'}</a>` : ''}
            ${links.discord ? `<a href="${links.discord}" target="_blank" rel="noopener">💬 Discord</a>` : ''}
            ${links.telegram ? `<a href="${links.telegram}" target="_blank" rel="noopener">✈️ Telegram</a>` : ''}
            ${links.whitepaper ? `<a href="${links.whitepaper}" target="_blank" rel="noopener">📄 白皮书</a>` : ''}
            ${links.github ? `<a href="${links.github}" target="_blank" rel="noopener">💻 GitHub</a>` : ''}
          </div>
        </div>

        <!-- 关注度 -->
        <div>
          <div class="ido-section-title">📊 关注度</div>
          <div class="ido-trust">
            <div class="ido-followers">𝕏 ${social.twitter_followers ? (social.twitter_followers >= 1000 ? (social.twitter_followers/1000).toFixed(0)+'K' : social.twitter_followers) : '—'} 粉丝 ${chStr}</div>
            <div class="ido-followers">💬 ${social.discord_members ? (social.discord_members >= 1000 ? (social.discord_members/1000).toFixed(0)+'K' : social.discord_members) : '—'} 成员</div>
            <div class="ido-followers">✈️ ${social.telegram_members ? (social.telegram_members >= 1000 ? (social.telegram_members/1000).toFixed(0)+'K' : social.telegram_members) : '—'} 成员</div>
          </div>
        </div>

        <!-- 信任 -->
        <div>
          <div class="ido-section-title">🛡️ 信任</div>
          <div class="ido-trust">
            <div class="ido-trust-item">${kyc}</div>
            <div class="ido-trust-item">${aud}</div>
            ${trust.auditor ? `<div class="ido-trust-item" style="grid-column: span 2;">🔍 ${trust.auditor}</div>` : ''}
            ${trust.investors && trust.investors.length ? `<div class="ido-trust-item" style="grid-column: span 2;">💰 ${trust.investors.slice(0, 4).join(' · ')}</div>` : ''}
            ${trust.raise_amount ? `<div class="ido-trust-item">融资: ${trust.raise_amount}</div>` : ''}
            ${trust.valuation ? `<div class="ido-trust-item">估值: ${trust.valuation}</div>` : ''}
          </div>
        </div>

        <!-- AI 分析 -->
        <div>
          <div class="ido-section-title">
            🤖 AI 分析 (评分: <strong style="color:var(--gold);">${ai.score || '—'}/100</strong>)
            <div class="ido-score-bar"><div class="ido-score-bar-fill" style="width:${ai.score || 0}%;"></div></div>
          </div>
          <div class="ido-summary">${ai.summary || '暂无分析'}</div>
          <div style="margin-top: 8px; font-size: 12px; color: var(--text-dim);">
            <strong style="color:var(--green);">适合:</strong> ${ai.suitable_for || '—'}<br>
            <strong style="color:var(--gold);">建议:</strong> ${ai.action || '—'}
          </div>
        </div>

        <!-- 优缺点 -->
        ${(ai.pros && ai.pros.length) || (ai.cons && ai.cons.length) ? `
        <div class="ido-pros-cons">
          <div class="ido-pros">
            <div class="ido-section-title">✓ 优点</div>
            <ul>${(ai.pros || []).map(p => `<li>${p}</li>`).join('')}</ul>
          </div>
          <div class="ido-cons">
            <div class="ido-section-title">✗ 风险</div>
            <ul>${(ai.cons || []).map(c => `<li>${c}</li>`).join('')}</ul>
          </div>
        </div>
        ` : ''}

        <!-- 风险标签 -->
        <div>
          <div class="ido-risk-tags">${riskTags}</div>
        </div>
      </div>

      <div class="ido-actions">
        <a class="ido-action primary" href="${tweetUrl}" target="_blank" rel="noopener">𝕏 一键发推</a>
        ${links.twitter ? `<a class="ido-action secondary" href="${links.twitter}" target="_blank" rel="noopener">关注 𝕏</a>` : ''}
        ${links.website ? `<a class="ido-action secondary" href="${links.website}" target="_blank" rel="noopener">官网</a>` : ''}
        ${links.whitepaper ? `<a class="ido-action secondary" href="${links.whitepaper}" target="_blank" rel="noopener">白皮书</a>` : ''}
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
  } else if (sectionId === 'ido-list') {
    // IDO 用严谨版卡片
    container.innerHTML = items.map(it => idoCardHTML(it)).join('');
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
