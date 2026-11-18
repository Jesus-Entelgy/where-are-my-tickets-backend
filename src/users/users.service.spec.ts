import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
        password: 'stored-hash',
      },
    ]);

    await expect(usersService.getAll()).resolves.toEqual([
      {
        id: '1',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
      },
    ]);
  });

  it('returns a user by email without their password hash', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      password: 'stored-hash',
    });

    await expect(usersService.getByEmail(' Ana@Example.COM ')).resolves.toEqual(
      {
        id: '1',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Garcia',
      },
    );
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
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
      password: 'stored-hash',
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
    });

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@example.com' },
      select: { id: true },
    });
    expect(usersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        password: expect.stringMatching(/^scrypt\$16384\$8\$1\$/),
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
});
