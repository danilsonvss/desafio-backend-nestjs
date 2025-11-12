import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { PaymentResponseDto } from '../dto/response/payment-response.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async processPayment(
    @Body(ValidationPipe) dto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.processPaymentUseCase.execute(dto);
    return PaymentResponseDto.fromEntity(payment);
  }
}

