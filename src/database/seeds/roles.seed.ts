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
  await groupRepo.save([userGroup, roleGroup]);

  // Create Permissions
  const permissions = await permissionRepo.save([
    // User permissions
    { name: 'users.read', description: 'View users', group: userGroup },
    { name: 'users.create', description: 'Create users', group: userGroup },
    { name: 'users.update', description: 'Update users', group: userGroup },
    { name: 'users.delete', description: 'Delete users', group: userGroup },

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

  await roleRepo.save([creatorRole, adminRole, managerRole, userRole]);

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
  console.log('   - creator: Full access (all permissions)');
  console.log('   - admin: Full access (all permissions)');
  console.log('   - manager: Read-only access');
  console.log('   - user: No default permissions');
}

