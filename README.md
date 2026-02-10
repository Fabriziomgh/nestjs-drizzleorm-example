# nestjs-test — Guía detallada: NestJS + Drizzle ORM + PostgreSQL

## Objetivo

Documentar paso a paso la integración del proyecto (#codebase) con Drizzle ORM y PostgreSQL, migraciones, seeds y uso desde servicios NestJS.

## Requisitos previos

- Node.js >= 20
- pnpm (recomendado) o npm
- Docker (opcional, recomendado para Postgres)
- Variables de entorno en archivo `.env`

## Archivo .env (ejemplo)

Usar en la raíz del repo:

```bash
# .env
DATABASE_URL=postgres://postgres:123456@localhost:5432/postgres
```

## Levantar Postgres con Docker

El repo contiene `docker-compose.yml`. Comandos básicos:

```bash
# levantar container en background
docker compose up -d

# ver logs
docker compose logs -f

# parar y eliminar container
docker compose down
```

(El compose expone Postgres en el puerto 5432 y usa POSTGRES_PASSWORD=123456 según el repo.)

## Drizzle CLI config

Archivo `drizzle.config.ts` ya incluido. Proporciona salida de migraciones en `./drizzle` y usa `process.env.DATABASE_URL`:

```ts
// ...existing code...
// filepath: drizzle.config.ts
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Esquema (schema.ts)

Tabla `users` definida en `src/db/schema.ts`:

```ts
// ...existing code...
// filepath: src/db/schema.ts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Módulo Drizzle en NestJS

`src/drizzle/drizzle.module.ts` exporta el token `PG_CONNECTION` y crea una instancia Drizzle tipada (`DrizzleDB`) usando `pg.Pool`. Patrón utilizado:

```ts
// ...existing code...
// filepath: src/drizzle/drizzle.module.ts
@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connection = config.get<string>('DATABASE_URL');
        const pool = new Pool({ connectionString: connection });
        return drizzle(pool, { schema }) as DrizzleDB;
      },
    },
  ],
  exports: [PG_CONNECTION],
})
export class DrizzleModule {}
```

Cómo inyectarlo en servicios:

```ts
constructor(@Inject(PG_CONNECTION) private db: DrizzleDB) {}
```

## Tipado Drizzle

`src/db/types/drizzle.ts` define `DrizzleDB`:

```ts
// ...existing code...
// filepath: src/db/types/drizzle.ts
export type DrizzleDB = NodePgDatabase<typeof schema>;
```

## Migraciones con drizzle-kit

1. Editar `src/db/schema.ts` (añadir/editar tablas).
2. Generar migración:
   - pnpm run db:generate
3. Aplicar migración:
   - pnpm run db:push
   - o pnpm run db:migrate
4. Revisar carpeta `drizzle/` generada.

## Semillas (seed)

Hay dos scripts de seed:

- `src/db/seed.ts` — usa faker y `drizzle(...).insert(...)`.
- `src/db/seedDrizzle.ts` — usa `drizzle-seed` para generar datos automáticamente.

Ejecutar seeds:

```bash
pnpm run db:seed   # ejecuta src/db/seed.ts
pnpm run db:seed2  # ejecuta src/db/seedDrizzle.ts
```

Ejemplo: seed rápido (snippet)

```ts
// ...existing code...
// filepath: src/db/seed.ts
const usersToInsert = Array(200)
  .fill(null)
  .map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
  }));
await db.insert(schema.users).values(usersToInsert);
```

## Uso en UsersService (CRUD)

`src/users/users.service.ts` muestra patrones comunes:

- Crear con verificación de email único:

```ts
// ...existing code...
const email = await this.findByEmail(createUserDto.email);
if (email) throw new ConflictException('El email ya existe');

const newUser = await this.db
  .insert(schema.users)
  .values(createUserDto)
  .returning();
```

- Buscar por id:

```ts
// ...existing code...
const [user] = await this.db
  .select()
  .from(schema.users)
  .where(eq(schema.users.id, id));
if (!user) throw new NotFoundException(...);
```

- Update/Delete usan `.update(...).set(...).where(...).returning()` y `.delete(...).where(...).returning()`.

## Pruebas manuales y consumo HTTP

Endpoints expuestos en `src/users/users.controller.ts`:

- POST /users
- GET /users
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id

Ejemplo curl crear usuario:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","email":"juan@example.com"}'
```

## Migración de flujo típico (resumen paso a paso)

1. Levantar Postgres (docker compose up -d).
2. Ajustar `DATABASE_URL` en `.env`.
3. Ejecutar `pnpm install`.
4. Generar migración: `pnpm run db:generate`.
5. Aplicar migración: `pnpm run db:migrate` o `pnpm run db:push`.
6. Sembrar datos: `pnpm run db:seed` o `pnpm run db:seed2`.
7. Iniciar app: `pnpm run start:dev`.
8. Probar endpoints con curl/Postman.

## Resolución de problemas comunes

- Error de conexión: comprobar `DATABASE_URL`, estado del container Docker y puerto 5432.
- Conflictos de rutas import (`src/...`): asegurar `tsconfig.json` y uso de `tsconfig-paths` en entornos de ejecución si es necesario.
- Migraciones no detectadas: revisar `drizzle.config.ts` y la carpeta `drizzle/`.

## Buenas prácticas y recomendaciones

- Mantener `DATABASE_URL` fuera del control de versiones.
- Usar DTOs y validaciones (class-validator) en controllers.
- Cerrar pools en scripts CLI (seed) con `pool.end()` — ya implementado en `src/db/seed*.ts`.
- Versionar migraciones y revisarlas antes de aplicar en producción.
- Añadir logs y retries en la inicialización de la conexión si es necesario.

## Recursos y comandos rápidos

- Levantar DB: docker compose up -d
- Instalar: pnpm install
- Start dev: pnpm run start:dev
- Generar migración: pnpm run db:generate
- Aplicar migración: pnpm run db:migrate
- Seed: pnpm run db:seed

## Contacto

Archivo base y snippets extraídos del codebase del repo. Para ampliaciones (relaciones, transacciones, testing e2e) se puede documentar la estrategia específica a seguir.
