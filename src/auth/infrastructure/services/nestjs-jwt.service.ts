import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IJwtService } from '../../domain/services/jwt.service.interface';

@Injectable()
export class NestJwtService implements IJwtService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: { sub: string; email: string; role: string }): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string): { sub: string; email: string; role: string } {
    return this.jwtService.verify(token);
  }
}


