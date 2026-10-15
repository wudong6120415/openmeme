"""
fetch_kol.py — 抓取 20 个推特大V最新推文
- 过滤: 包含 "新项目" / CA 合约 / "alpha" / ticker
- AI 分析 (大V 信誉 + 项目质量)
- 写入 data/kol.json

注意: 推特 API 限流严, 用 Nitter RSS fallback
"""
import json
import os
import re
import time
import urllib.request
import urllib.error
from datetime import datetime
from html import unescape

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"

# === 20 个推特大V ===
KOL_LIST = [
    # Meme 大V
    {"id": "CryptoKOL", "name": "CryptoKOL", "handle": "CryptoKOL", "followers": 250000, "cat": "meme", "lang": "en"},
    {"id": "blknoiz06", "name": "blknoiz06", "handle": "blknoiz06", "followers": 150000, "cat": "meme", "lang": "en"},
    {"id": "CryptoGems", "name": "Crypto Gems", "handle": "CryptoGems", "followers": 400000, "cat": "meme", "lang": "en"},
    # NFT 大V
    {"id": "NFTbillionaire", "name": "NFTbillionaire", "handle": "NFTbillionaire", "followers": 200000, "cat": "nft", "lang": "en"},
    {"id": "Zeneca", "name": "Zeneca", "handle": "Zeneca_", "followers": 200000, "cat": "nft", "lang": "en"},
    {"id": "punk6529", "name": "punk6529", "handle": "punk6529", "followers": 350000, "cat": "nft", "lang": "en"},
    # 铭文 / BTC
    {"id": "LeonidasNFT", "name": "Leonidas", "handle": "LeonidasNFT", "followers": 250000, "cat": "btc", "lang": "en"},
    {"id": "RuneAlpha", "name": "Rune Alpha", "handle": "TheRuneAlpha", "followers": 80000, "cat": "btc", "lang": "en"},
    {"id": "OrdinalHub", "name": "Ordinal Hub", "handle": "OrdinalHub", "followers": 100000, "cat": "btc", "lang": "en"},
    # DeFi / L1
    {"id": "DefiIgnas", "name": "DefiIgnas", "handle": "DefiIgnas", "followers": 280000, "cat": "defi", "lang": "en"},
    {"id": "Route2FI", "name": "Route2FI", "handle": "Route2FI", "followers": 120000, "cat": "defi", "lang": "en"},
    # Launchpad / CEX
    {"id": "heyibinance", "name": "Binance Wallet", "handle": "heyibinance", "followers": 1000000, "cat": "launchpad", "lang": "en", "official": True},
    {"id": "okx", "name": "OKX", "handle": "okx", "followers": 6000000, "cat": "launchpad", "lang": "en", "official": True},
    {"id": "BybitOfficial", "name": "Bybit", "handle": "Bybit_Official", "followers": 5000000, "cat": "launchpad", "lang": "en", "official": True},
    {"id": "BitgetOfficial", "name": "Bitget", "handle": "BitgetOfficial", "followers": 1500000, "cat": "launchpad", "lang": "en", "official": True},
    # 中文 KOL
    {"id": "roocrypto", "name": "Roo", "handle": "roocrypto", "followers": 100000, "cat": "meme", "lang": "zh"},
    {"id": "btcdayu", "name": "BTC 大宇", "handle": "btcdayu", "followers": 200000, "cat": "meme", "lang": "zh"},
    {"id": "foresightnews", "name": "Foresight News", "handle": "ForesightNews", "followers": 250000, "cat": "news", "lang": "zh"},
    {"id": "chaincatcher", "name": "ChainCatcher", "handle": "ChainCatcher", "followers": 350000, "cat": "news", "lang": "zh"},
    {"id": "TechFlowPost", "name": "TechFlow", "handle": "TechFlowPost", "followers": 180000, "cat": "news", "lang": "zh"},
]


def try_nitter_rss(handle):
    """尝试 Nitter RSS 抓取 (免推特 API)"""
    nitter_instances = [
        "https://nitter.net",
        "https://nitter.privacydev.net",
        "https://nitter.poast.org",
    ]
    for base in nitter_instances:
        try:
            url = f"{base}/{handle}/rss"
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=10) as r:
                xml = r.read().decode("utf-8", errors="ignore")
            return parse_rss(xml)
        except Exception as e:
            continue
    return []


def parse_rss(xml):
    """简单 RSS 解析 (无 lxml 依赖)"""
    items = []
    # 匹配 <item>...</item>
    blocks = re.findall(r"<item>(.*?)</item>", xml, re.DOTALL)
    for b in blocks[:5]:  # 最多 5 条
        title = re.search(r"<title>(.*?)</title>", b, re.DOTALL)
        link = re.search(r"<link>(.*?)</link>", b, re.DOTALL)
        pub = re.search(r"<pubDate>(.*?)</pubDate>", b)
        desc = re.search(r"<description>(.*?)</description>", b, re.DOTALL)
        if title and link:
            items.append({
                "text": unescape(title.group(1))[:500],
                "url": unescape(link.group(1)),
                "published": pub.group(1) if pub else "",
                "description": unescape(desc.group(1))[:500] if desc else "",
            })
    return items


def extract_ticker(text):
    """提取 ticker (大写 2-8 字符, 或 $XXX 格式)"""
    tickers = set()
    # $XXX 格式
    for m in re.findall(r"\$([A-Z]{2,8})", text):
        tickers.add(m)
    # 单独大写词 (可能误报, 仅限 $ 前缀)
    return list(tickers)


def is_relevant(text):
    """是否相关 (新项目/alpha/mint/launch)"""
    text_lower = text.lower()
    keywords = [
        "new", "alpha", "launch", "mint", "ido", "tge", "presale", "whitelist",
        "gem", "early", "airdrop", "claim", "$", "ca:", "contract:",
        "新", "白名单", "首发", "空投",
    ]
    for kw in keywords:
        if kw in text_lower:
            return True
    # 包含 CA (合约地址 0x... 或 solana base58 32+ 字符)
    if re.search(r"0x[a-fA-F0-9]{40,}", text):
        return True
    if re.search(r"[1-9A-HJ-NP-Za-km-z]{32,}", text):
        return True
    return False


def fetch_kol_tweets():
    """主入口: 抓 20 个 KOL 的推文"""
    all_items = []
    for kol in KOL_LIST:
        try:
            tweets = try_nitter_rss(kol["handle"])
            for t in tweets:
                if is_relevant(t["text"]):
                    tickers = extract_ticker(t["text"])
                    all_items.append({
                        "kol": kol,
                        "tweet": t,
                        "tickers": tickers,
                    })
        except Exception as e:
            print(f"[kol] {kol['handle']} failed: {e}")
        time.sleep(0.3)  # 礼貌延迟
    return all_items


def ai_analyze_project(kol_name, kol_followers, tweet_text, tickers):
    """AI 风格的项目分析 (基于规则, 不调用 LLM 节省 token)"""
    score = 50
    pros = []
    cons = []
    verdict = "观望"
    verdict_color = "yellow"

    # KOL 信誉加分
    if kol_followers >= 1000000:
        score += 15
        pros.append(f"大V {kol_name} 推荐 ({kol_followers//1000}K 粉)")
    elif kol_followers >= 100000:
        score += 8
        pros.append(f"KOL {kol_name} ({kol_followers//1000}K 粉)")
    else:
        score -= 10
        cons.append(f"KOL {kol_name} 粉丝较少 ({kol_followers//1000}K)")

    # ticker 数量
    if len(tickers) == 0:
        score -= 20
        cons.append("未提及具体项目名/ticker")
    elif len(tickers) == 1:
        score += 5
        pros.append(f"明确提到 ${tickers[0]}")
    else:
        score += 3
        cons.append(f"提到多个 ticker ({len(tickers)} 个), 不够聚焦")

    # 文本特征
    text_lower = tweet_text.lower()
    if "alpha" in text_lower or "新" in tweet_text:
        score += 5
    if "whitelist" in text_lower or "白名单" in tweet_text:
        score += 8
        pros.append("提供白名单机会")
    if "free" in text_lower or "免费" in tweet_text:
        score += 10
        pros.append("免费机会")
    if "paid" in text_lower or "sponsored" in text_lower or "赞助" in tweet_text:
        score -= 15
        cons.append("疑似付费推广")
    if "guaranteed" in text_lower or "100x" in text_lower or "1000x" in text_lower or "必涨" in tweet_text:
        score -= 10
        cons.append("夸张宣传 (guaranteed/100x)")

    # 风险
    if score >= 75:
        verdict = "可参与"
        verdict_color = "green"
    elif score >= 60:
        verdict = "谨慎关注"
        verdict_color = "blue"
    elif score >= 40:
        verdict = "观望"
        verdict_color = "yellow"
    else:
        verdict = "不建议"
        verdict_color = "red"

    return {
        "score": max(0, min(100, score)),
        "verdict": verdict,
        "verdict_color": verdict_color,
        "pros": pros[:4],
        "cons": cons[:4],
    }


def main():
    now = datetime.utcnow().isoformat() + "Z"
    print(f"[{now}] 抓取 20 个 KOL 推文...")

    items_raw = fetch_kol_tweets()
    print(f"  -> 抓到 {len(items_raw)} 条相关推文")

    # AI 分析
    items = []
    for r in items_raw[:30]:  # 最多 30 条
        ai = ai_analyze_project(
            r["kol"]["name"],
            r["kol"]["followers"],
            r["tweet"]["text"],
            r["tickers"],
        )
        items.append({
            "kol": r["kol"],
            "tweet": r["tweet"],
            "tickers": r["tickers"],
            "ai": ai,
            "added_at": now,
        })

    # 按 AI 评分排序
    items.sort(key=lambda x: x["ai"]["score"], reverse=True)

    out = {
        "updated_at": now,
        "source": "20 推特大V 推文 + AI 分析",
        "items": items,
    }

    out_path = os.path.join(os.path.dirname(__file__), "data", "kol.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"  -> {out_path} ({len(items)} items)")


if __name__ == "__main__":
    main()
