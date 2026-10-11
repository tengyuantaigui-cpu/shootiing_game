# STAR CREDIT PWA実装報告

## 今回の変更ファイル

| ファイル | 変更内容 |
| --- | --- |
| `manifest.webmanifest` | 名前、起動URL、scope、standalone表示、縦向き、背景色、アイコン |
| `index.html` | manifestリンク、Appleホーム画面用メタタグ、180pxアイコン、テーマ色 |
| `src/assets/icons/apple-touch-icon.png` | iPhone用180px不透明PNG |
| `src/assets/icons/icon-192.png` / `icon-512.png` | Webアプリ用PNG。自機はmaskable安全領域内 |
| `tools/generate-icons.mjs` | 既存の自機ドット絵からPNGを再生成する依存不要のスクリプト |
| `tools/prepare-publication.mjs` | 実行資産だけを `dist/` にコピー |
| `package.json` / `.gitignore` | `npm run build`、生成した `dist/` のGit除外 |
| `server.js` | manifest／PNGのContent-Type追加。既存のポート・LAN待受設定を維持 |
| `tests/pwa.test.js` | PWA回帰テスト4件 |
| `README.md` / `docs/pwa-report.md` | HTTPS公開、ホーム画面への追加、確認手順 |

この作業では戦闘・モード・入力・保存のJavaScriptとCSSを変更していない。先行フェーズの作業は維持した。スマホ用の相対ドラッグ、2段ボタン、四辺のセーフエリア、動的ビューポート高さをそのまま使用する。Service Workerを登録せず、オフライン動作を提供しない。

## 確認済み

- 変更前：既存63件すべて成功。
- 変更後：Node `--test`、67件成功、失敗・スキップ0。既存63件と追加4件。
- 追加テスト：manifestとHTMLの設定整合性、PNGの寸法・展開・全画素の不透明性・maskable安全領域、公開物の限定と全srcファイルの完全一致、実際の開発サーバーハンドラーのContent-Type。
- `tools/prepare-publication.mjs` の実行成功。`dist/` はHTML・manifest・srcのみを含む。証明書やHTTPSサーバーはこのスクリプトでは作成しない。
- 180pxアイコンの画像を目視し、暗い背景に既存の自機が表示されることを確認。
- 新しいサーバーのHTTP配信設定はハンドラーの自動テストで検証。現在起動中の開発サーバーや公開先の実HTTP応答を検証したものではない。

## 未確認と実機検証手順

以下は未確認であり、完了扱いにしていない。HTTPS公開後、iPhone SE等の小型端末とノッチ／Dynamic Island端末で実施し、機種・iOSバージョン・公開URL・結果を記録する。

1. SafariでHTTPS URLを開き、通信エラーなくタイトルが出る。manifest・全アイコン・JS・CSSがHTTP 200で正しいContent-Typeを返す。
2. 共有→ホーム画面に追加。Webアプリとして開く設定がある場合はオン。名前と自機アイコンを確認する。
3. アイコンから起動し、アドレスバーのない表示になる。閉じて再起動しても同じURLから起動する。
4. 縦画面でHUD・自機・主要ボタンが同時に見え、ノッチ・ステータスバー・ホームインジケーターと重ならない。ショップや図鑑のスクロールも確認する。
5. 移動指とチャージ指を同時に使い、誤発射、ページスクロール、ズーム、文字選択、長押しメニューが出ない。回転・アプリ切替・復帰で入力が残らず、明示再開できる。
6. クラシック・チャレンジ・エンドレスを起動し、プレイ・ショップ・ポーズ・リトライ・結果を確認する。通常のPCブラウザでもキーボード／実ゲームパッドを確認する。
7. ホーム画面アプリ内で記録・音量・操作・演出・スキン設定を保存し、閉じて再起動後に復元される。Safari側の既存保存も保持されている。Safariとホーム画面の保存共有や既存データ移行は保証せず、今回移行機能は実装していない。
8. HTTPS公開先の証明書・全資産の配信・更新反映を確認する。オフライン起動を合格条件にはしない。

追加手順は [Apple](https://support.apple.com/ja-jp/guide/iphone/iphea86e5236/ios)、Safariとホーム画面アプリの保存領域の注意は [WebKit](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)を参照。
