import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { FeedbackKind } from '@mediashelf/shared-types';

export class CreateFeedbackDto {
  @IsEnum(FeedbackKind)
  kind!: FeedbackKind;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  summary!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  details!: string;

  @ValidateIf((_, value) => value !== '' && value != null)
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;
}
