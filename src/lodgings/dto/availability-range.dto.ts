import { IsDateString } from 'class-validator';

export class AvailabilityRangeDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
