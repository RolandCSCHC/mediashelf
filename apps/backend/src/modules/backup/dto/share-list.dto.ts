import { IsEmail, MaxLength } from 'class-validator';

export class ShareListDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
