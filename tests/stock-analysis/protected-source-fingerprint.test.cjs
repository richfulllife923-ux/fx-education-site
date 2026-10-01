// Isolated fingerprint TEST DATA; never loaded by production.
const { test } = require("node:test"), assert = require("node:assert/strict");
const { sha256, canonicalTextBytes, onlyCrlfLfDifference, verifyProtectedText } = require("./protected-source-fingerprint.cjs");
const source = Buffer.from('\ufeff// proof\n\tconst value = "A";  \n\n', "utf8");
const expected = { RAW_SHA256: sha256(source), CANONICAL_TEXT_SHA256: sha256(canonicalTextBytes(source)) };
test("LF and same CRLF content pass while RAW mismatch remains recorded", () => {
  const crlf = Buffer.from(source.toString("utf8").replace(/\n/g, "\r\n"));
  const result = verifyProtectedText(crlf, source, expected);
  assert.equal(result.FINGERPRINT_CHECK, "PASS");
  assert.equal(result.RAW_SHA256_EQUAL, false);
  assert.equal(result.CANONICAL_TEXT_SHA256_EQUAL, true);
  assert.equal(result.DIFFERENCE_CLASS, "LINE_ENDING_ONLY");
  assert.ok(result.INDEPENDENT_EOL_ONLY_COMPARISON);
  assert.notEqual(result.RAW_SHA256, result.CANONICAL_TEXT_SHA256);
});
test("Exact bytes preserve both fingerprints and pass", () => {
  const result = verifyProtectedText(source, source, expected);
  assert.equal(result.RAW_SHA256_EQUAL, true); assert.equal(result.FINGERPRINT_CHECK, "PASS");
  assert.equal(result.DIFFERENCE_CLASS, "IDENTICAL");
});
for (const [name, mutate] of [
  ["one-character identifier", text => text.replace("value", "valuf")],
  ["one-character comment", text => text.replace("proof", "proog")],
  ["space/indentation", text => text.replace("const ", " const ")],
  ["trailing space", text => text.replace(";  ", "; ")],
  ["tab to space", text => text.replace("\t", " ")],
  ["string literal", text => text.replace('"A"', '"B"')],
  ["blank line", text => text.replace("\n\n", "\n")],
  ["case", text => text.replace("const", "Const")],
  ["quote", text => text.replace('"A"', "'A'")],
  ["BOM removal", text => text.slice(1)],
  ["standalone CR", text => text + "\r"],
  ["final newline", text => text.slice(0, -1)],
]) test(name + " difference fails canonical hash and independent diff", () => {
  const altered = Buffer.from(mutate(source.toString("utf8")));
  const result = verifyProtectedText(altered, source, expected);
  assert.equal(result.FINGERPRINT_CHECK, "FAIL");
  assert.equal(result.CANONICAL_TEXT_SHA256_EQUAL, false);
  assert.equal(onlyCrlfLfDifference(altered, source), false);
});
test("Mixed LF/CRLF only passes without trimming any other bytes", () => {
  const mixed = Buffer.from(source.toString("utf8").replace("proof\n", "proof\r\n"));
  assert.equal(verifyProtectedText(mixed, source, expected).FINGERPRINT_CHECK, "PASS");
  assert.deepEqual(canonicalTextBytes(mixed), source);
});
test("Unicode and encoding-relevant bytes remain distinct", () => {
  const a = Buffer.from("// café\n"), b = Buffer.from("// cafe\u0301\n");
  assert.notEqual(sha256(canonicalTextBytes(a)), sha256(canonicalTextBytes(b)));
  assert.equal(onlyCrlfLfDifference(a, b), false);
  const invalidA = Buffer.from([255, 10]), invalidB = Buffer.from([254, 10]);
  assert.notEqual(sha256(canonicalTextBytes(invalidA)), sha256(canonicalTextBytes(invalidB)));
});
test("A changed reference cannot authorize changed source", () => {
  const altered = Buffer.from(source.toString("utf8").replace("value", "other"));
  assert.equal(verifyProtectedText(altered, altered, expected).FINGERPRINT_CHECK, "FAIL");
});
