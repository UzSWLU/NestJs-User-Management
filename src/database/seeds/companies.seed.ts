import { DataSource } from 'typeorm';
import { Company } from '../entities/core/company.entity';

export async function seedCompanies(dataSource: DataSource) {
  const companyRepo = dataSource.getRepository(Company);

  // Check if default company already exists
  const existingCompany = await companyRepo.findOne({ where: { id: 1 } });
  if (existingCompany) {
    console.log('✅ Default company already exists');
    return;
  }

  // Create default company
  const defaultCompany = companyRepo.create({
    name: 'Default Company',
    domain: 'default.com',
    status: 'active',
  });

  await companyRepo.save(defaultCompany);
  
  console.log(`✅ Default company created with ID: ${defaultCompany.id}`);
  console.log('✅ Default company created successfully');
}

