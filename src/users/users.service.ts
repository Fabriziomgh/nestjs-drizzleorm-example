import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PG_CONNECTION } from 'src/drizzle/drizzle.module';
import type { DrizzleDB } from 'src/db/types/drizzle';
import * as schema from 'src/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(@Inject(PG_CONNECTION) private db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto) {
    const email = await this.findByEmail(createUserDto.email);
    if (email) throw new ConflictException('El email ya existe');
    const newUser = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning();

    return newUser;
  }

  async findAll(): Promise<schema.User[]> {
    const users = await this.db.query.users.findMany();
    return users;
  }

  async findOne(id: number): Promise<schema.User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));

    if (!user)
      throw new NotFoundException(`El usuario con el id ${id} no existe`);

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const [updatedUser] = await this.db
      .update(schema.users)
      .set(updateUserDto)
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }

  async remove(id: number): Promise<schema.User | undefined> {
    const [deletedUser] = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();

    if (!deletedUser) {
      throw new NotFoundException(`No se encontró el usuario con el id ${id}`);
    }

    return deletedUser;
  }

  private async findByEmail(email: string): Promise<string | undefined> {
    const [existEmail] = await this.db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.email, email));

    if (!existEmail) return undefined;

    return existEmail.email;
  }
}
