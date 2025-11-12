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
import { GetTaxByCountryAndTypeUseCase } from '../../application/use-cases/get-tax-by-country-and-type.use-case';
import { CreateTaxUseCase } from '../../application/use-cases/create-tax.use-case';
import { UpdateTaxUseCase } from '../../application/use-cases/update-tax.use-case';
import { ListTaxesUseCase } from '../../application/use-cases/list-taxes.use-case';
import { CreateTaxDto } from '../dto/create-tax.dto';
import { UpdateTaxDto } from '../dto/update-tax.dto';
import { TaxResponseDto } from '../dto/response/tax-response.dto';
import { TaxType } from '../../../shared/domain/enums/tax-type.enum';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

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
  async listTaxes(
    @Query('country') country?: string,
  ): Promise<TaxResponseDto[]> {
    const taxes = await this.listTaxesUseCase.execute(country);
    return taxes.map((tax) => TaxResponseDto.fromEntity(tax));
  }

  @Get(':country/:type')
  @HttpCode(HttpStatus.OK)
  async getTaxByCountryAndType(
    @Param('country') country: string,
    @Param('type') type: TaxType,
  ): Promise<TaxResponseDto> {
    const tax = await this.getTaxByCountryAndTypeUseCase.execute(country, type);
    return TaxResponseDto.fromEntity(tax);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTax(
    @Body(ValidationPipe) dto: CreateTaxDto,
  ): Promise<TaxResponseDto> {
    const tax = await this.createTaxUseCase.execute(dto);
    return TaxResponseDto.fromEntity(tax);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  async updateTax(
    @Body(ValidationPipe) dto: UpdateTaxDto,
  ): Promise<TaxResponseDto> {
    const tax = await this.updateTaxUseCase.execute(dto);
    return TaxResponseDto.fromEntity(tax);
  }
}

