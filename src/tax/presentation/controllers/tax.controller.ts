import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
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
  ApiQuery,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { GetTaxByCountryAndTypeUseCase } from '../../application/use-cases/get-tax-by-country-and-type.use-case';
import { CreateTaxUseCase } from '../../application/use-cases/create-tax.use-case';
import { UpdateTaxUseCase } from '../../application/use-cases/update-tax.use-case';
import { ListTaxesUseCase } from '../../application/use-cases/list-taxes.use-case';
import { CreateTaxDto } from '../dto/create-tax.dto';
import { UpdateTaxDto } from '../dto/update-tax.dto';
import { TaxResponseDto } from '../dto/response/tax-response.dto';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

@ApiTags('taxes')
@ApiBearerAuth('JWT-auth')
@Controller('taxes')
@UseGuards(JwtAuthGuard)
export class TaxController {
  constructor(
    private readonly getTaxByCountryAndTypeUseCase: GetTaxByCountryAndTypeUseCase,
    private readonly createTaxUseCase: CreateTaxUseCase,
    private readonly updateTaxUseCase: UpdateTaxUseCase,
    private readonly listTaxesUseCase: ListTaxesUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar taxas', description: 'Lista todas as taxas ou filtra por país' })
  @ApiQuery({ name: 'country', required: false, description: 'Código do país (ISO) para filtrar', example: 'BR' })
  @ApiResponse({ status: 200, description: 'Lista de taxas retornada com sucesso', type: [TaxResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async listTaxes(
    @Query('country') country?: string,
  ): Promise<TaxResponseDto[]> {
    const taxes = await this.listTaxesUseCase.execute(country);
    return taxes.map((tax) => TaxResponseDto.fromEntity(tax));
  }

  @Get(':country/:type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar taxa por país e tipo', description: 'Retorna a taxa específica para um país e tipo' })
  @ApiParam({ name: 'country', description: 'Código do país (ISO)', example: 'BR' })
  @ApiParam({ name: 'type', enum: TaxType, description: 'Tipo de taxa', example: TaxType.TRANSACTION })
  @ApiResponse({ status: 200, description: 'Taxa encontrada', type: TaxResponseDto })
  @ApiNotFoundResponse({ description: 'Taxa não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async getTaxByCountryAndType(
    @Param('country') country: string,
    @Param('type') type: TaxType,
  ): Promise<TaxResponseDto> {
    const tax = await this.getTaxByCountryAndTypeUseCase.execute(country, type);
    return TaxResponseDto.fromEntity(tax);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar taxa', description: 'Cria uma nova taxa para um país e tipo' })
  @ApiBody({ type: CreateTaxDto })
  @ApiResponse({ status: 201, description: 'Taxa criada com sucesso', type: TaxResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'Taxa já existe para este país e tipo' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async createTax(
    @Body(ValidationPipe) dto: CreateTaxDto,
  ): Promise<TaxResponseDto> {
    const tax = await this.createTaxUseCase.execute(dto);
    return TaxResponseDto.fromEntity(tax);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar taxa', description: 'Atualiza o percentual de uma taxa existente' })
  @ApiBody({ type: UpdateTaxDto })
  @ApiResponse({ status: 200, description: 'Taxa atualizada com sucesso', type: TaxResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiNotFoundResponse({ description: 'Taxa não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async updateTax(
    @Body(ValidationPipe) dto: UpdateTaxDto,
  ): Promise<TaxResponseDto> {
    const tax = await this.updateTaxUseCase.execute(dto);
    return TaxResponseDto.fromEntity(tax);
  }
}

