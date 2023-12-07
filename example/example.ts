import { FlowControl, Task, TaskGroup } from "../src";

const exampleTasks = [
  {
    id: "Provision Hardware",
    children: [
      {
        id: "Create Image",
        children: [
          {
            id: "Download Talos image",
            execution: 500,
          },
          {
            id: "Use Packer to create image",
            execution: 350,
          },
        ],
      },
      {
        id: "Setup Network",
        execution: 800,
      },
      {
        id: "Install Base OS",
        execution: 1200,
      },
    ],
  },
  {
    id: "Talos Setup",
    children: [
      {
        id: "Install Talos",
        children: [
          {
            id: "Bootstrap Talos Control Plane",
            execution: 5000,
          },
          {
            id: "Configure Talos Nodes",
            execution: 350,
          },
        ],
      },
      {
        id: "Validate Talos Installation",
        execution: 2000,
      },
    ],
  },
  {
    id: "Kubernetes Configuration",
    children: [
      {
        id: "Initialize Kubernetes Cluster",
        execution: 25000,
      },
      {
        id: "Configure Networking and Storage",
        execution: 15000,
      },
      {
        id: "Deploy Essential Services",
        children: [
          {
            id: "Set Up Monitoring",
            execution: 10000,
          },
          {
            id: "Set Up Logging",
            execution: 10000,
          },
          {
            id: "Deploy Ingress Controller",
            execution: 8000,
          },
        ],
      },
    ],
  },
];

const printStateRecursively = (state, depth) => {
  Object.keys(state).forEach((key) => {
    const item = state[key];
    const indent = "| ".repeat(depth);
    let output = `${indent}${key}:`;

    if (item.state === "completed") {
      output += ` ✅ (` + item.time + "ms)";
    } else if (item.state === "failed") {
      output += ` ❌ (${item.time}ms)`;
    }

    console.log(output);
    if (item.type === "task-group" && item.children) {
      printStateRecursively(item.children, depth + 1);
    }
  });
};

const printoutState = (serializedState) => {
  printStateRecursively(serializedState, 0);
};

const flowControl = new FlowControl();

// For debugging purposes let's print
// some output to the command line

flowControl.on("taskStarted", (task) => {
  const serailizedState = flowControl.getSerializedState();
  console.log(`Task ${task.id} started \n`);
  printoutState(serailizedState);
  console.log("\n");
});

const populateTasks = (taskBlueprint, parentGroup) => {
  if (taskBlueprint.children && taskBlueprint.children.length > 0) {
    taskBlueprint.children.forEach((child) => {
      if (child.children) {
        const group = new TaskGroup(child.id);
        populateTasks(child, group);
        parentGroup.addChild(group);
      } else {
        const task = new Task({
          id: child.id,
          execute: () =>
            new Promise((resolve) => setTimeout(resolve, child.execution)),
          checkCondition: async () => true,
        });
        parentGroup.addChild(task);
      }
    });
  }
};

(async () => {
  for (const taskGroup of exampleTasks) {
    const group = new TaskGroup(taskGroup.id);
    populateTasks(taskGroup, group);
    flowControl.addGroup(group);
  }

  await flowControl.run();
})();
