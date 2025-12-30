# SQL 参数修复说明

## 问题

MySQL2 的 prepared statement 对 `LIMIT` 和 `OFFSET` 参数有特殊要求，不能使用参数绑定（`?`），需要直接拼接在 SQL 中。

## 错误信息

```
Error: Incorrect arguments to mysqld_stmt_execute
code: 'ER_WRONG_ARGUMENTS'
sqlMessage: 'Incorrect arguments to mysqld_stmt_execute'
```

## 修复方案

### 修复前（错误）

```javascript
const [records] = await pool.execute(
  'SELECT * FROM blade ORDER BY updated_at DESC LIMIT ?',
  [limit]
);
```

### 修复后（正确）

```javascript
// 先验证参数是安全的整数
if (isNaN(limit) || limit < 1 || limit > 1000) {
  return res.status(400).json({
    code: 400,
    message: '参数错误'
  });
}

// 直接拼接在 SQL 中
const [records] = await pool.execute(
  `SELECT * FROM blade ORDER BY updated_at DESC LIMIT ${limit}`
);
```

## 安全措施

虽然直接拼接 SQL 有注入风险，但我们做了以下安全措施：

1. **参数验证**：确保 `limit` 和 `offset` 是有效的整数
2. **范围限制**：`limit` 最大为 1000，`offset` 最小为 0
3. **类型检查**：使用 `parseInt()` 和 `isNaN()` 验证

## 已修复的接口

1. ✅ `/api/blade/recent` - 获取最近记录
2. ✅ `/api/blade/list` - 获取叶片列表
3. ✅ `/api/blade/my-recent` - 获取操作员的最近记录

## 验证

修复后，后端服务会自动重启（nodemon），然后测试接口应该不再报错。

