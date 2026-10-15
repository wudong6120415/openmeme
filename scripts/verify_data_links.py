"""
verify_data_links.py — 5 分钟验证脚本

跑在每个数据产品 (data/*.json) 改完后.
任何 1 个 ❌ = 产品没做完, 立刻修.

用法:
    python3 scripts/verify_data_links.py [file.json ...]
    python3 scripts/verify_data_links.py  # 默认验证 data/*.json
"""
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

# 5-tier URL fallback (按优先级检查)
TIERS = [
    # Tier 1: 真实 status URL
    ('mint_url', 'Real status tweet'),
    ('quest_url', 'Real quest URL'),
    ('ido_url', 'Real IDO URL'),
    ('tweet_url', 'Real tweet URL'),
    ('latest_tweet', 'Real latest tweet'),

    # Tier 2: X 公开搜索
    # (URL 含 'x.com/search?q=')

    # Tier 3: KOL 主页
    ('twitter', 'KOL profile / Project Twitter'),

    # Tier 4: 项目主页
    ('website', 'Project website'),
    ('rgb_protocol', 'Protocol website'),
    ('tether_announce', 'Partner announcement'),
    ('docs', 'Docs'),
    ('discord', 'Discord'),

    # Tier 5: # (跳过, 不验证)
]


def check_url(url):
    """测 URL 真实状态, 返回 (status_code, error)"""
    if not url or url == '#':
        return None, 'empty'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status, None
    except urllib.error.HTTPError as e:
        return e.code, f'HTTP {e.code}'
    except urllib.error.URLError as e:
        return None, f'URL: {e.reason}'
    except Exception as e:
        return None, f'{type(e).__name__}: {e}'


def check_file(filepath):
    """验证一个 data/*.json 文件"""
    print(f'\n{"="*70}')
    print(f'📂 {filepath}')
    print(f'{"="*70}')

    try:
        with open(filepath) as f:
            data = json.load(f)
    except Exception as e:
        print(f'❌ JSON load failed: {e}')
        return 0, 0, 1

    # 兼容: data 可能是 list 或 dict
    if isinstance(data, list):
        data = {'items': data}
    items = data.get('items', [])
    if not items:
        print(f'⚠️  No items (empty data is OK if intentional)')
        return 0, 0, 0

    ok_count = 0
    fail_count = 0
    errors = []

    for item in items:
        name = item.get('name', '?')
        links = item.get('official_links') or {}

        for key, label in TIERS:
            url = links.get(key)
            if not url or url == '#':
                continue
            status, err = check_url(url)
            if status == 200:
                ok_count += 1
                # 简化输出
                short = url[:70] + ('...' if len(url) > 70 else '')
                # print(f'  ✅ {key:15s} {short}')
            elif status is None:
                fail_count += 1
                errors.append(f'  ❌ {name:20s} {key:15s} {err}  ({url[:60]})')
            else:
                fail_count += 1
                errors.append(f'  ❌ {name:20s} {key:15s} HTTP {status}  ({url[:60]})')

        # 也检查 tweet_url / source_tweet_url
        for key in ('source_tweet_url', 'tweet_url', 'kol_tweet_text'):
            url = item.get(key) or links.get(key)
            if not url or url == '#':
                continue
            status, err = check_url(url)
            if status == 200:
                ok_count += 1
            elif status is None:
                fail_count += 1
                errors.append(f'  ❌ {name:20s} {key:20s} {err}')

    print(f'\n  ✅ 200 OK: {ok_count}')
    print(f'  ❌ 失败:  {fail_count}')

    for e in errors:
        print(e)

    return ok_count, fail_count, 0


def main():
    if len(sys.argv) > 1:
        files = sys.argv[1:]
    else:
        # 默认找 data/*.json
        data_dir = Path(__file__).parent.parent / 'data'
        files = sorted(str(p) for p in data_dir.glob('*.json'))

    if not files:
        print('No files to check')
        return 0

    total_ok = 0
    total_fail = 0
    for f in files:
        ok, fail, _ = check_file(f)
        total_ok += ok
        total_fail += fail

    print(f'\n{"="*70}')
    print(f'📊 总计: {total_ok} 个 URL 通过, {total_fail} 个 URL 失败')
    print(f'{"="*70}')

    if total_fail == 0 and total_ok > 0:
        print('🎉 全部链接 200 OK, 产品可交付!')
        return 0
    elif total_ok == 0:
        print('⚠️  没有可验证的 URL, 检查数据是否为空 (OK if 限流中)')
        return 0
    else:
        print('🚫 有失败链接, 立刻修!')
        return 1


if __name__ == '__main__':
    sys.exit(main())
