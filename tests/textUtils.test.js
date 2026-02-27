const { wordCount, charCount, readingTime } = require('../src/textUtils');

describe('wordCount', () => {
  test('counts words in a normal sentence', () => {
    expect(wordCount('The quick brown fox')).toBe(4);
  });

  test('handles multiple spaces between words', () => {
    expect(wordCount('hello   world')).toBe(2);
  });

  test('handles leading and trailing whitespace', () => {
    expect(wordCount('  hello world  ')).toBe(2);
  });

  test('returns 0 for an empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  test('returns 0 for a string of only spaces', () => {
    expect(wordCount('   ')).toBe(0);
  });

  test('returns 1 for a single word', () => {
    expect(wordCount('hello')).toBe(1);
  });
});

describe('charCount', () => {
  test('counts characters excluding spaces', () => {
    expect(charCount('hello world')).toBe(10);
  });

  test('counts all characters in a string with no spaces', () => {
    expect(charCount('hello')).toBe(5);
  });

  test('returns 0 for an empty string', () => {
    expect(charCount('')).toBe(0);
  });

  test('returns 0 for a string of only spaces', () => {
    expect(charCount('   ')).toBe(0);
  });

  test('handles tabs and newlines as whitespace', () => {
    expect(charCount('a\tb\nc')).toBe(3);
  });
});

describe('readingTime', () => {
  test('returns 1 minute for a short text', () => {
    const shortText = 'word '.repeat(100).trim();
    expect(readingTime(shortText)).toBe(1);
  });

  test('returns 1 minute for exactly 200 words', () => {
    const text = 'word '.repeat(200).trim();
    expect(readingTime(text)).toBe(1);
  });

  test('rounds up to the nearest minute', () => {
    const text = 'word '.repeat(201).trim();
    expect(readingTime(text)).toBe(2);
  });

  test('returns 0 for an empty string', () => {
    expect(readingTime('')).toBe(0);
  });
});
