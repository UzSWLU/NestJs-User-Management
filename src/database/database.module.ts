import { Module, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedRolesAndPermissions } from './seeds/roles.seed';
import { seedOAuthProviders } from './seeds/oauth-providers.seed';

@Module({})
export class DatabaseModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    // Run seeds on application startup
    await seedRolesAndPermissions(this.dataSource);
    await seedOAuthProviders(this.dataSource);
  }
}

