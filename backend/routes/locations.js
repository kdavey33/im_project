const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new location
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    const location = await Location.create({ name, type });
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
