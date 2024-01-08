import EventEmitter from "./event-emitter";
import { wait } from "./util";

export type TaskState =
  | "not_started"
  | "completed"
  | "in_progress"
  | "failed"
  | "skipped";

type TaskId = string;
type TaskGroupId = string;

/**
 * Represents a task with execution logic, retry capability, and state management.
 *
 * A `Task` object encapsulates the logic for executing a task, a condition to check
 * before execution, and mechanisms for retrying the task with specified intervals.
 * It also maintains the task's current state and supports specifying subsequent tasks.
 *
 * @param {Object} options - Configuration options for the task.
 * @param {TaskId} options.id - A unique identifier for the task.
 * @param {Function} options.execute - A function that encapsulates the task's execution logic.
 *                                     Should return a Promise that resolves to `void`, `TaskId`, or `TaskGroupId`.
 * @param {Function} options.checkCondition - A function that returns a Promise resolving to a boolean,
 *                                            indicating whether the task is ready to be executed.
 * @param {TaskId[]} [options.nextTasks] - An optional array of task identifiers for tasks to be executed after this task.
 * @param {number} [options.retries=0] - The number of times to retry the task if it fails. Defaults to 0.
 * @param {number} [options.waitTime=1000] - The time in milliseconds to wait before retrying the task. Defaults to 1000ms.
 *
 * @property {TaskId} id - The unique identifier of the task.
 * @property {Function} execute - The execution logic of the task.
 * @property {Function} checkCondition - The function to check the precondition for the task execution.
 * @property {number} retries - The number of retries for the task.
 * @property {number} waitTime - The waiting time before a retry.
 * @property {TaskId[]} [nextTasks] - The identifiers of subsequent tasks.
 * @property {TaskState} [state] - The current state of the task, e.g., 'not_started', 'completed'.
 * @property {number} [time] - The time taken by the task, updated after execution.
 *
 * @example
 * // Creating a new Task
 * const myTask = new Task({
 *   id: 'task1',
 *   execute: async () => {
 *     // Task execution logic
 *   },
 *   checkCondition: async () => {
 *     // Condition to check before execution
 *     return true;
 *   },
 *   retries: 3,
 *   waitTime: 2000
 * });
 */
export class Task {
  id: TaskId;
  execute: () => Promise<void | TaskId | TaskGroupId>;
  checkCondition: () => Promise<boolean>;
  retries: number;
  waitTime: number;
  nextTasks?: TaskId[];
  state?: TaskState;
  time?: number;

  constructor(options: {
    id: TaskId;
    execute: () => Promise<void | TaskId | TaskGroupId>;
    checkCondition: () => Promise<boolean>;
    nextTasks?: TaskId[];
    retries?: number;
    waitTime?: number;
  }) {
    this.id = options.id;
    this.execute = options.execute;
    this.checkCondition = options.checkCondition;
    this.retries = options.retries || 0;
    this.waitTime = options.waitTime || 1000;
    this.nextTasks = options.nextTasks;
    this.state = "not_started";
    this.time = 0;
  }

  /**
   * Executes the task and manages its state and execution time.
   *
   * This method sets the task's state to 'in_process', executes the task's logic, and checks
   * a post-execution condition. If the condition is not met, it throws an error. Otherwise,
   * it calculates the execution time, updates the task's state to 'completed', and returns the result.
   * In case of an error during execution or condition check, it sets the task's state to 'failed'
   * and rethrows the error. This method is public primarily to facilitate testing.
   *
   * @returns {Promise<string | void>} A promise that resolves with the result of the task execution.
   *                                   The result can be a string, or void if there is no return value.
   * @throws {Error} Throws an error if the task execution fails or the post-execution condition is not met.
   *
   * @example
   * // Running a task
   * myTask.runTask().then(result => {
   *   console.log('Task completed with result:', result);
   * }).catch(error => {
   *   console.error('Task failed:', error);
   * });
   */
  public runTask = async (): Promise<string | void> => {
    try {
      this.state = "in_progress";

      const startTime = Date.now();
      const result = await this.execute();

      if (this.checkCondition && !(await this.checkCondition())) {
        throw new Error("Condition not met");
      }

      const endTime = Date.now();

      this.time = endTime - startTime;
      this.state = "completed";
      return result;
    } catch (error) {
      this.state = "failed";
      throw error;
    }
  };

  /**
   * Executes the task with retry logic.
   *
   * This method attempts to run the task using `runTask`. If `runTask` throws an error,
   * the method retries the execution based on the `retries` property of the task.
   * Between each retry, it waits for a duration specified by the `waitTime` property.
   * If the task continues to fail after all retries are exhausted, the error is thrown.
   * The method ensures at least one execution of the task regardless of the retry count.
   *
   * @returns {Promise<string | void>} A promise that resolves with the result of the task execution,
   *                                   or void if there is no return value. If the task fails even after
   *                                   all retries, the promise is rejected with the encountered error.
   * @throws {Error} Throws the error encountered during task execution if all retries fail.
   *
   * @example
   * // Running a task with retry logic
   * myTask.run().then(result => {
   *   console.log('Task completed successfully:', result);
   * }).catch(error => {
   *   console.error('Task failed after retries:', error);
   * });
   */
  public run = async (): Promise<string | void> => {
    let currentRetries = 0;
    let hasRun = false;
    while (currentRetries < this.retries || !hasRun) {
      try {
        const result = await this.runTask();
        return result;
      } catch (error) {
        if (this.waitTime > 0) {
          await wait(this.waitTime);
        }

        if (currentRetries >= this.retries) {
          throw error;
        }
      }

      hasRun = true;
      currentRetries++;
    }
  };
}

type SerializedData = {
  type: "task" | "task-group";
  state: TaskState;
  time: number;
  children?: SerializedState;
};

type SerializedState = {
  [entityId: string]: SerializedData;
};

/**
 * Represents a group of tasks and/or task groups.
 *
 * This class provides a structure for organizing tasks and task groups under a single
 * identifier. It facilitates managing related tasks collectively, allowing for
 * the addition and removal of tasks or task groups from the collection.
 *
 * @property {TaskGroupId} id - The unique identifier of the task group.
 * @property {Map<TaskId | TaskGroupId, Task | TaskGroup>} children - A map of child tasks and task groups.
 */
export class TaskGroup {
  id: TaskGroupId;
  children: Map<TaskId | TaskGroupId, Task | TaskGroup>;

  /**
   * Constructs a new instance of TaskGroup.
   *
   * @param {TaskGroupId} id - The unique identifier for the task group.
   */
  constructor(id: TaskGroupId) {
    this.id = id;
    this.children = new Map();
  }

  /**
   * Adds a task or task group to the collection.
   *
   * @param {Task | TaskGroup} task - The task or task group to be added to this group.
   */
  addChild(task: Task | TaskGroup) {
    this.children.set(task.id, task);
  }

  /**
   * Removes a task or task group from the collection by its identifier.
   *
   * @param {TaskId | TaskGroupId} taskId - The identifier of the task or task group to be removed.
   */
  removeChild(taskId: TaskId | TaskGroupId) {
    this.children.delete(taskId);
  }
}

/**
 * Manages and orchestrates the execution of task groups.
 *
 * This class extends EventEmitter to handle task execution flow control. It maintains a collection
 * of task groups, allowing for addition, removal, execution, and retrieval of these groups.
 * It also provides a method to serialize the state of the task groups.
 *
 * @extends EventEmitter
 * @property {Map<TaskGroupId, TaskGroup>} taskGroups - A private map to manage task groups by their IDs.
 */
export class FlowControl extends EventEmitter {
  // Map to quickly access tasks by id
  private taskGroups: Map<TaskGroupId, TaskGroup>;
  private nextTaskId?: TaskId;

  constructor() {
    super();
    this.taskGroups = new Map();
  }

  /**
   * Adds a task group to the collection.
   *
   * @param {TaskGroup} taskGroup - The task group to be added.
   */

  addGroup(taskGroup: TaskGroup) {
    this.taskGroups.set(taskGroup.id, taskGroup);
  }

  /**
   * Removes a task group from the collection using its ID.
   *
   * @param {TaskGroupId} taskGroupId - The ID of the task group to be removed.
   */
  removeGroup(taskGroupId: TaskGroupId) {
    this.taskGroups.delete(taskGroupId);
  }

  /**
   * Retrieves all task groups.
   *
   * @returns {Map<TaskGroupId, TaskGroup>} The current map of task groups.
   */

  getTaskGroups() {
    return this.taskGroups;
  }

  /**
   * Retrieves a specific task group by its ID.
   *
   * @param {TaskGroupId} taskGroupId - The ID of the task group to be retrieved.
   * @returns {TaskGroup | undefined} The requested task group, or undefined if not found.
   */

  getTaskGroup(taskGroupId: TaskGroupId) {
    return this.taskGroups.get(taskGroupId);
  }

  private executeTask = async (task: Task) => {
    if (this.nextTaskId && task.id !== this.nextTaskId) {
      task.state = "skipped";
      return;
    }

    this.emit("taskStarted", task);
    const nextTaskId = await task.run();
    if (nextTaskId) {
      this.nextTaskId = nextTaskId;
    } else if (this.nextTaskId) {
      delete this.nextTaskId;
    }
    this.emit("taskComplete", task);
  };

  /**
   * Executes a task group and its child tasks recursively.
   * Emits a 'success' event upon completion of a task group.
   *
   * @param {TaskGroup} taskGroup - The task group to be executed.
   * @private
   */

  private runTaskGroup = async (taskGroup: TaskGroup) => {
    const tasks = Array.from(taskGroup.children.values());
    for (const task of tasks) {
      if (task instanceof Task) {
        await this.executeTask(task);
      } else {
        await this.runTaskGroup(task);
      }
    }

    this.emit("success", `task-group-completed: ${taskGroup.id}`);
  };

  /**
   * Executes all task groups managed by the FlowControl instance.
   */
  run = async () => {
    const taskGroups = Array.from(this.taskGroups.values());
    for (const taskGroup of taskGroups) {
      await this.runTaskGroup(taskGroup);
    }
  };

  /**
   * Executes a specific task group and its child tasks recursively.
   * @param taskId
   */
  runTask = async (taskId: TaskId) => {
    const taskGroups = Array.from(this.taskGroups.values());
    for (const taskGroup of taskGroups) {
      const targetTask = taskGroup.children.get(taskId);
      if (targetTask instanceof Task) {
        await this.executeTask(targetTask);
      }
    }
  };

  /**
   * Serializes the state of all task groups into a structured format.
   *
   * @returns {SerializedState} The serialized state of all task groups.
   */
  getSerializedState = (): SerializedState => {
    const serializeTaskGroup = (taskGroup: TaskGroup): SerializedData => {
      let groupState: SerializedState = {};
      let totalTime = 0;
      let hasInProgress = false;
      let allCompleted = true;

      taskGroup.children.forEach((child, id) => {
        let childTime = (child as Task).time || 0;
        totalTime += childTime;

        if (child instanceof Task) {
          groupState[id] = {
            type: "task",
            state: child.state || "not_started",
            time: childTime,
          };

          if (child.state === "in_progress") {
            hasInProgress = true;
          }
          if (child.state !== "completed") {
            allCompleted = false;
          }
        } else {
          const childGroupData = serializeTaskGroup(child);
          groupState[id] = {
            ...childGroupData,
            type: "task-group",
          };

          if (childGroupData.state === "in_progress") {
            hasInProgress = true;
          }
          if (childGroupData.state !== "completed") {
            allCompleted = false;
          }
        }
      });

      let groupStatus = "not_started";
      if (hasInProgress) {
        groupStatus = "in_progress";
      } else if (allCompleted) {
        groupStatus = "completed";
      }

      return {
        type: "task-group",
        state: groupStatus as any,
        time: totalTime,
        children: groupState,
      };
    };

    let state: SerializedState = {};
    this.taskGroups.forEach((taskGroup, id) => {
      const groupData = serializeTaskGroup(taskGroup);
      state[id] = groupData;
    });
    return state;
  };
}
