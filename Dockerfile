# 演示镜像：node:22-slim，构建期装编译工具，运行期不带
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# better-sqlite3 在无预编译包时需要从源码编译
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data exports && chown -R node:node /app
USER node
EXPOSE 3000
# 首次启动自动建库 + 生成演示码
CMD ["node", "scripts/demo-boot.js"]
