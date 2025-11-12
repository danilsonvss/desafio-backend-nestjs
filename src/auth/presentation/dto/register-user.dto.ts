import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../shared/domain/enums/user-role.enum';

export class RegisterUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Senha do usuário (mínimo 6 caracteres)', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PRODUCER, description: 'Papel do usuário no sistema' })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}

