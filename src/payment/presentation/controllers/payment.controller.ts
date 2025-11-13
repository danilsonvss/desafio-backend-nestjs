import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
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
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { PaymentResponseDto } from '../dto/response/payment-response.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

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
      'Use os IDs dos usuários de teste criados pelo seed (produtor, afiliado, coprodutor) para testar o fluxo completo. ' +
      'Apenas o próprio produtor ou usuários com role PLATFORM podem processar pagamentos.'
  })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({ status: 201, description: 'Pagamento processado com sucesso', type: PaymentResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou comissões excedem valor líquido' })
  @ApiNotFoundResponse({ description: 'Produtor, afiliado ou coprodutor não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para processar este pagamento' })
  @ApiTooManyRequestsResponse({ description: 'Muitas requisições. Limite de 5 pagamentos por minuto.' })
  async processPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body(ValidationPipe) dto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    // Validação de autorização: apenas o próprio produtor ou usuários PLATFORM podem processar pagamentos
    if (user.role !== UserRole.PLATFORM && user.id !== dto.producerId) {
      throw new ForbiddenException(
        'You can only process payments for yourself. Only platform users can process payments for other producers.'
      );
    }

    // O comprador é sempre o usuário autenticado
    const paymentDto = {
      ...dto,
      buyerId: user.id,
    };

    const payment = await this.processPaymentUseCase.execute(paymentDto);
    return PaymentResponseDto.fromEntity(payment);
  }
}

