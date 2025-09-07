import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UserService } from './user.service';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Mock bcryptjs
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

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

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      const expectedUser = { ...mockUser, password: hashedPassword };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(expectedUser as User);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedUser as User);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Act
      const result = await service.create(mockCreateUserDto);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: [
          { email: mockCreateUserDto.email },
          { cpf: mockCreateUserDto.cpf },
        ],
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 12);
      expect(repository.create).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        password: hashedPassword,
      });
      expect(repository.save).toHaveBeenCalledWith(expectedUser);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException when user with email already exists', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        new ConflictException('User with this email or CPF already exists'),
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: [
          { email: mockCreateUserDto.email },
          { cpf: mockCreateUserDto.cpf },
        ],
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user with CPF already exists', async () => {
      // Arrange
      const existingUser = { ...mockUser, email: 'different@example.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        new ConflictException('User with this email or CPF already exists'),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default parameters', async () => {
      // Arrange
      const mockUsers = [mockUser];
      const total = 1;
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockUsers, total]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: ['id', 'name', 'email', 'cpf', 'phone', 'role', 'status', 'createdAt'],
      });
      expect(result).toEqual({ users: mockUsers, total });
    });

    it('should return paginated users with custom parameters', async () => {
      // Arrange
      const mockUsers = [mockUser];
      const total = 1;
      const page = 2;
      const limit = 5;
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockUsers, total]);

      // Act
      const result = await service.findAll(page, limit);

      // Assert
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 5, // (page - 1) * limit
        take: limit,
        select: ['id', 'name', 'email', 'cpf', 'phone', 'role', 'status', 'createdAt'],
      });
      expect(result).toEqual({ users: mockUsers, total });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = mockUser.id;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['id', 'name', 'email', 'cpf', 'phone', 'birthDate', 'role', 'status', 'address', 'metadata', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      const email = mockUser.email;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      const email = 'non-existent@example.com';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByCpf', () => {
    it('should return user when found by CPF', async () => {
      // Arrange
      const cpf = mockUser.cpf;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      // Act
      const result = await service.findByCpf(cpf);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { cpf },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by CPF', async () => {
      // Arrange
      const cpf = '99999999999';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service.findByCpf(cpf);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = mockUser.id;
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedUser as User);

      // Act
      const result = await service.update(userId, mockUpdateUserDto);

      // Assert
      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(repository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should update user with password hashing', async () => {
      // Arrange
      const userId = mockUser.id;
      const updateDtoWithPassword = { ...mockUpdateUserDto, password: 'newPassword123' };
      const hashedPassword = 'hashedNewPassword123';
      const updatedUser = { ...mockUser, ...updateDtoWithPassword, password: hashedPassword };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedUser as User);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Act
      const result = await service.update(userId, updateDtoWithPassword);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(repository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ConflictException when email already exists for another user', async () => {
      // Arrange
      const userId = mockUser.id;
      const updateDtoWithEmail = { ...mockUpdateUserDto, email: 'existing@example.com' };
      const existingUser = { ...mockUser, id: 'different-id' };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.update(userId, updateDtoWithEmail)).rejects.toThrow(
        new ConflictException('User with this email or CPF already exists'),
      );
    });

    it('should throw ConflictException when CPF already exists for another user', async () => {
      // Arrange
      const userId = mockUser.id;
      const updateDtoWithCpf = { ...mockUpdateUserDto, cpf: '99999999999' };
      const existingUser = { ...mockUser, id: 'different-id' };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.update(userId, updateDtoWithCpf)).rejects.toThrow(
        new ConflictException('User with this email or CPF already exists'),
      );
    });

    it('should throw NotFoundException when user to update not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(service.update(userId, mockUpdateUserDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      // Arrange
      const userId = mockUser.id;
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockUser);

      // Act
      await service.remove(userId);

      // Assert
      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user to remove not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(service.remove(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('changeStatus', () => {
    it('should change user status successfully', async () => {
      // Arrange
      const userId = mockUser.id;
      const newStatus = UserStatus.INACTIVE;
      const updatedUser = { ...mockUser, status: newStatus };
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedUser as User);

      // Act
      const result = await service.changeStatus(userId, newStatus);

      // Assert
      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(repository.save).toHaveBeenCalledWith({ ...mockUser, status: newStatus });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user to change status not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const newStatus = UserStatus.INACTIVE;
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(service.changeStatus(userId, newStatus)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('findByRole', () => {
    it('should return users with specific role and active status', async () => {
      // Arrange
      const role = UserRole.ADMIN;
      const mockUsers = [mockUser];
      jest.spyOn(repository, 'find').mockResolvedValue(mockUsers);

      // Act
      const result = await service.findByRole(role);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { role, status: UserStatus.ACTIVE },
        select: ['id', 'name', 'email', 'cpf', 'phone', 'role', 'status'],
      });
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users found with specific role', async () => {
      // Arrange
      const role = UserRole.MANAGER;
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      // Act
      const result = await service.findByRole(role);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('hashPassword (private method)', () => {
    it('should hash password with correct salt rounds', async () => {
      // Arrange
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Act
      const result = await (service as any).hashPassword(password);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });
});
