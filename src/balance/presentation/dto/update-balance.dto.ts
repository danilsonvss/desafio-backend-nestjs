import { IsNumber, IsPositive, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBalanceDto {
  @ApiProperty({ example: 100.50, description: 'Valor da operação (deve ser positivo)', minimum: 0.01 })
  @IsNumber()
  @IsPositive({ message: 'Amount must be positive' })
  amount: number;

  @ApiProperty({ enum: ['credit', 'debit'], example: 'credit', description: 'Tipo de operação: credit (adicionar) ou debit (subtrair)' })
  @IsIn(['credit', 'debit'], { message: 'Operation must be credit or debit' })
  operation: 'credit' | 'debit';
}
