import { IsString, MinLength } from 'class-validator';

export class MoveListItemDto {
  @IsString()
  @MinLength(1)
  targetListId!: string;
}
