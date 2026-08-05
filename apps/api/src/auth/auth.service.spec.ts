import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const seededUser = {
  id: 'user_1',
  email: 'admin@dealport.com',
  passwordHash: 'hashed-password',
  name: 'Dealport Admin',
  role: 'ADMIN',
  avatarUrl: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), findById: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('rejects an unknown email without ever calling bcrypt', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@dealport.com', password: 'whatever1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('rejects a known email with the wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(seededUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({ email: seededUser.email, password: 'wrong-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('wrong-pass', seededUser.passwordHash);
    });

    it('produces an identical error for an unknown email and a wrong password — the endpoint must not leak which one it was', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);
      let unknownEmailError: UnauthorizedException | undefined;
      try {
        await service.login({ email: 'ghost@dealport.com', password: 'whatever1' });
      } catch (error) {
        unknownEmailError = error as UnauthorizedException;
      }

      usersService.findByEmail.mockResolvedValueOnce(seededUser);
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);
      let wrongPasswordError: UnauthorizedException | undefined;
      try {
        await service.login({ email: seededUser.email, password: 'wrong-pass' });
      } catch (error) {
        wrongPasswordError = error as UnauthorizedException;
      }

      expect(unknownEmailError).toBeInstanceOf(UnauthorizedException);
      expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
      expect(unknownEmailError?.getStatus()).toBe(wrongPasswordError?.getStatus());
      expect(unknownEmailError?.getResponse()).toEqual(wrongPasswordError?.getResponse());
    });

    it('signs a JWT and returns the user shape without the password hash, on success', async () => {
      usersService.findByEmail.mockResolvedValue(seededUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login({ email: seededUser.email, password: 'Admin@123' });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: seededUser.id,
        email: seededUser.email,
        role: seededUser.role,
      });
      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        user: {
          id: seededUser.id,
          email: seededUser.email,
          name: seededUser.name,
          role: seededUser.role,
          avatarUrl: seededUser.avatarUrl,
        },
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('me', () => {
    it('throws UnauthorizedException when the user no longer exists', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.me('deleted-user')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns the user shape without the password hash', async () => {
      usersService.findById.mockResolvedValue(seededUser);

      const result = await service.me(seededUser.id);

      expect(result).toEqual({
        id: seededUser.id,
        email: seededUser.email,
        name: seededUser.name,
        role: seededUser.role,
        avatarUrl: seededUser.avatarUrl,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
