import { DataSource } from 'typeorm';
import { Role } from '../entities/core/role.entity';
import { Permission } from '../entities/core/permission.entity';
import { PermissionGroup } from '../entities/core/permission-group.entity';
import { RolePermission } from '../entities/core/role-permission.entity';

export async function seedRolesAndPermissions(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);
  const groupRepo = dataSource.getRepository(PermissionGroup);
  const rolePermRepo = dataSource.getRepository(RolePermission);

  // Check if roles already exist
  const existingRoles = await roleRepo.count();
  if (existingRoles > 0) {
    console.log('✅ Roles already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding roles and permissions...');

  // Create Permission Groups
  const userGroup = groupRepo.create({
    name: 'User Management',
    description: 'User related permissions',
  });
  const roleGroup = groupRepo.create({
    name: 'Role Management',
    description: 'Role and permission management',
  });
  const companyGroup = groupRepo.create({
    name: 'Company Management',
    description: 'Company related permissions',
  });
  const oauthGroup = groupRepo.create({
    name: 'OAuth Management',
    description: 'OAuth providers and accounts management',
  });
  const autoRoleGroup = groupRepo.create({
    name: 'Auto Role Rules',
    description: 'Auto role assignment rules management',
  });
  const mergeGroup = groupRepo.create({
    name: 'User Merge',
    description: 'User account merging permissions',
  });
  await groupRepo.save([
    userGroup,
    roleGroup,
    companyGroup,
    oauthGroup,
    autoRoleGroup,
    mergeGroup,
  ]);

  // Create Permissions
  const permissions = await permissionRepo.save([
    // User permissions
    { name: 'users.read', description: 'View users', group: userGroup },
    { name: 'users.create', description: 'Create users', group: userGroup },
    { name: 'users.update', description: 'Update users', group: userGroup },
    { name: 'users.delete', description: 'Delete users', group: userGroup },
    {
      name: 'users.assignRole',
      description: 'Assign roles to users',
      group: userGroup,
    },

    // Role permissions
    { name: 'roles.read', description: 'View roles', group: roleGroup },
    { name: 'roles.create', description: 'Create roles', group: roleGroup },
    { name: 'roles.update', description: 'Update roles', group: roleGroup },
    { name: 'roles.delete', description: 'Delete roles', group: roleGroup },

    // Permission permissions
    {
      name: 'permissions.read',
      description: 'View permissions',
      group: roleGroup,
    },
    {
      name: 'permissions.create',
      description: 'Create permissions',
      group: roleGroup,
    },
    {
      name: 'permissions.update',
      description: 'Update permissions',
      group: roleGroup,
    },
    {
      name: 'permissions.delete',
      description: 'Delete permissions',
      group: roleGroup,
    },

    // Company permissions
    {
      name: 'companies.read',
      description: 'View companies',
      group: companyGroup,
    },
    {
      name: 'companies.create',
      description: 'Create companies',
      group: companyGroup,
    },
    {
      name: 'companies.update',
      description: 'Update companies',
      group: companyGroup,
    },
    {
      name: 'companies.delete',
      description: 'Delete companies',
      group: companyGroup,
    },
    {
      name: 'companies.uploadLogo',
      description: 'Upload company logos',
      group: companyGroup,
    },

    // OAuth Provider permissions
    {
      name: 'oauth.providers.read',
      description: 'View OAuth providers',
      group: oauthGroup,
    },
    {
      name: 'oauth.providers.create',
      description: 'Create OAuth providers',
      group: oauthGroup,
    },
    {
      name: 'oauth.providers.update',
      description: 'Update OAuth providers',
      group: oauthGroup,
    },
    {
      name: 'oauth.providers.delete',
      description: 'Delete OAuth providers',
      group: oauthGroup,
    },

    // OAuth Account permissions
    {
      name: 'oauth.accounts.read',
      description: 'View OAuth accounts',
      group: oauthGroup,
    },
    {
      name: 'oauth.accounts.link',
      description: 'Link OAuth accounts',
      group: oauthGroup,
    },
    {
      name: 'oauth.accounts.unlink',
      description: 'Unlink OAuth accounts',
      group: oauthGroup,
    },

    // Auto Role Rules permissions
    {
      name: 'autoRoleRules.read',
      description: 'View auto role rules',
      group: autoRoleGroup,
    },
    {
      name: 'autoRoleRules.create',
      description: 'Create auto role rules',
      group: autoRoleGroup,
    },
    {
      name: 'autoRoleRules.update',
      description: 'Update auto role rules',
      group: autoRoleGroup,
    },
    {
      name: 'autoRoleRules.delete',
      description: 'Delete auto role rules',
      group: autoRoleGroup,
    },

    // User Merge permissions
    {
      name: 'userMerge.read',
      description: 'View merge history',
      group: mergeGroup,
    },
    {
      name: 'userMerge.merge',
      description: 'Merge user accounts',
      group: mergeGroup,
    },
  ]);

  // Create Roles
  const creatorRole = roleRepo.create({
    name: 'creator',
    description: 'System creator with full access',
    is_system: true,
  });

  const adminRole = roleRepo.create({
    name: 'admin',
    description: 'Administrator with full management access',
    is_system: true,
  });

  const managerRole = roleRepo.create({
    name: 'manager',
    description: 'Manager with read-only access',
    is_system: true,
  });

  const userRole = roleRepo.create({
    name: 'user',
    description: 'Regular user with limited access',
    is_system: true,
  });

  const employeeRole = roleRepo.create({
    name: 'employee',
    description: 'Employee with standard access',
    is_system: true,
  });

  const studentRole = roleRepo.create({
    name: 'student',
    description: 'Student with basic access',
    is_system: true,
  });

  await roleRepo.save([
    creatorRole,
    adminRole,
    managerRole,
    userRole,
    employeeRole,
    studentRole,
  ]);

  // Assign all permissions to creator and admin
  const allPermissions = permissions.map((perm) =>
    rolePermRepo.create({ role: creatorRole, permission: perm }),
  );
  await rolePermRepo.save(allPermissions);

  const adminPermissions = permissions.map((perm) =>
    rolePermRepo.create({ role: adminRole, permission: perm }),
  );
  await rolePermRepo.save(adminPermissions);

  // Assign read-only permissions to manager
  const readPermissions = permissions
    .filter((p) => p.name.includes('.read'))
    .map((perm) =>
      rolePermRepo.create({ role: managerRole, permission: perm }),
    );
  await rolePermRepo.save(readPermissions);

  // No permissions for regular user role by default

  console.log('✅ Roles and permissions seeded successfully!');
  console.log(`   - creator: Full access (${permissions.length} permissions)`);
  console.log(`   - admin: Full access (${permissions.length} permissions)`);
  console.log('   - manager: Read-only access');
  console.log('   - user: No default permissions');
  console.log('   - employee: No default permissions');
  console.log('   - student: No default permissions');
  console.log('');
  console.log('📋 Permission Groups:');
  console.log('   - User Management (5 permissions)');
  console.log('   - Role Management (8 permissions)');
  console.log('   - Company Management (5 permissions)');
  console.log('   - OAuth Management (7 permissions)');
  console.log('   - Auto Role Rules (4 permissions)');
  console.log('   - User Merge (2 permissions)');
}
