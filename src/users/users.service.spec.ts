import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { scryptSync } from 'node:crypto';
import { User } from './user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let usersService: UsersService;

  const usersRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  it('returns all users without their password hashes', async () => {
    usersRepository.find.mockResolvedValue([
      {
        id: '1',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        passwordHash: 'stored-hash',
        role: 'USER',
      },
    ]);

    await expect(usersService.getAll()).resolves.toEqual([
      {
        id: '1',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        role: 'USER',
      },
    ]);
  });

  it('returns a user by email without their password hash', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      passwordHash: 'stored-hash',
      role: 'ADMIN',
    });

    await expect(usersService.getByEmail(' Ana@Example.COM ')).resolves.toEqual(
      {
        id: '1',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        role: 'ADMIN',
      },
    );
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  });

  it('throws NotFoundException when the email is not registered', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(
      usersService.getByEmail('missing@example.com'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('normalizes email and hashes the password when creating a user', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockResolvedValue({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: 'USER',
      passwordHash: 'stored-hash',
    });

    await expect(
      usersService.create({
        email: ' Ana@Example.COM ',
        firstName: ' Ana ',
        lastName: ' Garcia ',
        password: 'password123',
      }),
    ).resolves.toEqual({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: 'USER',
    });

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
      select: { id: true },
    });
    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        passwordHash: expect.stringMatching(/^scrypt\$16384\$8\$1\$/),
        role: 'USER',
      }),
    );
  });

  it('rejects duplicate emails without saving a user', async () => {
    usersRepository.findOne.mockResolvedValue({ id: '1' });

    await expect(
      usersService.create({
        email: 'ANA@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('rejects invalid email addresses before querying the repository', async () => {
    await expect(
      usersService.create({
        email: 'not-an-email',
        firstName: 'Ana',
        lastName: 'Garcia',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersRepository.findOne).not.toHaveBeenCalled();
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('logs in with a matching password hash without returning the hash', async () => {
    const password = 'correct password';
    const salt = Buffer.from('00112233445566778899aabbccddeeff', 'hex');
    const hash = scryptSync(password, salt, 64, {
      N: 16384,
      r: 8,
      p: 1,
    });
    usersRepository.findOne.mockResolvedValue({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      passwordHash: `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`,
      role: 'USER',
    });

    await expect(
      usersService.login({
        email: ' ANA@Example.COM ',
        password,
      }),
    ).resolves.toEqual({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      role: 'USER',
    });
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
      },
    });
  });

  it('rejects an incorrect password', async () => {
    const salt = Buffer.from('00112233445566778899aabbccddeeff', 'hex');
    const hash = scryptSync('correct password', salt, 64, {
      N: 16384,
      r: 8,
      p: 1,
    });
    usersRepository.findOne.mockResolvedValue({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      passwordHash: `scrypt$16384$8$1$${salt.toString('base64url')}$${hash.toString('base64url')}`,
      role: 'USER',
    });

    await expect(
      usersService.login({
        email: 'ana@example.com',
        password: 'wrong password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login when the email is not registered', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(
      usersService.login({
        email: 'missing@example.com',
        password: 'some password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
