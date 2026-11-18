import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { User } from './user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let usersService: UsersService;

  const usersRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
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

    await expect(usersService.getByEmail('ana@example.com')).resolves.toEqual({
      id: '1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Garcia',
    });
  });

  it('throws NotFoundException when the email is not registered', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(
      usersService.getByEmail('missing@example.com'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
