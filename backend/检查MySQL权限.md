# 检查 MySQL 权限问题

## 权限问题诊断

如果遇到 "Access denied" 错误，可能是以下权限问题：

### 1. 用户没有访问权限
### 2. 用户没有访问该数据库的权限
### 3. 用户只能从特定主机连接

## 检查步骤

### 步骤 1：检查用户是否存在

```sql
-- 登录 MySQL（使用 root 或其他有权限的用户）
mysql -u root -p

-- 查看所有用户
SELECT user, host FROM mysql.user;
```

### 步骤 2：检查用户权限

```sql
-- 查看 root 用户的权限
SHOW GRANTS FOR 'root'@'localhost';

-- 查看用户权限详情
SELECT * FROM mysql.user WHERE user='root' AND host='localhost';
```

### 步骤 3：检查数据库权限

```sql
-- 查看数据库权限
SHOW GRANTS FOR 'root'@'localhost';

-- 检查是否有 traceability 数据库的权限
SELECT * FROM mysql.db WHERE Db='traceability';
```

## 解决方案

### 方案 1：授予 root 用户所有权限

```sql
-- 登录 MySQL
mysql -u root -p

-- 授予所有权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

-- 刷新权限
FLUSH PRIVILEGES;
```

### 方案 2：授予特定数据库权限

```sql
-- 授予 traceability 数据库的所有权限
GRANT ALL PRIVILEGES ON traceability.* TO 'root'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 方案 3：创建专用用户（推荐）

```sql
-- 创建新用户
CREATE USER 'traceability'@'localhost' IDENTIFIED BY 'your_password';

-- 授予 traceability 数据库的所有权限
GRANT ALL PRIVILEGES ON traceability.* TO 'traceability'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证权限
SHOW GRANTS FOR 'traceability'@'localhost';
```

## 常见权限问题

### 问题 1：用户只能从特定主机连接

如果用户是 `'root'@'127.0.0.1'` 而不是 `'root'@'localhost'`：

**解决：**
```sql
-- 创建 localhost 用户
CREATE USER 'root'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

### 问题 2：用户没有创建数据库的权限

**解决：**
```sql
GRANT CREATE ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 问题 3：用户没有访问特定数据库的权限

**解决：**
```sql
GRANT ALL PRIVILEGES ON traceability.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## 快速检查脚本

创建一个检查脚本 `check-permissions.js`：

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPermissions() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
      // 不指定数据库，先测试连接
    });
    
    console.log('✅ 基本连接成功\n');
    
    // 检查用户权限
    const [grants] = await connection.execute(
      `SHOW GRANTS FOR '${process.env.DB_USER || 'root'}'@'localhost'`
    );
    
    console.log('用户权限:');
    grants.forEach(grant => {
      console.log('  ', Object.values(grant)[0]);
    });
    
    // 检查数据库是否存在
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === 'traceability');
    
    console.log(`\n数据库 traceability: ${dbExists ? '✅ 存在' : '❌ 不存在'}`);
    
    if (dbExists) {
      // 检查表
      await connection.execute('USE traceability');
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`表数量: ${tables.length}`);
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkPermissions();
```

## 推荐操作

1. **先测试基本连接**（不指定数据库）
2. **检查用户权限**
3. **创建数据库**（如果不存在）
4. **授予权限**
5. **重新测试连接**

