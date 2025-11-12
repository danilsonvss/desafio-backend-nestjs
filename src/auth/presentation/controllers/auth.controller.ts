import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { LoginResponseDto } from '../dto/response/login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar novo usuário', description: 'Cria uma nova conta de usuário no sistema' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'Email já cadastrado' })
  async register(@Body(ValidationPipe) dto: RegisterUserDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute(dto);
    return UserResponseDto.fromEntity(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário', description: 'Realiza login e retorna token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
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

