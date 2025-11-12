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
import { CreateCoproductionUseCase } from '../../application/use-cases/create-coproduction.use-case';
import { ListCoproductionsByProducerUseCase } from '../../application/use-cases/list-coproductions-by-producer.use-case';
import { CreateCoproductionDto } from '../dto/create-coproduction.dto';
import { CoproductionResponseDto } from '../dto/response/coproduction-response.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

@Controller('coproductions')
@UseGuards(JwtAuthGuard)
export class CoproductionController {
  constructor(
    private readonly createCoproductionUseCase: CreateCoproductionUseCase,
    private readonly listCoproductionsByProducerUseCase: ListCoproductionsByProducerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCoproduction(
    @Body(ValidationPipe) dto: CreateCoproductionDto,
  ): Promise<CoproductionResponseDto> {
    const coproduction = await this.createCoproductionUseCase.execute(dto);
    return CoproductionResponseDto.fromEntity(coproduction);
  }

  @Get('producer/:producerId')
  @HttpCode(HttpStatus.OK)
  async listByProducer(
    @Param('producerId') producerId: string,
  ): Promise<CoproductionResponseDto[]> {
    const coproductions = await this.listCoproductionsByProducerUseCase.execute(producerId);
    return coproductions.map((coproduction) => CoproductionResponseDto.fromEntity(coproduction));
  }
}

