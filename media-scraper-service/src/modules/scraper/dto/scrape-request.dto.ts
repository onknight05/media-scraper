import { IsArray, IsUrl, ArrayMinSize } from 'class-validator';

export class ScrapeRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  urls: string[];
}
