# C# Class to JSON Schema

這是一個零相依的 Web Component，可將 C# `class` / `record` 模型轉換成 Azure OpenAI Structured Outputs 可接受的 JSON Schema 子集，也提供 MAF response format 包裝元件。

## 使用方式

在頁面載入元件：

```html
<script type="module" src="/assets/components/csharp-schema-converter.js"></script>
```

在頁面任意位置放入標籤：

```html
<csharp-json-schema-converter></csharp-json-schema-converter>
```

如果要輸出 MAF response format，改載入 MAF 元件並放入 `<csharp-schema--maf-converter>`：

```html
<script type="module" src="/assets/components/csharp-schema-maf-converter.js"></script>

<csharp-schema--maf-converter></csharp-schema--maf-converter>
```

MAF 元件會額外顯示 `name` 與 `description` 欄位，並輸出下列結構，其中 `strict` 固定為 `true`：

```json
{
  "name": "NameOfResponseFormat",
  "description": "description of what the response format is for",
  "schema": {},
  "strict": true
}
```

如果需要在 JavaScript 中直接使用轉換函式，可用 ESM import：

```js
import {
  convertCsharpToJsonSchema,
  formatSchema,
} from "/assets/components/csharp-schema-converter.js";

const schema = convertCsharpToJsonSchema(csharpSource);
console.log(formatSchema(schema));
```

MAF helper 也可用 ESM import：

```js
import {
  convertCsharpToMafResponseFormat,
} from "/assets/components/csharp-schema-maf-converter.js";

const responseFormat = convertCsharpToMafResponseFormat(csharpSource, {
  name: "NameOfResponseFormat",
  description: "description of what the response format is for",
});
console.log(JSON.stringify(responseFormat, null, 2));
```

如果只是本機試用，也可以直接用瀏覽器開啟 [index.html](./index.html)。

## 功能

- 支援解析 `class`、`record class`、`record`、巢狀模型型別與 `enum`。
- 產生的 `properties` 與 `required` 會保留 C# 成員順序。
- 每個 object schema 都會輸出 `additionalProperties: false`。
- nullable scalar 會以 `type: [T, "null"]` 表示。
- nullable object 與 array 會以 `anyOf` 表示。
- 參考到其他模型型別時，會輸出 `$defs` 與 `$ref`。
- 會套用 `[JsonPropertyName]`、`[JsonIgnore]`、`[Description]`，並盡量讀取 XML summary comment。
- 內建 C# 輸入與 JSON Schema 輸出的 syntax highlighting。
- 遇到 dictionary、`object`、`dynamic` 等無法安全轉換的型別時，會回傳結構化錯誤。

## 主要限制

- 不輸出 Azure OpenAI Structured Outputs 不支援的 JSON Schema 關鍵字，例如 `format`、`pattern`、`minimum`、`maximum`、`minItems`。
- `Dictionary<TKey, TValue>` 不會直接轉成自由鍵 object，因為 Structured Outputs 要求 object 必須使用 `additionalProperties: false`。
- root schema 必須是 object。
- 目前轉換器以瀏覽器端靜態解析 C# source 為主，並非完整 C# compiler / Roslyn 分析器。

## 本機檢查

```sh
npm test
```

本專案只使用 Node.js 內建測試工具。

## 主要參考來源

- [結構化輸出 - Azure OpenAI in Microsoft Foundry Models](https://learn.microsoft.com/zh-tw/azure/foundry/openai/how-to/structured-outputs)
