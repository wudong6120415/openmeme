"""
OpenMeme 数据抓取脚本 v2
- DexScreener search API: Meme 雷达 (改用 search, 不再用 profiles)
- Coingecko 公开 API: 热度突增
- 静态打新列表: 打新关注
"""
import json
import os
import time
import urllib.request
import urllib.error
from datetime import datetime

OUT_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(OUT_DIR, exist_ok=True)

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

# === 1. DexScreener Meme 雷达 (用 search) ===
# 用不同关键词组合搜新 Meme
MEME_QUERIES = [
    "meme",
    "pump",
    "pepe",
    "doge",
    "wojak",
    "inu",
    "cat",
    "ai",
    "trump",
    "elon",
]

def fetch_dexscreener_meme():
    """用 search 关键词搜新 Meme, 过滤出近期有流动性的."""
    candidates = []
    seen = set()

    for q in MEME_QUERIES:
        url = f"https://api.dexscreener.com/latest/dex/search?q={q}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read().decode())
        except Exception as e:
            print(f"[meme] dexscreener q={q} failed: {e}")
            continue

        pairs = data.get("pairs") or []
        for p in pairs:
            base = p.get("baseToken") or {}
            addr = base.get("address", "")
            if not addr or addr in seen:
                continue
            seen.add(addr)

            liq = (p.get("liquidity") or {}).get("usd") or 0
            vol = (p.get("volume") or {}).get("h24") or 0
            mc = p.get("marketCap") or p.get("fdv") or 0
            change = (p.get("priceChange") or {}).get("h24") or 0
            chain = (p.get("chainId") or "?").upper()

            # 过滤
            if liq < 5000:
                continue
            if vol < 20000:
                continue
            if mc > 50_000_000:  # 排除主流币
                continue
            # 优先 solana/bsc/base
            if chain not in ("SOLANA", "BSC", "BASE", "ETHEREUM", "ARBITRUM", "POLYGON"):
                continue

            age_h = 0
            if p.get("pairCreatedAt"):
                age_h = (time.time() * 1000 - p["pairCreatedAt"]) / 1000 / 3600

            # emoji 推断
            sym = (base.get("symbol") or "").upper()
            emoji = "🔥"
            for k, e in [("PEPE", "🐸"), ("DOGE", "🐕"), ("CAT", "🐱"), ("WOJAK", "😎"),
                         ("INU", "🐕"), ("AI", "🤖"), ("TRUMP", "🇺🇸"), ("ELON", "🚀")]:
                if k in sym or k in (base.get("name") or "").upper():
                    emoji = e
                    break

            candidates.append({
                "name": base.get("name", "?"),
                "symbol": base.get("symbol", "?"),
                "chain": chain,
                "mc": mc,
                "vol24h": vol,
                "liquidity": liq,
                "change24h": change,
                "age_h": round(age_h, 1),
                "desc": f"上线 {age_h:.0f}h · 流动性 ${liq/1000:.0f}K · 24h 量 ${vol/1000:.0f}K",
                "risk": "Meme 币 · 高风险 · DYOR · 可能归零" if age_h < 168 else "Meme 币 · 风险高 · DYOR",
                "dexUrl": p.get("url") or f"https://dexscreener.com/{p.get('chainId', '')}/{addr}",
                "emoji": emoji,
            })

    # 按 24h 成交量降序
    candidates.sort(key=lambda x: x.get("vol24h") or 0, reverse=True)
    return candidates[:15]


# === 2. Coingecko 热度突增 ===
def fetch_coingecko_trending():
    """Coingecko 公开 trending (无需 API key)."""
    url = "https://api.coingecko.com/api/v3/search/trending"
    items = []
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode())
        for c in (data.get("coins") or [])[:8]:
            item = c.get("item") or {}
            mc_rank = item.get("market_cap_rank")
            items.append({
                "name": item.get("name", "?"),
                "symbol": (item.get("symbol") or "?").upper(),
                "chain": "multi",
                "mc": None,
                "vol24h": None,
                "liquidity": None,
                "change24h": None,
                "rank": c.get("rank"),
                "mc_rank": mc_rank,
                "desc": f"Coingecko trending #{c.get('rank', '?')} · MC Rank #{mc_rank if mc_rank else '?'}",
                "risk": "主流币 · 热度高 · DYOR",
                "dexUrl": f"https://www.coingecko.com/en/coins/{item.get('id', '')}",
            })
    except Exception as e:
        print(f"[trending] coingecko failed: {e}")
    return items


# === 3. 打新关注 (静态 + 我维护的列表) ===
STATIC_IDO = [
    {
        "name": "Plasma Network",
        "symbol": "XPL",
        "chain": "eth",
        "mc": None, "vol24h": None, "liquidity": None, "change24h": None,
        "desc": "L1 稳定币公链, 2026 Q4 主网上线, 团队来自 Bitfinex/Tether 系。",
        "risk": "未上线 · 团队背书强 · DYOR",
        "dexUrl": "https://www.plasma.to/",
    },
    {
        "name": "Megaeth",
        "symbol": "MEGA",
        "chain": "eth",
        "mc": None, "vol24h": None, "liquidity": None, "change24h": None,
        "desc": "EVM 兼容 L2, 实时性能, Vitalik 推荐关注, 测试网运行中。",
        "risk": "测试网阶段 · 风险高 · DYOR",
        "dexUrl": "https://megaeth.systems/",
    },
    {
        "name": "Monad",
        "symbol": "MON",
        "chain": "eth",
        "mc": 380000000,
        "vol24h": 125000000,
        "liquidity": 28000000,
        "change24h": 4.2,
        "desc": "高性能 L1, 1 秒出块, EVM 兼容, 11 月主网。",
        "risk": "L1 风险 · 已发币 · DYOR",
        "dexUrl": "https://monad.xyz/",
    },
    {
        "name": "Berachain",
        "symbol": "BERA",
        "chain": "eth",
        "mc": 450000000,
        "vol24h": 88000000,
        "liquidity": 32000000,
        "change24h": -2.1,
        "desc": "PoL 共识 L1, 已上线 2 个月, 生态项目 100+。",
        "risk": "L1 · 已上线 · 风险中",
        "dexUrl": "https://www.berachain.com/",
    },
    {
        "name": "Hyperliquid",
        "symbol": "HYPE",
        "chain": "hyperliquid",
        "mc": 9800000000,
        "vol24h": 1200000000,
        "liquidity": 250000000,
        "change24h": 8.5,
        "desc": "链上永续合约交易所, 自有 L1, 实际收入 Top 3 加密项目。",
        "risk": "DeFi · 龙头 · 风险中",
        "dexUrl": "https://hyperliquid.xyz/",
    },
    {
        "name": "Story Protocol",
        "symbol": "IP",
        "chain": "eth",
        "mc": 380000000,
        "vol24h": 22000000,
        "liquidity": 18000000,
        "change24h": -1.4,
        "desc": "IP 资产化协议, a16z 投资, 影视/AI 版权。",
        "risk": "DePIN/IP · 概念新 · DYOR",
        "dexUrl": "https://www.storyprotocol.xyz/",
    },
    {
        "name": "Initia",
        "symbol": "INIT",
        "chain": "initia",
        "mc": 175000000,
        "vol24h": 28000000,
        "liquidity": 12000000,
        "change24h": 5.7,
        "desc": "模块化 L1 + 跨链, 韩国背景, 4 月 TGE。",
        "risk": "新 L1 · 风险中",
        "dexUrl": "https://initia.xyz/",
    },
    {
        "name": "Eigenlayer",
        "symbol": "EIGEN",
        "chain": "eth",
        "mc": 530000000,
        "vol24h": 28000000,
        "liquidity": 45000000,
        "change24h": 0.8,
        "desc": "再质押协议, ETH 生态核心, 已发币 6 个月。",
        "risk": "DeFi 龙头 · 风险中",
        "dexUrl": "https://www.eigenlayer.xyz/",
    },
]


# === 主流程 ===
def main():
    now = datetime.utcnow().isoformat() + "Z"

    # Meme
    print("[meme] 抓取 DexScreener ...")
    meme_items = fetch_dexscreener_meme()
    write_json("meme.json", {
        "updated_at": now,
        "source": "DexScreener public search API",
        "items": meme_items,
    })
    print(f"  -> {len(meme_items)} 个 Meme")

    # IDO
    write_json("ido.json", {
        "updated_at": now,
        "source": "static / curated",
        "items": STATIC_IDO,
    })
    print(f"  -> {len(STATIC_IDO)} 个 IDO")

    # Trending
    print("[trending] 抓取 Coingecko ...")
    trending_items = fetch_coingecko_trending()
    write_json("trending.json", {
        "updated_at": now,
        "source": "Coingecko public API",
        "items": trending_items,
    })
    print(f"  -> {len(trending_items)} 个 trending")

    print(f"\n[{now}] 完成")


def write_json(name, data):
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
