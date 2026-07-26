const { Sequelize, DataTypes } = require('sequelize');
const seq1 = new Sequelize('sqlite::memory:');
const seq2 = new Sequelize('sqlite::memory:');

const User = seq1.define('User', { name: DataTypes.STRING });
const Post = seq2.define('Post', { title: DataTypes.STRING });

try {
  Post.belongsTo(User);
  console.log("Success!");
} catch (err) {
  console.log("Error:", err.message);
}
