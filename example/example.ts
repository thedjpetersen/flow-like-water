import { FlowControl, Task, TaskGroup } from "../src";

(async () => {
  const flowControl = new FlowControl();

  const introductoryGroup = new TaskGroup("Intro Group");
  introductoryGroup.addChild(
    new Task({
      id: "Task 1",
      execute: async () => {
        console.log("Task 1 executed");
      },
      checkCondition: async () => true,
    })
  );

  flowControl.addGroup(introductoryGroup);

  // For debugging purposes let's print
  // some output to the command line
  flowControl.on("info", (message) => {
    console.log(message);
  });

  flowControl.on("error", (error) => {
    console.log(error);
  });

  await flowControl.run();
})();
