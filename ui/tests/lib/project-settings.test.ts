import { describe, expect, it } from 'vitest';

import { PrefixRules } from '@/ui/lib/project-settings.ts';

const VALUES = { issue_prefix: 'TREK', epic_prefix: 'EPIC', comment_prefix: 'CMT' };

describe('PrefixRules', () => {
  it('accepts uppercase prefixes that start with a letter', () => {
    expect(PrefixRules.problem(VALUES, 'issue_prefix')).toBeNull();
  });

  it('rejects malformed and duplicate prefixes', () => {
    expect(
      PrefixRules.problem({ ...VALUES, issue_prefix: '1TREK' }, 'issue_prefix')
    ).not.toBeNull();
    expect(PrefixRules.problem({ ...VALUES, epic_prefix: 'TREK' }, 'epic_prefix')).toBe(
      'Each prefix must be unique'
    );
  });

  it('normalizes input to uppercase', () => {
    expect(PrefixRules.normalize(' trek ')).toBe('TREK');
  });
});
