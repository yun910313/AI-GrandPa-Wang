```yaml
name: webapi-skill
description: RESTful API 設計規範與實作指引，涵蓋基礎路徑、HTTP 方法、資源命名、狀態碼及錯誤處理格式。
```

```markdown
# RESTful API 設計規範

## 1. 基礎路徑 (Base URL)
所有 API 應包含版本號以確保相容性，例如：
`https://api.domain.com/v1/`

## 2. HTTP 方法規範
- **GET**: 取得資源或資源列表。
- **POST**: 建立新資源。
- **PUT**: 更新現有資源（完整替換）。
- **PATCH**: 部分更新現有資源。
- **DELETE**: 刪除資源。

## 3. 資源命名原則
- **使用名詞**: 路徑應代表資源，而非動作（例如：使用 `/users` 而非 `/getUsers`）。
- **複數形式**: 資源名稱統一使用複數（例如：`/orders`, `/products`）。
- **層級關係**: 使用路徑表達資源隸屬關係（例如：`/users/123/orders`）。
- **小寫與連字號**: 路徑一律使用小寫，單字間以 `-` 分隔。

## 4. 標準回應狀態碼
- `200 OK`: 請求成功。
- `201 Created`: 資源建立成功。
- `204 No Content`: 請求成功但無回傳內容（常用於 DELETE）。
- `400 Bad Request`: 客戶端請求參數錯誤。
- `401 Unauthorized`: 未經身份驗證。
- `403 Forbidden`: 權限不足，拒絕訪問。
- `404 Not Found`: 找不到指定資源。
- `500 Internal Server Error`: 伺服器內部錯誤。

## 5. 錯誤處理格式
當發生錯誤時，應回傳統一的 JSON 結構：
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤詳細描述",
    "details": {}
  }
}
```

## 6. 過濾、排序與分頁
- **過濾**: `GET /products?category=electronics`
- **排序**: `GET /products?sort=price,desc`
- **分頁**: `GET /products?page=2&limit=20`
```

