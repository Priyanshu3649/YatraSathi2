require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const seq1 = new Sequelize(process.env.DB_NAME_TVL, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, dialect: 'mysql' });
const seq2 = new Sequelize(process.env.DB_NAME_TVL, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST, dialect: 'mysql' });

const User = seq1.define('User', { name: DataTypes.STRING }, { tableName: 'users' });
const Post = seq2.define('Post', { title: DataTypes.STRING }, { tableName: 'posts' });

Post.belongsTo(User);
User.hasMany(Post);

(async () => {
  try {
    await seq1.sync({ force: true });
    await seq2.sync({ force: true });
    const user = await User.create({ name: 'Alice' });
    await Post.create({ title: 'Hello', UserId: user.id });
    const posts = await Post.findAll({ include: User });
    console.log(JSON.stringify(posts, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
