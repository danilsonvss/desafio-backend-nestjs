import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { LoginResponseDto } from '../dto/response/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) dto: RegisterUserDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute(dto);
    return UserResponseDto.fromEntity(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.loginUseCase.execute(dto);
    const userResponse = new UserResponseDto();
    userResponse.id = result.user.id;
    userResponse.email = result.user.email;
    userResponse.name = result.user.name;
    userResponse.role = result.user.role as any;
    userResponse.createdAt = new Date();
    userResponse.updatedAt = new Date();
    
    return new LoginResponseDto(result.accessToken, userResponse);
  }
}

