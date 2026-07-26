const { Sequelize, DataTypes } = require('sequelize');
const seq = new Sequelize('TVL_001', 'root', '', { dialect: 'mysql' });
const User = seq.define('User', { name: DataTypes.STRING }, { schema: 'TVL_001', tableName: 'users' });
const Post = seq.define('Post', { title: DataTypes.STRING }, { tableName: 'posts' });

Post.belongsTo(User);
User.hasMany(Post);

console.log(Post.findAll({ include: User }).toString());
