require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const seq = new Sequelize(process.env.DB_NAME_TVL, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, dialect: 'mysql' });

const User = seq.define('User', { name: DataTypes.STRING }, { schema: process.env.DB_NAME_TVL, tableName: 'users' });
const Post = seq.define('Post', { title: DataTypes.STRING }, { tableName: 'posts' });

Post.belongsTo(User);
User.hasMany(Post);

console.log(Post.findAll({ include: User }).toString());
