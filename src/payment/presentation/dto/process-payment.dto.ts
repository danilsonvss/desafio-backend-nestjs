import { IsNumber, IsString, IsNotEmpty, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const MAX_PAYMENT_AMOUNT = 1000000; // 1 milhão

export class ProcessPaymentDto {
  @ApiProperty({ 
    example: 1000.00, 
    description: `Valor do pagamento (mínimo 0.01, máximo ${MAX_PAYMENT_AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`, 
    minimum: 0.01,
    maximum: MAX_PAYMENT_AMOUNT
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Max(MAX_PAYMENT_AMOUNT, { message: `Amount must not exceed ${MAX_PAYMENT_AMOUNT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @ApiProperty({ 
    example: 'BR', 
    description: 'Código do país (ISO 3166-1 alpha-2). Suporta vendas nacionais e internacionais. Exemplos: BR (Brasil), US (Estados Unidos), MX (México)' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do produtor (obrigatório)' })
  @IsUUID(4, { message: 'Producer ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Producer ID is required' })
  producerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID do afiliado (opcional)', required: false })
  @IsUUID(4, { message: 'Affiliate ID must be a valid UUID' })
  @IsOptional()
  affiliateId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', description: 'ID do coprodutor (opcional)', required: false })
  @IsUUID(4, { message: 'Coproducer ID must be a valid UUID' })
  @IsOptional()
  coproducerId?: string;
}

