const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('TVL_001', 'root', '', { host: '127.0.0.1', dialect: 'mysql' });
const User = sequelize.define('User', { name: DataTypes.STRING }, { tableName: 'users' });
const Customer = sequelize.define('Customer', { name: DataTypes.STRING }, { schema: 'TVL_001', tableName: 'customers' });
console.log("Customer table name with schema:", Customer.getTableName());
