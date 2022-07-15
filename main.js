const {Tasks} = require("./src/db");
const config = require('./src/config.json');
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const potential_task_types = ["Short","Common","Long"];

async function generateFakeTasks(data) {
    if(data.longTasks === '' || data.shortTasks === '' || data.commonTasks === '') {
        data = config;
    }
    let tasks = await Tasks.findAll();
    let imposterTasks = [];
    let commonTasksRemaining = data.commonTasks;
    let longTasksRemaining = data.longTasks;
    let shortTasksRemaining = data.shortTasks;
    while(commonTasksRemaining > 0 || longTasksRemaining > 0 || shortTasksRemaining > 0) {
        if(tasks.length === 0) {
            break;
        }
        let index = Math.floor(Math.random() * tasks.length);
        let task = tasks[index].dataValues;
        tasks.splice(index, 1);
        let maps = task.map.split(';');
        if(maps.includes(data.map)) {
            let types = task.types.split(';');
            let task_type = null;
            if(types.length > 1) {
                // There are multiple types depending on the map
                // Get the index of the current map and walk backwards until we get a type and then use it
                let i = types.indexOf(data.map);
                if(i === -1) {
                    continue;
                }
                for(let j = i; j > 0; j--) {
                    if(potential_task_types.includes(types[j])) {
                        task_type = types[j];
                        break;
                    }
                }
            }
            else {
                task_type = types[0];
            }

            let imposterTask = {};
            imposterTask.name = task.name;
            imposterTask.type = task_type;
            imposterTask.location = task.location;
            imposterTask.image = task.image;
            imposterTask.map = task.map;

            if (task_type === "Short" && shortTasksRemaining > 0) {
                imposterTasks.push(imposterTask);
                shortTasksRemaining--;
            } else if (task_type === "Long" && longTasksRemaining > 0) {
                imposterTasks.push(imposterTask);
                longTasksRemaining--;
            } else if (task_type === "Common" && commonTasksRemaining > 0) {
                imposterTasks.push(imposterTask);
                commonTasksRemaining--;
            }
        }
    }
    return imposterTasks;
}

function createWindow(tasks) {
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });
    //win.setMenu(null);
    win.loadFile('index.html')
}

function main() {
    generateFakeTasks(config).then(tasks => {
        app.whenReady().then(() => {
            ipcMain.handle('requestUpdate', async (event, arg) => {
                return await generateFakeTasks(arg);
            });
            createWindow(tasks);
        });
    });
}

main();
