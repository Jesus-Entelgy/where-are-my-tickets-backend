import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ writeOnly: true, minLength: 1 })
  password: string;
}
