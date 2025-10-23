import { PartialType } from '@nestjs/swagger';
import { CreateAutoRoleRuleDto } from './create-auto-role-rule.dto';

export class UpdateAutoRoleRuleDto extends PartialType(CreateAutoRoleRuleDto) {}





