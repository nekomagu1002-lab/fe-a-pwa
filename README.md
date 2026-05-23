# FE科目A 4択トレーニング PWA

基本情報技術者試験（FE）科目A向けの、スマホで使う軽量な4択学習PWAです。

## ファイル構成

```text
FE-A-PWA/
  index.html
  manifest.webmanifest
  sw.js
  README.md
  css/
    styles.css
  js/
    app.js
  data/
    questions.json
  tools/
    upgrade_questions_quality.js
    fix_quality_cases.js
  assets/
    icons/
      icon.svg
      icon-180.png
      icon-192.png
      icon-512.png
```

## 問題を追加する場所

問題は `data/questions.json` の `questions` 配列に追加します。

```json
{
  "id": "fe-a-sample-006",
  "category": "データベース",
  "difficulty": "基本",
  "question": "問題文をここに書きます。",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "answerIndex": 0,
  "explanation": "解説をここに書きます。"
}
```

`answerIndex` は正解の選択肢番号です。最初の選択肢が `0`、2番目が `1`、3番目が `2`、4番目が `3` です。

## iPhoneでホーム画面に追加する流れ

1. HTTPS対応のサーバー、またはローカル確認なら `localhost` で `index.html` を開く
2. Safariの共有ボタンを押す
3. 「ホーム画面に追加」を選ぶ

PWAのオフラインキャッシュは `sw.js` が担当します。問題やファイルを変更したあと反映されにくい場合は、`sw.js` の `CACHE_NAME` を変更してください。

## 成績保存

成績はブラウザの `localStorage` に `feAQuizStats.v1` というキーで保存します。

- 総回答数
- 正解数
- 問題IDごとの回答回数、正解回数、最終回答日時
- 問題IDごとの回答履歴

画面の「成績をリセット」ボタンで保存済み成績を削除できます。

## 復習モード

不正解だった問題は `localStorage` の問題ID別成績に `needsReview: true` として残ります。
「復習モード」ボタンを押すと、復習対象の問題だけをランダム順で出題します。
復習モードまたは通常モードで正解すると、その問題は復習リストから外れます。

## 機能メニュー

画面右上のメニューボタンから、通常出題、復習モード、カテゴリ別出題、成績表示、成績リセット、ヘルプ / バージョン情報を開けます。
スマホ画面で邪魔になりにくいよう、下部シート形式のメニューにしています。

## バージョン履歴

- v0.1.0 初期版 5問
- v0.2.0 30問化
- v0.3.0 ランダム出題・選択肢シャッフル
- v0.4.0 成績保存
- v0.5.0 100問化
- v0.6.0 復習モード
- v0.7.0 メニュー・ヘルプ追加・カテゴリ別出題
- v0.8.0 ダークモード
- v1.0.0 問題品質改善・安定版
