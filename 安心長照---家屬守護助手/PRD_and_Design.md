# 安心長照---家屬守護助手 - 產品需求與設計文件 (PRD & Design)

## 1. 產品概述
### 1.1 產品願景
透過遠端數據整合與即時通知，減輕家屬的照護壓力，確保長輩獲得精確且及時的照護支持。

### 1.2 目標對象
- 需要遠端照護父母或長輩的家屬。
- 居家照護服員或個案管理人員。

---

## 2. 系統架構圖 (System Architecture)
```mermaid
graph LR
    Caregiver((家屬))
    FE[React Frontend]
    BE[Node.js / Express Server]
    Service[Service Layer]
    Repo[Repository Layer]
    DB[(MSSQL Database)]

    Caregiver -->|管理設定| FE
    FE -->|API Requests| BE
    BE -->|Business Logic| Service
    Service -->|Data Access| Repo
    Repo -->|SQL Query| DB
    DB -->|Result Set| Repo
    Repo -->|Data Objects| Service
```

---

## 3. 核心功能需求
### 3.1 守護管理中心 (Console)
- **多對象監控**：快速切換不同長輩個案。
- **異常警報**：生理指標超過預設範圍或漏藥通知。

### 3.2 遠端計畫設定 (Care Planning)
- **用藥排程管理**：設定藥品、劑量、提醒頻率。
- **執行紀錄追蹤**：查看長輩端回傳的服藥 Log。

### 3.3 健康數據分析 (Health Analytics)
- **歷史趨勢**：心率、血壓、體溫數據的視覺化圖表。
- **就醫紀錄管理**：雲端儲存醫囑、診斷與回診時間。

---

## 4. 類別圖 (Class Diagram)
```mermaid
classDiagram
    class MedicationService {
        -medicationRepo: MedicationRepository
        +getAllMedications()
        +createMedication(data)
        +updateMedication(id, data)
        +deleteMedication(id)
    }
    class MedicationRepository {
        +findAll()
        +create(data)
        +update(id, data)
        +delete(id)
    }
    class ConnectionFactory {
        +createConnection(): ConnectionPool
    }

    MedicationService --> MedicationRepository : 使用
    MedicationRepository ..> ConnectionFactory : 依賴
```

---

## 5. 業務流程循序圖 (Sequence Diagram)
### 以「家屬新增用藥提醒」為例：
```mermaid
sequenceDiagram
    participant C as 家屬
    participant FE as 前端介面
    participant BE as server.ts (Controller)
    participant S as MedicationService
    participant R as MedicationRepository
    participant DB as 資料庫

    C->>FE: 輸入藥物資訊並按儲存
    FE->>BE: POST /api/medications
    BE->>S: createMedication(data)
    S->>S: 基礎驗證 (如ID是否存在)
    S->>R: create(data)
    R->>DB: INSERT INTO medications ...
    DB-->>R: Success / Inserted ID
    R-->>FE: 回傳成功狀態
    FE-->>C: 顯示「設定已同步同步」
```

---

## 6. 技術規格
- **後端技術**：Node.js + TypeScript + Express。
- **資料庫**：Azure SQL Database (MSSQL)。
- **開發模式**：Service-Repository 模式，確保商業邏輯與資料存取解耦。
