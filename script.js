/* OpenMeme — v3 主渲染 */
const SITE_URL = 'https://openmeme.art';
const X_HANDLE = 'ruoxi01';

// === 工具 ===
function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}
function timeAgo(iso) {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '—';
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return Math.floor(diff) + 's 前';
  if (diff < 3600) return Math.floor(diff / 60) + 'm 前';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h 前';
  return Math.floor(diff / 86400) + 'd 前';
}
function tweetUrl(text) {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
function buildTweet(text) {
  return `${text}\n\nvia @${X_HANDLE} · ${SITE_URL}`;
}

// === Loading / Empty / Error ===
function skeletonHTML(n) { let h = ''; for (let i = 0; i < n; i++) h += '<div class="skeleton"></div>'; return h; }
function emptyHTML(msg, icon) { return `<div class="empty"><div class="empty-icon">${icon || '📭'}</div><div>${msg}</div></div>`; }
function errorHTML(msg) { return `<div class="error">⚠ ${msg}</div>`; }

// ========== 🆕 早期项目卡片 (折叠版, 单页看完) ==========
function earlyCardHTML(item) {
  const links = item.official_links || {};
  const ai = item.ai_analysis || {};
  const initial = (item.name || '?')[0].toUpperCase();
  const itemId = item.id || 'project';

  // 人味推文 (5 个模板, 按阶段选)
  function humanTweet() {
    const name = item.name || '这个项目';
    const ticker = item.ticker || '?';
    const stage = item.stage || 'early';
    const oneLiner = item.one_liner || '值得关注';

    const templates = {
      early: [
        // 1. 激动型 (适合真早期)
        "🆕 看到一个挺有意思的项目 · " + name + " ($" + ticker + ")\n\n" +
        oneLiner + "\n\n" +
        "刚看了下, " + (ai.pros && ai.pros[0] ? ai.pros[0].replace(/^[✓✗] /, '') : '技术挺硬') + " 👀\n\n" +
        "想撸的先去关注官方 @",
      ],
      just_launched: [
        // 2. 提醒型 (适合刚上线)
        "🆕 " + name + " 刚上线没多久 (" + (item.timeline?.now || '刚') + ")\n\n" +
        oneLiner + "\n\n" +
        "已经有人上车了, 风险大, 但如果你想撸, 至少先看看官方推特搞清楚怎么参与.\n\n" +
        "链接都在 👉 openmeme.art",
      ],
      tge_soon: [
        // 3. 提醒型 (TGE 倒计时)
        "⏰ " + name + " ($" + ticker + ") TGE 倒计时\n\n" +
        (item.timeline?.mainnet_mint || item.timeline?.next || '近期') + "\n\n" +
        oneLiner + "\n\n" +
        "想参与的去官网看细则, 别错过. 链接 👉 openmeme.art",
      ],
      expansion: [
        // 4. 推荐型 (扩展期)
        "🔥 " + name + " ($" + ticker + ") 最近挺活跃的\n\n" +
        oneLiner + "\n\n" +
        (item.source_tweets && item.source_tweets[0] ? "他们最新推: \"" + item.source_tweets[0].text.slice(0, 80) + "...\"\n\n" : '') +
        "想跟的去 openmeme.art 看详情 👇",
      ]
    };

    const t = templates[stage] || templates.early;
    return t[0] + "\n\n📌 openmeme.art/#early\n\n#撸毛 #早期项目 @ruoxi01";
  }

  const tw = tweetUrl(humanTweet());

  return `
    <article class="early-card" data-cat="${item.category || 'nft'}" id="early-${itemId}">
      <!-- 默认折叠: 概要 + AI 分 + 5 按钮 -->
      <div class="early-header">
        <div class="early-logo">${item.logo ? `<img src="${item.logo}" alt="${item.name}" onerror="this.outerHTML='<span>${initial}</span>'">` : initial}</div>
        <div class="early-titles">
          <div class="early-name">${item.name} <span class="early-ticker">$${item.ticker}</span> <span class="early-chain">${(item.chain || 'multi').toUpperCase()}</span></div>
          <div class="early-one-liner">${item.one_liner || ''}</div>
          <div class="early-stage early-stage-${item.stage}">${item.stage_label || '🆕 早期'}</div>
        </div>
        <div class="early-verdict ${ai.verdict_color || 'yellow'}">${ai.score || 60}<br><span style="font-size:10px; font-weight:400;">${ai.verdict || '需核实'}</span></div>
      </div>

      <!-- 4 关键指标 (折叠也展示, 信息密度高) -->
      <div class="early-stats">
        <div class="early-stat">
          <div class="early-stat-label">🏷️ 类别</div>
          <div class="early-stat-value">${(item.category || 'nft').toUpperCase()}</div>
        </div>
        <div class="early-stat">
          <div class="early-stat-label">🔗 链</div>
          <div class="early-stat-value">${(item.chain || 'multi').toUpperCase()}</div>
        </div>
        <div class="early-stat">
          <div class="early-stat-label">📅 状态</div>
          <div class="early-stat-value">${(item.stage_label || '').replace(/^🟢 |^🆕 |^🚀 |^⏰ /, '').slice(0, 8)}</div>
        </div>
        <div class="early-stat">
          <div class="early-stat-label">💎 蓝筹</div>
          <div class="early-stat-value">${item.is_bluechip ? '✅ 是' : '❌ 否'}</div>
        </div>
      </div>

      <!-- 展开/收起 按钮 -->
      <div class="early-toggle" style="text-align:center; padding:8px; border-bottom:1px solid var(--border);">
        <button class="early-toggle-btn" onclick="toggleEarly('${itemId}')" style="background:transparent; border:1px solid var(--border); color:var(--text-dim); padding:6px 16px; border-radius:6px; cursor:pointer; font-size:12px; transition:all 0.2s;">
          📖 看详情 (项目背景/团队/AI/撸毛步骤)
        </button>
      </div>

      <!-- 详情区 (默认 hidden) -->
      <div class="early-details" id="early-details-${itemId}" style="display:none;">

        <!-- 项目背景 -->
        <div class="early-section">
          <div class="early-section-title">📖 项目背景</div>
          <div class="early-bg">${item.background || '—'}</div>
        </div>

        <!-- 团队 -->
        <div class="early-section">
          <div class="early-section-title">👥 团队</div>
          <div class="early-bg">${item.team || '—'}</div>
        </div>

        <!-- 融资 -->
        <div class="early-section">
          <div class="early-section-title">💰 融资 / 背书</div>
          <div class="early-bg">${item.funding || '—'}</div>
        </div>

        <!-- 时间表 -->
        <div class="early-section">
          <div class="early-section-title">📅 时间表</div>
          <div class="early-timeline">
            ${Object.entries(item.timeline || {}).map(([k, v]) => `<div class="early-timeline-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}
          </div>
        </div>

        <!-- AI 分析 -->
        <div class="early-section">
          <div class="early-section-title">🤖 AI 分析</div>
          <div class="early-bg" style="border-left:3px solid var(--gold); padding-left:12px;">${ai.summary || '—'}</div>
          <div class="early-pros-cons">
            <div class="early-pros">
              <div class="early-pc-title">✓ 优点</div>
              ${(ai.pros || []).map(p => `<div>${p}</div>`).join('')}
            </div>
            <div class="early-cons">
              <div class="early-pc-title">✗ 风险</div>
              ${(ai.cons || []).map(c => `<div>${c}</div>`).join('')}
            </div>
          </div>
        </div>

        <!-- 怎么撸 -->
        <div class="early-section">
          <div class="early-section-title">🎯 怎么撸 (大白话)</div>
          <div class="early-steps">
            ${(item.how_to_play || []).map(s => `<div class="early-step">${s}</div>`).join('')}
          </div>
        </div>

        <!-- 来源推文 -->
        ${item.source_tweets && item.source_tweets.length > 0 ? `
        <div class="early-section">
          <div class="early-section-title">📡 官方最新推文</div>
          ${item.source_tweets.slice(0, 2).map(t => `
            <div class="early-tweet">
              <div class="early-tweet-time">${t.timestamp}</div>
              <div class="early-tweet-text">${t.text}</div>
              <a href="${t.url}" target="_blank" rel="noopener" class="early-tweet-link">看原推 →</a>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>

      <!-- 4 按钮 (大白话, 折叠也展示) -->
      <div class="early-actions">
        <a class="early-btn primary" href="${links.latest_tweet || links.twitter || '#'}" target="_blank" rel="noopener">📡 看官方推文</a>
        <a class="early-btn" href="${tw}" target="_blank" rel="noopener">𝕏 一键发推</a>
        <a class="early-btn" href="${links.twitter || '#'}" target="_blank" rel="noopener">🔔 关注</a>
        <a class="early-btn" href="${links.website || links.discord || links.tether_announce || links.docs || '#'}" target="_blank" rel="noopener">🌐 官网</a>
      </div>
    </article>
  `;
}

// 折叠/展开 切换函数
function toggleEarly(itemId) {
  const details = document.getElementById('early-details-' + itemId);
  const btn = document.querySelector('#early-' + itemId + ' .early-toggle-btn');
  if (!details) return;
  if (details.style.display === 'none') {
    details.style.display = 'block';
    if (btn) btn.textContent = '🔼 收起详情';
  } else {
    details.style.display = 'none';
    if (btn) btn.textContent = '📖 看详情 (项目背景/团队/AI/撸毛步骤)';
  }
}
window.toggleEarly = toggleEarly;

// ========== 🔥 Meme 卡片 ==========
function memeCardHTML(item, rank) {
  const tw = tweetUrl(buildTweet(`🔥 ${item.name} ($${item.symbol}) — ${item.status || '新币'}\n\n${item.story || ''}\n\nAI 评分: ${item.ai_score || '—'} · ${item.ai_verdict || '—'}\n\n⚠ 高风险, DYOR`));
  return `
    <article class="meme-card">
      <div class="meme-rank">#${rank}</div>
      <div class="meme-emoji">${item.emoji || '🔥'}</div>
      <div class="meme-name">${item.name} <span class="meme-symbol">$${item.symbol}</span> <span class="meme-chain">${(item.chain || 'multi').toLowerCase()}</span></div>
      <div class="meme-launch">⏰ ${timeAgo(item.launch_time || item.first_seen)} 首发</div>
      <p class="meme-story">${item.story || ''}</p>
      <div class="meme-stats">
        <div class="meme-stat"><span class="meme-stat-label">市值</span><span class="meme-stat-value">$${fmtNum(item.mc)}</span></div>
        <div class="meme-stat"><span class="meme-stat-label">24h 量</span><span class="meme-stat-value">$${fmtNum(item.vol24h)}</span></div>
        <div class="meme-stat"><span class="meme-stat-label">流动性</span><span class="meme-stat-value">$${fmtNum(item.liquidity)}</span></div>
        <div class="meme-stat"><span class="meme-stat-label">持币</span><span class="meme-stat-value">${fmtNum(item.holders)}</span></div>
        <div class="meme-stat"><span class="meme-stat-label">24h 涨跌</span><span class="meme-stat-value ${item.change24h >= 0 ? 'up' : 'down'}">${fmtPct(item.change24h)}</span></div>
        <div class="meme-stat"><span class="meme-stat-label">大V</span><span class="meme-stat-value">@${item.source_kol || '—'}</span></div>
      </div>
      <div class="meme-verdict ${item.ai_verdict_color || 'yellow'}">${item.ai_score || '—'} · ${item.ai_verdict || '观望'}</div>
      <div class="meme-actions">
        <a class="meme-btn primary" href="${tw}" target="_blank" rel="noopener">𝕏 发推</a>
        <a class="meme-btn" href="${item.dexUrl || '#'}" target="_blank" rel="noopener">📈 Dex</a>
        <a class="meme-btn" href="${item.source_tweet || '#'}" target="_blank" rel="noopener">𝕏 原文</a>
      </div>
    </article>
  `;
}

// ========== 🎨 NFT 卡片 (倒计时) ==========
function nftCountdown(targetIso) {
  if (!targetIso) return null;
  const t = new Date(targetIso).getTime();
  if (isNaN(t)) return null;
  const now = Date.now();
  const diff = t - now;
  if (diff < 0) return { label: '已开始', time: '', done: true };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return {
    label: 'Mint 开抢',
    time: `${d > 0 ? d + 'd ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    done: false,
  };
}

function nftCardHTML(item) {
  const cd = nftCountdown(item.mint_time);
  const tw = tweetUrl(buildTweet(`🎨 ${item.name} Mint\n\n⏰ ${cd ? (cd.done ? '已开始' : cd.time) : '近期'} · ${item.price || '—'}\n\n${item.ai_summary || ''}\n\n⚠ NFT 风险, DYOR`));
  return `
    <article class="nft-card">
      <div class="nft-countdown">
        <div>
          <div class="nft-countdown-label">${cd ? cd.label : '即将 mint'}</div>
        </div>
        <div class="nft-countdown-time">${cd ? (cd.done ? '⏰ LIVE' : cd.time) : '—'}</div>
      </div>
      <div class="nft-body">
        <div class="nft-emoji-row">
          <span class="nft-emoji">${item.emoji || '🎨'}</span>
          <span class="nft-name">${item.name}</span>
          ${item.is_bluechip ? '<span class="nft-bluechip">蓝筹</span>' : ''}
        </div>
        <div class="nft-progress-wrap">
          <div class="nft-progress-label">
            <span>Mint 进度</span>
            <span><strong>${item.minted || 0}</strong> / ${item.supply || '—'} (${item.mint_progress || 0}%)</span>
          </div>
          <div class="nft-progress"><div class="nft-progress-bar" style="width:${item.mint_progress || 0}%;"></div></div>
        </div>
        <div class="nft-detail">
          <div class="nft-detail-row"><span class="nft-detail-label">价格</span><span class="nft-detail-value price">${item.price || '—'}</span></div>
          <div class="nft-detail-row"><span class="nft-detail-label">链</span><span class="nft-detail-value">${(item.chain || '—').toUpperCase()}</span></div>
          <div class="nft-detail-row"><span class="nft-detail-label">难度</span><span class="nft-detail-value">${item.difficulty || '—'}</span></div>
          <div class="nft-detail-row"><span class="nft-detail-label">大V</span><span class="nft-detail-value">@${item.source_kol || '—'}</span></div>
        </div>
        <div class="nft-difficulty">⏱ ${item.whitelist || '公开 mint'}</div>
        <div class="nft-wl">📌 ${item.ai_summary || ''}</div>
        <div class="meme-verdict ${item.ai_verdict_color || 'yellow'}">${item.ai_score || '—'} · ${item.ai_verdict || '观望'}</div>
      </div>
      <div class="nft-actions">
        <a class="nft-btn primary" href="${item.mint_url || item.project_website || '#'}" target="_blank" rel="noopener" title="${item.mint_url ? '直达 mint 页面' : '跳到官网'}">🎯 Mint ${item.is_free ? '免费' : ''}</a>
        <a class="nft-btn" href="${tw}" target="_blank" rel="noopener">𝕏 发推</a>
        <a class="nft-btn" href="${item.project_twitter || item.source_tweet || '#'}" target="_blank" rel="noopener">𝕏 关注</a>
        ${item.tutorial_url ? `<a class="nft-btn" href="${item.tutorial_url}" target="_blank" rel="noopener">📖 教程</a>` : ''}
      </div>
    </article>
  `;
}

// ========== 📜 铭文卡片 ==========
function inscCardHTML(item) {
  const tw = tweetUrl(buildTweet(`📜 ${item.name} ($${item.symbol}) — ${item.type}\n\nMint: ${item.mint_progress || 0}% · 地板: $${fmtNum(item.floor_usd)}\n\n${item.ai_summary || ''}`));
  return `
    <article class="insc-card">
      <span class="insc-emoji">${item.emoji || '📜'}</span>
      <div class="insc-name">${item.name} <span class="insc-type">${(item.type || '').toUpperCase()}</span></div>
      <div class="insc-progress-wrap" style="margin-top: 12px;">
        <div class="insc-progress-label">
          <span>Mint 进度</span>
          <span><strong>${item.minted || 0}</strong> / ${item.total_supply || '—'} (<strong>${item.mint_progress || 0}%</strong>)</span>
        </div>
        <div class="insc-progress"><div class="insc-progress-bar" style="width:${item.mint_progress || 0}%;"></div></div>
      </div>
      <div class="insc-stats">
        <div class="insc-stat"><span class="insc-stat-label">当前 gas</span><span class="insc-stat-value">${item.current_gas || '—'} sat/vB</span></div>
        <div class="insc-stat"><span class="insc-stat-label">地板价</span><span class="insc-stat-value">$${fmtNum(item.floor_usd)}</span></div>
        <div class="insc-stat"><span class="insc-stat-label">Discord</span><span class="insc-stat-value">${fmtNum(item.discord)}</span></div>
        <div class="insc-stat"><span class="insc-stat-label">大V</span><span class="insc-stat-value">@${item.source_kol || '—'}</span></div>
      </div>
      <div class="meme-verdict ${item.ai_verdict_color || 'yellow'}" style="margin-top: 10px;">${item.ai_score || '—'} · ${item.ai_verdict || '观望'}</div>
      <div class="meme-actions" style="margin-top: 10px;">
        <a class="meme-btn primary" href="${tw}" target="_blank" rel="noopener">𝕏 发推</a>
        <a class="meme-btn" href="https://magiceden.io/ordinals/marketplace" target="_blank" rel="noopener">📊 MagicEden</a>
        ${item.twitter ? `<a class="meme-btn" href="${item.twitter}" target="_blank" rel="noopener">𝕏 关注</a>` : ''}
      </div>
    </article>
  `;
}

// ========== 🚀 Launchpad 卡片 ==========
function lpCardHTML(item) {
  const cd = nftCountdown(item.ido_time);
  const tw = tweetUrl(buildTweet(`🚀 ${item.name} ($${item.symbol}) — ${item.platform}\n\n申购: ${item.ido_time ? new Date(item.ido_time).toLocaleString('zh-CN') : '近期'}\n价格: ${item.ido_price || '—'} · 总额: ${item.total_raise || '—'}\n\n${item.ai_summary || ''}`));
  return `
    <article class="lp-card">
      <div class="lp-platform">🏛 ${item.platform || 'Launchpad'}</div>
      <div class="lp-countdown">⏰ ${cd ? (cd.done ? '申购中' : cd.time) : '近期'} · ${item.ido_time ? new Date(item.ido_time).toLocaleString('zh-CN', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : ''}</div>
      <div style="display:flex; align-items:center; gap:8px; margin: 10px 0;">
        <span style="font-size:28px;">${item.emoji || '🚀'}</span>
        <div>
          <div class="lp-name">${item.name}</div>
          <div style="font-size:12px; color: var(--text-dim);">$${item.symbol} · ${(item.chain || '—').toUpperCase()}</div>
        </div>
      </div>
      <div class="lp-detail">
        <div class="nft-detail-row"><span class="lp-detail-label">申购价</span><span class="lp-detail-value price">${item.ido_price || '—'}</span></div>
        <div class="nft-detail-row"><span class="lp-detail-label">总额度</span><span class="lp-detail-value">${item.total_raise || '—'}</span></div>
        <div class="nft-detail-row"><span class="lp-detail-label">单用户</span><span class="lp-detail-value">${item.per_user || '—'}</span></div>
        <div class="nft-detail-row"><span class="lp-detail-label">解锁</span><span class="lp-detail-value">${item.unlock || '—'}</span></div>
        <div class="nft-detail-row"><span class="lp-detail-label">类别</span><span class="lp-detail-value">${item.category || '—'}</span></div>
        <div class="nft-detail-row"><span class="lp-detail-label">大V</span><span class="lp-detail-value">@${item.source_kol || '—'}</span></div>
      </div>
      <div class="meme-verdict ${item.ai_verdict_color || 'green'}" style="margin: 8px 0;">${item.ai_score || '—'} · ${item.ai_verdict || '—'}</div>
      <div class="meme-actions">
        <a class="meme-btn primary" href="${tw}" target="_blank" rel="noopener">𝕏 发推</a>
        <a class="meme-btn" href="${item.project_website || '#'}" target="_blank" rel="noopener">🌐 申购</a>
        <a class="meme-btn" href="${item.whitepaper || '#'}" target="_blank" rel="noopener">📄 白皮书</a>
      </div>
    </article>
  `;
}

// ========== 🎁 空投卡片 ==========
function airCardHTML(item) {
  const tw = tweetUrl(buildTweet(`🎁 ${item.name}\n\n💰 奖励: ${item.reward}\n⏰ 截止: ${item.deadline ? new Date(item.deadline).toLocaleString('zh-CN') : '近期'}\n\n${(item.tasks || []).slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n')}`));
  return `
    <article class="air-card">
      <div class="air-reward">💰 ${item.reward || '—'}</div>
      <div style="display:flex; align-items:center; gap:8px; margin: 10px 0;">
        <span style="font-size:28px;">${item.emoji || '🎁'}</span>
        <div>
          <div class="air-name">${item.name}</div>
          <div class="air-deadline">⏰ 截止: ${item.deadline ? new Date(item.deadline).toLocaleString('zh-CN', {month: 'short', day: 'numeric'}) : '近期'}</div>
        </div>
      </div>
      <div class="air-meta">
        <span class="air-meta-item">⏱ ${item.time_required || '—'}</span>
        <span class="air-meta-item">${item.difficulty || '—'}</span>
        <span class="air-meta-item">${item.need_kyc ? '🔐 需 KYC' : '🔓 无 KYC'}</span>
        <span class="air-meta-item">📱 ${item.platform || '—'}</span>
      </div>
      <div class="air-tasks">
        ${(item.tasks || []).map(t => `<div class="air-task">${t}</div>`).join('')}
      </div>
      <div class="meme-verdict ${item.ai_verdict_color || 'green'}" style="margin: 8px 0;">${item.ai_score || '—'} · ${item.ai_verdict || '—'}</div>
      <div class="meme-actions">
        <a class="meme-btn primary" href="${item.platform_url || '#'}" target="_blank" rel="noopener">🎯 立即参与</a>
        <a class="meme-btn" href="${tw}" target="_blank" rel="noopener">𝕏 发推</a>
        ${item.project_twitter ? `<a class="meme-btn" href="${item.project_twitter}" target="_blank" rel="noopener">𝕏 关注</a>` : ''}
      </div>
    </article>
  `;
}

// ========== ⚠️ 防骗卡片 ==========
function scamCardHTML(item) {
  return `
    <article class="scam-card">
      <div class="scam-title">${item.title || '🚨 防骗'}</div>
      <div class="scam-method">📌 骗术: ${item.method || '—'}</div>
      <div class="scam-compare">
        <div class="scam-fake">
          <div class="scam-fake-label">❌ 假</div>
          <div>${item.fake_account || ''}</div>
          <div class="scam-link">${item.fake_url || ''}</div>
        </div>
        <div class="scam-real">
          <div class="scam-real-label">✅ 真</div>
          <div>${item.real_account || ''}</div>
          <div class="scam-link">${item.real_url || ''}</div>
        </div>
      </div>
      ${item.loss ? `<div class="scam-loss">💸 已发现损失: ${item.loss}</div>` : ''}
      <div class="scam-warning">${item.warning || '⚠ 警惕!'}</div>
    </article>
  `;
}

// === 加载 & 渲染 ===
async function loadAndRender(sectionId, file, updatedId, renderFn, isList = true) {
  const container = document.getElementById(sectionId);
  const updatedEl = document.getElementById(updatedId);
  if (!container) return;
  container.innerHTML = skeletonHTML(4);

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
    container.innerHTML = items.map((it, i) => renderFn(it, i + 1)).join('');
  }

  if (updatedEl && updated) updatedEl.textContent = `更新: ${timeAgo(updated)}`;
}

// === 启动 ===
document.addEventListener('DOMContentLoaded', () => {
  loadAndRender("early-list", "data/early.json", "early-updated", earlyCardHTML);
  setupSearchAndFilters();
  loadAndRender('meme-list', 'data/meme.json', 'meme-updated', memeCardHTML);
  loadAndRender('nft-list', 'data/nft.json', 'nft-updated', nftCardHTML);
  loadAndRender('inscription-list', 'data/inscription.json', 'inscription-updated', inscCardHTML);
  loadAndRender('launchpad-list', 'data/launchpad.json', 'launchpad-updated', lpCardHTML);
  loadAndRender('airdrop-list', 'data/airdrop.json', 'airdrop-updated', airCardHTML);
  loadAndRender('scam-list', 'data/scam.json', 'scam-updated', scamCardHTML);

  loadStats();
  setupHeader();
  setupBackToTop();

  // 倒计时定时器
  setInterval(updateCountdowns, 1000);
});

function updateCountdowns() {
  document.querySelectorAll('[data-mint-time]').forEach(el => {
    // 暂用 nftCountdown 通过 ID 调用
  });
}

async function loadStats() {
  const sections = [
    ['meme', 'data/meme.json', 'stat-meme'],
    ['nft', 'data/nft.json', 'stat-nft'],
    ['inscription', 'data/inscription.json', 'stat-inscription'],
    ['launchpad', 'data/launchpad.json', 'stat-launchpad'],
    ['airdrop', 'data/airdrop.json', 'stat-airdrop'],
    ['early', 'data/early.json', 'stat-early'],
  ];
  for (const [key, file, el] of sections) {
    try {
      const res = await fetch(file + '?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const c = (data.items || []).length;
        const elDom = document.getElementById(el);
        if (elDom && window.animateNumber) {
          window.animateNumber(elDom, c);
        } else if (elDom) {
          elDom.textContent = c;
        }
      }
    } catch (e) {}
  }
}

function setupHeader() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });
}

function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========== refine-web-design: 搜索 + 过滤 ==========
const FilterState = {
  kol: { search: '', cat: 'all' },
  meme: { cat: 'all', sort: 'new' },
  nft: { cat: 'all' },
};

function setupSearchAndFilters() {
  // KOL 搜索 + 过滤
  const earlySearch = document.getElementById('early-search');
  const earlyFilters = document.getElementById('early-filters');
  if (earlySearch) {
    kolSearch.addEventListener('input', (e) => {
      FilterState.early.search = e.target.value.toLowerCase();
      applyFilters('early');
    });
  }
  if (earlyFilters) {
    kolFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      earlyFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      FilterState.early.cat = btn.dataset.filter;
      applyFilters('early');
    });
  }

  // Meme 链过滤
  setupFilterChips('meme-filters', (cat) => {
    FilterState.meme.cat = cat;
    applyFilters('meme');
  });

  // NFT 过滤
  setupFilterChips('nft-filters', (cat) => {
    FilterState.nft.cat = cat;
    applyFilters('nft');
  });
  // Early 早期项目过滤
  setupFilterChips('early-filters', (cat) => {
    FilterState.early.cat = cat;
    applyFilters('early');
  });
}

function setupFilterChips(containerId, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    onChange(btn.dataset.filter);
  });
}

function applyFilters(section) {
  const state = FilterState[section];
  const cards = document.querySelectorAll(`#${section}-list > .${section === 'early' ? 'kol' : section.replace(/s$/, '')}-card, #${section}-list > article`);
  cards.forEach(card => {
    let show = true;
    if (section === 'early') {
      // 搜索: 名字 + 推文内容
      if (state.search) {
        const text = card.textContent.toLowerCase();
        if (!text.includes(state.search)) show = false;
      }
      // 类别过滤
      if (state.cat !== 'all' && show) {
        const cat = card.dataset.cat || '';
        if (cat !== state.cat) show = false;
      }
    } else if (section === 'meme' && state.cat !== 'all') {
      if (state.cat === 'new') {
        // 24h 新币
        const ts = card.dataset.launchTime || '';
        const age = (Date.now() - new Date(ts).getTime()) / 3600000;
        if (age > 24) show = false;
      } else if (state.cat === 'hot') {
        // 24h 涨幅
        const change = parseFloat(card.dataset.change24h || '0');
        if (change < 50) show = false;
      } else {
        // 链
        const chain = (card.dataset.chain || '').toLowerCase();
        if (chain !== state.cat) show = false;
      }
    } else if (section === 'nft' && state.cat !== 'all') {
      if (state.cat === 'bluechip') {
        if (card.dataset.bluechip !== 'true') show = false;
      } else if (state.cat === 'free') {
        if (card.dataset.free !== 'true') show = false;
      } else if (state.cat === 'urgent') {
        const ts = card.dataset.mintTime || '';
        const diff = (new Date(ts).getTime() - Date.now()) / 3600000;
        if (diff > 24 || diff < 0) show = false;
      } else if (state.cat === 'upcoming') {
        const ts = card.dataset.mintTime || '';
        const diff = (new Date(ts).getTime() - Date.now()) / 3600000;
        if (diff > 168 || diff < 0) show = false;
      }
    }
    card.classList.toggle('filtered-out', !show);
  });
}

// 修改 loadAndRender, 渲染时加 data-attr
const _origLoadAndRender = loadAndRender;
loadAndRender = async function(sectionId, file, updatedId, renderFn) {
  await _origLoadAndRender(sectionId, file, updatedId, renderFn);
  // 渲染后注入 data 属性
  if (sectionId === 'early-list') {
    document.querySelectorAll('#kol-list > article').forEach((card, i) => {
      const item = window._lastKOLData && window._lastKOLData[i];
      if (item) {
        card.dataset.cat = item.kol.cat;
        card.dataset.handle = item.kol.handle;
      }
    });
  } else if (sectionId === 'meme-list') {
    document.querySelectorAll('#meme-list > article').forEach((card, i) => {
      const item = window._lastMemeData && window._lastMemeData[i];
      if (item) {
        card.dataset.chain = item.chain;
        card.dataset.launchTime = item.launch_time || item.first_seen;
        card.dataset.change24h = item.change24h;
      }
    });
  } else if (sectionId === 'nft-list') {
    document.querySelectorAll('#nft-list > article').forEach((card, i) => {
      const item = window._lastNFTData && window._lastNFTData[i];
      if (item) {
        card.dataset.bluechip = item.is_bluechip;
        card.dataset.free = item.is_free;
        card.dataset.mintTime = item.mint_time;
      }
    });
  }
};

// 修改 KOL/Meme/NFT 加载, 存到 window 供过滤用
const _origLoadAndRender2 = loadAndRender;
loadAndRender = async function(sectionId, file, updatedId, renderFn, isList) {
  let items = [];
  try {
    const res = await fetch(file + '?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      items = data.items || [];
    }
  } catch (e) {}
  if (sectionId === 'early-list') window._lastKOLData = items;
  if (sectionId === 'meme-list') window._lastMemeData = items;
  if (sectionId === 'nft-list') window._lastNFTData = items;
  await _origLoadAndRender2(sectionId, file, updatedId, renderFn, isList);
};
