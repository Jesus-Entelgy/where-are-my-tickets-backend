import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity.js';

export class UserResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'Garcia' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;
}
