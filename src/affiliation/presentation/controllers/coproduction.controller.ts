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
} from '@nestjs/swagger';
import { CreateCoproductionUseCase } from '../../application/use-cases/create-coproduction.use-case';
import { ListCoproductionsByProducerUseCase } from '../../application/use-cases/list-coproductions-by-producer.use-case';
import { CreateCoproductionDto } from '../dto/create-coproduction.dto';
import { CoproductionResponseDto } from '../dto/response/coproduction-response.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

@ApiTags('coproductions')
@ApiBearerAuth('JWT-auth')
@Controller('coproductions')
@UseGuards(JwtAuthGuard)
export class CoproductionController {
  constructor(
    private readonly createCoproductionUseCase: CreateCoproductionUseCase,
    private readonly listCoproductionsByProducerUseCase: ListCoproductionsByProducerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar coprodução', description: 'Cria uma nova coprodução entre um produtor e um coprodutor' })
  @ApiBody({ type: CreateCoproductionDto })
  @ApiResponse({ status: 201, description: 'Coprodução criada com sucesso', type: CoproductionResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'Coprodução já existe' })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async createCoproduction(
    @Body(ValidationPipe) dto: CreateCoproductionDto,
  ): Promise<CoproductionResponseDto> {
    const coproduction = await this.createCoproductionUseCase.execute(dto);
    return CoproductionResponseDto.fromEntity(coproduction);
  }

  @Get('producer/:producerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar coproduções por produtor', description: 'Retorna todas as coproduções de um produtor' })
  @ApiParam({ name: 'producerId', description: 'ID do produtor', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Lista de coproduções retornada com sucesso', type: [CoproductionResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  async listByProducer(
    @Param('producerId') producerId: string,
  ): Promise<CoproductionResponseDto[]> {
    const coproductions = await this.listCoproductionsByProducerUseCase.execute(producerId);
    return coproductions.map((coproduction) => CoproductionResponseDto.fromEntity(coproduction));
  }
}

