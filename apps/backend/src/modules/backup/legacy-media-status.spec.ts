import { MediaStatus } from '@mediashelf/shared-types';
import { coerceLegacyMediaStatus } from './legacy-media-status';

describe('coerceLegacyMediaStatus', () => {
  it('maps FUTURE to UPCOMING', () => {
    expect(coerceLegacyMediaStatus('FUTURE')).toBe(MediaStatus.UPCOMING);
  });

  it('leaves current statuses unchanged', () => {
    expect(coerceLegacyMediaStatus(MediaStatus.WATCHLIST)).toBe(
      MediaStatus.WATCHLIST,
    );
    expect(coerceLegacyMediaStatus(MediaStatus.UPCOMING)).toBe(
      MediaStatus.UPCOMING,
    );
  });
});
