const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
});

class Tasks extends Model {}
Tasks.init({
    name: DataTypes.STRING,
    map: DataTypes.STRING,
    types: DataTypes.STRING,
    location: DataTypes.STRING,
    image: DataTypes.STRING
}, {sequelize, modelName: 'Tasks'});

module.exports = {
    Tasks
}