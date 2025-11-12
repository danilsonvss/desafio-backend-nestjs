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
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { CreateOrUpdateBalanceUseCase } from '../../application/use-cases/create-or-update-balance.use-case';
import { BalanceResponseDto } from '../dto/response/balance-response.dto';
import { UpdateBalanceDto } from '../dto/update-balance.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { UserEntity } from '../../../auth/domain/entities/user.entity';

@Controller('balance')
@UseGuards(JwtAuthGuard)
export class BalanceController {
  constructor(
    private readonly getBalanceUseCase: GetBalanceUseCase,
    private readonly createOrUpdateBalanceUseCase: CreateOrUpdateBalanceUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBalance(@CurrentUser() user: UserEntity): Promise<BalanceResponseDto> {
    const balance = await this.getBalanceUseCase.execute(user.id);
    return BalanceResponseDto.fromEntity(balance);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
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
