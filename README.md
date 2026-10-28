# 週末重賞マスターピース Webダッシュボード
『競馬ジークンドー 統合理論』(theory-v8.00 / SOTA v12.1) に基づく重賞クオンツ・アナリティクスWeb端末

## 🚀 Vercel への最速デプロイ手順（1分で完了）

### 方法A: GitHub経由（最も推奨・自動更新可能）
1. 本フォルダ（`masterpiece-web`）を GitHub の新しいリポジトリに push します。
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Masterpiece Web Dashboard"
   git branch -M main
   git remote add origin https://github.com/<あなたのユーザー名>/masterpiece-web.git
   git push -u origin main
   ```
2. [Vercel](https://vercel.com/) にログインし、「**Add New...**」→「**Project**」をクリック。
3. 今 push した `masterpiece-web` リポジトリを選択し、「**Deploy**」を押すだけ！
   * Framework Preset: **Vite** が自動選択されます。
   * 1分ほどで `https://masterpiece-web-xxx.vercel.app` のURLが発行され、スマホ実機から即座に閲覧できます。

### 方法B: Vercel CLI を使う場合（PCのターミナルから一撃）
```bash
npm install -g vercel
vercel
```

---

## 🛠️ ローカルでの開発・動作確認
```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動（スマホと同じWi-Fiならスマホからもアクセス可能）
npm run dev -- --host
```

---

## 🔄 週末レースデータの差し替え方法
週末に出走馬確定後、バックエンドのPythonスクリプトを実行して `src/data/race_data.json` を上書きするだけで、Web画面のデータが瞬時に切り替わります。
