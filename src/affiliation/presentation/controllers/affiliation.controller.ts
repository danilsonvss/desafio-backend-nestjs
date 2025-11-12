import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CreateAffiliationUseCase } from '../../application/use-cases/create-affiliation.use-case';
import { ListAffiliationsByProducerUseCase } from '../../application/use-cases/list-affiliations-by-producer.use-case';
import { CreateAffiliationDto } from '../dto/create-affiliation.dto';
import { AffiliationResponseDto } from '../dto/response/affiliation-response.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

@Controller('affiliations')
@UseGuards(JwtAuthGuard)
export class AffiliationController {
  constructor(
    private readonly createAffiliationUseCase: CreateAffiliationUseCase,
    private readonly listAffiliationsByProducerUseCase: ListAffiliationsByProducerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAffiliation(
    @Body(ValidationPipe) dto: CreateAffiliationDto,
  ): Promise<AffiliationResponseDto> {
    const affiliation = await this.createAffiliationUseCase.execute(dto);
    return AffiliationResponseDto.fromEntity(affiliation);
  }

  @Get('producer/:producerId')
  @HttpCode(HttpStatus.OK)
  async listByProducer(
    @Param('producerId') producerId: string,
  ): Promise<AffiliationResponseDto[]> {
    const affiliations = await this.listAffiliationsByProducerUseCase.execute(producerId);
    return affiliations.map((affiliation) => AffiliationResponseDto.fromEntity(affiliation));
  }
}

