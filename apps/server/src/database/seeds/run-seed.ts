import { DataSource } from 'typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { STOCK_SEEDS } from './stocks.seed';

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'mocktrade',
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    entities: [StockEntity],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const stockRepo = dataSource.getRepository(StockEntity);

  for (const seed of STOCK_SEEDS) {
    const exists = await stockRepo.findOne({ where: { symbol: seed.symbol } });
    if (!exists) {
      const stock = stockRepo.create({
        symbol: seed.symbol,
        name: seed.name,
        persona: seed.persona,
        sector: seed.sector,
        basePrice: seed.basePrice,
        currentPrice: seed.basePrice,
        openPrice: seed.basePrice,
        prevClosePrice: seed.basePrice,
        dailyHigh: seed.basePrice,
        dailyLow: seed.basePrice,
        volume: 0,
        isActive: true,
      });
      await stockRepo.save(stock);
      console.log(`Seeded stock: ${seed.symbol} - ${seed.name}`);
    } else {
      console.log(`Stock already exists: ${seed.symbol}`);
    }
  }

  await dataSource.destroy();
  console.log('Seed complete');
}

runSeed().catch(console.error);
