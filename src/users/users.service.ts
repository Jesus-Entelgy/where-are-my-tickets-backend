import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserResponseDto } from './dto/user-response.dto.js';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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
    const user = await this.usersRepository.findOne({
      where: { email },
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

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
