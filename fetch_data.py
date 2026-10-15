"""
OpenMeme 数据抓取脚本
- DexScreener 公开 API: Meme 雷达
- Coingecko 公开 API: 热度突增
- 静态打新列表: 打新关注 (手动维护或 IDO 平台 RSS)
"""
import json
import os
import time
import urllib.request
import urllib.error
from datetime import datetime

OUT_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(OUT_DIR, exist_ok=True)

# === 1. DexScreener Meme 雷达 ===
def fetch_dexscreener_meme():
    """抓 DexScreener 最新 token profiles, 过滤出 Meme 候选."""
    url = "https://api.dexscreener.com/latest/dex/tokens/"
    candidates = []
    seen = set()
    # 用 trending pairs 入口
    trending_url = "https://api.dexscreener.com/latest/dex/search?q=pump.fun"
    try:
        with urllib.request.urlopen(trending_url, timeout=20) as r:
            data = json.loads(r.read().decode())
        pairs = data.get("pairs", []) or []
        for p in pairs[:30]:
            base = p.get("baseToken", {}) or {}
            addr = base.get("address", "")
            if not addr or addr in seen:
                continue
            seen.add(addr)
            chain = (p.get("chainId") or "?").upper()
            liq = (p.get("liquidity") or {}).get("usd") or 0
            vol = (p.get("volume") or {}).get("h24") or 0
            mc = p.get("marketCap") or p.get("fdv") or 0
            change = p.get("priceChange", {}).get("h24") or 0
            age_h = 0
            if p.get("pairCreatedAt"):
                age_h = (time.time() * 1000 - p["pairCreatedAt"]) / 1000 / 3600
            # 过滤: 新 + 流动性 + 量
            if age_h > 72:
                continue
            if liq < 10000:
                continue
            if vol < 30000:
                continue
            candidates.append({
                "name": base.get("name", "?"),
                "symbol": base.get("symbol", "?"),
                "chain": chain,
                "mc": mc,
                "vol24h": vol,
                "liquidity": liq,
                "change24h": change,
                "desc": f"上线约 {age_h:.0f}h, 流动性 ${liq/1000:.0f}K, 24h 量 ${vol/1000:.0f}K",
                "risk": "Meme 币 · 高风险 · DYOR · 可能归零",
                "dexUrl": p.get("url") or f"https://dexscreener.com/{p.get('chainId', '')}/{addr}",
            })
    except Exception as e:
        print(f"[meme] dexscreener failed: {e}")
    return candidates[:12]


# === 2. Coingecko 热度突增 ===
def fetch_coingecko_trending():
    """Coingecko 公开 trending (无需 API key)."""
    url = "https://api.coingecko.com/api/v3/search/trending"
    items = []
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            data = json.loads(r.read().decode())
        for c in (data.get("coins") or [])[:8]:
            item = c.get("item", {}) or {}
            items.append({
                "name": item.get("name", "?"),
                "symbol": (item.get("symbol") or "?").upper(),
                "chain": "multi",
                "mc": None,  # trending 不直接给 MC
                "vol24h": None,
                "liquidity": None,
                "change24h": None,
                "desc": f"Coingecko trending #{c.get('rank', '?')}, market cap rank #{item.get('market_cap_rank', '?')}",
                "risk": "主流币 · 热度高 · DYOR",
                "dexUrl": f"https://www.coingecko.com/en/coins/{item.get('id', '')}",
            })
    except Exception as e:
        print(f"[trending] coingecko failed: {e}")
    return items


# === 3. 打新关注 (静态 + 简单列表) ===
STATIC_IDO = [
    # 维护方式: 你/我手动更新 (无公开统一 API)
    # 字段: name / symbol / chain / desc / risk / dexUrl (项目官网)
    {
        "name": "示例 IDO 项目 A",
        "symbol": "EXA",
        "chain": "eth",
        "mc": None, "vol24h": None, "liquidity": None, "change24h": None,
        "desc": "可手动维护, 见 README.",
        "risk": "IDO 早期 · 代币解锁期长 · DYOR",
        "dexUrl": "https://example.com/ido-a",
    },
]


# === 主流程 ===
def main():
    now = datetime.utcnow().isoformat() + "Z"

    # Meme
    meme_items = fetch_dexscreener_meme()
    write_json("meme.json", {
        "updated_at": now,
        "source": "DexScreener public API",
        "items": meme_items,
    })

    # IDO
    write_json("ido.json", {
        "updated_at": now,
        "source": "static / manual",
        "items": STATIC_IDO,
    })

    # Trending
    trending_items = fetch_coingecko_trending()
    write_json("trending.json", {
        "updated_at": now,
        "source": "Coingecko public API",
        "items": trending_items,
    })

    print(f"[{now}] meme={len(meme_items)} ido={len(STATIC_IDO)} trending={len(trending_items)}")


def write_json(name, data):
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  -> {path} ({len(data.get('items', []))} items)")


if __name__ == "__main__":
    main()
