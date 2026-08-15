import { allowedStatusesForList, MediaStatus } from '@mediashelf/shared-types';
import {
  resolveMembershipDownloaded,
  resolveMembershipStatus,
} from './list-state';

describe('resolveMembershipStatus', () => {
  it('uses the list default when configured', () => {
    expect(
      resolveMembershipStatus(MediaStatus.WATCHED, MediaStatus.WATCHLIST),
    ).toBe(MediaStatus.WATCHED);
  });

  it('falls back to the title status when the list has no default', () => {
    expect(resolveMembershipStatus(null, MediaStatus.WATCHING)).toBe(
      MediaStatus.WATCHING,
    );
  });
});

describe('resolveMembershipDownloaded', () => {
  it('uses the list default when configured, including false', () => {
    expect(resolveMembershipDownloaded(false, true)).toBe(false);
    expect(resolveMembershipDownloaded(true, false)).toBe(true);
  });

  it('falls back to the title downloaded flag when the list has no default', () => {
    expect(resolveMembershipDownloaded(null, true)).toBe(true);
    expect(resolveMembershipDownloaded(null, false)).toBe(false);
  });
});

describe('allowedStatusesForList', () => {
  it('returns null when the list does not set a status', () => {
    expect(allowedStatusesForList(null)).toBeNull();
  });

  it('includes the configured status and Watching', () => {
    expect(allowedStatusesForList(MediaStatus.WATCHLIST)).toEqual([
      MediaStatus.WATCHLIST,
      MediaStatus.WATCHING,
    ]);
  });

  it('returns only Watching when that is the configured status', () => {
    expect(allowedStatusesForList(MediaStatus.WATCHING)).toEqual([
      MediaStatus.WATCHING,
    ]);
  });
});
