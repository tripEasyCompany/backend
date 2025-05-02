# 🧭 TripEasy 後端開發啟動說明

本專案整合 Node.js + Docker + PostgreSQL + Flyway，支援本機 `nodemon` 開發、Docker 模擬正式部署，以及獨立資料庫啟動，並區分測試區與正式區的環境設定。

## 📦 NPM Scripts 一覽

### 🧪 Docker 整合測試環境（完整模擬、支援 Flyway migration）

| 指令                 | 說明 |
|----------------------|------|
| `npm run start_dev`   | 使用 Docker Compose 啟動完整測試環境（API + PostgreSQL + Flyway） |
| `npm run clean_dev`   | 停止並刪除容器與 volume（重建資料庫狀態） |

---

### 🚀 正式部署模擬（雲端環境，例如 Render）

| 指令                 | 說明 |
|----------------------|------|
| `npm run start_prod`  | 啟動正式環境容器，使用 `.env.production`（連線遠端資料庫） |
| `npm run clean_prod`  | 停止並刪除正式容器與 volume 資料（慎用） |

---

## 🧭 建議開發流程

### ✅ 本機 nodemon + Docker DB 開發模式

```bash
npm run start_dev       # 使用 Docker Compose 啟動完整測試環境（API + PostgreSQL + Flyway）
npm run stop_dev      # 停止所有容器（保留 volume）
