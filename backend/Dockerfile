# 生产环境优化的 Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装应用依赖（仅生产依赖）
RUN npm ci --omit=dev

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 复制应用源代码
COPY --chown=nodejs:nodejs . .

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3001

# 定义容器启动时运行的命令
CMD ["npm", "start"]
