import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string | null;
}
