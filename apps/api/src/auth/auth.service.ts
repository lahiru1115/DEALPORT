import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthUserResponse }> {
    const user = await this.usersService.findByEmail(dto.email);
    const passwordValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    // Deliberately identical outcome for "unknown email" and "wrong password" —
    // this endpoint must not be usable to enumerate accounts (plans/02-API.md §2).
    if (!user || !passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, user: this.toUserResponse(user) };
  }

  async me(userId: string): Promise<AuthUserResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.toUserResponse(user);
  }

  private toUserResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }
}
