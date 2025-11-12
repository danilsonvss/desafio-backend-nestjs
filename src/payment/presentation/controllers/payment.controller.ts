import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { PaymentResponseDto } from '../dto/response/payment-response.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

@ApiTags('payment')
@ApiBearerAuth('JWT-auth')
@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Processar pagamento',
    description: 'Processa um pagamento, calcula taxas e comissões, e atualiza os saldos dos participantes automaticamente. ' +
      'Suporta vendas nacionais e internacionais através do campo `country`. ' +
      'Use os IDs dos usuários de teste criados pelo seed (produtor, afiliado, coprodutor) para testar o fluxo completo.'
  })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({ status: 201, description: 'Pagamento processado com sucesso', type: PaymentResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou comissões excedem valor líquido' })
  @ApiNotFoundResponse({ description: 'Produtor, afiliado ou coprodutor não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async processPayment(
    @Body(ValidationPipe) dto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.processPaymentUseCase.execute(dto);
    return PaymentResponseDto.fromEntity(payment);
  }
}

