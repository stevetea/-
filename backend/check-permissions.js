/**
 * 检查 MySQL 权限和连接
 * 运行: node check-permissions.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPermissions() {
  console.log('正在检查 MySQL 权限和连接...\n');
  console.log('配置信息:');
  console.log('  Host:', process.env.DB_HOST || 'localhost');
  console.log('  Port:', process.env.DB_PORT || 3306);
  console.log('  User:', process.env.DB_USER || 'root');
  console.log('  Password:', process.env.DB_PASSWORD ? '***已设置***' : '未设置');
  console.log('  Database:', process.env.DB_DATABASE || 'traceability');
  console.log('');

  try {
    // 步骤 1: 测试基本连接（不指定数据库）
    console.log('步骤 1: 测试基本连接（不指定数据库）...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ 基本连接成功\n');
    
    // 步骤 2: 检查用户权限
    console.log('步骤 2: 检查用户权限...');
    try {
      const [grants] = await connection.execute(
        `SHOW GRANTS FOR '${process.env.DB_USER || 'root'}'@'localhost'`
      );
      
      console.log('用户权限:');
      grants.forEach(grant => {
        console.log('  ', Object.values(grant)[0]);
      });
      console.log('');
    } catch (err) {
      console.log('⚠️  无法查看权限（可能是权限不足）:', err.message);
    }
    
    // 步骤 3: 检查数据库是否存在
    console.log('步骤 3: 检查数据库是否存在...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === (process.env.DB_DATABASE || 'traceability'));
    
    if (dbExists) {
      console.log('✅ 数据库 traceability 存在\n');
      
      // 步骤 4: 检查数据库权限
      console.log('步骤 4: 测试访问数据库...');
      try {
        await connection.execute(`USE ${process.env.DB_DATABASE || 'traceability'}`);
        console.log('✅ 可以访问数据库\n');
        
        // 步骤 5: 检查表
        console.log('步骤 5: 检查表...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`✅ 数据库中有 ${tables.length} 个表`);
        
        if (tables.length === 0) {
          console.log('⚠️  警告：数据库中没有表，请执行 traceability_schema.sql');
        } else {
          console.log('表列表:');
          tables.forEach(table => {
            console.log('  -', Object.values(table)[0]);
          });
        }
      } catch (err) {
        console.error('❌ 无法访问数据库:', err.message);
        console.error('\n可能原因：');
        console.error('1. 用户没有该数据库的权限');
        console.error('2. 需要执行: GRANT ALL PRIVILEGES ON traceability.* TO \'root\'@\'localhost\';');
        console.error('3. 然后执行: FLUSH PRIVILEGES;');
      }
    } else {
      console.log('❌ 数据库 traceability 不存在\n');
      console.log('需要创建数据库:');
      console.log('  CREATE DATABASE traceability DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_0900_ai_ci;');
    }
    
    await connection.end();
    console.log('\n✅ 检查完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 连接失败！\n');
    console.error('错误信息:', error.message);
    console.error('\n可能的原因：');
    console.error('1. 密码错误 - 检查 .env 文件中的 DB_PASSWORD');
    console.error('2. 用户不存在 - 检查 .env 文件中的 DB_USER');
    console.error('3. MySQL 服务未运行 - 检查 MySQL 服务状态');
    console.error('4. 权限不足 - 用户没有连接权限');
    console.error('\n解决方案：');
    console.error('1. 确认 MySQL root 密码是否正确');
    console.error('2. 如果忘记密码，重置 MySQL root 密码');
    console.error('3. 或创建新用户: CREATE USER \'traceability\'@\'localhost\' IDENTIFIED BY \'password\';');
    console.error('4. 授予权限: GRANT ALL PRIVILEGES ON traceability.* TO \'traceability\'@\'localhost\';');
    
    process.exit(1);
  }
}

checkPermissions();

