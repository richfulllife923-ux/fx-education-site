// Protected TEXT source verification only. Binary integrity continues to use raw SHA-256.
const crypto = require("node:crypto");
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
// Work on bytes: no decoding, BOM removal, Unicode/encoding conversion or whitespace changes.
function canonicalTextBytes(bytes) {
  const output = Buffer.alloc(bytes.length); let length = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 13 && bytes[i + 1] === 10) continue;
    output[length++] = bytes[i];
  }
  return output.subarray(0, length);
}
// Independent comparison: two cursors compare bytes directly without hashing/canonical buffers.
function onlyCrlfLfDifference(a, b) {
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (a[i] === 13 && a[i + 1] === 10) i++;
    if (b[j] === 13 && b[j + 1] === 10) j++;
    if (i >= a.length || j >= b.length) return i === a.length && j === b.length;
    if (a[i++] !== b[j++]) return false;
  }
  return true;
}
function verifyProtectedText(actual, reference, expected) {
  const raw = sha256(actual), canonical = sha256(canonicalTextBytes(actual));
  const rawEqual = raw === expected.RAW_SHA256;
  const canonicalEqual = canonical === expected.CANONICAL_TEXT_SHA256;
  const referenceAnchored = sha256(canonicalTextBytes(reference)) === expected.CANONICAL_TEXT_SHA256;
  const independentDiffEqual = onlyCrlfLfDifference(actual, reference);
  const passed = canonicalEqual && referenceAnchored && independentDiffEqual;
  return {
    RAW_SHA256: raw, CANONICAL_TEXT_SHA256: canonical,
    RAW_SHA256_EQUAL: rawEqual, CANONICAL_TEXT_SHA256_EQUAL: canonicalEqual,
    INDEPENDENT_EOL_ONLY_COMPARISON: independentDiffEqual,
    REFERENCE_ANCHORED: referenceAnchored,
    DIFFERENCE_CLASS: passed ? (rawEqual ? "IDENTICAL" : "LINE_ENDING_ONLY") : "NON_EOL_DIFFERENCE",
    PROTECTED_CONTENT_CHANGED: !passed, FINGERPRINT_CHECK: passed ? "PASS" : "FAIL",
  };
}
module.exports = { sha256, canonicalTextBytes, onlyCrlfLfDifference, verifyProtectedText };
