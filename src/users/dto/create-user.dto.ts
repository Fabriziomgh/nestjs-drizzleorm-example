import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;

  @IsEmail({}, { message: 'El formato del correo es invalido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;
}
