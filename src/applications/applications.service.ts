import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationResponseDto } from './dto/application-response.dto.js';
import { Application } from './application.entity.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepository: Repository<Application>,
  ) {}

  async getAll(): Promise<ApplicationResponseDto[]> {
    const applications = await this.applicationsRepository.find({
      select: { name: true },
    });

    return applications.map(({ name }) => ({ name }));
  }
}
