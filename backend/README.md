# 叶片质量追溯系统 - 后端API

## 项目简介

基于 Node.js + Express + MySQL 的后端API服务，为微信小程序提供数据接口。

## 技术栈

- **Node.js**: 运行环境
- **Express**: Web框架
- **MySQL2**: 数据库驱动
- **JWT**: 身份认证
- **bcryptjs**: 密码加密（可选）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=traceability

JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 3. 创建数据库

执行 `traceability_schema.sql` 创建数据库和表结构。

### 4. 启动服务

**开发模式**（自动重启）：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

### 5. 测试

访问 http://localhost:3000/health 查看服务状态。

## API接口

### 认证接口

- `POST /api/auth/login` - 用户登录

### 叶片接口

- `GET /api/blade/:bladeId` - 获取叶片信息
- `GET /api/blade/:bladeId/trace` - 获取完整追溯信息
- `GET /api/blade/my-recent` - 获取操作员的最近记录
- `GET /api/blade/recent` - 获取所有最近记录
- `GET /api/blade/list` - 获取叶片列表

### 质检接口

- `POST /api/qc` - 提交质检报告（需要QC或ADMIN权限）

## 权限说明

### 操作员 (OPERATOR)
- 可以查看自己操作的工序详情
- 可以看到其他操作员的工序，但看不到工艺参数

### 质检员 (QC)
- 可以查看所有工序的完整信息
- 可以提交质检报告

### 管理员 (ADMIN)
- 拥有所有权限

## 数据库配置

确保MySQL数据库已创建并执行了 `traceability_schema.sql`。

## 开发说明

### 目录结构

```
backend/
├── config/          # 配置文件
│   └── database.js  # 数据库配置
├── middleware/       # 中间件
│   └── auth.js      # 身份验证
├── routes/          # 路由
│   ├── auth.js      # 认证路由
│   ├── blade.js     # 叶片路由
│   └── qc.js        # 质检路由
├── app.js           # 应用入口
├── package.json     # 依赖配置
└── .env             # 环境变量
```

### 添加新接口

1. 在 `routes/` 目录创建或修改路由文件
2. 在 `app.js` 中注册路由
3. 使用中间件进行权限控制

## 部署

### 使用 PM2

```bash
npm install -g pm2
pm2 start app.js --name traceability-api
```

### 使用 Docker（可选）

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

## 注意事项

1. 生产环境请修改 `JWT_SECRET`
2. 配置数据库连接池大小
3. 添加日志记录
4. 配置HTTPS
5. 添加请求限流

## 许可证

MIT

