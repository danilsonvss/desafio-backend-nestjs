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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateAffiliationUseCase } from '../../application/use-cases/create-affiliation.use-case';
import { ListAffiliationsByProducerUseCase } from '../../application/use-cases/list-affiliations-by-producer.use-case';
import { CreateAffiliationDto } from '../dto/create-affiliation.dto';
import { AffiliationResponseDto } from '../dto/response/affiliation-response.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

@ApiTags('affiliations')
@ApiBearerAuth('JWT-auth')
@Controller('affiliations')
@UseGuards(JwtAuthGuard)
export class AffiliationController {
  constructor(
    private readonly createAffiliationUseCase: CreateAffiliationUseCase,
    private readonly listAffiliationsByProducerUseCase: ListAffiliationsByProducerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar afiliação', description: 'Cria uma nova afiliação entre um produtor e um afiliado' })
  @ApiBody({ type: CreateAffiliationDto })
  @ApiResponse({ status: 201, description: 'Afiliação criada com sucesso', type: AffiliationResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'Afiliação já existe' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async createAffiliation(
    @Body(ValidationPipe) dto: CreateAffiliationDto,
  ): Promise<AffiliationResponseDto> {
    const affiliation = await this.createAffiliationUseCase.execute(dto);
    return AffiliationResponseDto.fromEntity(affiliation);
  }

  @Get('producer/:producerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar afiliações por produtor', description: 'Retorna todas as afiliações de um produtor' })
  @ApiParam({ name: 'producerId', description: 'ID do produtor', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Lista de afiliações retornada com sucesso', type: [AffiliationResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async listByProducer(
    @Param('producerId') producerId: string,
  ): Promise<AffiliationResponseDto[]> {
    const affiliations = await this.listAffiliationsByProducerUseCase.execute(producerId);
    return affiliations.map((affiliation) => AffiliationResponseDto.fromEntity(affiliation));
  }
}

