import { describe, expect, it } from 'vitest';
import { pickNewer } from './cloudSync';

interface Timestamped {
  id: string;
  updatedAt: number;
}

const getTimestamp = (item: Timestamped) => item.updatedAt;

describe('pickNewer', () => {
  it('returns remote when local is missing', () => {
    const remote: Timestamped = { id: 'a', updatedAt: 1 };
    expect(pickNewer(undefined, remote, getTimestamp)).toBe(remote);
  });

  it('returns local when remote is missing', () => {
    const local: Timestamped = { id: 'a', updatedAt: 1 };
    expect(pickNewer(local, undefined, getTimestamp)).toBe(local);
  });

  it('returns undefined when both are missing', () => {
    expect(pickNewer<Timestamped>(undefined, undefined, getTimestamp)).toBeUndefined();
  });

  it('picks the item with the later timestamp', () => {
    const older: Timestamped = { id: 'a', updatedAt: 1 };
    const newer: Timestamped = { id: 'a', updatedAt: 2 };
    expect(pickNewer(older, newer, getTimestamp)).toBe(newer);
    expect(pickNewer(newer, older, getTimestamp)).toBe(newer);
  });

  it('prefers remote on an exact timestamp tie', () => {
    const local: Timestamped = { id: 'a', updatedAt: 5 };
    const remote: Timestamped = { id: 'a', updatedAt: 5 };
    expect(pickNewer(local, remote, getTimestamp)).toBe(remote);
  });
});
