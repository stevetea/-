# 叶片质量追溯系统 - 包图Mermaid代码

本文档提供系统完整功能包图的Mermaid代码，可直接在支持Mermaid的工具中渲染。

---

## 一、系统顶层包图（Top-Level Package Diagram）

```mermaid
graph TB
    System["«system»<br/>叶片质量追溯系统<br/>Blade Quality Traceability System"]
    
    Auth["«package»<br/>认证功能包<br/>Auth Function"]
    Blade["«package»<br/>叶片管理包<br/>Blade Management"]
    Process["«package»<br/>工序录入包<br/>Process Input"]
    QC["«package»<br/>质检功能包<br/>QC Function"]
    Trace["«package»<br/>追溯功能包<br/>Traceability Function"]
    SystemMgmt["«package»<br/>系统管理包<br/>System Management"]
    Statistics["«package»<br/>数据统计包<br/>Statistics Function"]
    Common["«package»<br/>公共基础包<br/>Common Foundation"]
    DataPersistence["«package»<br/>数据持久包<br/>Data Persistence"]
    External["«package»<br/>外部包<br/>External"]
    
    System --> Auth
    System --> Blade
    System --> Process
    System --> QC
    System --> Trace
    System --> SystemMgmt
    System --> Statistics
    System --> Common
    System --> DataPersistence
    System --> External
    
    style System fill:#e1f5ff
    style Auth fill:#fff4e6
    style Blade fill:#fff4e6
    style Process fill:#fff4e6
    style QC fill:#fff4e6
    style Trace fill:#fff4e6
    style SystemMgmt fill:#fff4e6
    style Statistics fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
    style External fill:#fce4ec
```

---

## 二、系统完整包图（Complete System Package Diagram）

```mermaid
graph TB
    subgraph System["«system» 叶片质量追溯系统"]
        subgraph Auth["«package» 认证功能包"]
            AuthUI["Frontend UI<br/>login.vue"]
            AuthAPI["Backend API<br/>auth.js"]
            AuthDB["Database<br/>auth_account<br/>operator_user"]
        end
        
        subgraph Blade["«package» 叶片管理包"]
            BladeUI["Frontend UI<br/>blade-list.vue<br/>blade-create.vue"]
            BladeAPI["Backend API<br/>blade.js"]
            BladeDB["Database<br/>blade<br/>blade_process_state"]
        end
        
        subgraph Process["«package» 工序录入包"]
            ProcessUI["Frontend UI<br/>process-input.vue"]
            ProcessAPI["Backend API<br/>process.js"]
            ProcessDB["Database<br/>proc_* (11 tables)<br/>process_def"]
        end
        
        subgraph QC["«package» 质检功能包"]
            QCUI["Frontend UI<br/>qc-input.vue"]
            QCAPI["Backend API<br/>qc.js"]
            QCDB["Database<br/>qc_inspection"]
        end
        
        subgraph Trace["«package» 追溯功能包"]
            TraceUI["Frontend UI<br/>scan.vue<br/>trace-detail.vue"]
            TraceAPI["Backend API<br/>blade.js (trace)"]
            TraceDB["Database<br/>All Tables"]
            QRCode["QRCode Generator<br/>generate-qr.js"]
        end
        
        subgraph SystemMgmt["«package» 系统管理包"]
            SystemUI["Frontend UI<br/>user-manage.vue<br/>statistics.vue"]
            SystemAPI["Backend API<br/>user.js<br/>statistics.js"]
            SystemDB["Database<br/>operator_user<br/>process_def"]
        end
        
        subgraph Statistics["«package» 数据统计包"]
            StatsUI["Frontend UI<br/>statistics.vue"]
            StatsAPI["Backend API<br/>statistics.js"]
            StatsDB["Database<br/>All Business Tables"]
        end
        
        subgraph Common["«package» 公共基础包"]
            FrontendCommon["Frontend Common<br/>request.js<br/>storage.js<br/>config.js"]
            BackendCommon["Backend Common<br/>middleware/auth.js<br/>config/database.js"]
        end
        
        subgraph DataPersistence["«package» 数据持久包"]
            MasterData["Master Data<br/>blade<br/>operator_user<br/>process_def"]
            ProcessData["Process Data<br/>proc_* (11 tables)"]
            StateData["State Data<br/>blade_process_state"]
            QCData["QC Data<br/>qc_inspection"]
            AuthData["Auth Data<br/>auth_account"]
        end
        
        subgraph External["«package» 外部包"]
            WeChatAPI["WeChat API<br/>login<br/>scanCode"]
            FileSystem["File System<br/>uploads<br/>static"]
        end
    end
    
    %% 依赖关系
    Auth --> Common
    Auth --> DataPersistence
    Blade --> Auth
    Blade --> Common
    Blade --> DataPersistence
    Process --> Blade
    Process --> Auth
    Process --> Common
    Process --> DataPersistence
    QC --> Process
    QC --> Blade
    QC --> Auth
    QC --> Common
    QC --> DataPersistence
    Trace --> Auth
    Trace --> Blade
    Trace --> Process
    Trace --> QC
    Trace --> Common
    Trace --> DataPersistence
    Trace --> External
    SystemMgmt --> Auth
    SystemMgmt --> Common
    SystemMgmt --> DataPersistence
    Statistics --> Auth
    Statistics --> Blade
    Statistics --> Process
    Statistics --> QC
    Statistics --> Common
    Statistics --> DataPersistence
    
    %% 内部关系
    AuthUI --> AuthAPI
    AuthAPI --> AuthDB
    BladeUI --> BladeAPI
    BladeAPI --> BladeDB
    ProcessUI --> ProcessAPI
    ProcessAPI --> ProcessDB
    QCUI --> QCAPI
    QCAPI --> QCDB
    TraceUI --> TraceAPI
    TraceAPI --> TraceDB
    TraceUI --> QRCode
    SystemUI --> SystemAPI
    SystemAPI --> SystemDB
    StatsUI --> StatsAPI
    StatsAPI --> StatsDB
    
    style System fill:#e1f5ff
    style Auth fill:#fff4e6
    style Blade fill:#fff4e6
    style Process fill:#fff4e6
    style QC fill:#fff4e6
    style Trace fill:#fff4e6
    style SystemMgmt fill:#fff4e6
    style Statistics fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
    style External fill:#fce4ec
```

---

## 三、系统包依赖关系图（Package Dependencies）

```mermaid
graph LR
    Auth["«package»<br/>认证功能包<br/>Auth Function"]
    Blade["«package»<br/>叶片管理包<br/>Blade Management"]
    Process["«package»<br/>工序录入包<br/>Process Input"]
    QC["«package»<br/>质检功能包<br/>QC Function"]
    Trace["«package»<br/>追溯功能包<br/>Traceability Function"]
    SystemMgmt["«package»<br/>系统管理包<br/>System Management"]
    Statistics["«package»<br/>数据统计包<br/>Statistics Function"]
    Common["«package»<br/>公共基础包<br/>Common Foundation"]
    DataPersistence["«package»<br/>数据持久包<br/>Data Persistence"]
    External["«package»<br/>外部包<br/>External"]
    
    Auth -.->|«uses»| Common
    Auth -.->|«uses»| DataPersistence
    
    Blade -.->|«uses»| Auth
    Blade -.->|«uses»| Common
    Blade -.->|«uses»| DataPersistence
    
    Process -.->|«uses»| Blade
    Process -.->|«uses»| Auth
    Process -.->|«uses»| Common
    Process -.->|«uses»| DataPersistence
    
    QC -.->|«uses»| Process
    QC -.->|«uses»| Blade
    QC -.->|«uses»| Auth
    QC -.->|«uses»| Common
    QC -.->|«uses»| DataPersistence
    
    Trace -.->|«uses»| Auth
    Trace -.->|«uses»| Blade
    Trace -.->|«uses»| Process
    Trace -.->|«uses»| QC
    Trace -.->|«uses»| Common
    Trace -.->|«uses»| DataPersistence
    Trace -.->|«uses»| External
    
    SystemMgmt -.->|«uses»| Auth
    SystemMgmt -.->|«uses»| Common
    SystemMgmt -.->|«uses»| DataPersistence
    
    Statistics -.->|«uses»| Auth
    Statistics -.->|«uses»| Blade
    Statistics -.->|«uses»| Process
    Statistics -.->|«uses»| QC
    Statistics -.->|«uses»| Common
    Statistics -.->|«uses»| DataPersistence
    
    style Auth fill:#fff4e6
    style Blade fill:#fff4e6
    style Process fill:#fff4e6
    style QC fill:#fff4e6
    style Trace fill:#fff4e6
    style SystemMgmt fill:#fff4e6
    style Statistics fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
    style External fill:#fce4ec
```

---

## 四、功能包内部结构图（Function Package Internal Structure）

### 4.1 认证功能包内部结构

```mermaid
graph TB
    subgraph Auth["«package» 认证功能包"]
        AuthUI["«package»<br/>Frontend UI<br/>login.vue"]
        AuthAPI["«package»<br/>Backend API<br/>auth.js"]
        AuthDB["«package»<br/>Database<br/>auth_account<br/>operator_user"]
    end
    
    Common["«package»<br/>公共基础包"]
    DataPersistence["«package»<br/>数据持久包"]
    
    AuthUI -->|«uses»| AuthAPI
    AuthAPI -->|«uses»| AuthDB
    AuthAPI -.->|«uses»| Common
    AuthDB -.->|«uses»| DataPersistence
    
    style Auth fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
```

### 4.2 叶片管理包内部结构

```mermaid
graph TB
    subgraph Blade["«package» 叶片管理包"]
        BladeUI["«package»<br/>Frontend UI<br/>blade-list.vue<br/>blade-create.vue"]
        BladeAPI["«package»<br/>Backend API<br/>blade.js"]
        BladeDB["«package»<br/>Database<br/>blade<br/>blade_process_state"]
    end
    
    Auth["«package»<br/>认证功能包"]
    Common["«package»<br/>公共基础包"]
    DataPersistence["«package»<br/>数据持久包"]
    
    BladeUI -->|«uses»| BladeAPI
    BladeAPI -->|«uses»| BladeDB
    BladeAPI -.->|«uses»| Auth
    BladeAPI -.->|«uses»| Common
    BladeDB -.->|«uses»| DataPersistence
    
    style Blade fill:#fff4e6
    style Auth fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
```

### 4.3 工序录入包内部结构

```mermaid
graph TB
    subgraph Process["«package» 工序录入包"]
        ProcessUI["«package»<br/>Frontend UI<br/>process-input.vue"]
        ProcessAPI["«package»<br/>Backend API<br/>process.js"]
        ProcessDB["«package»<br/>Database<br/>proc_* (11 tables)<br/>process_def"]
    end
    
    Blade["«package»<br/>叶片管理包"]
    Auth["«package»<br/>认证功能包"]
    Common["«package»<br/>公共基础包"]
    DataPersistence["«package»<br/>数据持久包"]
    
    ProcessUI -->|«uses»| ProcessAPI
    ProcessAPI -->|«uses»| ProcessDB
    ProcessAPI -.->|«uses»| Blade
    ProcessAPI -.->|«uses»| Auth
    ProcessAPI -.->|«uses»| Common
    ProcessDB -.->|«uses»| DataPersistence
    
    style Process fill:#fff4e6
    style Blade fill:#fff4e6
    style Auth fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
```

### 4.4 质检功能包内部结构

```mermaid
graph TB
    subgraph QC["«package» 质检功能包"]
        QCUI["«package»<br/>Frontend UI<br/>qc-input.vue"]
        QCAPI["«package»<br/>Backend API<br/>qc.js"]
        QCDB["«package»<br/>Database<br/>qc_inspection"]
    end
    
    Process["«package»<br/>工序录入包"]
    Blade["«package»<br/>叶片管理包"]
    Auth["«package»<br/>认证功能包"]
    Common["«package»<br/>公共基础包"]
    DataPersistence["«package»<br/>数据持久包"]
    
    QCUI -->|«uses»| QCAPI
    QCAPI -->|«uses»| QCDB
    QCAPI -.->|«uses»| Process
    QCAPI -.->|«uses»| Blade
    QCAPI -.->|«uses»| Auth
    QCAPI -.->|«uses»| Common
    QCDB -.->|«uses»| DataPersistence
    
    style QC fill:#fff4e6
    style Process fill:#fff4e6
    style Blade fill:#fff4e6
    style Auth fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
```

### 4.5 追溯功能包内部结构

```mermaid
graph TB
    subgraph Trace["«package» 追溯功能包"]
        TraceUI["«package»<br/>Frontend UI<br/>scan.vue<br/>trace-detail.vue"]
        TraceAPI["«package»<br/>Backend API<br/>blade.js (trace)"]
        TraceDB["«package»<br/>Database<br/>All Tables"]
        QRCode["«package»<br/>QRCode Generator<br/>generate-qr.js"]
    end
    
    Auth["«package»<br/>认证功能包"]
    Blade["«package»<br/>叶片管理包"]
    Process["«package»<br/>工序录入包"]
    QC["«package»<br/>质检功能包"]
    Common["«package»<br/>公共基础包"]
    DataPersistence["«package»<br/>数据持久包"]
    External["«package»<br/>外部包<br/>WeChat API"]
    
    TraceUI -->|«uses»| TraceAPI
    TraceUI -->|«uses»| QRCode
    TraceAPI -->|«uses»| TraceDB
    TraceAPI -.->|«uses»| Auth
    TraceAPI -.->|«uses»| Blade
    TraceAPI -.->|«uses»| Process
    TraceAPI -.->|«uses»| QC
    TraceAPI -.->|«uses»| Common
    TraceDB -.->|«uses»| DataPersistence
    TraceUI -.->|«uses»| External
    
    style Trace fill:#fff4e6
    style Auth fill:#fff4e6
    style Blade fill:#fff4e6
    style Process fill:#fff4e6
    style QC fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
    style External fill:#fce4ec
```

### 4.6 系统管理包内部结构

```mermaid
graph TB
    subgraph SystemMgmt["«package» 系统管理包"]
        SystemUI["«package»<br/>Frontend UI<br/>user-manage.vue<br/>statistics.vue"]
        SystemAPI["«package»<br/>Backend API<br/>user.js<br/>statistics.js"]
        SystemDB["«package»<br/>Database<br/>operator_user<br/>process_def<br/>auth_account"]
    end
    
    Auth["«package»<br/>认证功能包"]
    Common["«package»<br/>公共基础包"]
    DataPersistence["«package»<br/>数据持久包"]
    
    SystemUI -->|«uses»| SystemAPI
    SystemAPI -->|«uses»| SystemDB
    SystemAPI -.->|«uses»| Auth
    SystemAPI -.->|«uses»| Common
    SystemDB -.->|«uses»| DataPersistence
    
    style SystemMgmt fill:#fff4e6
    style Auth fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
```

### 4.7 数据统计包内部结构

```mermaid
graph TB
    subgraph Statistics["«package» 数据统计包"]
        StatsUI["«package»<br/>Frontend UI<br/>statistics.vue"]
        StatsAPI["«package»<br/>Backend API<br/>statistics.js"]
        StatsDB["«package»<br/>Database<br/>All Business Tables"]
    end
    
    Auth["«package»<br/>认证功能包"]
    Blade["«package»<br/>叶片管理包"]
    Process["«package»<br/>工序录入包"]
    QC["«package»<br/>质检功能包"]
    Common["«package»<br/>公共基础包"]
    DataPersistence["«package»<br/>数据持久包"]
    
    StatsUI -->|«uses»| StatsAPI
    StatsAPI -->|«uses»| StatsDB
    StatsAPI -.->|«uses»| Auth
    StatsAPI -.->|«uses»| Blade
    StatsAPI -.->|«uses»| Process
    StatsAPI -.->|«uses»| QC
    StatsAPI -.->|«uses»| Common
    StatsDB -.->|«uses»| DataPersistence
    
    style Statistics fill:#fff4e6
    style Auth fill:#fff4e6
    style Blade fill:#fff4e6
    style Process fill:#fff4e6
    style QC fill:#fff4e6
    style Common fill:#e8f5e9
    style DataPersistence fill:#f3e5f5
```

---

## 五、数据持久包详细结构

```mermaid
graph TB
    subgraph DataPersistence["«package» 数据持久包"]
        subgraph MasterData["«package» Master Data"]
            BladeTable["blade<br/>叶片表"]
            OperatorTable["operator_user<br/>人员表"]
            ProcessDefTable["process_def<br/>工序定义表"]
        end
        
        subgraph ProcessData["«package» Process Data"]
            ProcessTable1["proc_alloy_preheat<br/>合金预热"]
            ProcessTable2["proc_stamp_form_cool<br/>冲压成型冷却"]
            ProcessTable3["proc_edge_grind<br/>打磨边缘"]
            ProcessTable4["proc_ceramic_coat_heat<br/>涂陶瓷漆涂层加热"]
            ProcessTable5["proc_second_stamp<br/>二次冲压"]
            ProcessTable6["proc_trim_excess<br/>切除多余金属"]
            ProcessTable7["proc_die_cast<br/>压铸"]
            ProcessTable8["proc_broach<br/>拉床加工"]
            ProcessTable9["proc_hyd_remove_protect<br/>液压机去除保护层"]
            ProcessTable10["proc_qr_engrave<br/>雕刻二维码"]
            ProcessTable11["proc_fluorescent_test<br/>荧光检测"]
        end
        
        subgraph StateData["«package» State Data"]
            StateTable["blade_process_state<br/>叶片工序状态表"]
        end
        
        subgraph QCData["«package» QC Data"]
            QCTable["qc_inspection<br/>质检记录表"]
        end
        
        subgraph AuthData["«package» Auth Data"]
            AuthTable["auth_account<br/>认证账户表"]
        end
    end
    
    style DataPersistence fill:#f3e5f5
    style MasterData fill:#e1bee7
    style ProcessData fill:#e1bee7
    style StateData fill:#e1bee7
    style QCData fill:#e1bee7
    style AuthData fill:#e1bee7
```

---

## 六、公共基础包详细结构

```mermaid
graph TB
    subgraph Common["«package» 公共基础包"]
        subgraph FrontendCommon["«package» Frontend Common"]
            Request["request.js<br/>网络请求"]
            Storage["storage.js<br/>本地存储"]
            Config["config.js<br/>配置"]
        end
        
        subgraph BackendCommon["«package» Backend Common"]
            Middleware["middleware/auth.js<br/>认证中间件"]
            DatabaseConfig["config/database.js<br/>数据库配置"]
            AppConfig["app.js<br/>应用配置"]
        end
    end
    
    style Common fill:#e8f5e9
    style FrontendCommon fill:#c8e6c9
    style BackendCommon fill:#c8e6c9
```

---

## 七、系统完整包图（综合视图）

```mermaid
graph TB
    subgraph System["«system» 叶片质量追溯系统"]
        direction TB
        
        subgraph FunctionPackages["功能包层"]
            Auth["«package»<br/>认证功能包"]
            Blade["«package»<br/>叶片管理包"]
            Process["«package»<br/>工序录入包"]
            QC["«package»<br/>质检功能包"]
            Trace["«package»<br/>追溯功能包"]
            SystemMgmt["«package»<br/>系统管理包"]
            Statistics["«package»<br/>数据统计包"]
        end
        
        subgraph SupportPackages["支撑包层"]
            Common["«package»<br/>公共基础包"]
            DataPersistence["«package»<br/>数据持久包"]
            External["«package»<br/>外部包"]
        end
    end
    
    %% 功能包依赖关系
    Blade -.->|«uses»| Auth
    Process -.->|«uses»| Blade
    Process -.->|«uses»| Auth
    QC -.->|«uses»| Process
    QC -.->|«uses»| Blade
    QC -.->|«uses»| Auth
    Trace -.->|«uses»| Auth
    Trace -.->|«uses»| Blade
    Trace -.->|«uses»| Process
    Trace -.->|«uses»| QC
    SystemMgmt -.->|«uses»| Auth
    Statistics -.->|«uses»| Auth
    Statistics -.->|«uses»| Blade
    Statistics -.->|«uses»| Process
    Statistics -.->|«uses»| QC
    
    %% 功能包依赖支撑包
    Auth -.->|«uses»| Common
    Auth -.->|«uses»| DataPersistence
    Blade -.->|«uses»| Common
    Blade -.->|«uses»| DataPersistence
    Process -.->|«uses»| Common
    Process -.->|«uses»| DataPersistence
    QC -.->|«uses»| Common
    QC -.->|«uses»| DataPersistence
    Trace -.->|«uses»| Common
    Trace -.->|«uses»| DataPersistence
    Trace -.->|«uses»| External
    SystemMgmt -.->|«uses»| Common
    SystemMgmt -.->|«uses»| DataPersistence
    Statistics -.->|«uses»| Common
    Statistics -.->|«uses»| DataPersistence
    
    style System fill:#e1f5ff
    style FunctionPackages fill:#fff4e6
    style SupportPackages fill:#e8f5e9
    style Auth fill:#fff4e6
    style Blade fill:#fff4e6
    style Process fill:#fff4e6
    style QC fill:#fff4e6
    style Trace fill:#fff4e6
    style SystemMgmt fill:#fff4e6
    style Statistics fill:#fff4e6
    style Common fill:#c8e6c9
    style DataPersistence fill:#f3e5f5
    style External fill:#fce4ec
```

---

## 八、使用说明

### 8.1 Mermaid渲染工具

以下工具支持Mermaid代码渲染：

1. **在线工具**：
   - [Mermaid Live Editor](https://mermaid.live/)
   - [GitHub/GitLab](https://github.com/) - 在Markdown文件中直接渲染
   - [Notion](https://www.notion.so/) - 支持Mermaid代码块

2. **VS Code插件**：
   - Markdown Preview Mermaid Support
   - Mermaid Preview

3. **文档工具**：
   - [Typora](https://typora.io/) - 支持Mermaid
   - [Obsidian](https://obsidian.md/) - 支持Mermaid

### 8.2 使用方法

1. **在线使用**：
   - 访问 https://mermaid.live/
   - 复制上述Mermaid代码
   - 粘贴到编辑器中
   - 自动渲染为图表

2. **在Markdown中使用**：
   ```markdown
   ```mermaid
   graph TB
       A[节点A] --> B[节点B]
   ```
   ```

3. **导出图片**：
   - 在Mermaid Live Editor中点击"Actions" → "Download PNG/SVG"
   - 或使用Mermaid CLI工具导出

### 8.3 代码说明

- **节点样式**：使用`style`定义节点颜色
- **依赖关系**：使用`-.->`表示依赖关系（虚线箭头）
- **包含关系**：使用`-->`表示包含关系（实线箭头）
- **子图**：使用`subgraph`创建包内部结构
- **构造型**：使用`«package»`、`«system»`表示UML构造型

---

**文档版本：** 1.0  
**最后更新：** 2024-12-27  
**维护者：** 系统架构团队

