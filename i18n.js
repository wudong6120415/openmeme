/* OpenMeme — i18n 中英双语字典 */
const I18N = {
  zh: {
    site_title: 'OpenMeme — 早期项目推荐 · 新 Meme / NFT / 铭文 / 空投',
    hero_line1: '1-2 周内',
    hero_line2: 'TGE 速递',
    hero_line3: '·',
    hero_line4: '新 Meme / NFT / 铭文 / 空投',
    hero_sub: '服务推特 + 币安广场的大众币圈人, 大白话分享, 一键发推引流转评',
    live: '实时更新',
    data_sources: '数据源: DexScreener · MagicEden · 推特大V · 币安/OKX/Bybit',
    not_advice: '非投资建议 · DYOR',

    stat_early: '早期项目',
    stat_meme: 'Meme 速递',
    stat_nft: 'NFT Mint',
    stat_insc: '铭文',
    stat_lp: 'Launchpad',
    stat_air: '空投',

    sec_early: '🆕 早期项目推荐',
    sec_early_sub: '精选 1-2 周内有动作的超早期项目 · 含项目背景/团队/融资/AI 分析/撸毛路径',
    sec_meme: '🔥 Meme 速递',
    sec_meme_sub: '新 Meme 币首发 · Solana Pump.fun · BSC 4.meme · Base 等',
    sec_nft: '🎨 NFT Mint 名单',
    sec_nft_sub: '蓝筹续作 + 免费 mint · 倒计时提醒',
    sec_insc: '📜 铭文 / BTC 生态',
    sec_insc_sub: 'BRC-20 / SRC-20 / Runes · 进度条实时',
    sec_lp: '🚀 Launchpad / 拍卖',
    sec_lp_sub: '币安 Launchpad · OKX Jumpstart · Bybit',
    sec_air: '🎁 免费空投',
    sec_air_sub: 'Galxe / Zealy / Layer3 任务 · 5-30 分钟搞定',
    sec_scam: '⚠️ 防骗预警',
    sec_scam_sub: '慢雾 + CertiK + 推特举报 · 假推特 / 钓鱼 / 貔貅',

    btn_tweet: '𝕏 一键发推',
    btn_follow: '关注 𝕏',
    btn_website: '官网',
    btn_paper: '白皮书',
    btn_mint: '立即 Mint',
    btn_join: '立即参与',
    btn_dex: 'DexScreener',
    btn_magic: 'MagicEden',
    btn_track: '加入我的关注',

    footer_stats: '📊 访问统计',
    footer_ai: '由 MiniMax M3 AI 驱动',

    disc_title: '免责声明',
    disc_text: '本站所有内容仅供信息聚合与研究参考, 不构成任何投资建议。',
    disc_1: '加密资产价格波动剧烈, 可能损失全部本金',
    disc_2: 'Meme 币 / NFT / 铭文风险极高, 多数最终归零',
    disc_3: '请 DYOR (Do Your Own Research), 自行评估风险',
    disc_4: '3 天后自动归档 (TGE 跟踪期)',
    disc_5: '数据来自第三方公开 API + 推特大V, 不保证 100% 准确',
  },
  en: {
    site_title: 'OpenMeme — Early Projects · Meme / NFT / Inscription / Airdrop',
    hero_line1: '1-2 Week',
    hero_line2: 'TGE Express',
    hero_line3: '·',
    hero_line4: 'New Meme / NFT / Inscription / Airdrop',
    hero_sub: 'For Twitter & Binance Square retail crypto crowd, plain language, 1-click tweet & share',
    live: 'Live',
    data_sources: 'Sources: DexScreener · MagicEden · KOL tweets · Binance/OKX/Bybit',
    not_advice: 'Not financial advice · DYOR',

    stat_early: 'Early Projects',
    stat_meme: 'Meme Express',
    stat_nft: 'NFT Mint',
    stat_insc: 'Inscription',
    stat_lp: 'Launchpad',
    stat_air: 'Airdrop',

    sec_early: '🆕 Early Projects',
    sec_early_sub: 'Curated ultra-early projects · Background / team / funding / AI analysis / airdrop path',
    sec_meme: '🔥 Meme Express',
    sec_meme_sub: 'New meme launches · Solana Pump.fun · BSC 4.meme · Base',
    sec_nft: '🎨 NFT Mint List',
    sec_nft_sub: 'Bluechip sequels + free mint · Countdown alerts',
    sec_insc: '📜 Inscription / BTC',
    sec_insc_sub: 'BRC-20 / SRC-20 / Runes · Live mint progress',
    sec_lp: '🚀 Launchpad / Auction',
    sec_lp_sub: 'Binance Launchpad · OKX Jumpstart · Bybit',
    sec_air: '🎁 Free Airdrop',
    sec_air_sub: 'Galxe / Zealy / Layer3 quests · 5-30 min tasks',
    sec_scam: '⚠️ Scam Alert',
    sec_scam_sub: 'SlowMist + CertiK + Twitter reports · Fake accounts / phishing / rugpull',

    btn_tweet: '𝕏 Tweet',
    btn_follow: 'Follow 𝕏',
    btn_website: 'Website',
    btn_paper: 'Whitepaper',
    btn_mint: 'Mint Now',
    btn_join: 'Join Now',
    btn_dex: 'DexScreener',
    btn_magic: 'MagicEden',
    btn_track: 'Track This',

    footer_stats: '📊 Stats',
    footer_ai: 'Powered by MiniMax M3 AI',

    disc_title: 'Disclaimer',
    disc_text: 'All content is for informational and research purposes only, not financial advice.',
    disc_1: 'Crypto assets are highly volatile, total loss is possible',
    disc_2: 'Memes / NFTs / Inscriptions are extremely risky, most go to zero',
    disc_3: 'Please DYOR (Do Your Own Research)',
    disc_4: 'Auto-archive after 3 days (TGE tracking period)',
    disc_5: 'Data from 3rd party public APIs + KOL tweets, not 100% accurate',
  },
};

let currentLang = localStorage.getItem('lang') ||
  (navigator.language && navigator.language.startsWith('en') ? 'en' : 'zh');

function applyLang() {
  const dict = I18N[currentLang];
  document.documentElement.lang = currentLang;
  document.documentElement.setAttribute('data-lang', currentLang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  const lbl = document.getElementById('lang-label');
  if (lbl) lbl.textContent = currentLang === 'zh' ? 'EN' : '中';
}

function toggleLang() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', currentLang);
  applyLang();
}

document.addEventListener('DOMContentLoaded', () => {
  applyLang();
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.addEventListener('click', toggleLang);
});
