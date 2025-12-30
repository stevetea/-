/**
 * 二维码解析工具
 * 
 * 简化版：二维码只存储叶片ID，扫码后通过叶片ID查询数据库获取完整信息
 */

/**
 * 解析二维码内容，提取叶片ID
 * 支持的格式：
 * - B3（推荐）
 * - 3（纯数字）
 * - BLADE3（兼容旧格式）
 */
export function parseQRContent(qrContent) {
  if (!qrContent) {
    throw new Error('二维码内容为空')
  }
  
  // 去除首尾空格和换行
  const content = qrContent.trim()
  
  // 格式1：B3 或 B123（推荐格式）
  const format1Match = content.match(/^B(\d+)$/i)
  if (format1Match) {
    return {
      bladeId: parseInt(format1Match[1]),
      processIds: {}  // 不需要工序ID，通过叶片ID查询数据库获取
    }
  }
  
  // 格式2：纯数字 3 或 123
  const format2Match = content.match(/^(\d+)$/)
  if (format2Match) {
    return {
      bladeId: parseInt(format2Match[1]),
      processIds: {}
    }
  }
  
  // 格式3：BLADE3（兼容旧格式）
  const format3Match = content.match(/^BLADE?(\d+)$/i)
  if (format3Match) {
    return {
      bladeId: parseInt(format3Match[1]),
      processIds: {}
    }
  }
  
  // 格式4：完整格式（兼容，但不推荐）
  const format4Match = content.match(/^B(\d+)\|P(.+)$/i)
  if (format4Match) {
    // 只提取叶片ID，忽略工序ID（通过数据库查询获取）
    return {
      bladeId: parseInt(format4Match[1]),
      processIds: {}
    }
  }
  
  // 格式5：JSON格式（兼容）
  try {
    const data = JSON.parse(content)
    if (data.b || data.bladeId) {
      return {
        bladeId: parseInt(data.b || data.bladeId),
        processIds: {}
      }
    }
  } catch (e) {
    // JSON解析失败，继续
  }
  
  throw new Error('无法解析二维码格式: ' + content + '。支持的格式：B3 或 3（仅叶片ID）')
}

/**
 * 生成二维码内容
 */
export function generateQRContent(bladeId, processIds) {
  if (!bladeId || !processIds || Object.keys(processIds).length === 0) {
    throw new Error('参数不完整')
  }
  
  // 按工序顺序排序
  const sortedOrders = Object.keys(processIds)
    .map(Number)
    .sort((a, b) => a - b)
  
  const processParts = sortedOrders.map(order => {
    return `${order}:${processIds[order]}`
  })
  
  return `B${bladeId}|P${processParts.join(',')}`
}

