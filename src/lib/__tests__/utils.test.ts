import {
  generateId,
  calculateContentHashSync,
  formatDuration,
  extractDomain,
  truncateText,
  safeJsonParse,
  isExtensionContext,
} from '@/lib/utils';

describe('lib/utils', () => {
  test('generateId returns a non-empty string and is usually unique', () => {
    const a = generateId();
    const b = generateId();
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(5);
    expect(a).not.toBe(b);
  });

  test('calculateContentHashSync is stable for same input', () => {
    const a = calculateContentHashSync('hello');
    const b = calculateContentHashSync('hello');
    const c = calculateContentHashSync('hello!');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test('formatDuration formats seconds/minutes/hours', () => {
    expect(formatDuration(10)).toBe('10s');
    expect(formatDuration(61)).toBe('1m');
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(3661)).toBe('1h 1m');
  });

  test('extractDomain returns hostname or input on invalid URL', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
    expect(extractDomain('not a url')).toBe('not a url');
  });

  test('truncateText truncates with ellipsis', () => {
    expect(truncateText('abc', 10)).toBe('abc');
    expect(truncateText('abcdefghij', 10)).toBe('abcdefghij');
    expect(truncateText('abcdefghijk', 10)).toBe('abcdefg...');
  });

  test('safeJsonParse returns parsed value or fallback', () => {
    expect(safeJsonParse('{"a":1}', { a: 0 })).toEqual({ a: 1 });
    expect(safeJsonParse('not-json', { a: 0 })).toEqual({ a: 0 });
  });

  test('isExtensionContext uses chrome.runtime.id', () => {
    expect(isExtensionContext()).toBe(true);
  });
});
