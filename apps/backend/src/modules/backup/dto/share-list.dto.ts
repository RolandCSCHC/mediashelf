import { IsEmail, IsIn, MaxLength } from 'class-validator';
import {
  SHARE_LIST_LOCALES,
  type ShareListLocale,
} from '@mediashelf/shared-types';

export class ShareListDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsIn(SHARE_LIST_LOCALES)
  locale!: ShareListLocale;
}
