# おひさまポータル　（公開用）

日向坂46の関連コンテンツを、YouTube・TVerを中心に横断検索できるポータルサイトです。  
配信終了が近い情報の可視化と、メンバー・種別・キーワードでの絞り込みを組み合わせ、探しやすさと回遊性を高めています。

こちらは公開用の為、データはすべて架空です。

## プロジェクト概要

- Next.js(App Router) + TypeScriptで構築したフロントエンド中心の構成
- `/almost-over` を起点に「見逃し防止」を重視した導線設計
- `/:type` と `/:type/member/:member` によるシンプルなURL設計
- 旧URLからのリダイレクトを実装し、運用中の導線変更にも対応
- 1つの画面で種別・メンバー・キーワードを組み合わせて絞り込み可能

## 設計上の特色

- 公開ページのメタ情報は canonical / Open Graph / robots / sitemap / JSON-LD まで一貫して管理
- 利用状況の観測ポイントとして Vercel Analytics を組み込み、改善判断に必要な情報を取りやすく整理
- CSP, HSTS, X-Frame-Options などのヘッダーを `next.config.mjs` で明示し、運用時の方針をコード側で共有
- データ定義と絞り込みロジックを分離し、機能追加時の変更範囲が読み取りやすい構成
- Playwright のE2Eを前提に、主要導線を継続的に確認できる形に整備

## 技術スタック

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Playwright(E2E)
- Vercel Analytics

## 主要ページ

- `/almost-over`: 3日以内に配信終了するコンテンツ一覧
- `/all`: 全コンテンツ一覧
- `/:type`: 種別ごとの一覧
- `/:type/member/:member`: メンバー別の一覧
- `/about`: サイト情報と問い合わせ先

## セットアップ

1. 依存関係をインストール: `npm ci`
2. 開発サーバーを起動: `npm run dev`

## SEO関連の環境変数

- `NEXT_PUBLIC_SITE_URL`: canonical / Open Graph / sitemap / 構造化データのURL生成に使用
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: Google Search Console用のmetaタグ出力に使用

## テスト

- Smoke tests: `npm run test:e2e:smoke`
- Full tests: `npm run test:e2e`
- Report: `npm run test:e2e:report`
