import { FlowControl, Task } from "..";

describe("FlowControl", () => {
  let flowControl;

  beforeEach(() => {
    flowControl = new FlowControl();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add a new task to the internal map", () => {
    const flowControl = new FlowControl();
    const taskId = "test-task-id";
    const task: Task = {
      id: taskId,
      execute: async () => {},
      checkCondition: async () => true,
    };
    flowControl.addTask(task);
    expect(flowControl.getTask(taskId)).toBeTruthy();
  });
});
