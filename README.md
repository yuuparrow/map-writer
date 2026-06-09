# MapWriter — 歩いて地図に文字を描くGPSアートナビ

スマホで使うWebアプリです。描きたい文字を入力すると、文字の輪郭を地図上のルート(下書き)に変換し、実際に歩いてなぞるためのナビを行います。

## 使い方

1. **文字を入力** — 描きたい文字(日本語・英数字、最大10文字)と文字の高さ(100〜2000m)を指定
2. **ルート作成** — 現在地を中心に文字が自動配置され、各画が徒歩ルート(OSRM)で道路にスナップされます。道路に沿わせられない画は直線(オレンジ表示)のままになります
3. **ナビ開始** — 方位矢印・残り距離・進捗に従って歩きます。画と画の間(破線)は自由に移動してOK。ルートを35m以上外れると警告が出ます
4. **完成** — 赤い軌跡があなたの描いた文字です。スクリーンショットで保存してください

## 技術構成

- React 18 + TypeScript + Vite
- 地図: [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) タイル(無料)
- ルーティング: [OSRM 徒歩プロファイル](https://routing.openstreetmap.de/)(無料・APIキー不要)
- 文字解析: Canvasに描画した文字からマーチングスクエア法で輪郭を抽出し、Douglas-Peuckerで簡略化
- ナビ: Geolocation API + DeviceOrientation(方位)+ Wake Lock(画面常時点灯)
- すべてクライアントサイドで動作。サーバーコード・APIキー・課金要素なし

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm test           # 単体テスト (vitest)
npm run build      # 型チェック + ビルド → dist/
npm run preview    # wrangler dev で本番同等の配信を確認
```

### デバッグ用URL

- `http://localhost:5173/?debug=glyph` — 文字→輪郭抽出の確認ページ
- `http://localhost:5173/?sim=1` — GPSシミュレータ。実際に歩かずにナビ全フローを確認できます(再生/速度1〜20倍/逸脱ボタン)

## Cloudflare Workers へのデプロイ(無料枠)

[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) を使った静的配信のみの構成です。静的アセットへのリクエストは無料・無制限で、Workers無料枠の10万リクエスト/日を消費しません。

```bash
npx wrangler login   # 初回のみ(ブラウザでCloudflareアカウントに認証)
npm run deploy       # ビルドして https://map-writer.<あなたのサブドメイン>.workers.dev に公開
```

> **注意**: Geolocation APIはHTTPS必須です。workers.devのURLはHTTPSなのでそのまま動きます。

### OSRMのCORSが使えなくなった場合

現在 `routing.openstreetmap.de` は `Access-Control-Allow-Origin: *` を返すためプロキシ不要です。もし将来CORSが制限された場合は、`wrangler.jsonc` に `"main": "worker/index.ts"` と `"run_worker_first": ["/api/*"]` を追加し、`/api/route` → OSRM のパススルーWorkerを書いてください(無料枠で十分動作します)。

## 制限事項

- OSRM公開デモサーバーを使用しているため、大量アクセス時はレート制限される可能性があります(アプリ側でリクエストを直列化・300ms間隔に制御済み)
- 文字の形の再現度は周辺の道路網に依存します。碁盤目状の市街地ほどきれいに描けます
