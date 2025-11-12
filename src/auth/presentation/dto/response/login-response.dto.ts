import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Token JWT para autenticação' })
  accessToken: string;

  @ApiProperty({ type: UserResponseDto, description: 'Dados do usuário autenticado' })
  user: UserResponseDto;

  constructor(accessToken: string, user: UserResponseDto) {
    this.accessToken = accessToken;
    this.user = user;
  }
}

