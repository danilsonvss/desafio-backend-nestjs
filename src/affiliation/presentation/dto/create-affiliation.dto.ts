import { IsString, IsNumber, Min, Max, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAffiliationDto {
  @IsUUID(4, { message: 'Producer ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Producer ID is required' })
  producerId: string;

  @IsUUID(4, { message: 'Affiliate ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Affiliate ID is required' })
  affiliateId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Percentage must be at least 0' })
  @Max(100, { message: 'Percentage must be at most 100' })
  percentage: number;
}

