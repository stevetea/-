/**
 * 检查数据库表是否存在
 */

const pool = require('./config/database');

async function checkTables() {
  try {
    // 检查 blade 表
    const [bladeTables] = await pool.execute(
      "SHOW TABLES LIKE 'blade'"
    );
    console.log('blade 表:', bladeTables.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    if (bladeTables.length === 0) {
      console.log('⚠️  警告: blade 表不存在，请运行 traceability_schema.sql 创建表');
      return;
    }
    
    // 检查 blade 表数据
    const [bladeCount] = await pool.execute('SELECT COUNT(*) as count FROM blade');
    console.log('blade 表数据量:', bladeCount[0].count);
    
    // 检查工序表
    const processTables = [
      'proc_alloy_preheat',
      'proc_stamp_form_cool',
      'proc_edge_grind',
      'proc_ceramic_coat_heat',
      'proc_second_stamp',
      'proc_trim_excess',
      'proc_die_cast',
      'proc_broach',
      'proc_hyd_remove_protect',
      'proc_qr_engrave',
      'proc_fluorescent_test'
    ];
    
    console.log('\n工序表检查:');
    for (const table of processTables) {
      const [tables] = await pool.execute(`SHOW TABLES LIKE '${table}'`);
      console.log(`${table}:`, tables.length > 0 ? '✅ 存在' : '❌ 不存在');
    }
    
    // 检查 qc_inspection 表
    const [qcTables] = await pool.execute("SHOW TABLES LIKE 'qc_inspection'");
    console.log('\nqc_inspection 表:', qcTables.length > 0 ? '✅ 存在' : '❌ 不存在');
    
    // 测试查询
    console.log('\n测试查询:');
    try {
      const [test] = await pool.execute(
        'SELECT blade_id, blade_sn, status, updated_at FROM blade ORDER BY updated_at DESC LIMIT 10'
      );
      console.log('✅ 查询成功，返回', test.length, '条记录');
    } catch (err) {
      console.error('❌ 查询失败:', err.message);
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkTables();

