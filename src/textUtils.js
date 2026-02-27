/**
 * Counts the number of words in a string.
 * Words are defined as sequences of non-whitespace characters.
 *
 * @param {string} text - The input text
 * @returns {number} The word count
 */
function wordCount(text) {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Counts the number of characters in a string, excluding spaces.
 *
 * @param {string} text - The input text
 * @returns {number} The character count (excluding spaces)
 */
function charCount(text) {
  if (!text) return 0;
  return text.replace(/\s/g, '').length;
}

/**
 * Estimates the reading time for a piece of text.
 * Based on an average adult reading speed of 200 words per minute.
 *
 * @param {string} text - The input text
 * @returns {number} Estimated reading time in minutes, rounded up to the nearest whole minute
 */
function readingTime(text) {
  const WORDS_PER_MINUTE = 200;
  const words = wordCount(text);
  return Math.ceil(words / WORDS_PER_MINUTE);
}

module.exports = { wordCount, charCount, readingTime };
