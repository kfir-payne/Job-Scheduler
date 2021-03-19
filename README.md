# Redis Job Scheduler

A job scheduler solution based on Redis.

The scheduler accepts a callback function to run on each of its tasks.

You can schedule tasks using the scheduler addTask function.

addTask function accepts a list of args to pass to the callback, and a delay time.

When the delay time arrives the scheduler will run the task.

## Developed on Node -v

```bash
$ v14.16.0
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
$ npm run start
```

## The Algorithm

The job scheduler main component is the 'delayed' Redis ZSET Queue.
Every task that gets submitted to the scheduler are checked if its needs to run right now,
in that case the scheduler inserts the task to the 'execute' Redis List Queue, runs the task,
and then poping that task from the 'execute' Queue. if the task needs to be delayed,
it will insert the delayed task to the 'delayed' Queue with a score represented by the delay time.

The scheduler always watching the first task at 'delayed' Queue and checks if that task arrived its delayed time.
if so, it will move the task to the 'execute' Queue and then run it, and finally remove it from the 'execute' Queue.

The tasks that needs to be executed right now are inserted to the 'execute' Queue before they execute,
to handle a situation when for some reason the task wasn't able to complete.