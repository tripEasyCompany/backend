# 乾淨版 Dev Dockerfile
FROM node:22.14.0

WORKDIR /usr/backend

# 安裝 git（optional，之後若需要拉 repo 可以用）
RUN apt-get update && apt-get install -y git

# 只安裝 production 需要的時候，這邊先不 npm install
# 因為會用 volumes 綁本地檔案，保證每次都是最新

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 🔥 安裝所有依賴（包含 devDependencies）
RUN npm install

# 複製所有原始碼（包括 src/、routes/ 等）
COPY . .

ARG PORT=3000
EXPOSE ${PORT}


CMD ["npm", "run", "dev"]