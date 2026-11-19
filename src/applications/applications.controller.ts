import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationResponseDto } from './dto/application-response.dto.js';
import { ApplicationsService } from './applications.service.js';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all applications' })
  @ApiOkResponse({ type: ApplicationResponseDto, isArray: true })
  getAll(): Promise<ApplicationResponseDto[]> {
    return this.applicationsService.getAll();
  }
}
