import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoRoleRulesService } from './auto-role-rules.service';
import { AutoRoleRulesController } from './auto-role-rules.controller';
import { UserAutoRoleRule } from '../../database/entities/oauth/user-auto-role-rule.entity';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';
import { Role } from '../../database/entities/core/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAutoRoleRule, OAuthProvider, Role])],
  controllers: [AutoRoleRulesController],
  providers: [AutoRoleRulesService],
  exports: [AutoRoleRulesService],
})
export class AutoRoleRulesModule {}


