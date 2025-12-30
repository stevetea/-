# 叶片质量追溯系统 - API接口文档

## 基础信息

- **Base URL**: `https://your-api-domain.com/api`
- **认证方式**: Bearer Token (在请求头中传递: `Authorization: Bearer {token}`)
- **数据格式**: JSON

---

## 1. 认证接口

### 1.1 用户登录

**接口地址**: `POST /auth/login`

**请求参数**:
```json
{
  "code": "微信登录code",
  "operatorName": "工号或姓名",
  "password": "密码"
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_string",
    "userInfo": {
      "operator_id": 1,
      "operator_name": "张三",
      "role": "OPERATOR",
      "is_active": 1
    }
  }
}
```

---

## 2. 叶片相关接口

### 2.1 获取叶片基本信息

**接口地址**: `GET /blade/:bladeId`

**响应数据**:
```json
{
  "code": 200,
  "data": {
    "blade_id": 1,
    "blade_sn": "SN-20251227-0001",
    "status": "IN_PROCESS",
    "created_at": "2024-12-27 10:00:00",
    "updated_at": "2024-12-27 15:30:00"
  }
}
```

### 2.2 获取完整追溯信息

**接口地址**: `GET /blade/:bladeId/trace`

**响应数据**:
```json
{
  "code": 200,
  "data": {
    "blade": {
      "blade_id": 1,
      "blade_sn": "SN-20251227-0001",
      "status": "IN_PROCESS",
      "created_at": "2024-12-27 10:00:00",
      "updated_at": "2024-12-27 15:30:00"
    },
    "processes": [
      {
        "processCode": "ALLOY_PREHEAT",
        "processName": "合金预热",
        "processOrder": 1,
        "record": {
          "id": 1,
          "blade_id": 1,
          "operator_id": 1,
          "operator_name": "张三",
          "performed_at": "2024-12-27 10:30:00",
          "furnace_no": "F-03",
          "target_temp_c": 380.0,
          "actual_temp_c": 379.5,
          "is_success": 1,
          "attempt_no": 1,
          "fail_reason": null,
          "remarks": "预热正常"
        },
        "isSuccess": true
      }
      // ... 其他工序
    ],
    "qc": {
      "id": 1,
      "blade_id": 1,
      "inspector_id": 4,
      "inspector_name": "李四",
      "inspected_at": "2024-12-27 16:00:00",
      "result": "PASS",
      "dimension_pass": 1,
      "surface_pass": 1,
      "weight_g": 520.10,
      "key_dimension_mm": 25.0015,
      "defect_level": "NONE",
      "ncr_no": null,
      "remarks": "终检通过，入库"
    },
    "state": {
      "blade_id": 1,
      "current_success_order": 5,
      "last_process_code": "SECOND_STAMP",
      "is_blocked": 0,
      "blocked_order": null,
      "blocked_code": null,
      "blocked_reason": null
    }
  }
}
```

**权限说明**:
- 操作员只能看到自己操作的工序记录详情
- 质检员和管理员可以看到所有工序记录详情

### 2.3 获取最近记录（操作员）

**接口地址**: `GET /blade/my-recent`

**请求参数**:
```json
{
  "limit": 10
}
```

**响应数据**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "blade_id": 1,
        "blade_sn": "SN-20251227-0001",
        "status": "IN_PROCESS",
        "updated_at": "2024-12-27 15:30:00"
      }
    ]
  }
}
```

**说明**: 只返回当前操作员操作的叶片记录

### 2.4 获取最近记录（质检员/管理员）

**接口地址**: `GET /blade/recent`

**请求参数**:
```json
{
  "limit": 10
}
```

**响应数据**: 同 2.3，但返回所有叶片记录

### 2.5 获取叶片列表

**接口地址**: `GET /blade/list`

**请求参数**:
```json
{
  "status": "READY_FOR_QC",  // 可选，筛选状态
  "limit": 50,
  "offset": 0
}
```

**响应数据**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "blade_id": 1,
        "blade_sn": "SN-20251227-0001",
        "status": "READY_FOR_QC",
        "created_at": "2024-12-27 10:00:00",
        "updated_at": "2024-12-27 15:30:00"
      }
    ],
    "total": 100
  }
}
```

---

## 3. 质检接口

### 3.1 提交质检报告

**接口地址**: `POST /qc`

**请求参数**:
```json
{
  "blade_id": 1,
  "inspector_id": 4,
  "result": "PASS",
  "dimension_pass": 1,
  "surface_pass": 1,
  "weight_g": 520.10,
  "key_dimension_mm": 25.0015,
  "defect_level": "NONE",
  "ncr_no": null,
  "remarks": "终检通过，入库"
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "提交成功",
  "data": {
    "id": 1
  }
}
```

**权限**: 仅质检员和管理员

---

## 4. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（token过期或无效） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 5. 后端实现建议

### 5.1 权限控制

在获取追溯信息时，需要根据用户角色过滤数据：

```javascript
// 伪代码示例
async function getTraceInfo(bladeId, userId, userRole) {
  const processes = await getProcessRecords(bladeId)
  
  if (userRole === 'OPERATOR') {
    // 操作员只能看到自己操作的工序详情
    processes.forEach(process => {
      if (process.record && process.record.operator_id !== userId) {
        // 隐藏工艺参数，只显示基本信息
        process.record = {
          id: process.record.id,
          operator_id: process.record.operator_id,
          operator_name: process.record.operator_name,
          performed_at: process.record.performed_at,
          is_success: process.record.is_success,
          attempt_no: process.record.attempt_no
          // 不返回工艺参数
        }
      }
    })
  }
  
  return { processes, ... }
}
```

### 5.2 数据查询优化

- 使用 JOIN 查询减少数据库访问次数
- 缓存工序定义表（不常变化）
- 对常用查询字段建立索引

### 5.3 安全建议

- 所有接口都需要 token 验证
- 操作员只能查询自己操作的记录
- 质检员和管理员可以查询所有记录
- 输入参数需要验证和过滤

---

## 6. 测试数据

可以使用 `traceability_schema.sql` 中的示例数据进行测试。

