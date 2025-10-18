import { DataSource } from 'typeorm';
import { UserAutoRoleRule } from '../entities/oauth/user-auto-role-rule.entity';
import { OAuthProvider } from '../entities/oauth/oauth-provider.entity';
import { Role } from '../entities/core/role.entity';

export async function seedAutoRoleRules(dataSource: DataSource) {
  const autoRoleRuleRepo = dataSource.getRepository(UserAutoRoleRule);
  const providerRepo = dataSource.getRepository(OAuthProvider);
  const roleRepo = dataSource.getRepository(Role);

  // Check if auto role rules already exist
  const existingRules = await autoRoleRuleRepo.count();
  if (existingRules > 0) {
    console.log('✅ Auto role rules already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding auto role rules...');

  // Get providers
  const hemisProvider = await providerRepo.findOne({
    where: { name: 'hemis' },
  });
  const studentProvider = await providerRepo.findOne({
    where: { name: 'student' },
  });

  // Get roles
  const employeeRole = await roleRepo.findOne({
    where: { name: 'employee' },
  });
  const studentRole = await roleRepo.findOne({
    where: { name: 'student' },
  });

  if (!hemisProvider || !studentProvider) {
    console.log('⚠️  Providers not found, skipping auto role rules seed');
    return;
  }

  if (!employeeRole || !studentRole) {
    console.log('⚠️  Roles not found, skipping auto role rules seed');
    return;
  }

  // Create auto role rules
  const rules = autoRoleRuleRepo.create([
    {
      rule_name: 'HEMIS Employee Auto Role',
      provider: hemisProvider,
      role: employeeRole,
      condition_field: 'type',
      condition_operator: 'equals',
      condition_value: 'employee',
      is_active: true,
    },
    {
      rule_name: 'Student Portal Auto Role',
      provider: studentProvider,
      role: studentRole,
      condition_field: 'student_id',
      condition_operator: 'contains',
      condition_value: '', // Any user with student_id field
      is_active: true,
    },
  ]);

  await autoRoleRuleRepo.save(rules);

  console.log('✅ Auto role rules seeded successfully!');
  console.log('   - HEMIS: type=employee → employee role');
  console.log('   - Student Portal: has student_id → student role');
}

