const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('TVL_001', 'root', '', { host: '127.0.0.1', dialect: 'mysql' });
const User = sequelize.define('User', { name: DataTypes.STRING }, { schema: 'TVL_001', tableName: 'users' });
console.log(User.tableName);
console.log(User.getQueryInterface().queryGenerator.quoteTable(User.name));
