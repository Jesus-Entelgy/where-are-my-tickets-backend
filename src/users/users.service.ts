import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { User, UserRole } from './user.entity.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCRYPT_PARAMETERS = { N: 16384, r: 8, p: 1 };
const SCRYPT_HASH_PATTERN =
  /^scrypt\$16384\$8\$1\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{86})$/;

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

    const passwordHash = await this.hashPassword(userInput.password);

    try {
      const user = await this.usersRepository.save({
        email: userInput.email,
        firstName: userInput.firstName,
        lastName: userInput.lastName,
        passwordHash,
        role: UserRole.USER,
      });

      return this.toResponse(user);
    } catch (error) {
      if (this.isEmailUniqueViolation(error)) {
        throw new ConflictException('El usuario ya existe');
      }

      throw error;
    }
  }

  async login(input: LoginUserDto): Promise<UserResponseDto> {
    const credentials = this.validateLoginInput(input);
    const user = await this.usersRepository.findOne({
      where: { email: credentials.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
      },
    });

    if (
      !user ||
      !(await this.verifyPassword(credentials.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    return this.toResponse(user);
  }

  async getAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
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
        role: true,
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
    const hash = await this.deriveScryptKey(password, salt);

    return `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`;
  }

  private validateLoginInput(input: LoginUserDto): {
    email: string;
    password: string;
  } {
    if (
      typeof input !== 'object' ||
      input === null ||
      typeof input.email !== 'string' ||
      typeof input.password !== 'string'
    ) {
      throw new BadRequestException('Invalid login data');
    }

    const email = input.email.trim().toLowerCase();
    if (
      email.length === 0 ||
      email.length > 255 ||
      !EMAIL_PATTERN.test(email) ||
      input.password.length === 0 ||
      input.password.length > 1024
    ) {
      throw new BadRequestException('Invalid login data');
    }

    return { email, password: input.password };
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const match = SCRYPT_HASH_PATTERN.exec(storedHash);
    if (!match) {
      throw new Error('Stored password hash has an unsupported format');
    }

    const salt = Buffer.from(match[1], 'base64url');
    const expectedHash = Buffer.from(match[2], 'base64url');
    const actualHash = await this.deriveScryptKey(password, salt);

    return timingSafeEqual(actualHash, expectedHash);
  }

  private deriveScryptKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, 64, SCRYPT_PARAMETERS, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      });
    });
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
      role: user.role,
    };
  }
}
