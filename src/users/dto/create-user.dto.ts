import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'Garcia' })
  lastName: string;

  @ApiProperty({ writeOnly: true, minLength: 1 })
  password: string;
}
