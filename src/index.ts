import EventEmitter from "./event-emitter";

export type TaskState = "not_started" | "completed" | "in_process" | "failed";

type TaskId = string;
type TaskGroupId = string;

const wait = (time: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

export class Task {
  id: TaskId;
  execute: () => Promise<void | TaskId | TaskGroupId>;
  checkCondition: () => Promise<boolean>;
  retries: number;
  waitTime: number;
  nextTasks?: TaskId[];
  state?: TaskState;
  time?: number;

  constructor(
    id: TaskId,
    execute: () => Promise<void | TaskId | TaskGroupId>,
    checkCondition: () => Promise<boolean>,
    nextTasks?: TaskId[],
    retries: number = 0,
    waitTime: number = 0
  ) {
    this.id = id;
    this.execute = execute;
    this.checkCondition = checkCondition;
    this.retries = retries;
    this.waitTime = waitTime;
    this.nextTasks = nextTasks;
    this.state = "not_started";
    this.time = 0;
  }

  private runTask = async (): Promise<string | void> => {
    try {
      this.state = "in_process";

      const startTime = Date.now();
      const result = await this.execute();
      const endTime = Date.now();

      this.time = endTime - startTime;
      this.state = "completed";
      return result;
    } catch (error) {
      this.state = "failed";
      throw error;
    }
  };

  public run = async (): Promise<string | void> => {
    let currentRetries = 0;
    try {
      const result = await this.runTask();
      return result;
    } catch (error) {
      if (currentRetries < this.retries) {
        currentRetries++;
        if (this.waitTime > 0) {
          await wait(this.waitTime);
        }
        return this.run();
      } else {
        throw error;
      }
    }
  };
}

type SerializedState = {
  [entityId: TaskId | TaskGroupId]: {
    type: "task" | "task-group";
    state: TaskState;
    time: number;
    children?: SerializedState;
  };
};

export class TaskGroup {
  id: TaskGroupId;
  children: Map<TaskId | TaskGroupId, Task | TaskGroup>;

  constructor(id: TaskGroupId) {
    this.id = id;
    this.children = new Map();
  }

  addChild(task: Task | TaskGroup) {
    this.children.set(task.id, task);
  }

  removeChild(taskId: TaskId | TaskGroupId) {
    this.children.delete(taskId);
  }
}

export class FlowControl extends EventEmitter {
  // Map to quickly access tasks by id
  private taskGroups: Map<TaskGroupId, TaskGroup>;

  constructor() {
    super();
    this.taskGroups = new Map();
  }

  addGroup(taskGroup: TaskGroup) {
    this.taskGroups.set(taskGroup.id, taskGroup);
  }

  removeGroup(taskGroupId: TaskGroupId) {
    this.taskGroups.delete(taskGroupId);
  }

  private runTaskGroup = async (taskGroup: TaskGroup) => {
    const tasks = Array.from(taskGroup.children.values());
    for (const task of tasks) {
      if (task instanceof Task) {
        await task.run();
      } else {
        await this.runTaskGroup(task);
      }
    }

    this.emit("success", `task-group-completed: ${taskGroup.id}`);
  };

  run = async () => {
    const taskGroups = Array.from(this.taskGroups.values());
    for (const taskGroup of taskGroups) {
      await this.runTaskGroup(taskGroup);
    }
  };

  getSerializedState = (): SerializedState => {
    const serializeTaskGroup = (taskGroup: TaskGroup): SerializedState => {
      let groupState: SerializedState = {};
      taskGroup.children.forEach((child, id) => {
        if (child instanceof Task) {
          groupState[id] = {
            type: "task",
            state: child.state || "not_started",
            time: child.time || 0,
          };
        } else {
          groupState[id] = {
            type: "task-group",
            state: "not_started", // Assuming task groups don't have a state
            time: 0, // Assuming task groups don't have a time
            children: serializeTaskGroup(child),
          };
        }
      });
      return groupState;
    };

    let state: SerializedState = {};
    this.taskGroups.forEach((taskGroup, id) => {
      state[id] = {
        type: "task-group",
        state: "not_started", // Assuming task groups don't have a state
        time: 0, // Assuming task groups don't have a time
        children: serializeTaskGroup(taskGroup),
      };
    });
    return state;
  };
}
