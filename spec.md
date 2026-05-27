# C# Class Model 轉 Azure OpenAI Structured Outputs JSON Schema 規格

## 1. 目的

建立一套轉換規格，將 C# Class Model 轉換成可用於 Azure OpenAI Structured Outputs 的 JSON Schema。

輸出的 JSON Schema 必須符合 Azure OpenAI Structured Outputs 支援的 JSON Schema 子集，並可直接放入：

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "SchemaName",
    "strict": true,
    "schema": { }
  }
}
```

或 C# SDK：

```csharp
ChatResponseFormat.CreateJsonSchemaFormat(
    jsonSchemaFormatName: "schema_name",
    jsonSchema: BinaryData.FromBytes(schemaBytes),
    jsonSchemaIsStrict: true)
```

## 2. 設計原則

1. 輸出 Schema 必須能被 Azure OpenAI Structured Outputs 接受。
2. 輸出 Schema 必須保守，不產生 Azure OpenAI 不支援的 JSON Schema 關鍵字。
3. C# Model 的欄位順序應被保留，因為 Structured Outputs 的輸出鍵順序會依 Schema 順序產生。
4. 所有物件屬性都必須出現在 `required` 中。
5. C# 中的可選語意不得用「省略屬性」表達，必須用 `null` 表達。
6. 所有 object schema 都必須設定 `additionalProperties: false`。
7. 不可為了完整描述 C# 型別而輸出 Azure OpenAI 不支援的驗證條件。
8. 無法精準表達的 C# 型別，必須降級為支援型別、加入 `description`，或直接拒絕轉換。

## 3. 輸入範圍

### 3.1 支援的 C# Model 型態

支援下列模型來源：

1. `class`
2. `record class`
3. `record`
4. 公開可讀取屬性
5. 公開欄位，僅在設定允許時納入
6. 巢狀類別
7. enum
8. 泛型集合型別
9. nullable value type
10. nullable reference type metadata

### 3.2 預設排除成員

以下成員不得輸出成 JSON Schema property：

1. static member
2. indexer
3. method
4. event
5. delegate
6. `[JsonIgnore]` 標記成員
7. 無 public getter 的 property
8. 編譯器產生且非資料模型用途的 member

## 4. 輸出 Schema 基本結構

根 Schema 必須是 object，不得是 `anyOf`。

```json
{
  "type": "object",
  "properties": {
  },
  "required": [
  ],
  "additionalProperties": false
}
```

若輸入型別不是 object model，例如 `List<T>`、`string`、`int`、union root，必須包裝成 object：

```csharp
public sealed class RootResponse
{
    public required List<Item> Items { get; init; }
}
```

## 5. JSON Schema 支援關鍵字白名單

轉換器只能輸出以下 JSON Schema 關鍵字：

| 關鍵字                    | 用途                 |
| ---------------------- | ------------------ |
| `type`                 | 宣告型別               |
| `properties`           | object 屬性          |
| `required`             | object 必填屬性        |
| `additionalProperties` | 必須為 `false`        |
| `items`                | array item schema  |
| `enum`                 | enum 值集合           |
| `anyOf`                | 聯集型別、nullable、有限多型 |
| `$defs`                | 共用定義               |
| `$ref`                 | 引用 `$defs` 或遞迴結構   |
| `description`          | 語意描述               |

除非後續明確擴充規格，其他 JSON Schema 關鍵字一律不得輸出。

## 6. 不得輸出的 JSON Schema 關鍵字

### 6.1 string 不支援

不得輸出：

1. `minLength`
2. `maxLength`
3. `pattern`
4. `format`

因此以下 C# attribute 只能轉成 `description`，不得轉成驗證關鍵字：

1. `[MinLength]`
2. `[MaxLength]`
3. `[StringLength]`
4. `[RegularExpression]`
5. `[EmailAddress]`
6. `[Url]`
7. `[Phone]`
8. `[CreditCard]`
9. `[DataType]`

### 6.2 number / integer 不支援

不得輸出：

1. `minimum`
2. `maximum`
3. `multipleOf`

因此以下 C# attribute 只能轉成 `description`，不得轉成驗證關鍵字：

1. `[Range]`
2. 自訂數值範圍驗證 attribute

### 6.3 object 不支援

不得輸出：

1. `patternProperties`
2. `unevaluatedProperties`
3. `propertyNames`
4. `minProperties`
5. `maxProperties`

### 6.4 array 不支援

不得輸出：

1. `unevaluatedItems`
2. `contains`
3. `minContains`
4. `maxContains`
5. `minItems`
6. `maxItems`
7. `uniqueItems`

因此 `[MinLength]`、`[MaxLength]`、集合數量限制、唯一值限制，不得轉成 array 驗證條件。

## 7. C# 型別對應規則

### 7.1 基本型別

| C# 型別                                                                     | JSON Schema                                                                |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `string`                                                                  | `{ "type": "string" }`                                                     |
| `char`                                                                    | `{ "type": "string", "description": "Single character string." }`          |
| `bool`                                                                    | `{ "type": "boolean" }`                                                    |
| `byte` / `sbyte` / `short` / `ushort` / `int` / `uint` / `long` / `ulong` | `{ "type": "integer" }`                                                    |
| `float` / `double` / `decimal`                                            | `{ "type": "number" }`                                                     |
| `Guid`                                                                    | `{ "type": "string", "description": "GUID string." }`                      |
| `DateTime`                                                                | `{ "type": "string", "description": "Date and time string." }`             |
| `DateTimeOffset`                                                          | `{ "type": "string", "description": "Date and time with offset string." }` |
| `DateOnly`                                                                | `{ "type": "string", "description": "Date string." }`                      |
| `TimeOnly`                                                                | `{ "type": "string", "description": "Time string." }`                      |
| `TimeSpan`                                                                | `{ "type": "string", "description": "Time span string." }`                 |
| `object`                                                                  | 不支援，必須指定具體型別                                                               |
| `dynamic`                                                                 | 不支援                                                                        |

禁止使用 `format` 表達 `date-time`、`uuid`、`email` 等格式。

### 7.2 nullable value type

```csharp
public int? Age { get; init; }
```

輸出：

```json
{
  "type": ["integer", "null"]
}
```

該 property 仍必須出現在 `required` 中。

### 7.3 nullable reference type

啟用 nullable reference type 時：

```csharp
public string Name { get; init; } = default!;
public string? Nickname { get; init; }
```

輸出：

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "nickname": { "type": ["string", "null"] }
  },
  "required": ["name", "nickname"],
  "additionalProperties": false
}
```

### 7.4 enum

預設以 enum 名稱輸出 string enum：

```csharp
public enum Unit
{
    Celsius,
    Fahrenheit
}
```

輸出：

```json
{
  "type": "string",
  "enum": ["Celsius", "Fahrenheit"]
}
```

若 enum 受到 `JsonStringEnumConverter`、`JsonPropertyName`、`EnumMember` 或自訂命名策略影響，轉換器必須採用與實際序列化一致的字串值。

不建議將 enum 輸出成 integer，除非專案明確要求與序列化行為一致。

### 7.5 nullable enum

```csharp
public Unit? Unit { get; init; }
```

輸出：

```json
{
  "type": ["string", "null"],
  "enum": ["Celsius", "Fahrenheit", null]
}
```

若目標平台不接受 `enum` 中包含 `null`，可改用：

```json
{
  "anyOf": [
    { "type": "string", "enum": ["Celsius", "Fahrenheit"] },
    { "type": "null" }
  ]
}
```

### 7.6 array / collection

下列型別輸出成 array：

1. `T[]`
2. `List<T>`
3. `IList<T>`
4. `IReadOnlyList<T>`
5. `ICollection<T>`
6. `IEnumerable<T>`，僅在 T 可解析且語意確定時支援

```csharp
public List<string> Participants { get; init; } = [];
```

輸出：

```json
{
  "type": "array",
  "items": {
    "type": "string"
  }
}
```

不得輸出 `minItems`、`maxItems`、`uniqueItems`。

### 7.7 nullable collection

```csharp
public List<string>? Tags { get; init; }
```

輸出：

```json
{
  "anyOf": [
    {
      "type": "array",
      "items": { "type": "string" }
    },
    { "type": "null" }
  ]
}
```

或使用 type union：

```json
{
  "type": ["array", "null"],
  "items": { "type": "string" }
}
```

轉換器應採一致策略。建議對 simple scalar nullable 使用 `type: [T, "null"]`，對 array / object nullable 使用 `anyOf`。

### 7.8 object / class

```csharp
public sealed class CalendarEvent
{
    public required string Name { get; init; }
    public required string Date { get; init; }
    public required List<string> Participants { get; init; }
}
```

輸出：

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "date": { "type": "string" },
    "participants": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["name", "date", "participants"],
  "additionalProperties": false
}
```

### 7.9 dictionary

`Dictionary<string, TValue>` 不得直接輸出成 JSON object，因為任意鍵需要 `additionalProperties`，但 Structured Outputs 要求 object 必須 `additionalProperties: false`。

預設處理方式：拒絕轉換。

允許的替代設計：改成 key-value array model。

```csharp
public sealed class AttributeItem
{
    public required string Key { get; init; }
    public required string Value { get; init; }
}

public sealed class Response
{
    public required List<AttributeItem> Attributes { get; init; }
}
```

輸出：

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "key": { "type": "string" },
      "value": { "type": "string" }
    },
    "required": ["key", "value"],
    "additionalProperties": false
  }
}
```

### 7.10 inheritance / polymorphism

根型別不得輸出成 `anyOf`。

property 或 array item 可使用 `anyOf` 表達有限多型，但每個分支都必須符合 Structured Outputs 子集。

建議使用 discriminator 欄位，但不得使用 OpenAPI 的 `discriminator` 關鍵字。

```json
{
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "kind": { "type": "string", "enum": ["text"] },
        "text": { "type": "string" }
      },
      "required": ["kind", "text"],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "kind": { "type": "string", "enum": ["image"] },
        "url": { "type": "string" }
      },
      "required": ["kind", "url"],
      "additionalProperties": false
    }
  ]
}
```

## 8. required 產生規則

### 8.1 核心規則

每個 object schema：

1. `properties` 中出現的每個 property，都必須出現在 `required`。
2. 不得因為 C# property 是 nullable、非 required、或有 default value 而從 `required` 排除。
3. 可省略語意必須用 `null` 表達。

### 8.2 C# required 與 Schema required 的差異

C# 的 `required`、`[JsonRequired]`、constructor required parameter，只能用來判斷非 null 語意或模型設計意圖。

在 Azure OpenAI Structured Outputs JSON Schema 中，所有 property 一律 required。

因此：

```csharp
public sealed class Person
{
    public string? Nickname { get; init; }
}
```

仍必須輸出：

```json
{
  "type": "object",
  "properties": {
    "nickname": { "type": ["string", "null"] }
  },
  "required": ["nickname"],
  "additionalProperties": false
}
```

## 9. property 名稱解析規則

property 名稱必須與實際 `System.Text.Json` 序列化名稱一致。

解析順序：

1. `[JsonPropertyName("...")]`
2. 明確設定的 custom name resolver
3. `JsonSerializerOptions.PropertyNamingPolicy`
4. 原始 C# property name

若啟用 `JsonNamingPolicy.CamelCase`：

```csharp
public string FinalAnswer { get; init; } = default!;
```

輸出：

```json
{
  "finalAnswer": { "type": "string" }
}
```

若有：

```csharp
[JsonPropertyName("final_answer")]
public string FinalAnswer { get; init; } = default!;
```

輸出：

```json
{
  "final_answer": { "type": "string" }
}
```

## 10. description 產生規則

`description` 可由以下來源產生：

1. `[Description]`
2. XML documentation comment
3. 自訂 schema description attribute
4. 因限制降級後產生的補充描述

範例：

```csharp
[Description("The date of the event. Use yyyy-MM-dd.")]
public required DateOnly Date { get; init; }
```

輸出：

```json
{
  "type": "string",
  "description": "The date of the event. Use yyyy-MM-dd."
}
```

不得因為描述中提到格式，就產生 `format` 或 `pattern`。

## 11. $defs 與 $ref 規則

### 11.1 使用時機

下列情況應使用 `$defs`：

1. 同一型別被多處引用
2. 遞迴型別
3. 巢狀型別過長，使用 `$defs` 可提升可讀性

### 11.2 命名規則

`$defs` key 應採穩定、可重現的名稱。

建議格式：

```text
{Namespace}.{TypeName}
```

若 JSON Schema 消費端不接受 `.`，使用安全名稱：

```text
Namespace_TypeName
```

### 11.3 遞迴

允許使用 `$ref: "#"` 表示根遞迴，或使用 `$ref: "#/$defs/TypeName"` 表示明確遞迴。

遞迴節點中仍必須滿足：

1. object 有 `properties`
2. object 有完整 `required`
3. object 有 `additionalProperties: false`
4. nullable next/reference 使用 `anyOf` 加 `null`

## 12. 巢狀深度與 property 數量限制

### 12.1 限制

產生後的 Schema 必須通過：

1. object property 總數不得超過 100
2. object 巢狀層級不得超過 5

### 12.2 object property 總數計算

計算所有 object schema 的 `properties` 數量總和，包含：

1. root object
2. nested object
3. array item object
4. anyOf 分支中的 object
5. `$defs` 中的 object

### 12.3 巢狀層級計算

root object 為第 1 層。

每進入一個 object property 的 object schema，層級 +1。

array 本身不增加 object 層級，但 array item 若是 object，該 object 層級 +1。

anyOf 本身不增加 object 層級，但 anyOf 分支若是 object，該 object 層級依所在位置 +1。

## 13. 驗證流程

轉換器必須在輸出前執行驗證。

### 13.1 Schema 結構驗證

檢查：

1. root schema `type` 必須是 `object`
2. root schema 不得是 `anyOf`
3. 每個 object 必須有 `additionalProperties: false`
4. 每個 object 的 `required` 必須完整包含所有 `properties` key
5. 不得輸出黑名單關鍵字
6. 不得輸出 unsupported type
7. `anyOf` 每個分支都必須符合相同規則
8. `$ref` 必須能解析
9. `$defs` 中所有 schema 必須符合相同規則

### 13.2 Azure OpenAI 限制驗證

檢查：

1. object property 總數 <= 100
2. object 巢狀深度 <= 5
3. dictionary 未被直接輸出成自由鍵 object
4. nullable 欄位仍存在於 `required`
5. array 未輸出數量限制
6. string 未輸出格式或 pattern 限制
7. number 未輸出範圍限制

### 13.3 序列化一致性驗證

檢查：

1. property 名稱是否與 `System.Text.Json` 實際輸出一致
2. enum 值是否與 `System.Text.Json` 實際輸出一致
3. `[JsonIgnore]` 是否被排除
4. naming policy 是否被套用
5. source-generated context 的 metadata 是否可正確讀取

## 14. 轉換錯誤處理

轉換失敗時，必須回傳具體錯誤碼與路徑。

錯誤格式：

```json
{
  "code": "UnsupportedDictionary",
  "path": "$.attributes",
  "message": "Dictionary<string, string> cannot be represented because Structured Outputs requires additionalProperties: false. Use a key-value array model instead."
}
```

### 14.1 錯誤碼

| 錯誤碼                                | 意義                                       |
| ---------------------------------- | ---------------------------------------- |
| `RootMustBeObject`                 | root schema 不是 object                    |
| `RootAnyOfNotAllowed`              | root 使用 anyOf                            |
| `UnsupportedType`                  | C# 型別無法映射                                |
| `UnsupportedDictionary`            | dictionary 需要自由鍵 object                  |
| `UnsupportedKeywordGenerated`      | 產生了不支援的 JSON Schema 關鍵字                  |
| `MissingAdditionalPropertiesFalse` | object 未設定 `additionalProperties: false` |
| `RequiredNotComplete`              | required 未包含所有 properties                |
| `ExceededPropertyLimit`            | object property 總數超過 100                 |
| `ExceededNestingDepth`             | object 巢狀層級超過 5                          |
| `UnresolvedReference`              | `$ref` 無法解析                              |
| `AmbiguousPolymorphism`            | 多型型別無法產生有限 anyOf                         |
| `SerializationNameConflict`        | 多個 C# member 解析成同一 JSON property name    |

## 15. 產生流程

```text
Input C# Type
  ↓
Read System.Text.Json metadata
  ↓
Filter unsupported members
  ↓
Resolve JSON property names
  ↓
Map C# types to JSON Schema subset
  ↓
Normalize nullable into required + null union
  ↓
Set additionalProperties: false on every object
  ↓
Generate required from every properties key
  ↓
Extract reusable object schemas into $defs when needed
  ↓
Validate schema subset
  ↓
Validate Azure OpenAI limits
  ↓
Emit JSON Schema
```

## 16. 範例

### 16.1 C# Model

```csharp
using System.ComponentModel;
using System.Text.Json.Serialization;

public sealed class CalendarEventResponse
{
    [JsonPropertyName("event_name")]
    [Description("Name of the calendar event.")]
    public required string Name { get; init; }

    [Description("Event date. Use yyyy-MM-dd.")]
    public required DateOnly Date { get; init; }

    public string? Location { get; init; }

    public required List<Person> Participants { get; init; }
}

public sealed class Person
{
    public required string Name { get; init; }
    public string? Email { get; init; }
}
```

### 16.2 輸出 Schema

```json
{
  "type": "object",
  "properties": {
    "event_name": {
      "type": "string",
      "description": "Name of the calendar event."
    },
    "date": {
      "type": "string",
      "description": "Event date. Use yyyy-MM-dd."
    },
    "location": {
      "type": ["string", "null"]
    },
    "participants": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/Person"
      }
    }
  },
  "required": ["event_name", "date", "location", "participants"],
  "additionalProperties": false,
  "$defs": {
    "Person": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "email": {
          "type": ["string", "null"]
        }
      },
      "required": ["name", "email"],
      "additionalProperties": false
    }
  }
}
```

## 17. 實作建議

### 17.1 .NET metadata 來源

優先使用 `System.Text.Json` contract metadata，而不是直接只讀 reflection。

原因：

1. property name 需要符合實際序列化結果
2. `[JsonIgnore]` 需要被正確處理
3. converter / naming policy 可能改變輸出
4. required metadata 可從 contract model 取得

可用來源：

1. `JsonSerializerOptions.TypeInfoResolver`
2. `DefaultJsonTypeInfoResolver`
3. source-generated `JsonSerializerContext`
4. `JsonTypeInfo`
5. `JsonPropertyInfo`

### 17.2 Nullability 判斷

可使用：

1. `NullabilityInfoContext`
2. `Nullable.GetUnderlyingType`
3. `JsonPropertyInfo.IsRequired`
4. C# `required` metadata
5. `[JsonRequired]`

判斷結果只影響是否允許 `null`，不影響 `required` 是否包含該 property。

### 17.3 命名策略

轉換器設定必須接收 `JsonSerializerOptions`，並以該 options 解析：

1. property naming policy
2. dictionary key policy，雖然 dictionary 預設不支援
3. enum converter 行為
4. ignore condition
5. source-generated metadata

## 18. 明確不支援項目

以下項目不得自動轉換：

1. `Dictionary<TKey, TValue>` 直接轉 object
2. `object`
3. `dynamic`
4. open generic type
5. `Tuple` / `ValueTuple`，除非轉成具名 object
6. 非 string key dictionary
7. 無法靜態列舉分支的 interface / abstract class
8. circular reference 且無法用 `$ref` 表達者
9. 依 runtime converter 動態決定 shape 的型別
10. 需要 `format`、`pattern`、`minimum`、`maximum` 才能表達正確性的型別

## 19. 完成定義

此轉換器完成時，必須滿足：

1. 可輸入 C# class / record type 並產生 JSON Schema。
2. 產生的 Schema 不包含 Azure OpenAI Structured Outputs 不支援的關鍵字。
3. 每個 object 都有 `additionalProperties: false`。
4. 每個 object 的 `required` 完整包含所有 properties。
5. nullable 屬性以 `null` union 或 `anyOf` 表示，且仍列為 required。
6. root schema 必定是 object。
7. object property 總數不得超過 100。
8. object 巢狀層級不得超過 5。
9. property name 與 System.Text.Json 實際序列化名稱一致。
10. enum 值與 System.Text.Json 實際序列化值一致。
11. 遇到無法安全轉換的 C# 型別時，回傳明確錯誤，不產生不合規 Schema。
