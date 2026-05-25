const sequelize = require('./database');
const Location = require('./models/Location');
const Laptop = require('./models/Laptop');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Create Storage Closet
    const storage = await Location.create({ name: 'Storage Closet', type: 'storage' });

    // Create 200 Workstations
    const workstations = [];
    for (let i = 1; i <= 200; i++) {
      workstations.push({ name: `Workstation ${i}`, type: 'workstation' });
    }
    await Location.bulkCreate(workstations);
    console.log('Created 200 workstations');

    // Create some initial laptops
    const laptops = [
      { modelNumber: 'Dell Latitude 5420', serialNumber: 'SN001', LocationId: storage.id },
      { modelNumber: 'Dell Latitude 5420', serialNumber: 'SN002', LocationId: storage.id },
      { modelNumber: 'HP EliteBook 840', serialNumber: 'SN003', LocationId: storage.id },
    ];
    await Laptop.bulkCreate(laptops);
    console.log('Created initial laptops');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
