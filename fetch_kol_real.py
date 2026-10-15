"""
fetch_kol_real.py — 真实抓 21 个 KOL 推文
- 用 Scweet 库
- 过滤相关推文 (含 mint/launch/alpha/airdrop/$)
- AI 分析 (基于 KOL 信誉)
- 写入 data/kol.json
"""
import asyncio
import json
import os
import re
import time
from datetime import datetime
from Scweet import Scweet

# === 21 个 KOL (基于公开资料) ===
KOLS = [
    # Meme
    {"handle": "blknoiz06", "name": "blknoiz06", "followers": 155000, "cat": "meme", "lang": "en", "verified": True},
    {"handle": "thecryptocoin", "name": "The Crypto Coin", "followers": 200000, "cat": "meme", "lang": "en"},
    {"handle": "CryptoGems", "name": "Crypto Gems", "followers": 380000, "cat": "meme", "lang": "en", "verified": True},
    # DeFi
    {"handle": "Cobie", "name": "Cobie", "followers": 700000, "cat": "defi", "lang": "en", "verified": True},
    {"handle": "DefiIgnas", "name": "DefiIgnas", "followers": 280000, "cat": "defi", "lang": "en", "verified": True},
    {"handle": "Route2FI", "name": "Route2FI", "followers": 120000, "cat": "defi", "lang": "en"},
    # NFT
    {"handle": "NFTbillionaire", "name": "NFTbillionaire", "followers": 200000, "cat": "nft", "lang": "en"},
    {"handle": "Zeneca", "name": "Zeneca", "followers": 195000, "cat": "nft", "lang": "en", "verified": True},
    {"handle": "punk6529", "name": "punk6529", "followers": 340000, "cat": "nft", "lang": "en", "verified": True},
    # BTC
    {"handle": "LeonidasNFT", "name": "Leonidas", "followers": 240000, "cat": "btc", "lang": "en", "verified": True},
    {"handle": "RuneAlpha", "name": "Rune Alpha", "followers": 80000, "cat": "btc", "lang": "en"},
    {"handle": "OrdinalHub", "name": "Ordinal Hub", "followers": 95000, "cat": "btc", "lang": "en", "verified": True},
    # Launchpad 官方
    {"handle": "heyibinance", "name": "Binance Wallet", "followers": 1100000, "cat": "launchpad", "lang": "en", "verified": True, "official": True},
    {"handle": "okx", "name": "OKX", "followers": 5800000, "cat": "launchpad", "lang": "en", "verified": True, "official": True},
    {"handle": "Bybit_Official", "name": "Bybit", "followers": 5200000, "cat": "launchpad", "lang": "en", "verified": True, "official": True},
    {"handle": "BitgetOfficial", "name": "Bitget", "followers": 1600000, "cat": "launchpad", "lang": "en", "verified": True, "official": True},
    # 中文
    {"handle": "roocrypto", "name": "Roo", "followers": 100000, "cat": "meme", "lang": "zh"},
    {"handle": "btcdayu", "name": "BTC 大宇", "followers": 200000, "cat": "defi", "lang": "zh", "verified": True},
    {"handle": "foresightnews", "name": "Foresight News", "followers": 250000, "cat": "news", "lang": "zh", "verified": True, "official": True},
    {"handle": "ChainCatcher", "name": "ChainCatcher", "followers": 350000, "cat": "news", "lang": "zh", "verified": True, "official": True},
    {"handle": "TechFlowPost", "name": "TechFlow", "followers": 180000, "cat": "news", "lang": "zh", "official": True},
]

# 相关推文关键词
RELEVANT_KW = [
    "new", "alpha", "mint", "launch", "airdrop", "claim", "ido", "tge",
    "whitelist", "wl", "presale", "gem", "early", "ca:", "contract:",
    "pump", "meme", "nft", "inscription", "runes", "brc20",
    "上线", "白名单", "首发", "空投", "撸毛",
]

# 排除关键词 (replies/retweets)
EXCLUDE_KW = ["rt @", "re @"]


def is_relevant(text):
    """是否相关"""
    if not text:
        return False
    text_lower = text.lower()
    # 排除纯 RT / reply
    for kw in EXCLUDE_KW:
        if text_lower.startswith(kw):
            return False
    # 包含相关关键词
    for kw in RELEVANT_KW:
        if kw in text_lower:
            return True
    # 含 CA 合约 (0x 开头 40+ 字符)
    if re.search(r"0x[a-fA-F0-9]{40,}", text):
        return True
    # 含 $XXX ticker
    if re.search(r"\$[A-Z]{2,8}\b", text):
        return True
    return False


def extract_ticker(text):
    """提取 ticker"""
    tickers = re.findall(r"\$([A-Z]{2,8})\b", text)
    return list(set(tickers))


def ai_score_tweet(kol_info, tweet_text, tickers):
    """AI 评分"""
    score = 50
    pros = []
    cons = []

    # 官方账号加分
    if kol_info.get("official"):
        score += 20
        pros.append("✓ 官方账号, 100% 真实")
    if kol_info.get("verified"):
        score += 8
        pros.append("✓ 推特蓝标")

    # 粉丝
    f = kol_info.get("followers", 0)
    if f >= 1000000:
        score += 8
        pros.append(f"✓ 大V ({f//1000}K 粉)")
    elif f >= 200000:
        score += 5
        pros.append(f"✓ 知名 KOL ({f//1000}K 粉)")

    # ticker 数量
    if len(tickers) >= 1:
        score += 5
        pros.append(f"✓ 明确提到 ${', $'.join(tickers[:3])}")

    # 关键词加分
    text_lower = tweet_text.lower()
    if "alpha" in text_lower or "新" in tweet_text:
        score += 3
    if "whitelist" in text_lower or "白名单" in tweet_text:
        score += 5
        pros.append("✓ 提供白名单机会")
    if "free" in text_lower or "免费" in tweet_text:
        score += 5
        pros.append("✓ 免费机会")
    if "paid" in text_lower or "sponsored" in text_lower:
        score -= 10
        cons.append("⚠ 疑似付费推广")
    if "guaranteed" in text_lower or "100x" in text_lower or "1000x" in text_lower:
        score -= 10
        cons.append("⚠ 夸张宣传")

    cons.append(f"⚠ 来自 @{kol_info['handle']}, 需自行核实")

    if score >= 75:
        verdict = "可参与"
        color = "green"
    elif score >= 60:
        verdict = "谨慎关注"
        color = "blue"
    else:
        verdict = "观望"
        color = "yellow"

    return {
        "score": max(0, min(100, score)),
        "verdict": verdict,
        "verdict_color": color,
        "pros": pros[:4],
        "cons": cons[:3],
    }


async def main():
    # === 从安全 env 文件读 cookie (用户长期授权) ===
    env_path = os.path.expanduser("~/.hermes/secrets/twitter.env")
    if not os.path.exists(env_path):
        raise FileNotFoundError(
            f"❌ Cookie 文件不存在: {env_path}\n"
            f"   请先创建: mkdir -p ~/.hermes/secrets && touch ~/.hermes/secrets/twitter.env\n"
            f"   然后写入: TWITTER_AUTH_TOKEN=你的auth_token"
        )
    # 加载 env (不污染全局环境)
    env_vars = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip()

    TWITTER_AUTH = env_vars.get("TWITTER_AUTH_TOKEN")
    if not TWITTER_AUTH:
        raise ValueError("TWITTER_AUTH_TOKEN 未设置")
    # ========================================

    now = datetime.utcnow().isoformat() + "Z"
    print(f"[{now}] 抓取 21 KOL 真实推文 (Scweet)")

    s = Scweet(auth_token=TWITTER_AUTH)

    all_items = []
    kol_status = {}

    for kol in KOLS:
        handle = kol["handle"]
        # 重试 3 次, 指数退避
        tweets = None
        for attempt in range(3):
            try:
                tweets = await s.aget_profile_tweets(
                    users=[handle],
                    limit=15
                )
                if tweets is not None:
                    break
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "rate" in err_str.lower():
                    wait = 60 * (attempt + 1)
                    print(f"  @{handle}: 限流, 等 {wait}s (尝试 {attempt+1}/3)")
                    await asyncio.sleep(wait)
                else:
                    print(f"  @{handle}: ❌ {e}")
                    break

        if not tweets:
            kol_status[handle] = {"ok": 0, "relevant": 0}
            print(f"  @{handle}: 0 条")
            await asyncio.sleep(3)  # 失败也延迟
            continue

        # 找最新 1 条相关推文 (避免重复)
        relevant_added = 0
        for t in tweets:
            if not isinstance(t, dict):
                continue
            text = t.get("text", t.get("full_text", ""))
            if not is_relevant(text):
                continue

            tickers = extract_ticker(text)
            ai = ai_score_tweet(kol, text, tickers)

            # 推文 ID 用于 URL
            tweet_id = t.get("id_str") or t.get("id") or t.get("tweet_id", "")
            tweet_url = f"https://x.com/{handle}/status/{tweet_id}" if tweet_id else f"https://x.com/{handle}"

            # 时间
            ts = t.get("created_at", "")
            published = ts if ts else ""

            item = {
                "id": f"kol_{handle}_{tweet_id}",
                "kol": {
                    "id": handle,
                    "name": kol["name"],
                    "handle": handle,
                    "followers": kol["followers"],
                    "verified": kol.get("verified", False),
                    "official": kol.get("official", False),
                    "cat": kol["cat"],
                    "lang": kol.get("lang", "en"),
                },
                "tweet": {
                    "text": text,
                    "url": tweet_url,
                    "published": published,
                },
                "tickers": tickers,
                "ai": ai,
                "added_at": now,
            }
            all_items.append(item)
            relevant_added += 1
            if relevant_added >= 2:  # 每 KOL 最多 2 条
                break

        kol_status[handle] = {"ok": len(tweets), "relevant": relevant_added}
        print(f"  @{handle}: 总 {len(tweets)} / 相关 {relevant_added}")

        # 关键: 加大延迟防限流 (3 秒)
        await asyncio.sleep(3)

    # 按 AI 评分排序
    all_items.sort(key=lambda x: x["ai"]["score"], reverse=True)

    output = {
        "updated_at": now,
        "source": "Scweet 抓取 21 KOL 真实推文 (实时, 用你的 auth_token 一次性抓取)",
        "fetch_method": "Scweet 5.5.0 (https://github.com/Altimis/Scweet)",
        "kol_status": kol_status,
        "total_relevant": len(all_items),
        "items": all_items,
    }

    # 写入文件
    out_path = os.path.join(os.path.dirname(__file__), "data", "early.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 写入 {out_path}: {len(all_items)} 条相关推文")
    print(f"   KOL 覆盖: {len([h for h, r in kol_status.items() if r.get('relevant', 0) > 0])}/{len(KOLS)}")

    # === 不销毁 cookie (用户授权长期使用) ===
    # 但函数作用域结束, 内存中变量会被回收
    # ============================================


if __name__ == "__main__":
    asyncio.run(main())
