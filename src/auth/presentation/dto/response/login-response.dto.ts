import { UserResponseDto } from './user-response.dto';

export class LoginResponseDto {
  accessToken: string;
  user: UserResponseDto;

  constructor(accessToken: string, user: UserResponseDto) {
    this.accessToken = accessToken;
    this.user = user;
  }
}

