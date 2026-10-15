"""
archive.py — 跟踪项目 + 3 天后归档
所有板块的 data/*.json 都会经过这里:
- 3 天前的项目 → archive
- 跟踪中的项目 → 更新进度
"""
import json
import os
import time
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
ARCHIVE_DIR = os.path.join(DATA_DIR, "archive")
os.makedirs(ARCHIVE_DIR, exist_ok=True)

# 3 天 = 72 小时
ARCHIVE_HOURS = 72

# 跟踪的板块 (含 launch_time 字段)
TRACKED_SECTIONS = ["meme", "nft", "inscription", "launchpad", "airdrop", "kol"]


def parse_time(item):
    """从 item 提取时间戳 (ms)"""
    # 优先用 launch_time / tge_time / mint_time
    for key in ["launch_time", "tge_time", "mint_time", "first_seen", "added_at", "minted_at"]:
        v = item.get(key)
        if v:
            try:
                if isinstance(v, (int, float)):
                    return float(v)
                # ISO format
                if isinstance(v, str):
                    if v.endswith("Z"):
                        v = v[:-1] + "+00:00"
                    return datetime.fromisoformat(v).timestamp() * 1000
            except Exception:
                pass
    # fallback: created_at / published
    for key in ["created_at", "published", "publish_time", "date", "ido_date"]:
        v = item.get(key)
        if v:
            try:
                if isinstance(v, str):
                    if v.endswith("Z"):
                        v = v[:-1] + "+00:00"
                    return datetime.fromisoformat(v).timestamp() * 1000
            except Exception:
                pass
    return None


def process_section(section):
    """处理单个板块: 归档超期项目"""
    path = os.path.join(DATA_DIR, f"{section}.json")
    if not os.path.exists(path):
        return 0, 0

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"[archive] {section} load failed: {e}")
        return 0, 0

    items = data.get("items", [])
    now_ms = time.time() * 1000
    cutoff = now_ms - ARCHIVE_HOURS * 3600 * 1000

    active = []
    archive = []

    for it in items:
        t = parse_time(it)
        if t and t < cutoff:
            # 3 天前 → 归档
            it["archived_at"] = datetime.utcnow().isoformat() + "Z"
            archive.append(it)
        else:
            active.append(it)

    # 写主文件
    data["items"] = active
    data["updated_at"] = datetime.utcnow().isoformat() + "Z"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 归档 (追加)
    if archive:
        archive_path = os.path.join(ARCHIVE_DIR, f"{section}.json")
        existing = []
        if os.path.exists(archive_path):
            try:
                with open(archive_path, "r", encoding="utf-8") as f:
                    existing = json.load(f).get("items", [])
            except Exception:
                pass
        existing.extend(archive)
        with open(archive_path, "w", encoding="utf-8") as f:
            json.dump({"updated_at": datetime.utcnow().isoformat() + "Z", "items": existing},
                      f, ensure_ascii=False, indent=2)

    return len(active), len(archive)


def main():
    print(f"[{datetime.utcnow().isoformat()}Z] 归档检查 (>{ARCHIVE_HOURS}h)...")
    total_active, total_archived = 0, 0
    for sec in TRACKED_SECTIONS:
        active, archived = process_section(sec)
        print(f"  {sec}: 活跃 {active} / 归档 {archived}")
        total_active += active
        total_archived += archived
    print(f"  ---\n  总: 活跃 {total_active} / 归档 {total_archived}")


if __name__ == "__main__":
    main()
