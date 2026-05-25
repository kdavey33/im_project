const express = require('express');
const cors = require('cors');
const sequelize = require('./database');
const Location = require('./models/Location');
const Laptop = require('./models/Laptop');

const path = require('path');
const laptopRoutes = require('./routes/laptops');
const locationRoutes = require('./routes/locations');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes
app.use('/api/laptops', laptopRoutes);
app.use('/api/locations', locationRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not Found' });
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Sync database and start server
async function startServer() {
  console.log('Starting server...');
  try {
    console.log('Syncing database...');
    await sequelize.sync();
    console.log('Database synced');
    
    // Seed initial data if needed
    console.log('Checking if seeding is required...');
    const locationCount = await Location.count();
    console.log(`Current location count: ${locationCount}`);
    if (locationCount === 0) {
      console.log('Starting seed: Creating Storage Closet and 200 workstations...');
      
      // Create Storage Closet
      await Location.create({ name: 'Storage Closet', type: 'storage' });

      // Create 200 Workstations
      const workstations = [];
      for (let i = 1; i <= 200; i++) {
        workstations.push({ name: `Workstation ${i}`, type: 'workstation' });
      }
      await Location.bulkCreate(workstations);
      
      console.log('Seed completed.');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('System is ready.');
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();
