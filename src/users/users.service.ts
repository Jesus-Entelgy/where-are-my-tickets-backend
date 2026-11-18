import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, scrypt } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { User } from './user.entity.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCRYPT_PARAMETERS = { N: 16384, r: 8, p: 1 };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(input: CreateUserDto): Promise<UserResponseDto> {
    const userInput = this.validateAndNormalize(input);
    const existingUser = await this.usersRepository.findOne({
      where: { email: userInput.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    const password = await this.hashPassword(userInput.password);

    try {
      const user = await this.usersRepository.save({
        email: userInput.email,
        firstName: userInput.firstName,
        lastName: userInput.lastName,
        password,
      });

      return this.toResponse(user);
    } catch (error) {
      if (this.isEmailUniqueViolation(error)) {
        throw new ConflictException('El usuario ya existe');
      }

      throw error;
    }
  }

  async getAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return users.map((user) => this.toResponse(user));
  }

  async getByEmail(email: string): Promise<UserResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  private validateAndNormalize(input: CreateUserDto): CreateUserDto {
    if (
      typeof input !== 'object' ||
      input === null ||
      typeof input.email !== 'string' ||
      typeof input.firstName !== 'string' ||
      typeof input.lastName !== 'string' ||
      typeof input.password !== 'string'
    ) {
      throw new BadRequestException('Invalid user data');
    }

    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (
      email.length === 0 ||
      email.length > 255 ||
      !EMAIL_PATTERN.test(email) ||
      firstName.length === 0 ||
      firstName.length > 100 ||
      lastName.length === 0 ||
      lastName.length > 100 ||
      input.password.length === 0 ||
      input.password.length > 1024
    ) {
      throw new BadRequestException('Invalid user data');
    }

    return {
      email,
      firstName,
      lastName,
      password: input.password,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, SCRYPT_PARAMETERS, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      });
    });

    return `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`;
  }

  private isEmailUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;
    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      driverError.code === '23505' &&
      'constraint' in driverError &&
      driverError.constraint === 'UQ_users_email'
    );
  }

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
