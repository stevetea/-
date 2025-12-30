/* =========================================================
   质量追溯系统（仅建表版）
   - 不包含：存储过程 / 触发器 / 视图
   - 包含：主数据表、状态表、11道工序表、最终质检表
   MySQL 8.0+，建议：utf8mb4
========================================================= */

-- （可选）创建数据库并切换
-- CREATE DATABASE IF NOT EXISTS traceability
--   DEFAULT CHARACTER SET utf8mb4
--   DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE traceability;

SET NAMES utf8mb4;

-- =========================================================
-- 1) 人员表：操作员/质检员/管理员
-- =========================================================
CREATE TABLE operator_user (
                               operator_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '人员ID（主键）',
                               operator_name VARCHAR(64) NOT NULL COMMENT '姓名/工号显示名',
                               role ENUM('OPERATOR','QC','ADMIN') NOT NULL DEFAULT 'OPERATOR' COMMENT '角色：操作员/质检/管理员',
                               is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否在岗：1在岗 0停用',
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                               KEY idx_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人员表（操作员/质检员）';

-- =========================================================
-- 2) 叶片主表（被追溯对象）
-- =========================================================
CREATE TABLE blade (
                       blade_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '叶片ID（主键）',
                       blade_sn VARCHAR(64) NOT NULL COMMENT '叶片序列号/条码号（业务唯一）',
                       status ENUM('NEW','IN_PROCESS','BLOCKED','READY_FOR_QC','COMPLETED','SCRAPPED')
                                            NOT NULL DEFAULT 'NEW' COMMENT '状态：新建/加工中/阻塞/待质检/完成/报废',
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                       UNIQUE KEY uk_blade_sn (blade_sn),
                       KEY idx_status_updated (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='叶片主表';

-- =========================================================
-- 3) 工序定义表（用于维护工序顺序、名称、表名映射）
--    注意：本版本仅建表，不写入初始化数据（你可自行 insert）
-- =========================================================
CREATE TABLE process_def (
                             process_code VARCHAR(40) PRIMARY KEY COMMENT '工序编码（唯一）',
                             process_name VARCHAR(80) NOT NULL COMMENT '工序名称（中文）',
                             process_order INT NOT NULL COMMENT '工序顺序（1..N，质检可设为100）',
                             table_name VARCHAR(80) NOT NULL COMMENT '对应工序表表名',
                             is_qc TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否质检工序：1是 0否',
                             UNIQUE KEY uk_process_order (process_order),
                             UNIQUE KEY uk_table_name (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序定义表（工序顺序/名称/表名）';

-- （可选）你之后可以插入工序定义，例如：
-- INSERT INTO process_def(process_code, process_name, process_order, table_name, is_qc) VALUES
-- ('ALLOY_PREHEAT','合金预热',1,'proc_alloy_preheat',0),
-- ('STAMP_FORM_COOL','冲压成型冷却',2,'proc_stamp_form_cool',0),
-- ('EDGE_GRIND','打磨边缘',3,'proc_edge_grind',0),
-- ('CERAMIC_COAT_HEAT','涂陶瓷漆涂层加热',4,'proc_ceramic_coat_heat',0),
-- ('SECOND_STAMP','二次冲压',5,'proc_second_stamp',0),
-- ('TRIM_EXCESS','切除多余金属',6,'proc_trim_excess',0),
-- ('DIE_CAST','压铸',7,'proc_die_cast',0),
-- ('BROACH','拉床加工',8,'proc_broach',0),
-- ('HYD_REMOVE_PROTECT','液压机去除保护层',9,'proc_hyd_remove_protect',0),
-- ('QR_ENGRAVE','雕刻二维码',10,'proc_qr_engrave',0),
-- ('FLUORESCENT_TEST','荧光检测',11,'proc_fluorescent_test',0),
-- ('QC_INSPECTION','最终质检',100,'qc_inspection',1);

-- =========================================================
-- 4) 叶片工序状态表（用于记录当前进度/阻塞原因）
--    本版本不含触发器，因此需要应用层在合适时机维护该表
-- =========================================================
CREATE TABLE blade_process_state (
                                     blade_id BIGINT UNSIGNED PRIMARY KEY COMMENT '叶片ID（主键，同 blade.blade_id）',
                                     current_success_order INT NOT NULL DEFAULT 0 COMMENT '最后成功完成的工序顺序号',
                                     last_process_code VARCHAR(40) NULL COMMENT '最后一次写入记录的工序编码',
                                     is_blocked TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否阻塞：1阻塞 0正常',
                                     blocked_order INT NULL COMMENT '阻塞发生的工序顺序号',
                                     blocked_code VARCHAR(40) NULL COMMENT '阻塞发生的工序编码',
                                     blocked_reason VARCHAR(255) NULL COMMENT '阻塞原因（失败原因）',
                                     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                     KEY idx_blocked (is_blocked, blocked_order),
                                     CONSTRAINT fk_state_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='叶片加工进度与阻塞状态';

-- =========================================================
-- 5) 工序表（共11张）：每道工序一张表 + 明确工艺参数字段（无JSON）
--    通用字段：
--      id               工序记录ID（主键）
--      blade_id         叶片ID（外键）
--      operator_id      操作员ID（外键）
--      performed_at     操作时间
--      is_success       是否成功（1成功/0失败）
--      fail_reason      失败原因（失败时建议必填）
--      attempt_no       第几次尝试（返工/重做）
--      remarks          备注
-- =========================================================

-- 5.1 合金预热
CREATE TABLE proc_alloy_preheat (
                                    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                    blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                    operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                    performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                    furnace_no VARCHAR(30) NOT NULL COMMENT '炉号/设备编号',
                                    atmosphere ENUM('AIR','N2','AR','VACUUM') NOT NULL DEFAULT 'AIR' COMMENT '气氛：空气/氮气/氩气/真空',
                                    target_temp_c DECIMAL(6,1) NOT NULL COMMENT '目标温度(°C)',
                                    actual_temp_c DECIMAL(6,1) NULL COMMENT '实际温度(°C)',
                                    ramp_rate_c_per_min DECIMAL(6,2) NULL COMMENT '升温速率(°C/min)',
                                    hold_time_min INT NOT NULL COMMENT '保温时间(min)',
                                    actual_hold_time_min INT NULL COMMENT '实际保温时间(min)',

                                    is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                    fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                    attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数（同叶片同工序第N次）',
                                    remarks VARCHAR(255) NULL COMMENT '备注',
                                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                    KEY idx_blade_time (blade_id, performed_at),
                                    KEY idx_operator_time (operator_id, performed_at),
                                    UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                    CONSTRAINT fk_p1_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                    CONSTRAINT fk_p1_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-合金预热';

-- 5.2 冲压成型冷却
CREATE TABLE proc_stamp_form_cool (
                                      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                      blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                      operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                      performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                      press_no VARCHAR(30) NOT NULL COMMENT '冲压机编号',
                                      die_no VARCHAR(30) NOT NULL COMMENT '模具编号',
                                      tonnage_t DECIMAL(8,2) NOT NULL COMMENT '吨位(t)',
                                      stroke_mm DECIMAL(8,2) NULL COMMENT '行程(mm)',
                                      speed_mm_s DECIMAL(8,2) NULL COMMENT '速度(mm/s)',
                                      hold_time_s INT NULL COMMENT '保压/停留时间(s)',
                                      cooling_method ENUM('AIR','FORCED_AIR','WATER','OIL') NOT NULL DEFAULT 'AIR' COMMENT '冷却方式',
                                      cooling_time_min INT NOT NULL COMMENT '冷却时间(min)',
                                      coolant_temp_c DECIMAL(6,1) NULL COMMENT '冷却介质温度(°C)',

                                      is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                      fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                      attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                      remarks VARCHAR(255) NULL COMMENT '备注',
                                      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                      KEY idx_blade_time (blade_id, performed_at),
                                      KEY idx_operator_time (operator_id, performed_at),
                                      UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                      CONSTRAINT fk_p2_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                      CONSTRAINT fk_p2_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-冲压成型冷却';

-- 5.3 打磨边缘
CREATE TABLE proc_edge_grind (
                                 id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                 blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                 operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                 performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                 grinder_no VARCHAR(30) NOT NULL COMMENT '打磨设备编号',
                                 wheel_grit INT NOT NULL COMMENT '砂轮目数/粒度',
                                 spindle_rpm INT NULL COMMENT '主轴转速(rpm)',
                                 feed_mm_s DECIMAL(8,2) NULL COMMENT '进给速度(mm/s)',
                                 edge_radius_mm DECIMAL(8,3) NULL COMMENT '边缘圆角半径(mm)',
                                 material_removal_mm DECIMAL(8,3) NULL COMMENT '去除量(mm)',
                                 coolant_used TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否使用冷却液：1是 0否',
                                 coolant_type VARCHAR(30) NULL COMMENT '冷却液类型',

                                 is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                 fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                 attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                 remarks VARCHAR(255) NULL COMMENT '备注',
                                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                 KEY idx_blade_time (blade_id, performed_at),
                                 KEY idx_operator_time (operator_id, performed_at),
                                 UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                 CONSTRAINT fk_p3_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                 CONSTRAINT fk_p3_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-打磨边缘';

-- 5.4 涂陶瓷漆涂层加热
CREATE TABLE proc_ceramic_coat_heat (
                                        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                        blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                        operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                        performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                        paint_batch_no VARCHAR(40) NOT NULL COMMENT '陶瓷漆批次号',
                                        viscosity_cps DECIMAL(8,2) NULL COMMENT '粘度(cps)',
                                        spray_pressure_bar DECIMAL(6,2) NULL COMMENT '喷涂压力(bar)',
                                        coating_thickness_um DECIMAL(8,2) NOT NULL COMMENT '涂层厚度(μm)',
                                        oven_no VARCHAR(30) NOT NULL COMMENT '烘箱/固化炉编号',
                                        bake_temp_c DECIMAL(6,1) NOT NULL COMMENT '固化温度(°C)',
                                        bake_time_min INT NOT NULL COMMENT '固化时间(min)',
                                        curing_profile VARCHAR(80) NULL COMMENT '固化曲线/程序号',

                                        is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                        fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                        attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                        remarks VARCHAR(255) NULL COMMENT '备注',
                                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                        KEY idx_blade_time (blade_id, performed_at),
                                        KEY idx_operator_time (operator_id, performed_at),
                                        UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                        CONSTRAINT fk_p4_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                        CONSTRAINT fk_p4_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-涂陶瓷漆涂层加热';

-- 5.5 二次冲压
CREATE TABLE proc_second_stamp (
                                   id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                   blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                   operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                   performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                   press_no VARCHAR(30) NOT NULL COMMENT '冲压机编号',
                                   die_no VARCHAR(30) NOT NULL COMMENT '模具编号',
                                   tonnage_t DECIMAL(8,2) NOT NULL COMMENT '吨位(t)',
                                   stroke_mm DECIMAL(8,2) NULL COMMENT '行程(mm)',
                                   speed_mm_s DECIMAL(8,2) NULL COMMENT '速度(mm/s)',
                                   lubrication_type VARCHAR(30) NULL COMMENT '润滑剂类型',
                                   lubrication_amount_ml DECIMAL(8,2) NULL COMMENT '润滑剂用量(ml)',

                                   is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                   fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                   attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                   remarks VARCHAR(255) NULL COMMENT '备注',
                                   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                   KEY idx_blade_time (blade_id, performed_at),
                                   KEY idx_operator_time (operator_id, performed_at),
                                   UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                   CONSTRAINT fk_p5_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                   CONSTRAINT fk_p5_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-二次冲压';

-- 5.6 切除多余金属
CREATE TABLE proc_trim_excess (
                                  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                  blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                  operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                  performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                  trim_method ENUM('SHEAR','CNC_MILL','GRIND','LASER') NOT NULL COMMENT '切除方式：剪切/CNC/磨削/激光',
                                  tool_no VARCHAR(30) NULL COMMENT '刀具/工具编号',
                                  trim_allowance_mm DECIMAL(8,3) NULL COMMENT '切除余量(mm)',
                                  cut_speed_mm_s DECIMAL(8,2) NULL COMMENT '切削/进给速度(mm/s)',
                                  burr_height_um DECIMAL(8,2) NULL COMMENT '毛刺高度(μm)',

                                  is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                  fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                  attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                  remarks VARCHAR(255) NULL COMMENT '备注',
                                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                  KEY idx_blade_time (blade_id, performed_at),
                                  KEY idx_operator_time (operator_id, performed_at),
                                  UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                  CONSTRAINT fk_p6_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                  CONSTRAINT fk_p6_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-切除多余金属';

-- 5.7 压铸
CREATE TABLE proc_die_cast (
                               id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                               blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                               operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                               performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                               machine_no VARCHAR(30) NOT NULL COMMENT '压铸机编号',
                               alloy_batch_no VARCHAR(40) NOT NULL COMMENT '合金批次号',
                               melt_temp_c DECIMAL(6,1) NOT NULL COMMENT '熔炼温度(°C)',
                               mold_temp_c DECIMAL(6,1) NULL COMMENT '模温(°C)',
                               injection_pressure_mpa DECIMAL(8,2) NOT NULL COMMENT '注射压力(MPa)',
                               fill_time_ms INT NULL COMMENT '充型时间(ms)',
                               hold_pressure_mpa DECIMAL(8,2) NULL COMMENT '保压压力(MPa)',
                               hold_time_ms INT NULL COMMENT '保压时间(ms)',
                               cooling_time_s INT NULL COMMENT '冷却时间(s)',
                               shot_weight_g DECIMAL(10,2) NULL COMMENT '单次射出重量(g)',

                               is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                               fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                               attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                               remarks VARCHAR(255) NULL COMMENT '备注',
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                               KEY idx_blade_time (blade_id, performed_at),
                               KEY idx_operator_time (operator_id, performed_at),
                               UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                               CONSTRAINT fk_p7_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                               CONSTRAINT fk_p7_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-压铸';

-- 5.8 拉床加工
CREATE TABLE proc_broach (
                             id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                             blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                             operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                             performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                             machine_no VARCHAR(30) NOT NULL COMMENT '拉床设备编号',
                             broach_tool_no VARCHAR(30) NOT NULL COMMENT '拉刀编号',
                             broach_speed_mm_s DECIMAL(8,2) NULL COMMENT '拉削速度(mm/s)',
                             feed_mm_per_stroke DECIMAL(8,3) NULL COMMENT '每行程进给(mm/行程)',
                             cutting_oil_type VARCHAR(30) NULL COMMENT '切削油类型',
                             pass_count INT NOT NULL DEFAULT 1 COMMENT '走刀次数',
                             target_dimension_mm DECIMAL(10,4) NULL COMMENT '目标尺寸(mm)',
                             measured_dimension_mm DECIMAL(10,4) NULL COMMENT '实测尺寸(mm)',

                             is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                             fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                             attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                             remarks VARCHAR(255) NULL COMMENT '备注',
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                             KEY idx_blade_time (blade_id, performed_at),
                             KEY idx_operator_time (operator_id, performed_at),
                             UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                             CONSTRAINT fk_p8_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                             CONSTRAINT fk_p8_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-拉床加工';

-- 5.9 液压机去除保护层
CREATE TABLE proc_hyd_remove_protect (
                                         id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                         blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                         operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                         performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                         press_no VARCHAR(30) NOT NULL COMMENT '液压机编号',
                                         pressure_mpa DECIMAL(8,2) NOT NULL COMMENT '压力(MPa)',
                                         hold_time_s INT NOT NULL COMMENT '保压时间(s)',
                                         method ENUM('PRESS','PRESS_PLUS_SOLVENT') NOT NULL DEFAULT 'PRESS' COMMENT '方式：仅压/压+溶剂',
                                         solvent_type VARCHAR(40) NULL COMMENT '溶剂类型（如有）',
                                         solvent_temp_c DECIMAL(6,1) NULL COMMENT '溶剂温度(°C)',
                                         rinse_required TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否需要清洗：1是 0否',

                                         is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                         fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                         attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                         remarks VARCHAR(255) NULL COMMENT '备注',
                                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                         KEY idx_blade_time (blade_id, performed_at),
                                         KEY idx_operator_time (operator_id, performed_at),
                                         UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                         CONSTRAINT fk_p9_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                         CONSTRAINT fk_p9_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-液压去除保护层';

-- 5.10 雕刻二维码
CREATE TABLE proc_qr_engrave (
                                 id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                 blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                 operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                 performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                 laser_machine_no VARCHAR(30) NOT NULL COMMENT '激光设备编号',
                                 qr_format ENUM('BLADE_ID','BLADE_SN','CUSTOM') NOT NULL DEFAULT 'BLADE_ID' COMMENT '二维码内容格式类型',
                                 qr_text VARCHAR(128) NOT NULL COMMENT '二维码内容（建议包含 blade_id）',
                                 laser_power_w DECIMAL(8,2) NULL COMMENT '激光功率(W)',
                                 scan_speed_mm_s DECIMAL(10,2) NULL COMMENT '扫描速度(mm/s)',
                                 focal_length_mm DECIMAL(8,2) NULL COMMENT '焦距(mm)',
                                 mark_depth_um DECIMAL(8,2) NULL COMMENT '标刻深度(μm)',

                                 is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                 fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                 attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                 remarks VARCHAR(255) NULL COMMENT '备注',
                                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                 KEY idx_blade_time (blade_id, performed_at),
                                 KEY idx_operator_time (operator_id, performed_at),
                                 UNIQUE KEY uk_qr_text (qr_text),
                                 UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                 CONSTRAINT fk_qr_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                 CONSTRAINT fk_qr_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-雕刻二维码';

-- 5.11 荧光检测
CREATE TABLE proc_fluorescent_test (
                                       id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工序记录ID（主键）',
                                       blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                                       operator_id BIGINT UNSIGNED NOT NULL COMMENT '操作员ID',
                                       performed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',

                                       equipment_no VARCHAR(30) NOT NULL COMMENT '检测设备编号',
                                       penetrant_batch_no VARCHAR(40) NULL COMMENT '荧光渗透剂批次号（如适用）',
                                       dwell_time_min INT NOT NULL COMMENT '停留时间(min)',
                                       developer_type VARCHAR(40) NULL COMMENT '显像剂类型',
                                       developer_time_min INT NULL COMMENT '显像时间(min)',
                                       uv_intensity_uw_cm2 DECIMAL(10,2) NULL COMMENT '紫外强度(μW/cm²)',
                                       defect_count INT NOT NULL DEFAULT 0 COMMENT '缺陷数量',
                                       max_defect_length_mm DECIMAL(8,2) NULL COMMENT '最大缺陷长度(mm)',
                                       inspector_notes VARCHAR(255) NULL COMMENT '检查说明/备注',

                                       is_success TINYINT(1) NOT NULL COMMENT '是否成功：1成功 0失败',
                                       fail_reason VARCHAR(255) NULL COMMENT '失败原因（失败必填）',
                                       attempt_no SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '尝试次数',
                                       remarks VARCHAR(255) NULL COMMENT '备注',
                                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                       KEY idx_blade_time (blade_id, performed_at),
                                       KEY idx_operator_time (operator_id, performed_at),
                                       UNIQUE KEY uk_blade_attempt (blade_id, attempt_no),
                                       CONSTRAINT fk_p11_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                                       CONSTRAINT fk_p11_operator FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序-荧光检测';

-- =========================================================
-- 6) 最终质检表（不使用JSON，给出常见关键项，可按你们规范扩展）
-- =========================================================
CREATE TABLE qc_inspection (
                               id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '质检记录ID（主键）',
                               blade_id BIGINT UNSIGNED NOT NULL COMMENT '叶片ID',
                               inspector_id BIGINT UNSIGNED NOT NULL COMMENT '质检员ID',
                               inspected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '质检时间',

                               result ENUM('PASS','FAIL') NOT NULL COMMENT '质检结论：PASS/FAIL',
                               dimension_pass TINYINT(1) NOT NULL DEFAULT 1 COMMENT '尺寸是否合格：1是 0否',
                               surface_pass TINYINT(1) NOT NULL DEFAULT 1 COMMENT '外观/表面是否合格：1是 0否',
                               weight_g DECIMAL(10,2) NULL COMMENT '重量(g)',
                               key_dimension_mm DECIMAL(10,4) NULL COMMENT '关键尺寸(mm)（如需要可拆分多字段）',
                               defect_level ENUM('NONE','MINOR','MAJOR','CRITICAL') NOT NULL DEFAULT 'NONE' COMMENT '缺陷等级',
                               ncr_no VARCHAR(40) NULL COMMENT '不合格单号/返工单号（如有）',
                               remarks VARCHAR(255) NULL COMMENT '备注',

                               KEY idx_blade_time (blade_id, inspected_at),
                               KEY idx_inspector_time (inspector_id, inspected_at),
                               CONSTRAINT fk_qc_blade FOREIGN KEY (blade_id) REFERENCES blade(blade_id),
                               CONSTRAINT fk_qc_inspector FOREIGN KEY (inspector_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='最终质检记录表';
/* =========================================================
   质量追溯系统 - 完整示例数据（全表 INSERT）
   - 不包含：存储过程 / 触发器 / 视图
   - 覆盖表：operator_user、blade、process_def、blade_process_state、
            11道工序表、qc_inspection
   - 叶片：blade_id = 1~10
   - 示例包含：返工（涂层）、失败（荧光/质检）、阻塞（状态表体现）
========================================================= */

SET NAMES utf8mb4;

-- （可选）若需要重置数据，请先手动按外键依赖顺序 TRUNCATE（此处不强制）
-- SET FOREIGN_KEY_CHECKS=0;
-- TRUNCATE TABLE qc_inspection;
-- TRUNCATE TABLE proc_fluorescent_test;
-- TRUNCATE TABLE proc_qr_engrave;
-- TRUNCATE TABLE proc_hyd_remove_protect;
-- TRUNCATE TABLE proc_broach;
-- TRUNCATE TABLE proc_die_cast;
-- TRUNCATE TABLE proc_trim_excess;
-- TRUNCATE TABLE proc_second_stamp;
-- TRUNCATE TABLE proc_ceramic_coat_heat;
-- TRUNCATE TABLE proc_edge_grind;
-- TRUNCATE TABLE proc_stamp_form_cool;
-- TRUNCATE TABLE proc_alloy_preheat;
-- TRUNCATE TABLE blade_process_state;
-- TRUNCATE TABLE process_def;
-- TRUNCATE TABLE blade;
-- TRUNCATE TABLE operator_user;
-- SET FOREIGN_KEY_CHECKS=1;

-- =========================================================
-- 1) 人员表 operator_user
-- =========================================================
INSERT INTO operator_user (operator_id, operator_name, role, is_active) VALUES
                                                                            (1,  '张园英',   'OPERATOR', 1),
                                                                            (2,  '李瑞',   'OPERATOR', 1),
                                                                            (3,  '安宥真',   'OPERATOR', 1),
                                                                            (4,  '金秋天',   'QC',       1),
                                                                            (5,  '直井怜','ADMIN',    1),
                                                                            (6,  'liz',   'OPERATOR', 1),
                                                                            (7,  'lisa',   'OPERATOR', 1),
                                                                            (8,  'rose',   'OPERATOR', 1),
                                                                            (9,  'jisso',   'OPERATOR', 1),
                                                                            (10, 'jennie', 'OPERATOR', 1),
                                                                            (11, '李在容','QC',       1),
                                                                            (12, '柳智敏','QC',       1);

-- =========================================================
-- 2) 叶片表 blade
--   为了和质检记录一致，这里预设状态：
--   - PASS：COMPLETED
--   - FAIL：SCRAPPED
--   - 荧光失败/阻塞：BLOCKED
-- =========================================================
INSERT INTO blade (blade_id, blade_sn, status) VALUES
                                                   (1,  'SN-20251227-0001', 'COMPLETED'),
                                                   (2,  'SN-20251227-0002', 'SCRAPPED'),
                                                   (3,  'SN-20251227-0003', 'COMPLETED'),
                                                   (4,  'SN-20251227-0004', 'COMPLETED'),
                                                   (5,  'SN-20251227-0005', 'COMPLETED'),
                                                   (6,  'SN-20251227-0006', 'COMPLETED'),
                                                   (7,  'SN-20251227-0007', 'BLOCKED'),
                                                   (8,  'SN-20251227-0008', 'COMPLETED'),
                                                   (9,  'SN-20251227-0009', 'COMPLETED'),
                                                   (10, 'SN-20251227-0010', 'SCRAPPED');

-- =========================================================
-- 3) 工序定义 process_def（按你的工艺顺序）
-- =========================================================
INSERT INTO process_def(process_code, process_name, process_order, table_name, is_qc) VALUES
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
-- 4) 叶片状态 blade_process_state（无触发器版本需应用层维护）
--   约定：
--   - 正常完成：current_success_order=11, is_blocked=0
--   - 荧光失败阻塞：current_success_order=10, is_blocked=1, blocked_order=11
-- =========================================================
INSERT INTO blade_process_state(
    blade_id, current_success_order, last_process_code,
    is_blocked, blocked_order, blocked_code, blocked_reason
) VALUES
      (1, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),
      (2, 11, 'QC_INSPECTION',    0, NULL, NULL, NULL),
      (3, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),
      (4, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),
      (5, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),
      (6, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),
      (7, 10, 'FLUORESCENT_TEST', 1, 11, 'FLUORESCENT_TEST', '荧光检测发现线状指示，需复检/返工'),
      (8, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),
      (9, 11, 'FLUORESCENT_TEST', 0, NULL, NULL, NULL),
      (10,11, 'QC_INSPECTION',    0, NULL, NULL, NULL);

-- =========================================================
-- 5) 工序表数据（11张）
-- =========================================================

/* 5.1 合金预热 proc_alloy_preheat */
INSERT INTO proc_alloy_preheat(
    blade_id, operator_id, performed_at,
    furnace_no, atmosphere, target_temp_c, actual_temp_c, ramp_rate_c_per_min,
    hold_time_min, actual_hold_time_min,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'F-03', 'N2',    380.0, 379.5, 6.50, 25, 25, 1, NULL, 1, '预热正常'),
      (2,  2, DATE_SUB(NOW(), INTERVAL  9 DAY), 'F-02', 'AIR',   385.0, 386.2, 6.20, 30, 30, 1, NULL, 1, '预热正常'),
      (3,  1, DATE_SUB(NOW(), INTERVAL  8 DAY), 'F-03', 'AR',    390.0, 389.8, 6.80, 28, 28, 1, NULL, 1, '预热正常'),
      (4,  6, DATE_SUB(NOW(), INTERVAL 96 HOUR),'F-01', 'N2',    380.0, 379.8, 6.40, 25, 25, 1, NULL, 1, '预热稳定'),
      (5,  7, DATE_SUB(NOW(), INTERVAL 92 HOUR),'F-02', 'AIR',   385.0, 385.6, 6.10, 30, 30, 1, NULL, 1, '正常'),
      (6,  8, DATE_SUB(NOW(), INTERVAL 88 HOUR),'F-03', 'AR',    390.0, 389.7, 6.70, 28, 28, 1, NULL, 1, '正常'),
      (7,  9, DATE_SUB(NOW(), INTERVAL 84 HOUR),'F-01', 'N2',    382.0, 381.5, 6.30, 26, 26, 1, NULL, 1, '正常'),
      (8, 10, DATE_SUB(NOW(), INTERVAL 80 HOUR),'F-02', 'AIR',   387.0, 386.9, 6.20, 30, 30, 1, NULL, 1, '正常'),
      (9,  6, DATE_SUB(NOW(), INTERVAL 76 HOUR),'F-04', 'VACUUM',395.0, 394.6, 6.80, 22, 22, 1, NULL, 1, '真空预热'),
      (10, 7, DATE_SUB(NOW(), INTERVAL 72 HOUR),'F-03', 'AR',    389.0, 388.8, 6.60, 24, 24, 1, NULL, 1, '正常');


/* 5.2 冲压成型冷却 proc_stamp_form_cool */
INSERT INTO proc_stamp_form_cool(
    blade_id, operator_id, performed_at,
    press_no, die_no, tonnage_t, stroke_mm, speed_mm_s, hold_time_s,
    cooling_method, cooling_time_min, coolant_temp_c,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  2, DATE_SUB(NOW(), INTERVAL 9 DAY),  'P-01', 'D-100', 80.00, 120.00, 35.00, 3, 'AIR',        12, NULL, 1, NULL, 1, '成型良好'),
      (2,  2, DATE_SUB(NOW(), INTERVAL 8 DAY),  'P-02', 'D-101', 82.00, 118.00, 34.00, 3, 'FORCED_AIR', 10, NULL, 1, NULL, 1, '成型良好'),
      (3,  3, DATE_SUB(NOW(), INTERVAL 7 DAY),  'P-01', 'D-100', 79.50, 120.00, 36.00, 3, 'AIR',        12, NULL, 1, NULL, 1, '成型良好'),
      (4,  7, DATE_SUB(NOW(), INTERVAL 95 HOUR),'P-01', 'D-100', 80.0,  120.0,  35.0,  3, 'AIR',        12, NULL, 1, NULL, 1, '良好'),
      (5,  7, DATE_SUB(NOW(), INTERVAL 91 HOUR),'P-02', 'D-101', 81.0,  118.0,  34.0,  3, 'FORCED_AIR', 10, NULL, 1, NULL, 1, '良好'),
      (6,  8, DATE_SUB(NOW(), INTERVAL 87 HOUR),'P-01', 'D-100', 79.5,  120.0,  36.0,  3, 'AIR',        12, NULL, 1, NULL, 1, '良好'),
      (7,  9, DATE_SUB(NOW(), INTERVAL 83 HOUR),'P-03', 'D-102', 82.0,  119.0,  33.5,  4, 'AIR',        11, NULL, 1, NULL, 1, '良好'),
      (8, 10, DATE_SUB(NOW(), INTERVAL 79 HOUR),'P-02', 'D-101', 81.5,  118.0,  34.5,  3, 'WATER',       8, 20.0, 1, NULL, 1, '水冷'),
      (9,  6, DATE_SUB(NOW(), INTERVAL 75 HOUR),'P-01', 'D-103', 80.5,  120.0,  35.5,  3, 'AIR',        12, NULL, 1, NULL, 1, '良好'),
      (10, 8, DATE_SUB(NOW(), INTERVAL 71 HOUR),'P-03', 'D-102', 82.5,  119.0,  33.0,  4, 'FORCED_AIR', 10, NULL, 1, NULL, 1, '良好');


/* 5.3 打磨边缘 proc_edge_grind */
INSERT INTO proc_edge_grind(
    blade_id, operator_id, performed_at,
    grinder_no, wheel_grit, spindle_rpm, feed_mm_s, edge_radius_mm,
    material_removal_mm, coolant_used, coolant_type,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  3, DATE_SUB(NOW(), INTERVAL 8 DAY),  'G-01', 120, 3200, 2.50, 0.800, 0.120, 1, '水基冷却液', 1, NULL, 1, '边缘平整'),
      (2,  3, DATE_SUB(NOW(), INTERVAL 7 DAY),  'G-02', 150, 3000, 2.20, 0.850, 0.110, 1, '水基冷却液', 1, NULL, 1, '边缘平整'),
      (3,  3, DATE_SUB(NOW(), INTERVAL 6 DAY),  'G-01', 120, 3250, 2.60, 0.780, 0.125, 1, '水基冷却液', 1, NULL, 1, '边缘平整'),
      (4,  8, DATE_SUB(NOW(), INTERVAL 94 HOUR),'G-01', 120, 3200, 2.50, 0.800, 0.120, 1, '水基',       1, NULL, 1, '边缘平整'),
      (5,  8, DATE_SUB(NOW(), INTERVAL 90 HOUR),'G-02', 150, 3000, 2.20, 0.850, 0.110, 1, '水基',       1, NULL, 1, '正常'),
      (6,  9, DATE_SUB(NOW(), INTERVAL 86 HOUR),'G-01', 120, 3250, 2.60, 0.780, 0.125, 1, '水基',       1, NULL, 1, '正常'),
      (7, 10, DATE_SUB(NOW(), INTERVAL 82 HOUR),'G-03', 180, 2800, 2.10, 0.900, 0.100, 1, '水基',       1, NULL, 1, '正常'),
      (8,  6, DATE_SUB(NOW(), INTERVAL 78 HOUR),'G-02', 150, 3100, 2.30, 0.820, 0.115, 1, '水基',       1, NULL, 1, '正常'),
      (9,  7, DATE_SUB(NOW(), INTERVAL 74 HOUR),'G-01', 120, 3300, 2.70, 0.790, 0.130, 1, '水基',       1, NULL, 1, '正常'),
      (10, 9, DATE_SUB(NOW(), INTERVAL 70 HOUR),'G-03', 180, 2850, 2.15, 0.910, 0.105, 1, '水基',       1, NULL, 1, '正常');


/* 5.4 涂陶瓷漆涂层加热 proc_ceramic_coat_heat
   - blade 2：attempt_no=1失败，attempt_no=2成功
   - blade 9：attempt_no=1失败，attempt_no=2成功 */
INSERT INTO proc_ceramic_coat_heat(
    blade_id, operator_id, performed_at,
    paint_batch_no, viscosity_cps, spray_pressure_bar, coating_thickness_um,
    oven_no, bake_temp_c, bake_time_min, curing_profile,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  1, DATE_SUB(NOW(), INTERVAL 7 DAY),  'PAINT-202512-A', 320.00, 1.80, 45.00, 'OV-01', 220.0, 35, 'CURVE-A1', 1, NULL,                     1, '涂层均匀'),

      (2,  1, DATE_SUB(NOW(), INTERVAL 6 DAY),  'PAINT-202512-A', 318.00, 1.85, 62.00, 'OV-01', 220.0, 35, 'CURVE-A1', 0, '涂层厚度超差（偏厚）',     1, '需返工重涂'),
      (2,  1, DATE_SUB(NOW(), INTERVAL 5 DAY),  'PAINT-202512-A', 319.00, 1.80, 48.00, 'OV-01', 220.0, 35, 'CURVE-A1', 1, NULL,                     2, '返工后合格'),

      (3,  2, DATE_SUB(NOW(), INTERVAL 5 DAY),  'PAINT-202512-B', 305.00, 1.75, 46.50, 'OV-02', 215.0, 40, 'CURVE-B2', 1, NULL,                     1, '涂层均匀'),

      (4,  6, DATE_SUB(NOW(), INTERVAL 93 HOUR),'PAINT-202512-A', 320.0,  1.80, 45.0,  'OV-01', 220.0, 35, 'CURVE-A1', 1, NULL,                     1, '均匀'),
      (5,  6, DATE_SUB(NOW(), INTERVAL 89 HOUR),'PAINT-202512-A', 318.0,  1.85, 46.0,  'OV-01', 220.0, 35, 'CURVE-A1', 1, NULL,                     1, '均匀'),
      (6,  7, DATE_SUB(NOW(), INTERVAL 85 HOUR),'PAINT-202512-B', 305.0,  1.75, 46.5,  'OV-02', 215.0, 40, 'CURVE-B2', 1, NULL,                     1, '均匀'),
      (7,  7, DATE_SUB(NOW(), INTERVAL 81 HOUR),'PAINT-202512-B', 306.0,  1.75, 47.0,  'OV-02', 215.0, 40, 'CURVE-B2', 1, NULL,                     1, '均匀'),
      (8,  8, DATE_SUB(NOW(), INTERVAL 77 HOUR),'PAINT-202512-C', 300.0,  1.70, 45.5,  'OV-03', 210.0, 45, 'CURVE-C3', 1, NULL,                     1, '均匀'),

      (9,  8, DATE_SUB(NOW(), INTERVAL 73 HOUR),'PAINT-202512-C', 300.0,  1.70, 62.0,  'OV-03', 210.0, 45, 'CURVE-C3', 0, '涂层厚度偏厚',             1, '返工重涂'),
      (9,  8, DATE_SUB(NOW(), INTERVAL 72 HOUR),'PAINT-202512-C', 300.0,  1.70, 48.0,  'OV-03', 210.0, 45, 'CURVE-C3', 1, NULL,                     2, '返工后合格'),

      (10, 9, DATE_SUB(NOW(), INTERVAL 69 HOUR),'PAINT-202512-A', 319.0,  1.80, 46.0,  'OV-01', 220.0, 35, 'CURVE-A1', 1, NULL,                     1, '均匀');


/* 5.5 二次冲压 proc_second_stamp */
INSERT INTO proc_second_stamp(
    blade_id, operator_id, performed_at,
    press_no, die_no, tonnage_t, stroke_mm, speed_mm_s,
    lubrication_type, lubrication_amount_ml,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  2, DATE_SUB(NOW(), INTERVAL 6 DAY),  'P-03', 'D-200', 60.00, 80.00, 28.00, 'OIL-A', 8.0,  1, NULL, 1, '二次冲压正常'),
      (2,  2, DATE_SUB(NOW(), INTERVAL 5 DAY),  'P-03', 'D-200', 60.50, 80.00, 28.50, 'OIL-A', 8.0,  1, NULL, 1, '二次冲压正常'),
      (3,  2, DATE_SUB(NOW(), INTERVAL 4 DAY),  'P-03', 'D-200', 59.80, 80.00, 29.00, 'OIL-A', 8.0,  1, NULL, 1, '二次冲压正常'),
      (4,  7, DATE_SUB(NOW(), INTERVAL 92 HOUR),'P-03', 'D-200', 60.0,  80.0,  28.0,  'OIL-A', 8.0,  1, NULL, 1, '正常'),
      (5,  7, DATE_SUB(NOW(), INTERVAL 88 HOUR),'P-03', 'D-200', 60.5,  80.0,  28.5,  'OIL-A', 8.0,  1, NULL, 1, '正常'),
      (6,  8, DATE_SUB(NOW(), INTERVAL 84 HOUR),'P-04', 'D-201', 59.8,  79.0,  29.0,  'OIL-A', 7.5,  1, NULL, 1, '正常'),
      (7,  9, DATE_SUB(NOW(), INTERVAL 80 HOUR),'P-04', 'D-201', 60.2,  79.0,  28.8,  'OIL-A', 7.5,  1, NULL, 1, '正常'),
      (8, 10, DATE_SUB(NOW(), INTERVAL 76 HOUR),'P-03', 'D-200', 60.1,  80.0,  28.2,  'OIL-A', 8.0,  1, NULL, 1, '正常'),
      (9,  6, DATE_SUB(NOW(), INTERVAL 71 HOUR),'P-05', 'D-202', 61.0,  81.0,  27.5,  'OIL-B', 8.5,  1, NULL, 1, '正常'),
      (10, 8, DATE_SUB(NOW(), INTERVAL 68 HOUR),'P-05', 'D-202', 61.2,  81.0,  27.0,  'OIL-B', 8.5,  1, NULL, 1, '正常');


/* 5.6 切除多余金属 proc_trim_excess */
INSERT INTO proc_trim_excess(
    blade_id, operator_id, performed_at,
    trim_method, tool_no, trim_allowance_mm, cut_speed_mm_s, burr_height_um,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  3, DATE_SUB(NOW(), INTERVAL 5 DAY),  'CNC_MILL', 'T-05', 0.500, 10.00, 15.0, 1, NULL, 1, '毛刺可控'),
      (2,  3, DATE_SUB(NOW(), INTERVAL 4 DAY),  'CNC_MILL', 'T-05', 0.500, 10.50, 18.0, 1, NULL, 1, '毛刺可控'),
      (3,  3, DATE_SUB(NOW(), INTERVAL 4 DAY),  'CNC_MILL', 'T-06', 0.450, 11.00, 12.0, 1, NULL, 1, '毛刺可控'),
      (4,  8, DATE_SUB(NOW(), INTERVAL 91 HOUR),'CNC_MILL', 'T-05', 0.500, 10.0,  15.0, 1, NULL, 1, '毛刺可控'),
      (5,  8, DATE_SUB(NOW(), INTERVAL 87 HOUR),'CNC_MILL', 'T-05', 0.500, 10.5,  16.0, 1, NULL, 1, '毛刺可控'),
      (6,  9, DATE_SUB(NOW(), INTERVAL 83 HOUR),'CNC_MILL', 'T-06', 0.450, 11.0,  12.0, 1, NULL, 1, '毛刺可控'),
      (7, 10, DATE_SUB(NOW(), INTERVAL 79 HOUR),'SHEAR',    NULL,   0.600, NULL,  20.0, 1, NULL, 1, '剪切后去毛刺'),
      (8,  6, DATE_SUB(NOW(), INTERVAL 75 HOUR),'CNC_MILL', 'T-05', 0.500, 10.2,  14.0, 1, NULL, 1, '正常'),
      (9,  7, DATE_SUB(NOW(), INTERVAL 70 HOUR),'LASER',    NULL,   0.300, NULL,  10.0, 1, NULL, 1, '激光切边'),
      (10, 9, DATE_SUB(NOW(), INTERVAL 67 HOUR),'CNC_MILL', 'T-07', 0.480, 10.8,  13.0, 1, NULL, 1, '正常');


/* 5.7 压铸 proc_die_cast */
INSERT INTO proc_die_cast(
    blade_id, operator_id, performed_at,
    machine_no, alloy_batch_no, melt_temp_c, mold_temp_c,
    injection_pressure_mpa, fill_time_ms, hold_pressure_mpa, hold_time_ms,
    cooling_time_s, shot_weight_g,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  2, DATE_SUB(NOW(), INTERVAL 4 DAY),  'DC-01', 'AL-202512-01', 680.0, 210.0, 65.00, 45, 45.00, 120, 25, 520.0, 1, NULL, 1, '参数稳定'),
      (2,  2, DATE_SUB(NOW(), INTERVAL 3 DAY),  'DC-01', 'AL-202512-01', 682.0, 212.0, 66.00, 44, 46.00, 118, 26, 519.0, 1, NULL, 1, '参数稳定'),
      (3,  2, DATE_SUB(NOW(), INTERVAL 3 DAY),  'DC-02', 'AL-202512-02', 678.0, 208.0, 64.50, 46, 44.50, 122, 24, 521.5, 1, NULL, 1, '参数稳定'),
      (4,  7, DATE_SUB(NOW(), INTERVAL 90 HOUR),'DC-01', 'AL-202512-01', 680.0, 210.0, 65.0,  45, 45.0,  120, 25, 520.0, 1, NULL, 1, '稳定'),
      (5,  7, DATE_SUB(NOW(), INTERVAL 86 HOUR),'DC-01', 'AL-202512-01', 681.5, 211.0, 65.5,  44, 45.5,  118, 26, 519.0, 1, NULL, 1, '稳定'),
      (6,  8, DATE_SUB(NOW(), INTERVAL 82 HOUR),'DC-02', 'AL-202512-02', 678.0, 208.0, 64.5,  46, 44.5,  122, 24, 521.5, 1, NULL, 1, '稳定'),
      (7,  9, DATE_SUB(NOW(), INTERVAL 78 HOUR),'DC-02', 'AL-202512-02', 679.0, 209.0, 64.8,  46, 44.8,  121, 24, 521.0, 1, NULL, 1, '稳定'),
      (8, 10, DATE_SUB(NOW(), INTERVAL 74 HOUR),'DC-03', 'AL-202512-03', 682.0, 212.0, 66.0,  44, 46.0,  118, 26, 518.5, 1, NULL, 1, '稳定'),
      (9,  6, DATE_SUB(NOW(), INTERVAL 69 HOUR),'DC-01', 'AL-202512-01', 680.5, 210.5, 65.2,  45, 45.2,  120, 25, 520.2, 1, NULL, 1, '稳定'),
      (10, 8, DATE_SUB(NOW(), INTERVAL 66 HOUR),'DC-03', 'AL-202512-03', 683.0, 213.0, 66.2,  43, 46.2,  117, 27, 518.0, 1, NULL, 1, '稳定');


/* 5.8 拉床加工 proc_broach */
INSERT INTO proc_broach(
    blade_id, operator_id, performed_at,
    machine_no, broach_tool_no, broach_speed_mm_s, feed_mm_per_stroke,
    cutting_oil_type, pass_count, target_dimension_mm, measured_dimension_mm,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  3, DATE_SUB(NOW(), INTERVAL 3 DAY),  'BR-01', 'BRC-09', 12.50, 0.120, 'OIL-B', 1, 25.0000, 25.0015, 1, NULL, 1, '尺寸接近目标'),
      (2,  3, DATE_SUB(NOW(), INTERVAL 3 DAY),  'BR-01', 'BRC-09', 12.30, 0.120, 'OIL-B', 1, 25.0000, 25.0020, 1, NULL, 1, '尺寸接近目标'),
      (3,  3, DATE_SUB(NOW(), INTERVAL 3 DAY),  'BR-02', 'BRC-10', 12.70, 0.115, 'OIL-B', 1, 25.0000, 25.0008, 1, NULL, 1, '尺寸稳定'),
      (4,  8, DATE_SUB(NOW(), INTERVAL 48 HOUR), 'BR-01','BRC-09', 12.5, 0.120, 'OIL-B', 1, 25.0000, 25.0012, 1, NULL, 1, '正常'),
      (5,  8, DATE_SUB(NOW(), INTERVAL 46 HOUR), 'BR-01','BRC-09', 12.3, 0.120, 'OIL-B', 1, 25.0000, 25.0018, 1, NULL, 1, '正常'),
      (6,  9, DATE_SUB(NOW(), INTERVAL 44 HOUR), 'BR-02','BRC-10', 12.7, 0.115, 'OIL-B', 1, 25.0000, 25.0007, 1, NULL, 1, '正常'),
      (7, 10, DATE_SUB(NOW(), INTERVAL 42 HOUR), 'BR-02','BRC-10', 12.6, 0.115, 'OIL-B', 1, 25.0000, 25.0025, 1, NULL, 1, '正常'),
      (8,  6, DATE_SUB(NOW(), INTERVAL 40 HOUR), 'BR-03','BRC-11', 12.4, 0.118, 'OIL-C', 1, 25.0000, 25.0010, 1, NULL, 1, '正常'),
      (9,  7, DATE_SUB(NOW(), INTERVAL 38 HOUR), 'BR-01','BRC-09', 12.5, 0.120, 'OIL-B', 1, 25.0000, 25.0013, 1, NULL, 1, '正常'),
      (10, 9, DATE_SUB(NOW(), INTERVAL 36 HOUR), 'BR-03','BRC-11', 12.2, 0.118, 'OIL-C', 1, 25.0000, 25.0030, 1, NULL, 1, '正常');


/* 5.9 液压机去除保护层 proc_hyd_remove_protect */
INSERT INTO proc_hyd_remove_protect(
    blade_id, operator_id, performed_at,
    press_no, pressure_mpa, hold_time_s, method,
    solvent_type, solvent_temp_c, rinse_required,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  1, DATE_SUB(NOW(), INTERVAL 2 DAY),  'HP-01', 12.50, 20, 'PRESS',              NULL,    NULL, 1, 1, NULL, 1, '保护层去除干净'),
      (2,  1, DATE_SUB(NOW(), INTERVAL 2 DAY),  'HP-01', 12.50, 22, 'PRESS_PLUS_SOLVENT', 'SOLV-X', 35.0, 1, 1, NULL, 1, '溶剂辅助效果好'),
      (3,  1, DATE_SUB(NOW(), INTERVAL 1 DAY),  'HP-02', 12.20, 20, 'PRESS',              NULL,    NULL, 1, 1, NULL, 1, '保护层去除干净'),
      (4,  6, DATE_SUB(NOW(), INTERVAL 30 HOUR),'HP-01', 12.5,  20, 'PRESS',              NULL,    NULL, 1, 1, NULL, 1, '干净'),
      (5,  6, DATE_SUB(NOW(), INTERVAL 29 HOUR),'HP-01', 12.5,  22, 'PRESS_PLUS_SOLVENT', 'SOLV-X', 35.0, 1, 1, NULL, 1, '溶剂辅助'),
      (6,  7, DATE_SUB(NOW(), INTERVAL 28 HOUR),'HP-02', 12.2,  20, 'PRESS',              NULL,    NULL, 1, 1, NULL, 1, '干净'),
      (7,  7, DATE_SUB(NOW(), INTERVAL 27 HOUR),'HP-02', 12.3,  21, 'PRESS',              NULL,    NULL, 1, 1, NULL, 1, '干净'),
      (8,  8, DATE_SUB(NOW(), INTERVAL 26 HOUR),'HP-03', 12.6,  18, 'PRESS_PLUS_SOLVENT', 'SOLV-Y', 32.0, 1, 1, NULL, 1, '干净'),
      (9,  9, DATE_SUB(NOW(), INTERVAL 25 HOUR),'HP-01', 12.5,  20, 'PRESS',              NULL,    NULL, 1, 1, NULL, 1, '干净'),
      (10,10, DATE_SUB(NOW(), INTERVAL 24 HOUR),'HP-03', 12.7,  18, 'PRESS',              NULL,    NULL, 1, 1, NULL, 1, '干净');


/* 5.10 雕刻二维码 proc_qr_engrave（qr_text 唯一） */
INSERT INTO proc_qr_engrave(
    blade_id, operator_id, performed_at,
    laser_machine_no, qr_format, qr_text, laser_power_w, scan_speed_mm_s,
    focal_length_mm, mark_depth_um,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  2, DATE_SUB(NOW(), INTERVAL 20 HOUR), 'LS-01', 'BLADE_ID', 'BLADE:1',  55.00, 120.00, 160.00, 18.0, 1, NULL, 1, '标刻清晰'),
      (2,  2, DATE_SUB(NOW(), INTERVAL 19 HOUR), 'LS-01', 'BLADE_ID', 'BLADE:2',  55.00, 118.00, 160.00, 18.5, 1, NULL, 1, '标刻清晰'),
      (3,  2, DATE_SUB(NOW(), INTERVAL 18 HOUR), 'LS-02', 'BLADE_ID', 'BLADE:3',  54.00, 122.00, 160.00, 17.5, 1, NULL, 1, '标刻清晰'),
      (4,  8, DATE_SUB(NOW(), INTERVAL 20 HOUR), 'LS-01', 'BLADE_ID', 'BLADE:4',  55.0,  120.0,  160.0,  18.0, 1, NULL, 1, '清晰'),
      (5,  8, DATE_SUB(NOW(), INTERVAL 19 HOUR), 'LS-01', 'BLADE_ID', 'BLADE:5',  55.0,  119.0,  160.0,  18.2, 1, NULL, 1, '清晰'),
      (6,  9, DATE_SUB(NOW(), INTERVAL 18 HOUR), 'LS-02', 'BLADE_ID', 'BLADE:6',  54.0,  122.0,  160.0,  17.8, 1, NULL, 1, '清晰'),
      (7, 10, DATE_SUB(NOW(), INTERVAL 17 HOUR), 'LS-02', 'BLADE_ID', 'BLADE:7',  54.0,  121.0,  160.0,  18.1, 1, NULL, 1, '清晰'),
      (8,  6, DATE_SUB(NOW(), INTERVAL 16 HOUR), 'LS-03', 'BLADE_ID', 'BLADE:8',  56.0,  118.0,  160.0,  18.5, 1, NULL, 1, '清晰'),
      (9,  7, DATE_SUB(NOW(), INTERVAL 15 HOUR), 'LS-03', 'BLADE_ID', 'BLADE:9',  56.0,  118.5,  160.0,  18.4, 1, NULL, 1, '清晰'),
      (10, 9, DATE_SUB(NOW(), INTERVAL 14 HOUR), 'LS-01', 'BLADE_ID', 'BLADE:10', 55.0,  120.5,  160.0,  18.0, 1, NULL, 1, '清晰');


/* 5.11 荧光检测 proc_fluorescent_test（blade 7 演示失败） */
INSERT INTO proc_fluorescent_test(
    blade_id, operator_id, performed_at,
    equipment_no, penetrant_batch_no, dwell_time_min, developer_type,
    developer_time_min, uv_intensity_uw_cm2, defect_count,
    max_defect_length_mm, inspector_notes,
    is_success, fail_reason, attempt_no, remarks
) VALUES
      (1,  4,  DATE_SUB(NOW(), INTERVAL  6 HOUR), 'FT-01', 'PEN-202512-01', 15, 'DEV-A', 10, 1200.00, 0, NULL, '未见异常指示', 1, NULL, 1, '合格'),
      (2,  4,  DATE_SUB(NOW(), INTERVAL  5 HOUR), 'FT-01', 'PEN-202512-01', 15, 'DEV-A', 10, 1200.00, 1, 2.50, '发现轻微线状指示，需评估', 0, '检测发现疑似缺陷', 1, '建议复检/返工'),
      (3,  4,  DATE_SUB(NOW(), INTERVAL  4 HOUR), 'FT-02', 'PEN-202512-02', 15, 'DEV-A', 10, 1180.00, 0, NULL, '未见异常指示', 1, NULL, 1, '合格'),
      (4,  11, DATE_SUB(NOW(), INTERVAL 10 HOUR), 'FT-01', 'PEN-202512-01', 15, 'DEV-A', 10, 1200.0,  0, NULL, '未见异常指示', 1, NULL, 1, '合格'),
      (5,  11, DATE_SUB(NOW(), INTERVAL  9 HOUR), 'FT-01', 'PEN-202512-01', 15, 'DEV-A', 10, 1200.0,  0, NULL, '未见异常指示', 1, NULL, 1, '合格'),
      (6,  12, DATE_SUB(NOW(), INTERVAL  8 HOUR), 'FT-02', 'PEN-202512-02', 15, 'DEV-A', 10, 1180.0,  0, NULL, '未见异常指示', 1, NULL, 1, '合格'),
      (7,  12, DATE_SUB(NOW(), INTERVAL  7 HOUR), 'FT-02', 'PEN-202512-02', 15, 'DEV-A', 10, 1180.0,  2, 3.20, '线状指示明显',   0, '发现线状指示，判定不合格', 1, '需复检/返工'),
      (8,  11, DATE_SUB(NOW(), INTERVAL  6 HOUR), 'FT-03', 'PEN-202512-03', 12, 'DEV-B',  8, 1250.0,  0, NULL, '未见异常指示', 1, NULL, 1, '合格'),
      (9,  11, DATE_SUB(NOW(), INTERVAL  5 HOUR), 'FT-03', 'PEN-202512-03', 12, 'DEV-B',  8, 1250.0,  0, NULL, '未见异常指示', 1, NULL, 1, '合格'),
      (10, 12, DATE_SUB(NOW(), INTERVAL  4 HOUR), 'FT-01', 'PEN-202512-01', 15, 'DEV-A', 10, 1200.0,  0, NULL, '未见异常指示', 1, NULL, 1, '合格');

-- =========================================================
-- 6) 最终质检 qc_inspection（多条）
-- =========================================================
INSERT INTO qc_inspection(
    blade_id, inspector_id, inspected_at,
    result, dimension_pass, surface_pass, weight_g, key_dimension_mm,
    defect_level, ncr_no, remarks
) VALUES
      (1,  4,  DATE_SUB(NOW(), INTERVAL 3 HOUR), 'PASS', 1, 1, 520.10, 25.0015, 'NONE',  NULL,                 '终检通过，入库'),
      (3,  4,  DATE_SUB(NOW(), INTERVAL 2 HOUR), 'PASS', 1, 1, 520.50, 25.0008, 'NONE',  NULL,                 '终检通过，入库'),
      (4,  11, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'PASS', 1, 1, 520.40, 25.0012, 'NONE',  NULL,                 '终检通过，入库'),
      (5,  11, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'PASS', 1, 1, 519.90, 25.0018, 'NONE',  NULL,                 '终检通过，入库'),
      (6,  12, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'PASS', 1, 1, 521.10, 25.0007, 'NONE',  NULL,                 '终检通过，入库'),
      (8,  11, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'PASS', 1, 1, 518.60, 25.0010, 'NONE',  NULL,                 '终检通过，入库'),
      (9,  11, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'PASS', 1, 1, 520.20, 25.0013, 'NONE',  NULL,                 '终检通过，入库'),
      (2,  4,  DATE_SUB(NOW(), INTERVAL 1 HOUR), 'FAIL', 1, 0, 519.80, 25.0020, 'MAJOR', 'NCR-20251227-0007',   '荧光异常/外观不合格，判退'),
      (10, 12, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'FAIL', 1, 0, 518.00, 25.0030, 'MAJOR', 'NCR-20251227-0010',   '终检外观不合格，判报废/返工按流程');
CREATE TABLE IF NOT EXISTS auth_account (
                                            operator_id BIGINT UNSIGNED PRIMARY KEY,
                                            username    VARCHAR(64) NOT NULL UNIQUE,
                                            password    VARCHAR(128) NOT NULL,
                                            created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                            CONSTRAINT fk_auth_operator
                                                FOREIGN KEY (operator_id) REFERENCES operator_user(operator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SET NAMES utf8mb4;

INSERT INTO auth_account(operator_id, username, password)
SELECT
    u.operator_id,
    u.operator_name AS username,
    '123456' AS password
FROM operator_user u
WHERE u.is_active = 1
ON DUPLICATE KEY UPDATE
                     username = VALUES(username),
                     password = VALUES(password);