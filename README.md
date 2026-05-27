# C# Class to JSON Schema

A dependency-free Web Component for converting C# class and record models into the JSON Schema subset accepted by Azure OpenAI Structured Outputs.

Open [index.html](./index.html) in a browser to use the converter.

## Features

- Parses `class`, `record class`, `record`, nested model types, and `enum`.
- Preserves C# member order in generated `properties` and `required`.
- Emits `additionalProperties: false` for every object schema.
- Represents nullable scalar types with `type: [T, "null"]`.
- Represents nullable object and array types with `anyOf`.
- Emits `$defs` and `$ref` for referenced model classes.
- Applies `[JsonPropertyName]`, `[JsonIgnore]`, `[Description]`, and XML summary comments where possible.
- Highlights C# input and JSON Schema output inside the Web Component.
- Rejects unsupported dictionary, `object`, and `dynamic` members with structured errors.

## Local Checks

```sh
npm test
```

The project uses only built-in Node.js test tooling.
