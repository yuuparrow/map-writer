# ✍ MapWriter

移動しながら地図に文字・絵を書くWebアプリ。

## 機能

- 📌 **スタンプモード** — 現在地にテキストや絵文字を配置
- 🚶 **移動で描くモード** — GPSで移動した軌跡に沿って文字を描く
- 🎨 カラーとサイズの選択
- 💾 ローカルストレージで自動保存

## セットアップ

```bash
npm install
npm run dev
```

## Cloudflare Pages デプロイ

1. GitHubにPush
2. Cloudflare Pages ダッシュボードで New Project
3. リポジトリを選択
4. Build command: `npm run build`
5. Build output directory: `dist`
6. デプロイ完了！

## 技術スタック

- React 18 + Vite
- Leaflet.js / react-leaflet
- OpenStreetMap タイル（無料）
- Geolocation API
- localStorage（データ永続化）
