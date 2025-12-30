# JWT_SECRET 说明

## 什么是 JWT_SECRET？

`JWT_SECRET` 是用于**签名和验证 JWT（JSON Web Token）令牌的密钥**。

### JWT 工作原理

1. **用户登录** → 服务器使用 `JWT_SECRET` **签名**生成 token
2. **用户请求** → 服务器使用 `JWT_SECRET` **验证** token 是否有效
3. **如果密钥泄露** → 攻击者可以伪造 token，冒充任何用户

### 为什么需要 JWT_SECRET？

- ✅ **安全性**：确保 token 不能被伪造
- ✅ **完整性**：验证 token 是否被篡改
- ✅ **身份验证**：确认 token 是由你的服务器签发的

## 如何设置 JWT_SECRET？

### 方法一：使用随机字符串（推荐）

#### 在 Node.js 中生成：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 在命令行中生成（Linux/Mac）：

```bash
openssl rand -hex 64
```

#### 在 PowerShell 中生成（Windows）：

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 方法二：使用在线工具

访问：https://randomkeygen.com/ 生成随机密钥

### 方法三：手动创建（简单但不安全）

```env
JWT_SECRET=my_super_secret_key_123456789
```

⚠️ **注意**：生产环境不要使用简单字符串！

## 配置示例

### 开发环境（.env 文件）

```env
# 开发环境可以使用简单密钥
JWT_SECRET=dev_secret_key_12345
```

### 生产环境（.env 文件）

```env
# 生产环境必须使用强随机密钥
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

## 安全建议

### ✅ 应该做的：

1. **使用强随机密钥**
   - 至少 32 个字符
   - 包含字母、数字、特殊字符
   - 使用加密安全的随机数生成器

2. **不同环境使用不同密钥**
   - 开发环境：`dev_secret_xxx`
   - 测试环境：`test_secret_xxx`
   - 生产环境：`prod_secret_xxx`（必须强随机）

3. **定期更换密钥**
   - 如果密钥泄露，立即更换
   - 更换后，所有已签发的 token 都会失效

4. **不要提交到代码仓库**
   - `.env` 文件应该在 `.gitignore` 中
   - 使用 `.env.example` 作为模板

### ❌ 不应该做的：

1. ❌ 使用简单字符串：`123456`、`password`、`secret`
2. ❌ 使用可预测的密钥：`mycompany2024`
3. ❌ 将密钥提交到 Git 仓库
4. ❌ 在代码中硬编码密钥
5. ❌ 在不同环境使用相同密钥

## 实际使用示例

### 1. 生成密钥

```bash
# 生成一个 64 位的随机十六进制字符串
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

输出示例：
```
a3f5b8c9d2e1f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

### 2. 配置到 .env 文件

```env
JWT_SECRET=a3f5b8c9d2e1f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

### 3. 在代码中使用

```javascript
// routes/auth.js
const token = jwt.sign(
  { operator_id: user.operator_id, role: user.role },
  process.env.JWT_SECRET,  // 从环境变量读取
  { expiresIn: '7d' }
);
```

## 常见问题

### Q: 如果忘记 JWT_SECRET 会怎样？

A: 所有已签发的 token 都会失效，用户需要重新登录。

### Q: 可以修改 JWT_SECRET 吗？

A: 可以，但修改后所有现有 token 都会失效。

### Q: JWT_SECRET 泄露了怎么办？

A: 立即更换新的密钥，并通知所有用户重新登录。

### Q: 开发环境可以使用简单密钥吗？

A: 可以，但建议养成好习惯，使用随机密钥。

## 快速设置（推荐）

### 步骤 1：生成密钥

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 步骤 2：复制生成的密钥

### 步骤 3：粘贴到 .env 文件

```env
JWT_SECRET=你刚才生成的密钥
```

### 步骤 4：重启后端服务

```bash
npm run dev
```

## 总结

- **JWT_SECRET** = 用于签名和验证 token 的密钥
- **必须保密**，不能泄露
- **生产环境**必须使用强随机密钥
- **开发环境**可以使用简单密钥，但建议使用随机密钥

