import Redis from "redis-mock";
import { promisify } from "util";
import { v4 as uuidv4 } from 'uuid';
import { taskParams } from "./types/task.type";

export class JobScheduler {

    private redisClient = Redis.createClient();
    private callback: (args: [string]) => void;

    private zadd: (key: string, score: number, item: string) => Promise<any>
    = promisify(this.redisClient.zadd).bind(this.redisClient);

    private zrange: (key: string, start: number, stop: number, withscores?: string) => Promise<any>
        = promisify(this.redisClient.zrange).bind(this.redisClient);

    private zrem: (key: string, item: string) => Promise<any>
        = promisify(this.redisClient.zrem).bind(this.redisClient);

    private rpush: (key: string, item: string) => Promise<any>
        = promisify(this.redisClient.rpush).bind(this.redisClient);

    private lrem: (key: string, item: string) => Promise<any>
        = promisify(this.redisClient.lrem).bind(this.redisClient);

    private llen: (key: string, item?: string) => Promise<any>
        = promisify(this.redisClient.llen).bind(this.redisClient);

    private lpop: (key: string) => Promise<any>
        = promisify(this.redisClient.lpop).bind(this.redisClient);

    constructor(callback: (args: [string]) => void) {
        this.callback = callback;
        this.watchDelayed();
        this.runExecuted();
    }

    public async addTask(task: taskParams): Promise<string> {
        const identifier = uuidv4();
        const newTask = JSON.stringify([identifier, task.args ]);

        if (task.delay > 0) {
            try {
                this.zadd('delayed:', new Date().getTime() + task.delay, newTask);
                console.log(`task ${task.args[0]} added to the delayed Q, it will start in ${task.delay} ms`);
            } catch (err) {
                console.log('failed to add to the delayed Q, retry?');
            }
        } else {
            try{
                this.runCallback(task.args, newTask)
            } catch (err) {
                console.log('failed to add to the execute Q, retry?');
            }
        }
        return identifier;
    }

    public async watchDelayed() {
        setInterval(async () => {
            const delayedTask = await this.zrange('delayed:', 0, 0, 'WITHSCORES');
            if (delayedTask && Number(delayedTask[1]) < new Date().getTime()){
                const executedTask = delayedTask[0];
                if (await this.zrem('delayed:', executedTask)) {
                    const executedTaskJson = JSON.parse(executedTask);
                    await this.rpush('execute:', executedTask);
                    this.runCallback(executedTaskJson[1], executedTask);
                }
            }
        }, 1)
    }

    public async runExecuted() {
        while (await this.llen('execute:')) {
            const task = await this.lpop('execute:');
            const executedTaskJson = JSON.parse(task);
            this.addTask({args: executedTaskJson[1], delay: 0});
        }
    }

    public async runCallback(args: [string], executedTask: string) {
        await this.rpush('execute:', executedTask);
        try{
            await this.callback(args);
        } catch(err) {
            console.log('Zero number of retries, move to Failed Q.');
        }
        await this.lrem('execute:', executedTask);
    }
}