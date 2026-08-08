import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  MinLength,
} from 'class-validator';

export class AddListItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  mediaItemIds!: string[];
}
