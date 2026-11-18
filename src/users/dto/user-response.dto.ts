import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'Garcia' })
  lastName: string;
}
