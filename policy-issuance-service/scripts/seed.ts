import { DataSource } from 'typeorm';
import { seedDatabase } from '../src/database/seed';
import { DatabaseConfig } from '../src/config/database.config';
import { ConfigService } from '@nestjs/config';

async function runSeed() {
  const configService = new ConfigService();
  const databaseConfig = new DatabaseConfig(configService);
  
  const dataSource = new DataSource(databaseConfig.createTypeOrmOptions());
  
  try {
    await dataSource.initialize();
    console.log('🔌 Database connection established');
    
    await seedDatabase(dataSource);
    
    await dataSource.destroy();
    console.log('✅ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seed:', error);
    process.exit(1);
  }
}

runSeed();
