import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponse {
  @ApiProperty({ example: 'ok', description: 'Status da aplicação' })
  status: string;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Timestamp da verificação' })
  timestamp: string;

  @ApiProperty({ example: 123.456, description: 'Tempo de execução em segundos' })
  uptime: number;

  @ApiProperty({ example: 'development', description: 'Ambiente de execução' })
  environment: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verificar saúde da aplicação', description: 'Retorna o status, uptime e ambiente da aplicação' })
  @ApiResponse({ status: 200, description: 'Aplicação está funcionando', type: HealthCheckResponse })
  check(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

