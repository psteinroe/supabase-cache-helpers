import { buildFilterPattern, buildTablePrefix } from '../src/key';
import { describe, expect, test } from 'vitest';

describe('buildTablePrefix', () => {
  test('should join schema and table with separator', () => {
    expect(buildTablePrefix('public', 'posts')).toBe('public$posts');
  });
});

describe('buildFilterPattern', () => {
  test('should build pattern for simple filter', () => {
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'user_id',
      value: 5,
    });
    expect(pattern).toBe('public$posts$*user_id=eq.5*');
  });

  test('should build pattern for string value', () => {
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'status',
      value: 'active',
    });
    expect(pattern).toBe('public$posts$*status=eq.active*');
  });

  test('should URL-encode special characters in value', () => {
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'name',
      value: 'hello world',
    });
    expect(pattern).toBe('public$posts$*name=eq.hello%20world*');
  });

  test('should escape glob special characters in path', () => {
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'field*name',
      value: 'test',
    });
    expect(pattern).toBe('public$posts$*field\\*name=eq.test*');
  });

  test('should escape glob special characters in value', () => {
    // encodeURIComponent does not encode *, so it gets escaped with backslash
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'name',
      value: '*test*',
    });
    expect(pattern).toBe('public$posts$*name=eq.\\*test\\**');
  });

  test('should escape question mark in value', () => {
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'name',
      value: 'test?',
    });
    // ? gets URL-encoded to %3F
    expect(pattern).toBe('public$posts$*name=eq.test%3F*');
  });

  test('should handle boolean value', () => {
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'is_active',
      value: true,
    });
    expect(pattern).toBe('public$posts$*is_active=eq.true*');
  });

  test('should handle null value', () => {
    const pattern = buildFilterPattern('public', 'posts', {
      path: 'deleted_at',
      value: null as any,
    });
    expect(pattern).toBe('public$posts$*deleted_at=eq.null*');
  });
});
