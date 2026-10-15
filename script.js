/* OpenMeme — 加载数据 + 渲染卡片 + 一键发推 */

const SITE_URL = 'https://openmeme.art';
const X_HANDLE = 'ruoxi01';

// 工具: 格式化数字
function fmtNum(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(2);
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return Math.floor(diff) + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

// 卡片模板
function cardHTML(item, rank) {
  const tweetText = encodeURIComponent(
    `${item.emoji || '🔥'} ${item.name} (${item.symbol})\n\n` +
    `${item.desc || 'A new project just popped up on the radar.'}\n\n` +
    `Chain: ${item.chain || '—'} | MC: $${fmtNum(item.mc)} | Vol 24h: $${fmtNum(item.vol24h)}\n\n` +
    `⚠ Not financial advice. DYOR.\n\n` +
    `via @${X_HANDLE} · ${SITE_URL}`
  );
  const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;

  return `
    <article class="card">
      <div class="card-rank">${rank}</div>
      <h3 class="card-title">${item.name} <span class="card-chain">${item.chain || 'multi'}</span></h3>
      <p class="card-desc">${item.desc || ''}</p>
      <div class="card-stats">
        <div class="stat"><span class="stat-label">市值 MC</span><span class="stat-value">$${fmtNum(item.mc)}</span></div>
        <div class="stat"><span class="stat-label">24h 量</span><span class="stat-value">$${fmtNum(item.vol24h)}</span></div>
        <div class="stat"><span class="stat-label">流动性</span><span class="stat-value">$${fmtNum(item.liquidity)}</span></div>
        <div class="stat"><span class="stat-label">24h 涨跌</span><span class="stat-value ${item.change24h >= 0 ? 'up' : 'down'}">${fmtPct(item.change24h)}</span></div>
      </div>
      <div class="card-risk">⚠ ${item.risk || '高风险 · DYOR · 可能归零'}</div>
      <div class="card-actions">
        <a class="btn btn-primary" href="${tweetUrl}" target="_blank" rel="noopener">𝕏 一键发推</a>
        <a class="btn btn-secondary" href="${item.dexUrl || '#'}" target="_blank" rel="noopener">DexScreener</a>
      </div>
    </article>
  `;
}

// 加载并渲染 (data.json 优先, fallback 到 demo)
async function loadAndRender(sectionId, file) {
  const container = document.getElementById(sectionId);
  if (!container) return;
  container.innerHTML = '<div class="loading">加载中</div>';

  let items = [];
  try {
    const res = await fetch(file, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      items = data.items || [];
    }
  } catch (e) {
    console.warn(`load ${file} failed`, e);
  }

  // fallback demo data (no data.json yet)
  if (items.length === 0 && sectionId === 'meme-list') {
    items = DEMO.meme;
  } else if (items.length === 0 && sectionId === 'ido-list') {
    items = DEMO.ido;
  } else if (items.length === 0 && sectionId === 'trending-list') {
    items = DEMO.trending;
  }

  if (items.length === 0) {
    container.innerHTML = '<div class="empty">暂无数据, 等待下次抓取</div>';
    return;
  }

  container.innerHTML = items.map((it, i) => cardHTML(it, i + 1)).join('');
}

// Fallback demo data
const DEMO = {
  meme: [
    {
      name: '$CATNIP',
      symbol: 'CATNIP',
      chain: 'solana',
      mc: 234000,
      vol24h: 1250000,
      liquidity: 45000,
      change24h: 84.5,
      desc: 'Pump.fun 上 6h 前上线, 流动性 $45K, 多家 KOL 转推。',
      risk: 'Meme 币高风险 · 1 日内上线 · DYOR',
      dexUrl: 'https://dexscreener.com/solana/catnip-demo',
      emoji: '🐱',
    },
    {
      name: '$WOJAK',
      symbol: 'WOJAK',
      chain: 'bsc',
      mc: 890000,
      vol24h: 3400000,
      liquidity: 120000,
      change24h: 156.2,
      desc: 'BSC four.meme 24h 成交破 $3M, 上线 18h。',
      risk: 'Meme 币高风险 · 拉盘明显 · 警惕回落',
      dexUrl: 'https://dexscreener.com/bsc/wojak-demo',
      emoji: '😎',
    },
    {
      name: '$PEPENADO',
      symbol: 'PEPE',
      chain: 'base',
      mc: 560000,
      vol24h: 890000,
      liquidity: 78000,
      change24h: 42.1,
      desc: 'Base 链新上线, 24h 量 $890K, 多 meme 元素。',
      risk: 'Meme 币高风险 · Base 链新项目 · DYOR',
      dexUrl: 'https://dexscreener.com/base/pepenado-demo',
      emoji: '🐸',
    },
  ],
  ido: [
    {
      name: 'NovaChain',
      symbol: 'NOVA',
      chain: 'eth',
      mc: null,
      vol24h: null,
      liquidity: null,
      change24h: null,
      desc: 'L2 扩容项目, 公开 IDO 阶段, 白皮书 + GitHub 已公开。',
      risk: 'IDO 早期 · 代币解锁期长 · DYOR',
      dexUrl: 'https://novachain.example',
      emoji: '🚀',
    },
    {
      name: 'PixelRealm',
      symbol: 'PXR',
      chain: 'polygon',
      mc: 1200000,
      vol24h: 320000,
      liquidity: 210000,
      change24h: 12.3,
      desc: '链游 + NFT, 公开 IEO 阶段, 已有 50K 推特粉丝。',
      risk: 'GameFi 风险 · 上线早期 · DYOR',
      dexUrl: 'https://pixelrealm.example',
      emoji: '🎮',
    },
  ],
  trending: [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      chain: 'btc',
      mc: 1320000000000,
      vol24h: 38000000000,
      liquidity: null,
      change24h: 2.4,
      desc: '搜索热度 +12%, 机构讨论密集, Coingecko trending #3。',
      risk: '主流币 · 高流动性 · DYOR',
      dexUrl: 'https://www.coingecko.com/en/coins/bitcoin',
      emoji: '₿',
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      chain: 'solana',
      mc: 78000000000,
      vol24h: 4200000000,
      liquidity: null,
      change24h: 5.8,
      desc: '24h 交易量 +18%, 多家 meme 项目上线催化。',
      risk: '主流币 · 高波动 · DYOR',
      dexUrl: 'https://www.coingecko.com/en/coins/solana',
      emoji: '◎',
    },
  ],
};

// 启动
document.addEventListener('DOMContentLoaded', () => {
  loadAndRender('meme-list', 'data/meme.json');
  loadAndRender('ido-list', 'data/ido.json');
  loadAndRender('trending-list', 'data/trending.json');
});
