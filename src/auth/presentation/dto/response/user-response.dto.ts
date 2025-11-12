import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../shared/domain/enums/user-role.enum';
import { UserEntity } from '../../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID único do usuário' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email do usuário' })
  email: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PRODUCER, description: 'Papel do usuário no sistema' })
  role: UserRole;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-12T20:00:00.000Z', description: 'Data de última atualização' })
  updatedAt: Date;

  static fromEntity(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.name = entity.name;
    dto.role = entity.role;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

