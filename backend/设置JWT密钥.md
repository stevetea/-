# 如何设置 JWT_SECRET

## 快速设置步骤

### 方法一：使用 Node.js 生成（推荐）

在 `backend` 目录下运行：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

这会生成一个 128 位的随机十六进制字符串，例如：
```
a3f5b8c9d2e1f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

### 方法二：使用 PowerShell 生成（Windows）

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 方法三：使用简单密钥（仅开发环境）

如果只是测试，可以使用简单密钥：

```env
JWT_SECRET=my_dev_secret_key_12345
```

⚠️ **注意**：生产环境必须使用强随机密钥！

## 配置步骤

### 步骤 1：生成密钥

运行以下命令生成密钥：

```bash
cd backend
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 步骤 2：复制生成的密钥

复制终端输出的随机字符串。

### 步骤 3：配置到 .env 文件

打开 `backend/.env` 文件，找到或添加 `JWT_SECRET` 行：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=traceability

# JWT密钥（将下面这行替换为你生成的密钥）
JWT_SECRET=你刚才生成的随机字符串

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 步骤 4：保存文件

保存 `.env` 文件。

### 步骤 5：重启后端服务

如果后端正在运行，需要重启：

```bash
# 停止当前服务（Ctrl+C）
# 然后重新启动
npm run dev
```

## 完整示例

### 示例 1：开发环境配置

```env
# .env 文件
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_DATABASE=traceability

JWT_SECRET=dev_secret_key_2024_test_only
PORT=3000
NODE_ENV=development
```

### 示例 2：生产环境配置

```env
# .env 文件
DB_HOST=localhost
DB_PORT=3306
DB_USER=traceability
DB_PASSWORD=strong_password_here
DB_DATABASE=traceability

JWT_SECRET=a3f5b8c9d2e1f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
PORT=3000
NODE_ENV=production
```

## 验证配置

### 方法 1：检查后端启动日志

启动后端后，如果没有报错，说明配置成功：

```bash
npm run dev
```

应该看到：
```
🚀 服务器运行在 http://localhost:3000
✅ 数据库连接成功
```

### 方法 2：测试登录接口

使用 Postman 或 curl 测试登录：

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"operatorName":"张园英","password":"123456"}'
```

如果返回 token，说明 JWT_SECRET 配置成功。

## 常见问题

### Q: 可以不设置 JWT_SECRET 吗？

A: 可以，代码中有默认值 `'default_secret'`，但**强烈建议**设置自己的密钥。

### Q: JWT_SECRET 可以修改吗？

A: 可以，但修改后所有已签发的 token 都会失效，用户需要重新登录。

### Q: 开发和生产环境可以使用相同的密钥吗？

A: **不建议**，应该使用不同的密钥。

### Q: 密钥长度有要求吗？

A: 建议至少 32 个字符，推荐 64 个字符以上。

## 安全建议

1. ✅ **使用强随机密钥**（至少 32 字符）
2. ✅ **不同环境使用不同密钥**
3. ✅ **不要提交到 Git 仓库**（.env 应在 .gitignore 中）
4. ✅ **定期更换密钥**（如果怀疑泄露）
5. ❌ **不要使用简单字符串**（如：123456、password）

## 快速命令

### 一键生成并显示

```bash
# Windows PowerShell
cd backend
$secret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host "生成的密钥: $secret"
Write-Host "请复制到 .env 文件的 JWT_SECRET= 后面"
```

### 直接写入 .env（谨慎使用）

```bash
# 生成密钥并追加到 .env（如果 JWT_SECRET 行不存在）
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> .env
```

## 总结

1. **生成密钥**：`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. **复制密钥**
3. **粘贴到 .env 文件**：`JWT_SECRET=你的密钥`
4. **保存文件**
5. **重启后端服务**

完成！

