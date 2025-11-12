import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { CreateOrUpdateBalanceUseCase } from '../../application/use-cases/create-or-update-balance.use-case';
import { BalanceResponseDto } from '../dto/response/balance-response.dto';
import { UpdateBalanceDto } from '../dto/update-balance.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { UserEntity } from '../../../auth/domain/entities/user.entity';

@ApiTags('balance')
@ApiBearerAuth('JWT-auth')
@Controller('balance')
@UseGuards(JwtAuthGuard)
export class BalanceController {
  constructor(
    private readonly getBalanceUseCase: GetBalanceUseCase,
    private readonly createOrUpdateBalanceUseCase: CreateOrUpdateBalanceUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar saldo', description: 'Retorna o saldo do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Saldo retornado com sucesso', type: BalanceResponseDto })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async getBalance(@CurrentUser() user: UserEntity): Promise<BalanceResponseDto> {
    const balance = await this.getBalanceUseCase.execute(user.id);
    return BalanceResponseDto.fromEntity(balance);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar saldo', description: 'Realiza operação de crédito ou débito no saldo do usuário autenticado' })
  @ApiBody({ type: UpdateBalanceDto })
  @ApiResponse({ status: 200, description: 'Saldo atualizado com sucesso', type: BalanceResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou saldo insuficiente' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async updateBalance(
    @CurrentUser() user: UserEntity,
    @Body(ValidationPipe) dto: UpdateBalanceDto,
  ): Promise<BalanceResponseDto> {
    const balance = await this.createOrUpdateBalanceUseCase.execute({
      userId: user.id,
      amount: dto.amount,
      operation: dto.operation,
    });
    return BalanceResponseDto.fromEntity(balance);
  }
}
