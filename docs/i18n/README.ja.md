# Main Bareng · Soforia

[Indonesia](../../README.md) · [English](README.en.md) · [Español](README.es.md) · [Português](README.pt.md) · **日本語** · [简体中文](README.zh-CN.md)

2人で遊ぶためのローカルゲームコンソールです。ノートPCが共通画面と権威サーバーを担当し、同じLANにつながる2台のスマートフォンのブラウザーをコントローラーとして使います。ビルド後のプレイにクラウドアカウントやインターネットは不要です。

## 起動

Node.js **20.19以上**、npm、WebGL対応のPCブラウザーが必要です。ランチャーの主な対象はLinuxです。

```sh
npm ci
npm run check
npm test
npm run build
./play.sh
```

ターミナルに表示されるPC用URLを開き、2台のスマートフォンでQRを読み取ります。PCのlocalhost URLをスマートフォンで開かないでください。どちらのプレイヤーもゲームを選んで開始できます。サーバーのみ起動する場合は `npm start` を使います。[オフライン手順](../../RUN-OFFLINE.md)も参照してください。古い配布パッケージには最新ソースの変更が自動で入りません。

Orbitは光を集める協力ゲーム、Gardenは栽培と収穫の分担、Seiramaは公開まで回答を秘密にするゲーム、Cityは不動産対戦です。Glassには60のチャレンジ構成、交互に変わる6つの環境、物理障害物、動く機械、ローカル音楽と効果音があります。持ち上げる、下げる、回転、ジャンプを協力して使います。指定角度の強制や接触のない破損判定はありません。最後のチェックポイントから次のステージへ即座に移ります。

プレイヤー1の **♫** は共通音声、PCの **M** はローカルのミュートです。Glassのキーボードテストは、参加枠が空のメニューで **F2**、説明と開始に **Enter**、終了に **F3**。[操作一覧](../18-kaca-keyboard.md)。

## モジュール単位で参加

最初に [AGENTS](../../AGENTS.md)、[AI向け経路案内](../architecture/AI-START.md)、[共同開発ガイド](../../collaboration_guide.md)を読んでください。1つのPRは1つのscopeに限定します。ゲームの変更先は `src/games/<id>/`、メニューは `src/dashboard/` です。他のゲームや共通APIをついでに変更しないでください。

```sh
npm run game:new -- --id comet --title "ふたりのコメット"
npm run change:new -- --scope game:comet --summary "コメットを追加"
npm test -- --scope game:comet
npm run check
npm run build
npm run check:scope -- --working
```

manifestから自動登録するため、中央リストの編集は不要です。各ゲームはサーバー、画面、コントローラー、HUD、CSS、素材、テスト、状態記録を所有します。[追加手順](../architecture/ADD-GAME.md)。全AIが指示を読み守る保証はありません。自動チェックと所有者レビューで検査可能な境界を守ります。GitHubのブランチ保護は所有者による設定が必要です。

コードと独自音声・形状は [MIT](../../LICENSE)、外部モデルは[個別ライセンス](../../public/assets/ATTRIBUTION.md)です。有効なQR、セッション秘密情報、非公開回答は投稿しないでください。[行動規範](../../CODE_OF_CONDUCT.md)を守ってください。自動テストは実機2台、楽しさ、FPS、入力から表示までの遅延を証明しません。[ロードマップ](../09-roadmap.md)で現状を確認できます。[任意の支援](https://trakteer.id/oskhar)は利用条件ではありません。
