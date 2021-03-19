import { JobScheduler } from "./job-scheduler";
import { taskParams } from "./types/task.type";

const sleep = (ms: number): Promise<any> => new Promise( res => setTimeout(res, ms));

const callback = async (args: [string]) => {
  const taskId = args[0];
  let sleepTime = 0;
  console.log(`running task ${taskId}`);
  switch (taskId) {
    case '1': {
      sleepTime = 4000;
      break;
    }
    case '2': {
      sleepTime = 1000;
      break;
    }
    default: {
      sleepTime = 0;
    }
  }
  await sleep(sleepTime)
  console.log(`finished task ${taskId}`);
}

const scheduler = new JobScheduler(callback);

const task1: taskParams = {args: ['1'], delay: 3000};
const task2: taskParams = {args: ['2'], delay: 5000};
const task3: taskParams = {args: ['3'], delay: 0};
const task4: taskParams = {args: ['4'], delay: 6000};

scheduler.addTask(task1);
scheduler.addTask(task2);
scheduler.addTask(task3);
scheduler.addTask(task4);
