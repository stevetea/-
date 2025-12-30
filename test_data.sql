-- =========================================================
-- 测试数据 - 覆盖所有情况
-- 包括：不同状态的叶片、成功/失败的工序、返工、质检等
-- =========================================================

USE traceability;

-- =========================================================
-- 1. 插入工序定义（如果还没有）
-- =========================================================
INSERT IGNORE INTO process_def(process_code, process_name, process_order, table_name, is_qc) VALUES
('ALLOY_PREHEAT','合金预热',1,'proc_alloy_preheat',0),
('STAMP_FORM_COOL','冲压成型冷却',2,'proc_stamp_form_cool',0),
('EDGE_GRIND','打磨边缘',3,'proc_edge_grind',0),
('CERAMIC_COAT_HEAT','涂陶瓷漆涂层加热',4,'proc_ceramic_coat_heat',0),
('SECOND_STAMP','二次冲压',5,'proc_second_stamp',0),
('TRIM_EXCESS','切除多余金属',6,'proc_trim_excess',0),
('DIE_CAST','压铸',7,'proc_die_cast',0),
('BROACH','拉床加工',8,'proc_broach',0),
('HYD_REMOVE_PROTECT','液压机去除保护层',9,'proc_hyd_remove_protect',0),
('QR_ENGRAVE','雕刻二维码',10,'proc_qr_engrave',0),
('FLUORESCENT_TEST','荧光检测',11,'proc_fluorescent_test',0),
('QC_INSPECTION','最终质检',100,'qc_inspection',1);

-- =========================================================
-- 2. 插入操作员（如果还没有）
-- =========================================================
INSERT IGNORE INTO operator_user(operator_id, operator_name, role, is_active) VALUES
(1, '张园英', 'OPERATOR', 1),
(2, '李建国', 'OPERATOR', 1),
(3, '王美丽', 'OPERATOR', 1),
(4, '金秋天', 'QC', 1),
(5, '赵质检', 'QC', 1),
(6, '管理员', 'ADMIN', 1),
(7, '刘操作', 'OPERATOR', 0);  -- 停用的操作员

-- =========================================================
-- 3. 插入叶片（覆盖所有状态）
-- =========================================================
INSERT INTO blade(blade_id, blade_sn, status, created_at, updated_at) VALUES
-- 已完成（有质检记录）
(1, 'SN-20251228-0001', 'COMPLETED', '2025-12-20 08:00:00', '2025-12-25 16:30:00'),
(2, 'SN-20251228-0002', 'COMPLETED', '2025-12-20 09:00:00', '2025-12-25 17:00:00'),

-- 待质检（已完成所有工序）
(3, 'SN-20251228-0003', 'READY_FOR_QC', '2025-12-21 08:00:00', '2025-12-27 15:00:00'),
(4, 'SN-20251228-0004', 'READY_FOR_QC', '2025-12-21 09:00:00', '2025-12-27 16:00:00'),
(5, 'SN-20251228-0005', 'READY_FOR_QC', '2025-12-22 08:00:00', '2025-12-28 10:00:00'),

-- 加工中（部分工序完成）
(6, 'SN-20251228-0006', 'IN_PROCESS', '2025-12-22 10:00:00', '2025-12-28 11:00:00'),
(7, 'SN-20251228-0007', 'IN_PROCESS', '2025-12-23 08:00:00', '2025-12-28 12:00:00'),

-- 阻塞（有失败工序）
(8, 'SN-20251228-0008', 'BLOCKED', '2025-12-23 09:00:00', '2025-12-28 13:00:00'),

-- 新建（刚开始）
(9, 'SN-20251228-0009', 'NEW', '2025-12-28 08:00:00', '2025-12-28 08:00:00'),

-- 报废（质检不通过）
(10, 'SN-20251228-0010', 'SCRAPPED', '2025-12-20 10:00:00', '2025-12-26 14:00:00');

-- =========================================================
-- 4. 插入工序状态记录
-- =========================================================
INSERT INTO blade_process_state(blade_id, current_success_order, last_process_code, is_blocked, blocked_order, blocked_code, blocked_reason) VALUES
(1, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),  -- 已完成
(2, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),  -- 已完成
(3, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),  -- 待质检
(4, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),  -- 待质检
(5, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),  -- 待质检
(6, 5, 'SECOND_STAMP', 0, NULL, NULL, NULL),       -- 加工中（完成到第5步）
(7, 8, 'BROACH', 0, NULL, NULL, NULL),              -- 加工中（完成到第8步）
(8, 3, 'EDGE_GRIND', 1, 4, 'CERAMIC_COAT_HEAT', '涂层厚度不达标'),  -- 阻塞
(9, 0, NULL, 0, NULL, NULL, NULL),                  -- 新建
(10, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL);  -- 报废

-- =========================================================
-- 5. 叶片1：已完成（所有工序成功，质检通过）
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(1, 1, '2025-12-20 08:30:00', 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(1, 1, '2025-12-20 10:30:00', 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(1, 2, '2025-12-20 12:00:00', 'GRIND-001', 120, 50.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(1, 2, '2025-12-20 14:00:00', 'AL2O3', 150.0, 1200.0, 180, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(1, 1, '2025-12-21 08:00:00', 'PRESS-002', 'DIE-B01', 600.00, 1, 1);

INSERT INTO proc_trim_excess(blade_id, operator_id, performed_at, trim_method, tool_no, is_success, attempt_no) VALUES
(1, 3, '2025-12-21 10:00:00', 'CNC_MILL', 'TOOL-C01', 1, 1);

INSERT INTO proc_die_cast(blade_id, operator_id, performed_at, machine_no, alloy_batch_no, melt_temp_c, injection_pressure_mpa, is_success, attempt_no) VALUES
(1, 3, '2025-12-21 14:00:00', 'CAST-001', 'BATCH-20251220', 750.0, 80.00, 1, 1);

INSERT INTO proc_broach(blade_id, operator_id, performed_at, machine_no, broach_tool_no, pass_count, is_success, attempt_no) VALUES
(1, 1, '2025-12-22 08:00:00', 'BROACH-001', 'TOOL-D01', 2, 1, 1);

INSERT INTO proc_hyd_remove_protect(blade_id, operator_id, performed_at, press_no, pressure_mpa, hold_time_s, is_success, attempt_no) VALUES
(1, 2, '2025-12-22 10:00:00', 'HYD-001', 15.00, 300, 1, 1);

INSERT INTO proc_qr_engrave(blade_id, operator_id, performed_at, laser_machine_no, qr_format, qr_text, is_success, attempt_no) VALUES
(1, 3, '2025-12-22 14:00:00', 'LASER-001', 'BLADE_ID', 'B1|P1:1,P2:1,P3:1,P4:1,P5:1,P6:1,P7:1,P8:1,P9:1,P10:1,P11:1', 1, 1);

INSERT INTO proc_fluorescent_test(blade_id, operator_id, performed_at, equipment_no, dwell_time_min, is_success, attempt_no) VALUES
(1, 2, '2025-12-23 08:00:00', 'FLUO-001', 15, 1, 1);

INSERT INTO qc_inspection(blade_id, inspector_id, inspected_at, result, dimension_pass, surface_pass, weight_g, key_dimension_mm, defect_level, remarks) VALUES
(1, 4, '2025-12-25 16:30:00', 'PASS', 1, 1, 1250.50, 150.25, 'NONE', '质检合格');

-- =========================================================
-- 6. 叶片2：已完成（有返工记录）
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(2, 1, '2025-12-20 09:30:00', 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no, fail_reason) VALUES
(2, 1, '2025-12-20 11:30:00', 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 0, 1, '温度不足'),
(2, 1, '2025-12-20 13:00:00', 'PRESS-001', 'DIE-A01', 520.00, 'AIR', 65, 1, 2);  -- 返工成功

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(2, 2, '2025-12-20 15:00:00', 'GRIND-001', 120, 50.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(2, 2, '2025-12-21 08:00:00', 'AL2O3', 150.0, 1200.0, 180, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(2, 1, '2025-12-21 10:00:00', 'PRESS-002', 'DIE-B01', 600.00, 1, 1);

INSERT INTO proc_trim_excess(blade_id, operator_id, performed_at, trim_method, tool_no, is_success, attempt_no) VALUES
(2, 3, '2025-12-21 12:00:00', 'CNC_MILL', 'TOOL-C01', 1, 1);

INSERT INTO proc_die_cast(blade_id, operator_id, performed_at, machine_no, alloy_batch_no, melt_temp_c, injection_pressure_mpa, is_success, attempt_no) VALUES
(2, 3, '2025-12-21 16:00:00', 'CAST-001', 'BATCH-20251220', 750.0, 80.00, 1, 1);

INSERT INTO proc_broach(blade_id, operator_id, performed_at, machine_no, broach_tool_no, pass_count, is_success, attempt_no) VALUES
(2, 1, '2025-12-22 09:00:00', 'BROACH-001', 'TOOL-D01', 2, 1, 1);

INSERT INTO proc_hyd_remove_protect(blade_id, operator_id, performed_at, press_no, pressure_mpa, hold_time_s, is_success, attempt_no) VALUES
(2, 2, '2025-12-22 11:00:00', 'HYD-001', 15.00, 300, 1, 1);

INSERT INTO proc_qr_engrave(blade_id, operator_id, performed_at, laser_machine_no, qr_format, qr_text, is_success, attempt_no) VALUES
(2, 3, '2025-12-22 15:00:00', 'LASER-001', 'BLADE_ID', 'B2|P1:1,P2:2,P3:1,P4:1,P5:1,P6:1,P7:1,P8:1,P9:1,P10:1,P11:1', 1, 1);

INSERT INTO proc_fluorescent_test(blade_id, operator_id, performed_at, equipment_no, dwell_time_min, is_success, attempt_no) VALUES
(2, 2, '2025-12-23 09:00:00', 'FLUO-001', 15, 1, 1);

INSERT INTO qc_inspection(blade_id, inspector_id, inspected_at, result, dimension_pass, surface_pass, weight_g, key_dimension_mm, defect_level, remarks) VALUES
(2, 4, '2025-12-25 17:00:00', 'PASS', 1, 1, 1251.20, 150.30, 'NONE', '质检合格，有返工记录');

-- =========================================================
-- 7. 叶片3-5：待质检（已完成所有工序）
-- =========================================================
-- 叶片3
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(3, 1, '2025-12-21 08:30:00', 'FURN-001', 850.0, 120, 1, 1),
(4, 1, '2025-12-21 09:30:00', 'FURN-001', 850.0, 120, 1, 1),
(5, 2, '2025-12-22 08:30:00', 'FURN-002', 855.0, 125, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(3, 1, '2025-12-21 10:30:00', 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1),
(4, 1, '2025-12-21 11:30:00', 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1),
(5, 2, '2025-12-22 10:30:00', 'PRESS-002', 'DIE-A02', 510.00, 'WATER', 45, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(3, 2, '2025-12-21 12:30:00', 'GRIND-001', 120, 50.0, 1, 1),
(4, 2, '2025-12-21 13:30:00', 'GRIND-001', 120, 50.0, 1, 1),
(5, 3, '2025-12-22 12:30:00', 'GRIND-002', 150, 45.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(3, 2, '2025-12-21 14:30:00', 'AL2O3', 150.0, 1200.0, 180, 1, 1),
(4, 2, '2025-12-21 15:30:00', 'AL2O3', 150.0, 1200.0, 180, 1, 1),
(5, 3, '2025-12-22 14:30:00', 'ZRO2', 160.0, 1250.0, 200, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(3, 1, '2025-12-22 08:00:00', 'PRESS-002', 'DIE-B01', 600.00, 1, 1),
(4, 1, '2025-12-22 09:00:00', 'PRESS-002', 'DIE-B01', 600.00, 1, 1),
(5, 2, '2025-12-23 08:00:00', 'PRESS-003', 'DIE-B02', 610.00, 1, 1);

INSERT INTO proc_trim_excess(blade_id, operator_id, performed_at, trim_method, tool_no, is_success, attempt_no) VALUES
(3, 3, '2025-12-22 10:00:00', 'CNC_MILL', 'TOOL-C01', 1, 1),
(4, 3, '2025-12-22 11:00:00', 'CNC_MILL', 'TOOL-C01', 1, 1),
(5, 1, '2025-12-23 10:00:00', 'LASER', 'LASER-TOOL-01', 1, 1);

INSERT INTO proc_die_cast(blade_id, operator_id, performed_at, machine_no, alloy_batch_no, melt_temp_c, injection_pressure_mpa, is_success, attempt_no) VALUES
(3, 3, '2025-12-22 14:00:00', 'CAST-001', 'BATCH-20251221', 750.0, 80.00, 1, 1),
(4, 3, '2025-12-22 15:00:00', 'CAST-001', 'BATCH-20251221', 750.0, 80.00, 1, 1),
(5, 1, '2025-12-23 14:00:00', 'CAST-002', 'BATCH-20251222', 755.0, 82.00, 1, 1);

INSERT INTO proc_broach(blade_id, operator_id, performed_at, machine_no, broach_tool_no, pass_count, is_success, attempt_no) VALUES
(3, 1, '2025-12-23 08:00:00', 'BROACH-001', 'TOOL-D01', 2, 1, 1),
(4, 1, '2025-12-23 09:00:00', 'BROACH-001', 'TOOL-D01', 2, 1, 1),
(5, 2, '2025-12-24 08:00:00', 'BROACH-002', 'TOOL-D02', 3, 1, 1);

INSERT INTO proc_hyd_remove_protect(blade_id, operator_id, performed_at, press_no, pressure_mpa, hold_time_s, is_success, attempt_no) VALUES
(3, 2, '2025-12-23 10:00:00', 'HYD-001', 15.00, 300, 1, 1),
(4, 2, '2025-12-23 11:00:00', 'HYD-001', 15.00, 300, 1, 1),
(5, 3, '2025-12-24 10:00:00', 'HYD-002', 16.00, 320, 1, 1);

INSERT INTO proc_qr_engrave(blade_id, operator_id, performed_at, laser_machine_no, qr_format, qr_text, is_success, attempt_no) VALUES
(3, 3, '2025-12-23 14:00:00', 'LASER-001', 'BLADE_ID', 'B3|P1:1,P2:1,P3:1,P4:1,P5:1,P6:1,P7:1,P8:1,P9:1,P10:1,P11:1', 1, 1),
(4, 3, '2025-12-23 15:00:00', 'LASER-001', 'BLADE_ID', 'B4|P1:1,P2:1,P3:1,P4:1,P5:1,P6:1,P7:1,P8:1,P9:1,P10:1,P11:1', 1, 1),
(5, 1, '2025-12-24 14:00:00', 'LASER-002', 'BLADE_ID', 'B5|P1:1,P2:1,P3:1,P4:1,P5:1,P6:1,P7:1,P8:1,P9:1,P10:1,P11:1', 1, 1);

INSERT INTO proc_fluorescent_test(blade_id, operator_id, performed_at, equipment_no, dwell_time_min, is_success, attempt_no) VALUES
(3, 2, '2025-12-24 08:00:00', 'FLUO-001', 15, 1, 1),
(4, 2, '2025-12-24 09:00:00', 'FLUO-001', 15, 1, 1),
(5, 3, '2025-12-25 08:00:00', 'FLUO-002', 18, 1, 1);

-- =========================================================
-- 8. 叶片6-7：加工中（部分工序完成）
-- =========================================================
-- 叶片6：完成到第5步（二次冲压）
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(6, 1, '2025-12-22 10:30:00', 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(6, 1, '2025-12-22 12:30:00', 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(6, 2, '2025-12-22 14:30:00', 'GRIND-001', 120, 50.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(6, 2, '2025-12-23 08:00:00', 'AL2O3', 150.0, 1200.0, 180, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(6, 1, '2025-12-23 10:00:00', 'PRESS-002', 'DIE-B01', 600.00, 1, 1);

-- 叶片7：完成到第8步（拉床加工）
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(7, 2, '2025-12-23 08:30:00', 'FURN-002', 855.0, 125, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(7, 2, '2025-12-23 10:30:00', 'PRESS-002', 'DIE-A02', 510.00, 'WATER', 45, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(7, 3, '2025-12-23 12:30:00', 'GRIND-002', 150, 45.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(7, 3, '2025-12-23 14:30:00', 'ZRO2', 160.0, 1250.0, 200, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(7, 2, '2025-12-24 08:00:00', 'PRESS-003', 'DIE-B02', 610.00, 1, 1);

INSERT INTO proc_trim_excess(blade_id, operator_id, performed_at, trim_method, tool_no, is_success, attempt_no) VALUES
(7, 1, '2025-12-24 10:00:00', 'LASER', 'LASER-TOOL-01', 1, 1);

INSERT INTO proc_die_cast(blade_id, operator_id, performed_at, machine_no, alloy_batch_no, melt_temp_c, injection_pressure_mpa, is_success, attempt_no) VALUES
(7, 1, '2025-12-24 14:00:00', 'CAST-002', 'BATCH-20251223', 755.0, 82.00, 1, 1);

INSERT INTO proc_broach(blade_id, operator_id, performed_at, machine_no, broach_tool_no, pass_count, is_success, attempt_no) VALUES
(7, 2, '2025-12-25 08:00:00', 'BROACH-002', 'TOOL-D02', 3, 1, 1);

-- =========================================================
-- 9. 叶片8：阻塞（第4步失败）
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(8, 1, '2025-12-23 09:30:00', 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, attempt_no) VALUES
(8, 1, '2025-12-23 11:30:00', 'PRESS-001', 'DIE-A01', 500.00, 'AIR', 60, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(8, 2, '2025-12-23 13:30:00', 'GRIND-001', 120, 50.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no, fail_reason) VALUES
(8, 2, '2025-12-23 15:30:00', 'AL2O3', 120.0, 1150.0, 150, 0, 1, '涂层厚度不达标，需要返工');

-- =========================================================
-- 10. 叶片10：报废（质检不通过）
-- =========================================================
INSERT INTO proc_alloy_preheat(blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, attempt_no) VALUES
(10, 1, '2025-12-20 10:30:00', 'FURN-001', 850.0, 120, 1, 1);

INSERT INTO proc_stamp_form_cool(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, stamp_temp_c, cool_method, cool_time_min, is_success, attempt_no) VALUES
(10, 1, '2025-12-20 12:30:00', 'PRESS-001', 'DIE-A01', 500.00, 800.0, 'AIR', 60, 1, 1);

INSERT INTO proc_edge_grind(blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, attempt_no) VALUES
(10, 2, '2025-12-20 14:30:00', 'GRIND-001', 120, 50.0, 1, 1);

INSERT INTO proc_ceramic_coat_heat(blade_id, operator_id, performed_at, coating_type, thickness_um, bake_temp_c, bake_time_min, is_success, attempt_no) VALUES
(10, 2, '2025-12-21 08:00:00', 'AL2O3', 150.0, 1200.0, 180, 1, 1);

INSERT INTO proc_second_stamp(blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, is_success, attempt_no) VALUES
(10, 1, '2025-12-21 10:00:00', 'PRESS-002', 'DIE-B01', 600.00, 1, 1);

INSERT INTO proc_trim_excess(blade_id, operator_id, performed_at, trim_method, tool_no, is_success, attempt_no) VALUES
(10, 3, '2025-12-21 12:00:00', 'CNC_MILL', 'TOOL-C01', 1, 1);

INSERT INTO proc_die_cast(blade_id, operator_id, performed_at, machine_no, alloy_batch_no, melt_temp_c, injection_pressure_mpa, is_success, attempt_no) VALUES
(10, 3, '2025-12-21 16:00:00', 'CAST-001', 'BATCH-20251220', 750.0, 80.00, 1, 1);

INSERT INTO proc_broach(blade_id, operator_id, performed_at, machine_no, broach_tool_no, pass_count, is_success, attempt_no) VALUES
(10, 1, '2025-12-22 09:00:00', 'BROACH-001', 'TOOL-D01', 2, 1, 1);

INSERT INTO proc_hyd_remove_protect(blade_id, operator_id, performed_at, press_no, pressure_mpa, hold_time_s, is_success, attempt_no) VALUES
(10, 2, '2025-12-22 11:00:00', 'HYD-001', 15.00, 300, 1, 1);

INSERT INTO proc_qr_engrave(blade_id, operator_id, performed_at, laser_machine_no, qr_format, qr_text, is_success, attempt_no) VALUES
(10, 3, '2025-12-22 15:00:00', 'LASER-001', 'BLADE_ID', 'B10|P1:1,P2:1,P3:1,P4:1,P5:1,P6:1,P7:1,P8:1,P9:1,P10:1,P11:1', 1, 1);

INSERT INTO proc_fluorescent_test(blade_id, operator_id, performed_at, equipment_no, dwell_time_min, is_success, attempt_no) VALUES
(10, 2, '2025-12-23 09:00:00', 'FLUO-001', 15, 1, 1);

INSERT INTO qc_inspection(blade_id, inspector_id, inspected_at, result, dimension_pass, surface_pass, weight_g, key_dimension_mm, defect_level, ncr_no, remarks) VALUES
(10, 5, '2025-12-26 14:00:00', 'FAIL', 0, 1, 1245.30, 148.50, 'CRITICAL', 'NCR-20251226-001', '尺寸严重超标，无法修复');

-- =========================================================
-- 数据说明
-- =========================================================
-- 叶片1-2：已完成（有质检记录，状态为COMPLETED）
-- 叶片3-5：待质检（已完成所有工序，状态为READY_FOR_QC）
-- 叶片6-7：加工中（部分工序完成，状态为IN_PROCESS）
-- 叶片8：阻塞（第4步失败，状态为BLOCKED）
-- 叶片9：新建（无工序记录，状态为NEW）
-- 叶片10：报废（质检不通过，状态为SCRAPPED）
--
-- 覆盖情况：
-- ✅ 所有11道工序
-- ✅ 成功和失败的工序记录
-- ✅ 返工情况（attempt_no > 1）
-- ✅ 不同操作员
-- ✅ 不同叶片状态
-- ✅ 质检通过和不通过
-- ✅ 不同缺陷等级

