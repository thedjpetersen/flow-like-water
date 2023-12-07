import { Task, TaskGroup, FlowControl } from "../index";

jest.useFakeTimers();

describe("Task Management System", () => {
  describe("Task", () => {
    let task: Task;
    const mockExecute = jest.fn(() => {
      return new Promise((async) => {
        return "success";
      });
    });
    const mockCheckCondition = jest.fn(async () => true);

    beforeEach(() => {
      task = new Task({
        id: "testTask",
        execute: mockExecute as any,
        checkCondition: mockCheckCondition,
        retries: 2,
        waitTime: 10,
      });
    });

    describe("constructor", () => {
      it("initializes the task with the correct properties", () => {
        expect(task.id).toBe("testTask");
        expect(task.retries).toBe(2);
        expect(task.waitTime).toBe(10);
        expect(task.state).toBe("not_started");
        expect(task.nextTasks).toBeUndefined();
        expect(task.time).toBe(0);
      });
    });

    describe("runTask", () => {
      it("updates state to completed on successful execution", async () => {
        mockExecute.mockResolvedValue("success");
        await task.runTask();
        expect(task.state).toBe("completed");
      });

      it("updates state to failed on execution failure", async () => {
        mockExecute.mockRejectedValue(new Error("failure"));
        const taskPromise = task.runTask();
        jest.runAllTimers();
        try {
          await taskPromise;
        } catch (error) {
          expect((error as any).message).toBe("failure");
        }
        expect(task.state).toBe("failed");
      });
    });
  });

  describe("TaskGroup", () => {
    let taskGroup: TaskGroup;
    let task: Task;

    beforeEach(() => {
      taskGroup = new TaskGroup("group1");
      task = new Task({
        id: "testTask",
        execute: jest.fn(),
        checkCondition: jest.fn(),
        retries: 0,
        waitTime: 1000,
      });
    });

    it("initializes with the correct id", () => {
      expect(taskGroup.id).toBe("group1");
    });

    it("initializes an empty children map", () => {
      expect(taskGroup.children.size).toBe(0);
    });

    it("should add and remove a task", () => {
      taskGroup.addChild(task);
      expect(taskGroup.children.has(task.id)).toBeTruthy();

      taskGroup.removeChild(task.id);
      expect(taskGroup.children.has(task.id)).toBeFalsy();
    });
  });

  describe("FlowControl", () => {
    let flowControl: FlowControl;
    let taskGroup: TaskGroup;

    beforeEach(() => {
      flowControl = new FlowControl();
      taskGroup = new TaskGroup("group1");
    });

    it("initializes with an empty taskGroups map", () => {
      expect(flowControl.getTaskGroups().size).toBe(0);
    });

    it("should add and remove a task group", () => {
      flowControl.addGroup(taskGroup);
      expect(flowControl.getTaskGroup(taskGroup.id)).toBeTruthy();

      flowControl.removeGroup(taskGroup.id);
      expect(flowControl.getTaskGroup(taskGroup.id)).toBeFalsy();
    });

    // Here you can add more tests for runTaskGroup, run, and getSerializedState methods
  });

  describe("run", () => {
    let flowControl: FlowControl;
    let taskGroup1: TaskGroup;
    let taskGroup2: TaskGroup;
    let task1: Task;
    let task2: Task;

    beforeEach(() => {
      flowControl = new FlowControl();
      taskGroup1 = new TaskGroup("group1");
      taskGroup2 = new TaskGroup("group2");

      task1 = new Task({
        id: "testTask1",
        execute: jest.fn(),
        checkCondition: jest.fn(async () => true),
      });

      task2 = new Task({
        id: "testTask2",
        execute: jest.fn(),
        checkCondition: jest.fn(async () => true),
      });

      taskGroup1.addChild(task1);
      taskGroup2.addChild(task2);

      flowControl.addGroup(taskGroup1);
      flowControl.addGroup(taskGroup2);
    });

    it("should execute all task groups", async () => {
      await flowControl.run();
      expect(task1.state).toBe("completed");
      expect(task1.execute).toHaveBeenCalledTimes(1);
      expect(task1.checkCondition).toHaveBeenCalledTimes(1);
      expect(task2.state).toBe("completed");
      expect(task2.execute).toHaveBeenCalledTimes(1);
      expect(task2.checkCondition).toHaveBeenCalledTimes(1);
    });
  });
});
