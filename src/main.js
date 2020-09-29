const {Task, initDatabase} = require("./db");
this.database = {Task};
const config = require('./config.json');

async function generateFakeTasks() {
    let tasks = await Task.findAll({
        where: {
            map: config.map
        }
    });
    let imposterTasks = [];
    let commonTasksRemaining = config.commonTasks;
    let longTasksRemaining = config.longTasks;
    let shortTasksRemaining = config.shortTasks;
    while(commonTasksRemaining > 0 || longTasksRemaining > 0 || shortTasksRemaining > 0) {
        let index = Math.floor(Math.random() * tasks.length);
        let task = tasks[index].dataValues;
        tasks.splice(index, 1);
        let types = task.types.split(', ');
        if(types.includes("Visual") && !config.visualTasksOn) {
            continue;
        }
        else {
            let imposterTask = new Object();
            for(var type in types) {
                if(types[type] === "Short" && shortTasksRemaining > 0) {
                    imposterTask.name = task.name;
                    imposterTask.type = task.types;
                    imposterTask.steps = task.steps;
                    imposterTasks.push(imposterTask);
                    shortTasksRemaining--;
                }
                else if(types[type] === "Long" && longTasksRemaining > 0) {
                    imposterTask.name = task.name;
                    imposterTask.type = task.types;
                    imposterTask.steps = task.steps;
                    imposterTasks.push(imposterTask);
                    longTasksRemaining--;
                }
                else if(types[type] === "Common" && commonTasksRemaining > 0) {
                    imposterTask.name = task.name;
                    imposterTask.type = task.types;
                    imposterTask.steps = task.steps;
                    imposterTasks.push(imposterTask);
                    commonTasksRemaining--;
                }
            }
        }
    }
    return imposterTasks;
}

async function main() {
    await initDatabase();
    let tasks = await generateFakeTasks();
    console.log(`Map: ${config.map}\nTotal Tasks: ${tasks.length}`);
    for(var i in tasks) {
        let task = tasks[i];
        console.log("----------");
        console.log(`${parseInt(i) + 1}: ${task.name} - ${task.type} - ${task.steps}`);
    }
}

main();