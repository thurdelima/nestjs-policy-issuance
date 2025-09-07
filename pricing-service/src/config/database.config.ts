import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_DATABASE', 'pricing'),
  schema: configService.get<string>('DB_SCHEMA', 'pricing'),
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: false,
  logging: configService.get<boolean>('DB_LOGGING', false),
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN', false),
  ssl: configService.get<boolean>('DB_SSL', false) ? {
    rejectUnauthorized: false,
  } : false,
  extra: {
    max: configService.get<number>('DB_MAX_CONNECTIONS', 20),
    idleTimeoutMillis: configService.get<number>('DB_IDLE_TIMEOUT', 30000),
    connectionTimeoutMillis: configService.get<number>('DB_CONNECTION_TIMEOUT', 2000),
  },
});
