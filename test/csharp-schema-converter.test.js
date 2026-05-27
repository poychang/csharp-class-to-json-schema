const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SchemaConversionError,
  convertCsharpToJsonSchema,
  DEFAULT_SAMPLE,
  highlightCsharp,
  highlightJson,
} = require("../src/csharp-schema-converter");

test("generates a structured outputs compatible schema for the sample model", () => {
  const schema = convertCsharpToJsonSchema(DEFAULT_SAMPLE);

  assert.deepEqual(schema.required, [
    "event_name",
    "date",
    "location",
    "participants",
  ]);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.event_name.description, "Name of the calendar event.");
  assert.deepEqual(schema.properties.location.type, ["string", "null"]);
  assert.deepEqual(schema.properties.participants.items, {
    $ref: "#/$defs/Person",
  });
  assert.deepEqual(schema.$defs.Person.required, ["name", "email"]);
  assert.equal(schema.$defs.Person.additionalProperties, false);
});

test("maps nullable enum values to a nullable string enum", () => {
  const schema = convertCsharpToJsonSchema(`
    public enum Unit
    {
      Celsius,
      Fahrenheit
    }

    public sealed class Forecast
    {
      public Unit? Unit { get; init; }
    }
  `);

  assert.deepEqual(schema.properties.unit, {
    type: ["string", "null"],
    enum: ["Celsius", "Fahrenheit", null],
  });
  assert.deepEqual(schema.required, ["unit"]);
});

test("supports positional record members and JsonPropertyName attributes", () => {
  const schema = convertCsharpToJsonSchema(`
    public record Person(
      [property: JsonPropertyName("full_name")] string Name,
      int? Age
    );
  `);

  assert.deepEqual(schema.properties, {
    full_name: { type: "string" },
    age: { type: ["integer", "null"] },
  });
  assert.deepEqual(schema.required, ["full_name", "age"]);
});

test("excludes JsonIgnore properties", () => {
  const schema = convertCsharpToJsonSchema(`
    public sealed class Person
    {
      [JsonIgnore]
      public string Secret { get; init; }

      public string Name { get; init; }
    }
  `);

  assert.deepEqual(Object.keys(schema.properties), ["name"]);
  assert.deepEqual(schema.required, ["name"]);
});

test("rejects dictionary properties with a structured error", () => {
  assert.throws(
    () =>
      convertCsharpToJsonSchema(`
        public sealed class Response
        {
          public Dictionary<string, string> Attributes { get; init; }
        }
      `),
    (error) => {
      assert.ok(error instanceof SchemaConversionError);
      assert.equal(error.code, "UnsupportedDictionary");
      assert.equal(error.path, "$.attributes");
      return true;
    },
  );
});

test("highlights csharp source while escaping html", () => {
  const html = highlightCsharp("public string Name { get; init; } // <unsafe>");

  assert.match(html, /class="token keyword">public<\/span>/);
  assert.match(html, /class="token type">string<\/span>/);
  assert.match(html, /&lt;unsafe&gt;/);
});

test("highlights json schema output while escaping string values", () => {
  const html = highlightJson('{"type":"string","description":"<unsafe>","nullable":null}');

  assert.match(html, /class="token key">&quot;type&quot;<\/span>/);
  assert.match(html, /class="token string">&quot;string&quot;<\/span>/);
  assert.match(html, /class="token literal">null<\/span>/);
  assert.match(html, /&lt;unsafe&gt;/);
});
