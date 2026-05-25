const express = require('express');
const router = express.Router();
const Laptop = require('../models/Laptop');
const Location = require('../models/Location');

// Get all laptops
router.get('/', async (req, res) => {
  try {
    const laptops = await Laptop.findAll({ include: Location });
    res.json(laptops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new laptop
router.post('/', async (req, res) => {
  try {
    const { modelNumber, serialNumber, LocationId, resolveConflict } = req.body;
    const locId = LocationId ? parseInt(LocationId) : null;
    
    // Check if location is a workstation and if it's already occupied
    if (locId) {
      const location = await Location.findByPk(locId);
      if (location && location.type === 'workstation') {
        const existingLaptop = await Laptop.findOne({ where: { LocationId: locId } });
        if (existingLaptop) {
          if (resolveConflict) {
            const storage = await Location.findOne({ where: { type: 'storage', name: 'Storage Closet' } });
            if (!storage) return res.status(500).json({ error: 'Storage Closet not found.' });
            await existingLaptop.update({ LocationId: storage.id });
          } else {
            return res.status(409).json({ 
              error: `Workstation '${location.name}' is already occupied.`,
              conflict: true,
              existingLaptop: {
                serialNumber: existingLaptop.serialNumber,
                modelNumber: existingLaptop.modelNumber
              }
            });
          }
        }
      }
    }

    const laptop = await Laptop.create({ modelNumber, serialNumber, LocationId: locId });
    res.status(201).json(laptop);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a laptop (e.g., change location)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { modelNumber, serialNumber, LocationId, resolveConflict } = req.body;
    const locId = LocationId ? parseInt(LocationId) : null;
    
    const laptop = await Laptop.findByPk(id);
    if (!laptop) return res.status(404).json({ error: 'Laptop not found' });

    // Check if new location is a workstation and if it's already occupied
    if (locId && locId != laptop.LocationId) {
      const location = await Location.findByPk(locId);
      if (location && location.type === 'workstation') {
        const existingLaptop = await Laptop.findOne({ where: { LocationId: locId } });
        
        if (existingLaptop) {
          if (resolveConflict) {
            // Find storage closet
            const storage = await Location.findOne({ where: { type: 'storage', name: 'Storage Closet' } });
            if (!storage) {
              return res.status(500).json({ error: 'Storage Closet not found for conflict resolution.' });
            }
            // Move existing laptop to storage
            await existingLaptop.update({ LocationId: storage.id });
          } else {
            return res.status(409).json({ 
              error: `Workstation '${location.name}' is already occupied.`,
              conflict: true,
              existingLaptop: {
                id: existingLaptop.id,
                serialNumber: existingLaptop.serialNumber,
                modelNumber: existingLaptop.modelNumber
              }
            });
          }
        }
      }
    }
    
    await laptop.update({ modelNumber, serialNumber, LocationId: locId });
    res.json(laptop);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk add laptops
router.post('/bulk', async (req, res) => {
  try {
    const laptopsData = req.body;
    console.log('Bulk Import started. Items:', laptopsData.length);
    const workstationMap = new Set();
    
    // Fetch all locations to map names/IDs
    const allLocations = await Location.findAll();
    const locationMap = {};
    allLocations.forEach(loc => {
      locationMap[loc.name.toLowerCase().trim()] = loc.id;
      locationMap[loc.id.toString()] = loc.id;
    });

    console.log('Location Map Keys (first 5):', Object.keys(locationMap).slice(0, 5));

    const finalLaptops = [];

    for (const item of laptopsData) {
      // Find the correct Location ID (support both name and ID in CSV)
      let locId = null;
      const rawLoc = (item.LocationId || item.location || '').toString().trim().toLowerCase();
      
      console.log(`Processing item: ${item.serialNumber}, Raw Location input: "${rawLoc}"`);

      if (rawLoc && locationMap[rawLoc]) {
        locId = locationMap[rawLoc];
        console.log(`  Matched to Location ID: ${locId}`);
      } else {
        console.log(`  FAILED to match location: "${rawLoc}"`);
      }

      if (locId) {
        const location = allLocations.find(l => l.id === locId);
        if (location && location.type === 'workstation') {
          // Check if already occupied in DB
          const existingLaptop = await Laptop.findOne({ where: { LocationId: locId } });
          if (existingLaptop) {
            console.log(`  Conflict: Workstation ${location.name} occupied.`);
            return res.status(400).json({ error: `Bulk import failed: Workstation '${location.name}' is already occupied.` });
          }
          if (workstationMap.has(locId)) {
            console.log(`  Conflict: Multiple entries for ${location.name} in CSV.`);
            return res.status(400).json({ error: `Bulk import failed: Multiple laptops assigned to '${location.name}' in the CSV.` });
          }
          workstationMap.add(locId);
        }
      }

      finalLaptops.push({
        modelNumber: item.modelNumber,
        serialNumber: item.serialNumber,
        LocationId: locId
      });
    }

    const laptops = await Laptop.bulkCreate(finalLaptops);
    console.log('Bulk Import successful.');
    res.status(201).json(laptops);
  } catch (error) {
    console.error('Bulk Import Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Retire (delete) a laptop
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const laptop = await Laptop.findByPk(id);
    if (!laptop) {
      return res.status(404).json({ error: 'Laptop not found' });
    }
    await laptop.destroy();
    res.json({ message: 'Laptop retired successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
