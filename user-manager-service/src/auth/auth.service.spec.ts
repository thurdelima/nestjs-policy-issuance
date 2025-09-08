import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService, LoginResponse, JwtPayload } from './auth.service';
import { UserService } from '../modules/user/user.service';
import { User } from '../entities/user.entity';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const baseUser: User = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-02T00:00:00Z'),
  } as unknown as User;

  beforeEach(() => {
    userService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    service = new AuthService(userService, jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      userService.findByEmail.mockResolvedValue({ ...baseUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(baseUser.email, 'plain-password');

      expect(userService.findByEmail).toHaveBeenCalledWith(baseUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('plain-password', baseUser.password);
      expect(result).toBeTruthy();
      expect((result as any).password).toBeUndefined();
      expect(result).toEqual(
        expect.objectContaining({ id: baseUser.id, email: baseUser.email, role: baseUser.role })
      );
    });

    it('should return null when user does not exist', async () => {
      userService.findByEmail.mockResolvedValue(null as any);

      const result = await service.validateUser('missing@example.com', 'x');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      userService.findByEmail.mockResolvedValue({ ...baseUser });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(baseUser.email, 'wrong');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should sign JWT with correct payload and return token with user data', async () => {
      const token = 'signed.jwt.token';
      jwtService.sign.mockReturnValue(token);

      const response: LoginResponse = await service.login(baseUser);

      const expectedPayload: JwtPayload = { sub: baseUser.id, email: baseUser.email, role: baseUser.role };
      expect(jwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(response).toEqual({
        access_token: token,
        user: {
          id: baseUser.id,
          name: baseUser.name,
          email: baseUser.email,
          role: baseUser.role,
        },
      });
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user when found and active', async () => {
      const activeUser = { ...baseUser, status: 'active' } as any;
      userService.findById.mockResolvedValue(activeUser);

      const result = await service.validateJwtPayload({ sub: baseUser.id, email: baseUser.email, role: baseUser.role });
      expect(userService.findById).toHaveBeenCalledWith(baseUser.id);
      expect(result).toBe(activeUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userService.findById.mockResolvedValue(null as any);

      await expect(
        service.validateJwtPayload({ sub: baseUser.id, email: baseUser.email, role: baseUser.role })
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...baseUser, status: 'inactive' } as any;
      userService.findById.mockResolvedValue(inactiveUser);

      await expect(
        service.validateJwtPayload({ sub: baseUser.id, email: baseUser.email, role: baseUser.role })
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should throw not implemented error', async () => {
      await expect(service.register({})).rejects.toThrow('Register method should be implemented in UserController');
    });
  });

  describe('password helpers', () => {
    it('hashPassword should call bcrypt.hash with saltRounds 12', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      const result = await service.hashPassword('plain');
      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 12);
      expect(result).toBe('new-hash');
    });

    it('verifyPassword should delegate to bcrypt.compare', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.verifyPassword('a', 'b')).resolves.toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('a', 'b');
    });
  });
});


