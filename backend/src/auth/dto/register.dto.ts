import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const USER_ROLES = ['ADMIN', 'EMPLOYEE', 'CUSTOMER'] as const;
type UserRoleValue = (typeof USER_ROLES)[number];

export class RegisterDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRoleValue;
}
