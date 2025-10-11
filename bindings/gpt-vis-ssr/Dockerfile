FROM node:20-alpine AS base

# 安装构建依赖（canvas 需要）
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    python3

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chown -R appuser:nodejs /app

# ======================================
# 安装生产依赖
# ======================================
FROM base AS deps

COPY --chown=appuser:nodejs package.json pnpm-lock.yaml ./

RUN corepack enable && \
    corepack prepare pnpm@latest --activate

USER appuser

RUN pnpm install --prod --no-frozen-lockfile

# ======================================
# 构建应用
# ======================================
FROM base AS builder

COPY --chown=appuser:nodejs package.json pnpm-lock.yaml ./

RUN corepack enable && \
    corepack prepare pnpm@latest --activate

USER appuser

RUN pnpm install --no-frozen-lockfile

COPY --chown=appuser:nodejs . .

# 构建库和服务器
RUN pnpm run build && \
    pnpm run build:server

# ======================================
# 最终镜像
# ======================================
FROM node:20-alpine AS final

# 安装运行时依赖（canvas 需要）
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chown -R appuser:nodejs /app

USER appuser

# 从构建阶段复制文件
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

# 创建 public 目录（用于存储生成的图片）
RUN mkdir -p public

# 环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    IMAGE_MODE=base64

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server/index.js"]

