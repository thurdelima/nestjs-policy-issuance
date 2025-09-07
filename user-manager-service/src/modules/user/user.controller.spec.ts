import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, UserStatus } from '../../entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  // Mock data
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'João Silva',
    email: 'joao.silva@example.com',
    cpf: '12345678901',
    phone: '+5511999999999',
    birthDate: new Date('1990-01-01'),
    password: 'hashedPassword123',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    },
    metadata: {},
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockCreateUserDto: CreateUserDto = {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    cpf: '12345678901',
    password: 'password123',
    phone: '+5511999999999',
    birthDate: '1990-01-01',
    role: UserRole.CUSTOMER,
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    },
  };

  const mockUpdateUserDto: UpdateUserDto = {
    name: 'João Silva Updated',
    phone: '+5511888888888',
  };

  const mockCurrentUser: User = {
    ...mockUser,
    id: 'current-user-id',
    email: 'current@example.com',
  };

  beforeEach(async () => {
    // Create mock UserService
    const mockUserService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      changeStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      jest.spyOn(userService, 'create').mockResolvedValue(mockUser);

      // Act
      const result = await controller.create(mockCreateUserDto);

      // Assert
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(userService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      const conflictError = new ConflictException('User with this email or CPF already exists');
      jest.spyOn(userService, 'create').mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(conflictError);
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(userService.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid input data', async () => {
      // Arrange
      const badRequestError = new BadRequestException('Invalid input data');
      jest.spyOn(userService, 'create').mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(badRequestError);
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default parameters', async () => {
      // Arrange
      const mockResult = { users: [mockUser], total: 1 };
      jest.spyOn(userService, 'findAll').mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(userService.findAll).toHaveBeenCalledWith(1, 10);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should return paginated users with custom parameters', async () => {
      // Arrange
      const page = 2;
      const limit = 5;
      const mockResult = { users: [mockUser], total: 1 };
      jest.spyOn(userService, 'findAll').mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll(page, limit);

      // Assert
      expect(userService.findAll).toHaveBeenCalledWith(page, limit);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should handle string query parameters correctly', async () => {
      // Arrange
      const page = '2' as any;
      const limit = '5' as any;
      const mockResult = { users: [mockUser], total: 1 };
      jest.spyOn(userService, 'findAll').mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll(page, limit);

      // Assert
      expect(userService.findAll).toHaveBeenCalledWith(page, limit);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      // Arrange
      jest.spyOn(userService, 'findById').mockResolvedValue(mockCurrentUser);

      // Act
      const result = await controller.getProfile(mockCurrentUser);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(mockCurrentUser.id);
      expect(userService.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCurrentUser);
    });

    it('should throw NotFoundException when current user not found', async () => {
      // Arrange
      const notFoundError = new NotFoundException('User not found');
      jest.spyOn(userService, 'findById').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.getProfile(mockCurrentUser)).rejects.toThrow(notFoundError);
      expect(userService.findById).toHaveBeenCalledWith(mockCurrentUser.id);
    });
  });

  describe('findOne', () => {
    it('should return user by ID', async () => {
      // Arrange
      const userId = mockUser.id;
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await controller.findOne(userId);

      // Assert
      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(userService.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const notFoundError = new NotFoundException('User not found');
      jest.spyOn(userService, 'findById').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.findOne(userId)).rejects.toThrow(notFoundError);
      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      const badRequestError = new BadRequestException('Invalid UUID format');
      jest.spyOn(userService, 'findById').mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.findOne(invalidId)).rejects.toThrow(badRequestError);
      expect(userService.findById).toHaveBeenCalledWith(invalidId);
    });
  });

  describe('updateProfile', () => {
    it('should update current user profile successfully', async () => {
      // Arrange
      const updatedUser = { ...mockCurrentUser, ...mockUpdateUserDto };
      jest.spyOn(userService, 'update').mockResolvedValue(updatedUser as User);

      // Act
      const result = await controller.updateProfile(mockCurrentUser, mockUpdateUserDto);

      // Assert
      expect(userService.update).toHaveBeenCalledWith(mockCurrentUser.id, mockUpdateUserDto);
      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestException for invalid input data', async () => {
      // Arrange
      const badRequestError = new BadRequestException('Invalid input data');
      jest.spyOn(userService, 'update').mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.updateProfile(mockCurrentUser, mockUpdateUserDto)).rejects.toThrow(badRequestError);
      expect(userService.update).toHaveBeenCalledWith(mockCurrentUser.id, mockUpdateUserDto);
    });

    it('should throw NotFoundException when current user not found', async () => {
      // Arrange
      const notFoundError = new NotFoundException('User not found');
      jest.spyOn(userService, 'update').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.updateProfile(mockCurrentUser, mockUpdateUserDto)).rejects.toThrow(notFoundError);
      expect(userService.update).toHaveBeenCalledWith(mockCurrentUser.id, mockUpdateUserDto);
    });
  });

  describe('update', () => {
    it('should update user by ID successfully', async () => {
      // Arrange
      const userId = mockUser.id;
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };
      jest.spyOn(userService, 'update').mockResolvedValue(updatedUser as User);

      // Act
      const result = await controller.update(userId, mockUpdateUserDto);

      // Assert
      expect(userService.update).toHaveBeenCalledWith(userId, mockUpdateUserDto);
      expect(userService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestException for invalid input data', async () => {
      // Arrange
      const userId = mockUser.id;
      const badRequestError = new BadRequestException('Invalid input data');
      jest.spyOn(userService, 'update').mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.update(userId, mockUpdateUserDto)).rejects.toThrow(badRequestError);
      expect(userService.update).toHaveBeenCalledWith(userId, mockUpdateUserDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const notFoundError = new NotFoundException('User not found');
      jest.spyOn(userService, 'update').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.update(userId, mockUpdateUserDto)).rejects.toThrow(notFoundError);
      expect(userService.update).toHaveBeenCalledWith(userId, mockUpdateUserDto);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      const badRequestError = new BadRequestException('Invalid UUID format');
      jest.spyOn(userService, 'update').mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.update(invalidId, mockUpdateUserDto)).rejects.toThrow(badRequestError);
      expect(userService.update).toHaveBeenCalledWith(invalidId, mockUpdateUserDto);
    });
  });

  describe('changeStatus', () => {
    it('should change user status successfully', async () => {
      // Arrange
      const userId = mockUser.id;
      const newStatus = UserStatus.INACTIVE;
      const updatedUser = { ...mockUser, status: newStatus };
      jest.spyOn(userService, 'changeStatus').mockResolvedValue(updatedUser as User);

      // Act
      const result = await controller.changeStatus(userId, newStatus);

      // Assert
      expect(userService.changeStatus).toHaveBeenCalledWith(userId, newStatus);
      expect(userService.changeStatus).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const newStatus = UserStatus.INACTIVE;
      const notFoundError = new NotFoundException('User not found');
      jest.spyOn(userService, 'changeStatus').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.changeStatus(userId, newStatus)).rejects.toThrow(notFoundError);
      expect(userService.changeStatus).toHaveBeenCalledWith(userId, newStatus);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      const newStatus = UserStatus.INACTIVE;
      const badRequestError = new BadRequestException('Invalid UUID format');
      jest.spyOn(userService, 'changeStatus').mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.changeStatus(invalidId, newStatus)).rejects.toThrow(badRequestError);
      expect(userService.changeStatus).toHaveBeenCalledWith(invalidId, newStatus);
    });

    it('should handle all UserStatus enum values', async () => {
      // Arrange
      const userId = mockUser.id;
      const statuses = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED];
      jest.spyOn(userService, 'changeStatus').mockResolvedValue(mockUser);

      // Act & Assert
      for (const status of statuses) {
        await controller.changeStatus(userId, status);
        expect(userService.changeStatus).toHaveBeenCalledWith(userId, status);
      }
      expect(userService.changeStatus).toHaveBeenCalledTimes(statuses.length);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      // Arrange
      const userId = mockUser.id;
      jest.spyOn(userService, 'remove').mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(userId);

      // Assert
      expect(userService.remove).toHaveBeenCalledWith(userId);
      expect(userService.remove).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const notFoundError = new NotFoundException('User not found');
      jest.spyOn(userService, 'remove').mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.remove(userId)).rejects.toThrow(notFoundError);
      expect(userService.remove).toHaveBeenCalledWith(userId);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      const badRequestError = new BadRequestException('Invalid UUID format');
      jest.spyOn(userService, 'remove').mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(controller.remove(invalidId)).rejects.toThrow(badRequestError);
      expect(userService.remove).toHaveBeenCalledWith(invalidId);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle valid UUID parameters', async () => {
      // Arrange
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      // Act & Assert
      for (const uuid of validUuids) {
        await controller.findOne(uuid);
        expect(userService.findById).toHaveBeenCalledWith(uuid);
      }
      expect(userService.findById).toHaveBeenCalledTimes(validUuids.length);
    });

    it('should handle query parameter types correctly', async () => {
      // Arrange
      const mockResult = { users: [mockUser], total: 1 };
      jest.spyOn(userService, 'findAll').mockResolvedValue(mockResult);

      // Act & Assert - Test different parameter types
      await controller.findAll(1, 10); // numbers
      await controller.findAll('2' as any, '5' as any); // strings
      await controller.findAll(); // no parameters (should use defaults)

      expect(userService.findAll).toHaveBeenCalledWith(1, 10);
      expect(userService.findAll).toHaveBeenCalledWith('2', '5');
      expect(userService.findAll).toHaveBeenCalledWith(1, 10); // defaults applied
      expect(userService.findAll).toHaveBeenCalledTimes(3);
    });
  });

  describe('Service Integration', () => {
    it('should propagate all service errors correctly', async () => {
      // Arrange
      const errors = [
        new BadRequestException('Bad request'),
        new NotFoundException('Not found'),
        new ConflictException('Conflict'),
        new Error('Internal server error'),
      ];

      // Act & Assert
      for (const error of errors) {
        jest.spyOn(userService, 'create').mockRejectedValue(error);
        await expect(controller.create(mockCreateUserDto)).rejects.toThrow(error);
      }
    });

    it('should call service methods with correct parameters', async () => {
      // Arrange
      jest.spyOn(userService, 'create').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'findAll').mockResolvedValue({ users: [mockUser], total: 1 });
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'update').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'changeStatus').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'remove').mockResolvedValue(undefined);

      // Act
      await controller.create(mockCreateUserDto);
      await controller.findAll(1, 10);
      await controller.findOne(mockUser.id);
      await controller.updateProfile(mockCurrentUser, mockUpdateUserDto);
      await controller.update(mockUser.id, mockUpdateUserDto);
      await controller.changeStatus(mockUser.id, UserStatus.INACTIVE);
      await controller.remove(mockUser.id);

      // Assert
      expect(userService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(userService.findAll).toHaveBeenCalledWith(1, 10);
      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userService.update).toHaveBeenCalledWith(mockCurrentUser.id, mockUpdateUserDto);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, mockUpdateUserDto);
      expect(userService.changeStatus).toHaveBeenCalledWith(mockUser.id, UserStatus.INACTIVE);
      expect(userService.remove).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
