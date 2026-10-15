# OpenMeme.art — 今日打新关注 · Meme 雷达 · 热度突增

> 零预算币圈情报站, AI 实时聚合新 Meme 币 / IDO 打新 / 热度突增项目, 一键发推分享。

🌐 **在线访问**: <https://openmeme.art>
𝕏 **关联账号**: [@ruoxi01](https://x.com/ruoxi01)
🐙 **源码**: <https://github.com/wudong6120415/openmeme>

![OpenMeme](https://openmeme.art/og-image.png)

## 📊 内容板块

| 板块 | 数据源 | 频率 |
|---|---|---|
| 🔥 **Meme 雷达** | DexScreener 公开 API (新上线 + 流动性 + 量过滤) | 每日 3 次 (cron) |
| 🚀 **打新关注** | 静态精选 (Plasma/Megaeth/Monad/Hyperliquid 等) | 每周 |
| 📈 **热度突增** | Coingecko 公开 trending | 每日 3 次 (cron) |

## 🛠 技术栈

- **静态站点** (HTML + CSS + JS, 0 后端)
- **数据抓取**: Python `urllib` + 免费公开 API
- **托管**: Caddy + 你的云服务器 (43.156.175.175)
- **域名**: `openmeme.art` (腾讯云 DNSPod)
- **AI 驱动**: MiniMax M3 (via Hermes Agent)
- **零预算**: 0 美元, 无第三方付费 API

## 📁 文件结构

```
openmeme/
├── index.html          # 主页 (含 SEO meta + OG image)
├── style.css           # 样式 v2 (深色 + 金色高端风 + 动效)
├── script.js           # 渲染 + 一键发推 + 状态管理
├── og-image.png        # 社交分享卡 (1200x630)
├── fetch_data.py       # 数据抓取脚本
├── data/               # 抓取结果 (自动生成, .gitignore)
│   ├── meme.json
│   ├── ido.json
│   └── trending.json
├── .gitignore
└── README.md
```

## 🚀 本地运行

```bash
# 1. 抓取数据 (可选, 站点内置 fallback)
python3 fetch_data.py

# 2. 用任意 HTTP 服务器
python3 -m http.server 8080
# 访问 http://localhost:8080
```

## 🌐 部署 (当前)

Caddy 自动服务 `/usr/share/caddy/openmeme/`, 配置:

```
openmeme.art, www.openmeme.art {
    root * /usr/share/caddy/openmeme
    encode gzip
    file_server
}
```

Caddy 自动 HTTPS + Let's Encrypt 证书。

## ⏰ 自动化 (cron)

每 8 小时自动抓取 + 部署:

```bash
# /home/ubuntu/.hermes/scripts/openmeme-fetch.sh
# crontab: 30 */8 * * *
```

脚本流程:
1. `cd /usr/share/caddy/openmeme`
2. `python3 fetch_data.py` (覆盖 data/*.json)
3. 写日志到 `~/.hermes/logs/openmeme-fetch.log`

## 📊 数据流

```
[DexScreener] → fetch_data.py → data/meme.json
[Coingecko]   → fetch_data.py → data/trending.json
[Static]      → fetch_data.py → data/ido.json
                       ↓
              Caddy 静态服务
                       ↓
            https://openmeme.art
```

## 🤖 AI 集成 (MiniMax M3)

每日抓取后, MiniMax M3 可以:

1. **生成推文草稿**: 基于 raw data 生成吸引人的中文推文
2. **风险标签**: 自动给每个项目打风险等级
3. **趋势解读**: 总结当日热点
4. **@ruoxi01 发推**: 一键发推按钮 (用户审核后)

## ⚠ 免责声明

本站所有内容仅供<strong>信息聚合与研究参考</strong>, <strong>不构成任何投资建议</strong>。

- 加密资产价格波动剧烈, **可能损失全部本金**
- Meme 币风险极高, 多数最终归零
- 请 **DYOR** (Do Your Own Research), 自行评估风险
- 数据来自第三方公开 API, 不保证 100% 准确

## 📜 License

MIT

## 🆕 更新日志

- **v2.0 (2026-10-15)**: 精打细磨版
  - DexScreener search API 修复
  - 4 卡片统计条
  - 完整数据网格 + 风险标签
  - Loading skeleton / Empty / Error 状态
  - Header 滚动 + Back-to-top
  - SEO meta + OG image
  - 全响应式
- **v1.0 (2026-10-15)**: 初始版本
