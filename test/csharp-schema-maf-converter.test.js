import test from "node:test";
import assert from "node:assert/strict";

import {
  SchemaConversionError,
  DEFAULT_SAMPLE,
} from "../src/csharp-schema-converter.js";
import {
  convertCsharpToMafResponseFormat,
  normalizeResponseFormatMetadata,
} from "../src/csharp-schema-maf-converter.js";

test("wraps generated schema in a MAF response format", () => {
  const responseFormat = convertCsharpToMafResponseFormat(DEFAULT_SAMPLE, {
    name: "CalendarEventResponse",
    description: "Response format for calendar event extraction.",
  });

  assert.equal(responseFormat.name, "CalendarEventResponse");
  assert.equal(
    responseFormat.description,
    "Response format for calendar event extraction.",
  );
  assert.equal(responseFormat.strict, true);
  assert.equal(responseFormat.schema.type, "object");
  assert.deepEqual(responseFormat.schema.required, [
    "event_name",
    "date",
    "location",
    "participants",
  ]);
});

test("validates MAF response format name constraints", () => {
  assert.deepEqual(
    normalizeResponseFormatMetadata({
      name: "Name_Of-ResponseFormat",
      description: "Description.",
    }),
    {
      name: "Name_Of-ResponseFormat",
      description: "Description.",
    },
  );

  assert.throws(
    () =>
      normalizeResponseFormatMetadata({
        name: "Invalid Name",
        description: "Description.",
      }),
    (error) => {
      assert.ok(error instanceof SchemaConversionError);
      assert.equal(error.code, "InvalidResponseFormatName");
      assert.equal(error.path, "$.name");
      return true;
    },
  );

  assert.throws(
    () =>
      normalizeResponseFormatMetadata({
        name: "a".repeat(65),
        description: "Description.",
      }),
    (error) => {
      assert.ok(error instanceof SchemaConversionError);
      assert.equal(error.code, "InvalidResponseFormatName");
      assert.equal(error.path, "$.name");
      return true;
    },
  );
});

test("requires a MAF response format description", () => {
  assert.throws(
    () =>
      normalizeResponseFormatMetadata({
        name: "ResponseFormat",
        description: "",
      }),
    (error) => {
      assert.ok(error instanceof SchemaConversionError);
      assert.equal(error.code, "InvalidResponseFormatDescription");
      assert.equal(error.path, "$.description");
      return true;
    },
  );
});
