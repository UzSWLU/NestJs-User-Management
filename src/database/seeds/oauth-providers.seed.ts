import { DataSource } from 'typeorm';
import { OAuthProvider } from '../entities/oauth/oauth-provider.entity';

export async function seedOAuthProviders(dataSource: DataSource) {
  const providerRepo = dataSource.getRepository(OAuthProvider);

  // Check if providers already exist
  const existingProviders = await providerRepo.count();
  if (existingProviders > 0) {
    console.log('✅ OAuth providers already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding OAuth providers...');

  const providers = providerRepo.create([
    {
      name: 'hemis',
      client_id: '4',
      client_secret: 'nfqKaEMNzb5FbALETL9GqRa_n6g9KDMoEsFSDDF1',
      redirect_uri: 'https://uzswlu.uz/site/login',
      url_authorize: 'https://hemis.uzswlu.uz/oauth/authorize',
      url_access_token: 'https://hemis.uzswlu.uz/oauth/access-token',
      url_resource_owner_details:
        'https://hemis.uzswlu.uz/oauth/api/user?fields=id,uuid,employee-list?type=all,type,name,login,image_full,email,university_id,phone,employee_list,departments',
      // front_redirect: Configure via API (e.g., 'http://localhost:3001/auth/success')
      is_active: true,
    },
    {
      name: 'google',
      url_authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
      url_access_token: 'https://oauth2.googleapis.com/token',
      url_resource_owner_details: 'https://www.googleapis.com/oauth2/v2/userinfo',
      is_active: false,
    },
    {
      name: 'oneid',
      url_authorize: 'https://sso.egov.uz/oauth2/authorization',
      url_access_token: 'https://sso.egov.uz/oauth2/access-token',
      url_resource_owner_details: 'https://sso.egov.uz/oauth2/user-info',
      is_active: false,
    },
    {
      name: 'github',
      url_authorize: 'https://github.com/login/oauth/authorize',
      url_access_token: 'https://github.com/login/oauth/access_token',
      url_resource_owner_details: 'https://api.github.com/user',
      is_active: false,
    },
  ]);

  await providerRepo.save(providers);

  console.log('✅ OAuth providers seeded successfully!');
  console.log('   - hemis: Active (UZSWLU HEMIS)');
  console.log('   - google: Inactive (ready for configuration)');
  console.log('   - oneid: Inactive (ready for configuration)');
  console.log('   - github: Inactive (ready for configuration)');
}

