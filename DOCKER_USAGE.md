# Docker 部署使用说明

> **注意**：如果您使用的是 macOS 系统的 Colima 环境，请参考 [COLIMA_USAGE.md](./COLIMA_USAGE.md) 文件获取特殊配置说明。

本项目提供了两种 Docker 部署方式：开发环境和生产环境。

## 开发环境（推荐用于开发）

开发环境支持热重载，代码修改后会自动重启服务。

### 启动开发环境

```bash
# 使用开发环境配置启动
docker-compose -f docker-compose.dev.yml up --build

# 或者在后台运行
docker-compose -f docker-compose.dev.yml up --build -d
```

### 停止开发环境

```bash
docker-compose -f docker-compose.dev.yml down
```

### 重新构建并启动

```bash
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

## 生产环境

生产环境使用优化的镜像，仅包含生产依赖。

### 启动生产环境

```bash
# 使用生产环境配置启动
docker-compose up --build

# 或者在后台运行
docker-compose up --build -d
```

### 停止生产环境

```bash
docker-compose down
```

### 重新构建并启动

```bash
docker-compose up --build --force-recreate
```

## 主要区别

| 特性 | 开发环境 | 生产环境 |
|------|----------|----------|
| 热重载 | ✅ 支持 | ❌ 不支持 |
| 代码映射 | ✅ 映射到容器 | ❌ 构建到镜像 |
| 依赖安装 | 包含开发依赖 | 仅生产依赖 |
| 性能 | 较慢（开发便利） | 较快（生产优化） |
| NODE_ENV | development | production |

## 常用命令

### 查看日志

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml logs -f

# 生产环境
docker-compose logs -f
```

### 进入容器

```bash
# 进入后端容器
docker exec -it user_management_backend_dev sh    # 开发环境
docker exec -it user_management_backend sh        # 生产环境

# 进入前端容器
docker exec -it user_management_frontend_dev sh   # 开发环境
docker exec -it user_management_frontend sh       # 生产环境
```

### 清理资源

```bash
# 停止并删除容器、网络
docker-compose -f docker-compose.dev.yml down    # 开发环境
docker-compose down                               # 生产环境

# 删除相关镜像
docker image prune -f

# 删除所有未使用的资源
docker system prune -f
```

## 首次使用建议

1. **开发阶段**：使用 `docker-compose.dev.yml` 配置
2. **测试阶段**：使用主 `docker-compose.yml` 配置验证生产环境
3. **部署阶段**：使用主 `docker-compose.yml` 配置部署到服务器

## 故障排除

### 端口冲突
如果遇到端口被占用的问题，可以修改 docker-compose 文件中的端口映射：

```yaml
ports:
  - "3001:3001"  # 改为 "3002:3001"
```

### 权限问题
如果在 Linux/macOS 上遇到权限问题：

```bash
sudo chown -R $USER:$USER ./
```

### 数据库连接问题
确保 MongoDB 容器已启动：

```bash
docker-compose -f docker-compose.dev.yml ps
```
