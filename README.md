# 🧭 TripEasy 後端開發啟動說明

本專案整合 Node.js + Docker + PostgreSQL，支援本機 `nodemon` 開發與 Docker 環境模擬部署。

## 📦 NPM Scripts 一覽

### 🔧 本機開發

| 指令               | 說明 |
|--------------------|------|
| `npm run pg_only`   | **僅啟動 PostgreSQL 容器**（使用 `.env.development`）並開放至 `localhost:5432` |
| `npm run dev`       | 啟動本機開發模式（使用 `nodemon`），需搭配 `pg_only` 啟動資料庫 |

---

### 🧪 Docker 開發整合模式

| 指令                | 說明 |
|---------------------|------|
| `npm run start_dev`  | 使用 Docker 啟動整套開發環境（Node.js + PostgreSQL） |
| `npm run stop_dev`   | 停止開發用容器（不刪除 volume 資料） |
| `npm run clean_dev`  | 停止並刪除容器與資料卷（重建資料庫初始狀態） |

---

### 🚀 正式部署模擬（Render / 雲端測試用）

| 指令                 | 說明 |
|----------------------|------|
| `npm run start_prod`  | 啟動正式環境容器，使用 `.env.production` 設定（含 SSL） |
| `npm run stop_prod`   | 停止正式環境容器 |
| `npm run clean_prod`  | 停止並刪除正式容器與 volume 資料 |

---

## 🧭 建議開發流程

### ✅ 本機 nodemon + Docker DB 開發模式

```bash
npm run pg_only       # 啟動 PostgreSQL（背景模式）
npm run dev           # 使用本機 nodemon 進行 API 開發
