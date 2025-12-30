-- =========================================================
-- 测试数据 - 用于测试工序录入功能
-- 插入几个工艺未完成的叶片，方便操作员测试录入
-- =========================================================

USE traceability;

-- =========================================================
-- 1. 插入新的叶片（工艺未完成）
-- =========================================================
INSERT INTO blade(blade_id, blade_sn, status, created_at, updated_at) VALUES
-- 叶片11：新建，无任何工序
(11, 'SN-20251228-0011', 'NEW', NOW(), NOW()),

-- 叶片12：加工中，完成到第2步（冲压成型冷却）
(12, 'SN-20251228-0012', 'IN_PROCESS', NOW(), NOW()),

-- 叶片13：加工中，完成到第5步（二次冲压）
(13, 'SN-20251228-0013', 'IN_PROCESS', NOW(), NOW()),

-- 叶片14：加工中，完成到第8步（拉床加工）
(14, 'SN-20251228-0014', 'IN_PROCESS', NOW(), NOW()),

-- 叶片15：阻塞，第3步（打磨边缘）失败，需要返工
(15, 'SN-20251228-0015', 'BLOCKED', NOW(), NOW());

-- =========================================================
-- 2. 插入工序状态记录
-- =========================================================
INSERT INTO blade_process_state(blade_id, current_success_order, last_process_code, is_blocked, blocked_order, blocked_code, blocked_reason) VALUES
(11, 0, NULL, 0, NULL, NULL, NULL),                    -- 新建
(12, 2, 'STAMP_FORM_COOL', 0, NULL, NULL, NULL),        -- 完成到第2步
(13, 5, 'SECOND_STAMP', 0, NULL, NULL, NULL),           -- 完成到第5步
(14, 8, 'BROACH', 0, NULL, NULL, NULL),                 -- 完成到第8步
(15, 2, 'EDGE_GRIND', 1, 3, 'EDGE_GRIND', '打磨质量不达标，需要返工');  -- 阻塞在第3步

-- =========================================================
-- 3. 叶片12：完成到第2步（冲压成型冷却）
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(12, 1, NOW() - INTERVAL 2 HOUR, 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(12, 1, NOW() - INTERVAL 1 HOUR, 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1);

-- 下一步应该是：打磨边缘（工序3）

-- =========================================================
-- 4. 叶片13：完成到第5步（二次冲压）
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(13, 2, NOW() - INTERVAL 4 HOUR, 'FURN-002', 855.0, 125, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(13, 2, NOW() - INTERVAL 3 HOUR, 'PRESS-002', 'DIE-A02', 510.00, 'WATER', 45, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(13, 2, NOW() - INTERVAL 2 HOUR, 'GRIND-002', 150, 45.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(13, 3, NOW() - INTERVAL 1 HOUR, 'ZRO2', 160.0, 1250.0, 200, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(13, 1, NOW() - INTERVAL 30 MINUTE, 'PRESS-003', 'DIE-B02', 610.00, 1, 1);

-- 下一步应该是：切除多余金属（工序6）

-- =========================================================
-- 5. 叶片14：完成到第8步（拉床加工）
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(14, 1, NOW() - INTERVAL 6 HOUR, 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(14, 1, NOW() - INTERVAL 5 HOUR, 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(14, 2, NOW() - INTERVAL 4 HOUR, 'GRIND-001', 120, 50.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(14, 2, NOW() - INTERVAL 3 HOUR, 'AL2O3', 150.0, 1200.0, 180, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(14, 1, NOW() - INTERVAL 2 HOUR, 'PRESS-002', 'DIE-B01', 600.00, 1, 1);

INSERT INTO proc_trim_excess(blade_id, operator_id, performed_at, trim_method, tool_no, is_success, attempt_no) VALUES
(14, 3, NOW() - INTERVAL 1 HOUR, 'CNC_MILL', 'TOOL-C01', 1, 1);

INSERT INTO proc_die_cast(blade_id, operator_id, performed_at, machine_no, alloy_batch_no, melt_temp_c, injection_pressure_mpa, is_success, attempt_no) VALUES
(14, 3, NOW() - INTERVAL 30 MINUTE, 'CAST-001', 'BATCH-20251228', 750.0, 80.00, 1, 1);

INSERT INTO proc_broach(blade_id, operator_id, performed_at, machine_no, broach_tool_no, pass_count, is_success, attempt_no) VALUES
(14, 1, NOW() - INTERVAL 10 MINUTE, 'BROACH-001', 'TOOL-D01', 2, 1, 1);

-- 下一步应该是：液压机去除保护层（工序9）

-- =========================================================
-- 6. 叶片15：阻塞，第3步失败，需要返工
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(15, 1, NOW() - INTERVAL 3 HOUR, 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(15, 1, NOW() - INTERVAL 2 HOUR, 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no, fail_reason) VALUES
(15, 2, NOW() - INTERVAL 1 HOUR, 'GRIND-001', 120, 50.0, 0, 1, '打磨质量不达标，边缘有毛刺，需要返工');

-- 需要返工第3步（打磨边缘）

-- =========================================================
-- 数据说明
-- =========================================================
-- 叶片11：新建，无任何工序 - 可以测试从第1步开始录入
-- 叶片12：完成到第2步 - 可以测试录入第3步（打磨边缘）
-- 叶片13：完成到第5步 - 可以测试录入第6步（切除多余金属）
-- 叶片14：完成到第8步 - 可以测试录入第9步（液压机去除保护层）
-- 叶片15：阻塞在第3步 - 可以测试返工录入（第3步，attempt_no=2）

