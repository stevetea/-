/**
 * 命令行二维码生成工具
 * 使用方法：node generate-qr.js <blade_id> [process_ids...]
 * 
 * 示例：
 * node generate-qr.js 3
 * node generate-qr.js 1 1 2 3 4 5 6 7 8 9 10 11
 */

const qrcode = require('qrcode');

function generateQRContent(bladeId, processIds = {}) {
  if (!bladeId) {
    throw new Error('叶片ID不能为空');
  }
  
  if (Object.keys(processIds).length === 0) {
    // 简单格式
    return `B${bladeId}`;
  }
  
  // 完整格式
  const sortedOrders = Object.keys(processIds)
    .map(Number)
    .sort((a, b) => a - b);
  
  const processParts = sortedOrders.map(order => {
    return `${order}:${processIds[order]}`;
  });
  
  return `B${bladeId}|P${processParts.join(',')}`;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法：');
    console.log('  node generate-qr.js <blade_id> [process_order:record_id ...]');
    console.log('');
    console.log('示例：');
    console.log('  node generate-qr.js 3                    # 简单格式：B3');
    console.log('  node generate-qr.js 1 1:1 2:2 3:3        # 完整格式：B1|P1:1,2:2,3:3');
    console.log('');
    console.log('快速测试：');
    console.log('  node generate-qr.js 3                    # 待质检叶片');
    console.log('  node generate-qr.js 1                    # 已完成叶片');
    console.log('  node generate-qr.js 6                    # 加工中叶片');
    return;
  }
  
  const bladeId = args[0];
  const processIds = {};
  
  // 解析工序记录ID
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.includes(':')) {
      const [order, recordId] = arg.split(':');
      processIds[parseInt(order)] = parseInt(recordId);
    } else {
      // 如果没有冒号，按顺序分配
      processIds[i] = parseInt(arg);
    }
  }
  
  const qrContent = generateQRContent(bladeId, processIds);
  
  console.log('📱 二维码内容：');
  console.log(qrContent);
  console.log('');
  
  // 在终端显示二维码
  try {
    const qrString = await qrcode.toString(qrContent, {
      type: 'terminal',
      errorCorrectionLevel: 'H'
    });
    console.log(qrString);
  } catch (err) {
    console.error('生成二维码失败:', err.message);
  }
  
  // 保存为图片
  const filename = `qr-b${bladeId}.png`;
  try {
    await qrcode.toFile(filename, qrContent, {
      errorCorrectionLevel: 'H',
      width: 512
    });
    console.log(`✅ 二维码已保存为: ${filename}`);
  } catch (err) {
    console.error('保存二维码失败:', err.message);
  }
}

main().catch(console.error);

