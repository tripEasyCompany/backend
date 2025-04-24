FROM node:20-alpine3.19
ENV NODE_ENV=production

# 設定工作目錄
WORKDIR /app

# 複製原始碼
COPY . .

RUN npm ci --production

ARG PORT=3000
EXPOSE ${PORT}

# 預設啟動指令
CMD ["npm", "run", "start"]