const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
});

const axios = require('axios');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;
const maps = ["Mira HQ", "The Skeld", "Polus"];
const taskTypes = ["Short", "Long", "Common", "Visual"];

async function initDatabase() {
    await sequelize.sync();
    let data = await Task.findAndCountAll();
    if(data.count !== 0) {
        return 0
    }
    console.log("Database is empty, building");
    let res = await axios.get("https://among-us.fandom.com/wiki/Tasks");
    const dom = new JSDOM(res.data);
    let rows = dom.window.document.querySelectorAll("table > tbody > tr");
    let prevTaskName;
    let prevTaskType;
    let prevSteps;
    for(let i = 1; i < rows.length; i++) {
        let children = rows[i].children;
        if(children.length === 4) {
            prevTaskName = children[0].textContent.trim();
            prevTaskType = children[2].textContent.trim();
            prevSteps = children[3].textContent.trim();
            await Task.create({
                name: prevTaskName,
                map: children[1].textContent.trim(),
                types: prevTaskType,
                steps: prevSteps
            });
        }
        else {
            let currentElm = 0;
            let name;
            let map;
            let types;
            let steps;
            if(!maps.includes(children[currentElm].textContent.trim())) {
                name = children[currentElm].textContent.trim();
                currentElm++;
            }
            else {
                name = prevTaskName;
            }
            map = children[currentElm].textContent.trim();
            currentElm++;
            if(children.length === 1) {
                types = prevTaskType;
                steps = prevSteps
            }
            else {
                if(taskTypes.includes(children[currentElm].textContent.trim().split(", ")[0])) {
                    types = children[currentElm].textContent.trim();
                    currentElm++;
                }
                else {
                    types = prevTaskType;
                }
                if(children[currentElm] === undefined) {
                    steps = prevSteps;
                }
                else {
                    steps = children[currentElm].textContent.trim();
                }
            }
            await Task.create({
                name: name,
                map: map,
                types: types,
                steps: steps
            });
        }
    }
    console.log("Finished building database");
    return 0
}

class Task extends Model {}
Task.init({
    name: DataTypes.STRING,
    map: DataTypes.STRING,
    types: DataTypes.STRING,
    steps: DataTypes.STRING
}, {sequelize, modelName: 'tasks'});

module.exports = {
    Task,
    initDatabase
}