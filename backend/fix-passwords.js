const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  try {
    console.log('开始修复密码...\n');

    // 获取所有用户
    const [users] = await pool.execute(
      'SELECT operator_id, username, password FROM auth_account'
    );

    console.log(`找到 ${users.length} 个用户账号\n`);

    for (const user of users) {
      console.log(`处理用户: ${user.username} (ID: ${user.operator_id})`);

      // 检查密码是否已经是哈希格式（bcrypt 哈希以 $2a$ 或 $2b$ 开头）
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`  ✓ 密码已经是哈希格式，跳过\n`);
        continue;
      }

      // 如果是明文密码，进行哈希
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await pool.execute(
        'UPDATE auth_account SET password = ? WHERE operator_id = ?',
        [hashedPassword, user.operator_id]
      );

      console.log(`  ✓ 密码已更新为哈希格式\n`);
    }

    console.log('✅ 所有密码修复完成！');

    // 验证修复结果
    console.log('\n验证修复结果...');
    const [updatedUsers] = await pool.execute(
      'SELECT operator_id, username, password FROM auth_account LIMIT 3'
    );

    console.log('\n示例用户密码格式:');
    updatedUsers.forEach(user => {
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      console.log(`  ${user.username}: ${isHashed ? '✓ 哈希格式' : '✗ 明文格式'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 修复密码时出错:', error);
    process.exit(1);
  }
}

fixPasswords();
