import { IsNumber, IsPositive, IsIn } from 'class-validator';

export class UpdateBalanceDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be positive' })
  amount: number;

  @IsIn(['credit', 'debit'], { message: 'Operation must be credit or debit' })
  operation: 'credit' | 'debit';
}
