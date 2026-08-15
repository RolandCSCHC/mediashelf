import { MediaStatus } from '@mediashelf/shared-types';

/** Maps the pre-rename backup value `FUTURE` onto `UPCOMING`. */
export function coerceLegacyMediaStatus(value: unknown): unknown {
  return value === 'FUTURE' ? MediaStatus.UPCOMING : value;
}
