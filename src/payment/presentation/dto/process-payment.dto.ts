import { IsNumber, IsString, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class ProcessPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @IsUUID(4, { message: 'Producer ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Producer ID is required' })
  producerId: string;

  @IsUUID(4, { message: 'Affiliate ID must be a valid UUID' })
  @IsOptional()
  affiliateId?: string;

  @IsUUID(4, { message: 'Coproducer ID must be a valid UUID' })
  @IsOptional()
  coproducerId?: string;
}

