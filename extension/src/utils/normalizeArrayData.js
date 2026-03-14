/**
 * Safely normalizes input data to an array.
 *
 * Prevents `TypeError: forEach is not a function` and similar crashes
 * when the backend returns malformed data (e.g., `{}` instead of `[]`).
 *
 * @param {unknown} data - The data to normalize.
 * @returns {Array} The original array if valid, otherwise an empty array.
 *
 * @example
 * normalizeArrayData([1, 2, 3]); // [1, 2, 3]
 * normalizeArrayData({});         // []
 * normalizeArrayData(null);       // []
 * normalizeArrayData(undefined);  // []
 */
export function normalizeArrayData(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
}
