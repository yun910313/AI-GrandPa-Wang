---
name: repository-skill
description: 規範資料庫 Repository 層的 CRUD 操作標準，確保程式碼具備一致性、安全性與高效能。
---

```markdown
# Repository CRUD 技能規範 (Skill Rules)

## 1. 核心目標
規範針對資料庫資料表（Table）進行增刪查改（CRUD）的操作標準，確保 Repository 層程式碼具備一致性、安全性與高效能。

## 2. 實作準則

### 查詢 (Read)
*   **單筆查詢**：必須處理「查無資料」的情境（回傳 Null 或拋出自定義 NotFound 異常）。
*   **清單查詢**：
    *   預設必須實作分頁（Pagination）機制。
    *   支援動態過濾條件（Filtering）與排序（Sorting）。
*   **效能**：僅選取必要的欄位，避免 `SELECT *`。

### 新增 (Create)
*   **輸入驗證**：使用專用的 `CreateDTO`，並在進入 Repository 前完成基礎格式驗證。
*   **唯一性檢查**：寫入前須檢查業務鍵（Business Key）是否重複。
*   **回傳值**：成功後回傳完整的新增實體或其識別碼（ID）。

### 更新 (Update)
*   **檢查機制**：更新前必須確認該資料項存在。
*   **更新範圍**：
    *   **Full Update**：替換整個實體。
    *   **Partial Update (Patch)**：僅更動有變更的欄位。
*   **併發控制**：建議實作樂觀鎖（Optimistic Locking，如 Version 欄位）。

### 刪除 (Delete)
*   **策略選用**：
    *   優先採用 **軟刪除 (Soft Delete)**（透過 `is_deleted` 標記）。
    *   僅在特定法規或需求下執行實體刪除（Hard Delete）。
*   **關聯處理**：檢查外鍵約束，避免破壞參照完整性。

## 3. 代碼品質與安全
*   **異步操作**：所有資料庫存取必須採用 `async/await` 異步模式。
*   **事務管理**：涉及多表異動時，必須在 Unit of Work 或 Transaction 中執行。
*   **參數化查詢**：嚴禁字串拼接，防止 SQL Injection。

## 4. 執行任務清單 (Task List)
- [ ] 定義資料表實體模型 (Entity Model) 與資料傳輸物件 (DTO)。
- [ ] 建立 Repository 介面 (Interface) 定義標準方法。
- [ ] 實作查詢邏輯（包含 ID 查詢與分頁過濾）。
- [ ] 實作新增邏輯（包含欄位驗證與唯一性檢查）。
- [ ] 實作更新邏輯（支援併發控制與部分更新）。
- [ ] 實作刪除邏輯（配置軟刪除過濾器）。
- [ ] 撰寫整合測試驗證 CRUD 完整流程。
```
