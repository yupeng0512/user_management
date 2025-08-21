# Docker 部署使用说明

> **注意**：如果您使用的是 macOS 系统的 Colima 环境，请参考 [COLIMA_USAGE.md](./COLIMA_USAGE.md) 文件获取特殊配置说明。

本项目提供了两种 Docker 部署方式：开发环境和生产环境。

## 1. 开发环境部署

开发环境配置了热重载功能，适合日常开发使用。代码修改后无需重新构建镜像，容器会自动检测变化并更新。

### 1.1 快速启动

使用提供的便捷脚本启动开发环境：

```bash
sh start-dev.sh
```

该脚本会自动执行以下操作：
- 检查 Docker 是否正在运行
- 检查 Docker Buildx 是否可用
- 对于 Colima 环境，自动更新 IP 地址配置
- 停止可能正在运行的服务
- 构建并启动所有服务

### 1.2 手动启动

如果您需要手动控制启动过程，可以使用以下命令：

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.dev.yml up --build -d

# 查看服务状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 停止服务
docker-compose -f docker-compose.dev.yml down
```

### 1.3 访问服务

- 前端应用：http://localhost:3000
- 后端API：http://localhost:3001/api
- 数据库：mongodb://admin:password123@localhost:27017/user_management

## 2. 生产环境部署

生产环境针对性能和安全性进行了优化，适合正式部署使用。

### 2.1 快速启动

使用提供的便捷脚本启动生产环境：

```bash
sh start-prod.sh
```

该脚本会自动执行以下操作：
- 检查 Docker 是否正在运行
- 检查 Docker Buildx 是否可用
- 停止可能正在运行的服务
- 构建并启动所有服务

### 2.2 手动启动

如果您需要手动控制启动过程，可以使用以下命令：

```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 2.3 访问服务

- 前端应用：http://localhost:3000
- 后端API：http://localhost:3001/api
- 数据库：mongodb://admin:password123@localhost:27017/user_management

## 3. 自定义配置

如果需要自定义配置，可以修改相应的 Docker Compose 文件：

- 开发环境：`docker-compose.dev.yml`
- 生产环境：`docker-compose.yml`

主要可配置项包括：

- 端口映射
- 环境变量
- 数据卷挂载
- 网络配置

## 4. 常见问题

### 4.1 端口冲突

如果遇到端口冲突，可以修改 Docker Compose 文件中的端口映射：

```yaml
ports:
  - "新端口:容器端口"
```

### 4.2 数据持久化

默认情况下，MongoDB 数据存储在 Docker 卷中。如果需要将数据存储在主机目录，可以修改卷配置：

```yaml
volumes:
  - ./data/mongodb:/data/db
```

### 4.3 环境变量

可以通过修改 Docker Compose 文件中的 `environment` 部分来配置环境变量，或者创建 `.env` 文件。

## 5. 安全注意事项

- 生产环境部署时，请修改所有默认密码
- 考虑使用 Docker Secrets 或环境变量文件管理敏感信息
- 限制容器网络访问，只开放必要的端口
- 定期更新基础镜像和依赖包
