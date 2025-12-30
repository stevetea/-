/**
 * 数据库连接测试脚本
 * 运行: node test-db.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('正在测试数据库连接...\n');
  console.log('配置信息:');
  console.log('  Host:', process.env.DB_HOST || 'localhost');
  console.log('  Port:', process.env.DB_PORT || 3306);
  console.log('  User:', process.env.DB_USER || 'root');
  console.log('  Database:', process.env.DB_DATABASE || 'traceability');
  console.log('  Password:', process.env.DB_PASSWORD ? '***已设置***' : '未设置');
  console.log('');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'traceability'
    });
    
    console.log('✅ 数据库连接成功！\n');
    
    // 测试查询
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 查询测试成功:', rows);
    
    // 检查表是否存在
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\n✅ 数据库中有 ${tables.length} 个表`);
    
    if (tables.length === 0) {
      console.log('⚠️  警告：数据库中没有表，请执行 traceability_schema.sql');
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败！\n');
    console.error('错误信息:', error.message);
    console.error('\n请检查：');
    console.error('1. MySQL 服务是否运行');
    console.error('2. .env 文件是否存在且配置正确');
    console.error('3. 数据库用户密码是否正确');
    console.error('4. 数据库 traceability 是否已创建');
    console.error('\n提示：');
    console.error('- 如果 MySQL root 没有密码，设置 DB_PASSWORD=  (空)');
    console.error('- 如果忘记密码，需要重置 MySQL root 密码');
    console.error('- 可以创建新用户：CREATE USER \'traceability\'@\'localhost\' IDENTIFIED BY \'password\';');
    
    process.exit(1);
  }
}

testConnection();

