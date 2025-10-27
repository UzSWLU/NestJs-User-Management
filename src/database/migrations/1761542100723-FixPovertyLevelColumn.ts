import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPovertyLevelColumn1761542100723 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change poverty_level column from INT to TEXT to store JSON
        await queryRunner.query(`
            ALTER TABLE \`hemis_students\` 
            MODIFY COLUMN \`poverty_level\` TEXT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to INT (data loss warning)
        await queryRunner.query(`
            ALTER TABLE \`hemis_students\` 
            MODIFY COLUMN \`poverty_level\` INT NULL
        `);
    }

}
