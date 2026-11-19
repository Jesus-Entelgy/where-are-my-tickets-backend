import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Application } from './application.entity.js';
import { ApplicationsService } from './applications.service.js';

describe('ApplicationsService', () => {
  let applicationsService: ApplicationsService;

  const applicationsRepository = {
    find: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: applicationsRepository,
        },
      ],
    }).compile();

    applicationsService = module.get<ApplicationsService>(ApplicationsService);
  });

  it('returns all applications with only their names', async () => {
    applicationsRepository.find.mockResolvedValue([
      { id: 'random-hash', name: 'MesaOne' },
      { id: 'another-hash', name: 'TaskForge' },
    ]);

    await expect(applicationsService.getAll()).resolves.toEqual([
      { name: 'MesaOne' },
      { name: 'TaskForge' },
    ]);
    expect(applicationsRepository.find).toHaveBeenCalledWith({
      select: { name: true },
    });
  });
});
