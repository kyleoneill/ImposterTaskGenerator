const {Task, initDatabase} = require("./src/db");
this.database = {Task};
const config = require('./src/config.json');
const electron = require('electron');
const { app } = require("electron");

//TODO - add extra tasks equivilant to the number of common tasks provided (ex, one common task in list - provide one extra task)
//       to compensate in case that common task is not used by the group
// Should common tasks be in this list at all?

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

function createWindow(tasks) {
    const win = new electron.BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true
        }
    });
    //win.setMenu(null);
    electron.ipcMain.on('request-update', (event, arg) => {
        generateFakeTasks().then((tasks) => {
            win.webContents.send('action-update', tasks);
        });
    });
    win.loadFile('index.html', {query: {"data": JSON.stringify(tasks)}});
}

async function main() {
    await initDatabase();
    let tasks = await generateFakeTasks();
    // console.log(`Map: ${config.map}\nTotal Tasks: ${tasks.length}`);
    // for(var i in tasks) {
    //     let task = tasks[i];
    //     console.log("----------");
    //     console.log(`${parseInt(i) + 1}: ${task.name} - ${task.type} - ${task.steps}`);
    // }
    app.whenReady().then(() => createWindow(tasks));
}

main();