import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddDefaultRoleToOAuthProviders1729083000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add default_role_id column to oauth_providers table
    await queryRunner.addColumn(
      'oauth_providers',
      new TableColumn({
        name: 'default_role_id',
        type: 'int',
        isNullable: true,
        comment: 'Default role assigned to users who login via this OAuth provider',
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'oauth_providers',
      new TableForeignKey({
        name: 'FK_oauth_providers_default_role',
        columnNames: ['default_role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('oauth_providers', 'FK_oauth_providers_default_role');

    // Drop column
    await queryRunner.dropColumn('oauth_providers', 'default_role_id');
  }
}

