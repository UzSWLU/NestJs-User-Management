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

  // Create Permissions (Endpoint-based naming)
  const permissions = await permissionRepo.save([
    // User permissions
    { name: 'GET /api/users', description: 'View users list', group: userGroup },
    { name: 'GET /api/users/:id', description: 'View specific user', group: userGroup },
    { name: 'POST /api/users', description: 'Create new user', group: userGroup },
    { name: 'PATCH /api/users/:id', description: 'Update user', group: userGroup },
    { name: 'DELETE /api/users/:id', description: 'Delete user', group: userGroup },
    {
      name: 'GET /api/users/:id/roles',
      description: 'View user roles',
      group: userGroup,
    },
    {
      name: 'POST /api/users/:id/roles',
      description: 'Assign role to user',
      group: userGroup,
    },
    {
      name: 'DELETE /api/users/:id/roles/:roleId',
      description: 'Remove role from user',
      group: userGroup,
    },

    // Role permissions
    { name: 'GET /api/roles', description: 'View roles list', group: roleGroup },
    { name: 'GET /api/roles/:id', description: 'View specific role', group: roleGroup },
    { name: 'POST /api/roles', description: 'Create new role', group: roleGroup },
    { name: 'PATCH /api/roles/:id', description: 'Update role', group: roleGroup },
    { name: 'DELETE /api/roles/:id', description: 'Delete role', group: roleGroup },

    // Permission permissions
    {
      name: 'GET /api/permissions',
      description: 'View permissions list',
      group: roleGroup,
    },
    {
      name: 'GET /api/permissions/:id',
      description: 'View specific permission',
      group: roleGroup,
    },
    {
      name: 'POST /api/permissions',
      description: 'Create new permission',
      group: roleGroup,
    },
    {
      name: 'PATCH /api/permissions/:id',
      description: 'Update permission',
      group: roleGroup,
    },
    {
      name: 'DELETE /api/permissions/:id',
      description: 'Delete permission',
      group: roleGroup,
    },

    // Company permissions
    {
      name: 'GET /api/companies',
      description: 'View companies list',
      group: companyGroup,
    },
    {
      name: 'GET /api/companies/:id',
      description: 'View specific company',
      group: companyGroup,
    },
    {
      name: 'POST /api/companies',
      description: 'Create new company',
      group: companyGroup,
    },
    {
      name: 'PATCH /api/companies/:id',
      description: 'Update company',
      group: companyGroup,
    },
    {
      name: 'DELETE /api/companies/:id',
      description: 'Delete company',
      group: companyGroup,
    },
    {
      name: 'POST /api/companies/:id/upload-logo',
      description: 'Upload company logo',
      group: companyGroup,
    },

    // OAuth Provider permissions
    {
      name: 'GET /api/oauth-providers',
      description: 'View OAuth providers list',
      group: oauthGroup,
    },
    {
      name: 'GET /api/oauth-providers/:id',
      description: 'View specific OAuth provider',
      group: oauthGroup,
    },
    {
      name: 'POST /api/oauth-providers',
      description: 'Create OAuth provider',
      group: oauthGroup,
    },
    {
      name: 'PATCH /api/oauth-providers/:id',
      description: 'Update OAuth provider',
      group: oauthGroup,
    },
    {
      name: 'DELETE /api/oauth-providers/:id',
      description: 'Delete OAuth provider',
      group: oauthGroup,
    },
    {
      name: 'PATCH /api/oauth-providers/:id/toggle-active',
      description: 'Toggle OAuth provider active status',
      group: oauthGroup,
    },

    // OAuth Account permissions
    {
      name: 'GET /api/oauth-accounts',
      description: 'View all OAuth accounts',
      group: oauthGroup,
    },
    {
      name: 'GET /api/oauth-accounts/user/:userId',
      description: 'View user OAuth accounts',
      group: oauthGroup,
    },
    {
      name: 'POST /api/oauth-accounts/user/:userId/link',
      description: 'Link OAuth account to user',
      group: oauthGroup,
    },
    {
      name: 'DELETE /api/oauth-accounts/user/:userId/accounts/:accountId',
      description: 'Unlink OAuth account',
      group: oauthGroup,
    },

    // Auto Role Rules permissions
    {
      name: 'GET /api/auto-role-rules',
      description: 'View auto role rules list',
      group: autoRoleGroup,
    },
    {
      name: 'GET /api/auto-role-rules/:id',
      description: 'View specific auto role rule',
      group: autoRoleGroup,
    },
    {
      name: 'GET /api/auto-role-rules/provider/:providerId',
      description: 'View auto role rules for provider',
      group: autoRoleGroup,
    },
    {
      name: 'POST /api/auto-role-rules',
      description: 'Create auto role rule',
      group: autoRoleGroup,
    },
    {
      name: 'PATCH /api/auto-role-rules/:id',
      description: 'Update auto role rule',
      group: autoRoleGroup,
    },
    {
      name: 'DELETE /api/auto-role-rules/:id',
      description: 'Delete auto role rule',
      group: autoRoleGroup,
    },

    // User Merge permissions
    {
      name: 'GET /api/user-merge',
      description: 'View merge history list',
      group: mergeGroup,
    },
    {
      name: 'GET /api/user-merge/:id',
      description: 'View specific merge history',
      group: mergeGroup,
    },
    {
      name: 'GET /api/user-merge/user/:userId',
      description: 'View user merge history',
      group: mergeGroup,
    },
    {
      name: 'POST /api/user-merge',
      description: 'Merge user accounts',
      group: mergeGroup,
    },

    // User Profile permissions
    {
      name: 'GET /api/user-profiles/me',
      description: 'View own user profile',
      group: userGroup,
    },
    {
      name: 'GET /api/user-profiles/all',
      description: 'View all user profiles',
      group: userGroup,
    },
    {
      name: 'POST /api/user-profiles/preferences',
      description: 'Set user profile preferences',
      group: userGroup,
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

  // Assign read-only permissions to manager (all GET endpoints)
  const readPermissions = permissions
    .filter((p) => p.name.startsWith('GET '))
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
