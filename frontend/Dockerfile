# 生产环境优化的 Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装应用依赖
RUN npm ci

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 创建缓存目录并设置权限
RUN mkdir -p /app/node_modules/.cache && \
    chown -R nodejs:nodejs /app/node_modules/.cache

# 复制应用源代码
COPY --chown=nodejs:nodejs . .

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 定义容器启动时运行的命令
CMD ["npm", "start"]
