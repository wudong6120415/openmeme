# OpenMeme.art — 今日打新关注 · Meme 雷达 · 热度突增

> 零预算币圈情报站, AI 实时聚合新 Meme 币 / IDO 打新 / 热度突增项目, 一键发推分享。

🌐 在线访问: <https://openmeme.art>
𝕏 关联账号: [@ruoxi01](https://x.com/ruoxi01)

## 📊 内容板块

| 板块 | 数据源 | 频率 |
|---|---|---|
| 🔥 **Meme 雷达** | DexScreener 公开 API (新上线 + 流动性过滤) | 每日 2-3 次 |
| 🚀 **打新关注** | 静态 / 手动维护 (IDO/ICO/IEO/NFT) | 每周 |
| 📈 **热度突增** | Coingecko 公开 trending | 每日 2-3 次 |

## 🛠 技术栈

- **静态站点** (HTML + CSS + JS, 无后端)
- **数据抓取**: Python `urllib` + 免费公开 API
- **托管**: Caddy + 你的云服务器 (43.156.175.175)
- **域名**: `openmeme.art` (腾讯云 DNSPod)
- **AI 驱动**: MiniMax-M3 (via Hermes Agent)
- **零预算**: 0 美元, 无第三方付费 API

## 📁 文件结构

```
openmeme/
├── index.html          # 主页
├── style.css           # 样式 (深色 + 金色高端风)
├── script.js           # 渲染 + 一键发推
├── fetch_data.py       # 数据抓取脚本
├── data/               # 抓取结果 (自动生成)
│   ├── meme.json
│   ├── ido.json
│   └── trending.json
├── .gitignore
└── README.md
```

## 🚀 本地运行

```bash
# 1. 抓取数据 (可选, 站点内置 demo fallback)
python3 fetch_data.py

# 2. 用任意 HTTP 服务器
python3 -m http.server 8080
# 访问 http://localhost:8080
```

## 🌐 部署

Caddy 自动服务 `/usr/share/caddy/openmeme/`, 配置:

```
openmeme.art {
    root * /usr/share/caddy/openmeme
    encode gzip
    file_server
    tls internal
}
```

Caddy 自动 HTTPS + Let's Encrypt 证书。

## ⏰ 自动化 (cron 任务)

建议每日 2-3 次抓取:

```cron
0 */6 * * * cd /usr/share/caddy/openmeme && python3 fetch_data.py >> /var/log/openmeme-fetch.log 2>&1
```

## 🤖 AI 集成 (MiniMax M3)

每日抓取后, 用 MiniMax M3:

1. **生成推文**: 基于 raw data 生成吸引人的中文推文
2. **风险标签**: 自动给每个项目打风险等级
3. **趋势解读**: 总结当日热点
4. **@ruoxi01 发推**: 一键发推按钮 (用户审核后)

## ⚠ 免责声明

本站所有内容仅供信息聚合与研究参考, **不构成任何投资建议**。
加密资产价格波动剧烈, Meme 币风险极高, 可能损失全部本金。
请 DYOR (Do Your Own Research), 自行评估风险。

## 📜 License

MIT
