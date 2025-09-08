import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService, LoginResponse } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const loginDto = { email: 'john@example.com', password: 'secret' } as any;

  const loginResponse: LoginResponse = {
    access_token: 'jwt.token',
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    },
  };

  const user = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
  } as any;

  beforeEach(() => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    } as any;

    controller = new AuthController(authService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should validate user and return login response on success', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);
      jest.spyOn(authService, 'login').mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(loginResponse);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null as any);

      await expect(controller.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(authService.login).not.toHaveBeenCalled();
    });
  });
});


