# 生产环境优化的 Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 创建非root用户（提前创建，避免后续大量文件的权限更改）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 切换到 nodejs 用户
USER nodejs

# 复制package.json和package-lock.json（如果存在）
COPY --chown=nodejs:nodejs package*.json ./

# 安装应用依赖（仅生产依赖）
RUN npm ci --only=production

# 复制应用源代码
COPY --chown=nodejs:nodejs . .

# 暴露端口
EXPOSE 3001

# 定义容器启动时运行的命令
CMD ["npm", "start"]
