const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Location = require('./Location');

const Laptop = sequelize.define('Laptop', {
  modelNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

Laptop.belongsTo(Location);
Location.hasMany(Laptop);

module.exports = Laptop;
