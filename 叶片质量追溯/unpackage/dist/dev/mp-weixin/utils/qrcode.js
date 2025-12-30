"use strict";
function parseQRContent(qrContent) {
  if (!qrContent) {
    throw new Error("二维码内容为空");
  }
  const content = qrContent.trim();
  const format1Match = content.match(/^B(\d+)$/i);
  if (format1Match) {
    return {
      bladeId: parseInt(format1Match[1]),
      processIds: {}
      // 不需要工序ID，通过叶片ID查询数据库获取
    };
  }
  const format2Match = content.match(/^(\d+)$/);
  if (format2Match) {
    return {
      bladeId: parseInt(format2Match[1]),
      processIds: {}
    };
  }
  const format3Match = content.match(/^BLADE?(\d+)$/i);
  if (format3Match) {
    return {
      bladeId: parseInt(format3Match[1]),
      processIds: {}
    };
  }
  const format4Match = content.match(/^B(\d+)\|P(.+)$/i);
  if (format4Match) {
    return {
      bladeId: parseInt(format4Match[1]),
      processIds: {}
    };
  }
  try {
    const data = JSON.parse(content);
    if (data.b || data.bladeId) {
      return {
        bladeId: parseInt(data.b || data.bladeId),
        processIds: {}
      };
    }
  } catch (e) {
  }
  throw new Error("无法解析二维码格式: " + content + "。支持的格式：B3 或 3（仅叶片ID）");
}
exports.parseQRContent = parseQRContent;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/qrcode.js.map
