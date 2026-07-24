import { describe, it, expect } from 'vitest';

import { normalizeKnkyLinks } from '../links';

describe('normalizeKnkyLinks', () => {
  it('upgrades bare knky.co links to absolute https', () => {
    expect(normalizeKnkyLinks('see knky.co/foo now')).toContain('https://knky.co/foo');
    expect(normalizeKnkyLinks('www.knky.co/bar')).toContain('https://knky.co/bar');
  });

  it('leaves non-knky text untouched and does not upgrade knky.co.* TLD lookalikes', () => {
    expect(normalizeKnkyLinks('hello world')).toBe('hello world');
    // The (?!\.[A-Za-z0-9-]) guard blocks knky.co.uk-style domains.
    expect(normalizeKnkyLinks('knky.co.uk/x')).toBe('knky.co.uk/x');
  });
});
