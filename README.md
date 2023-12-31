<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->

<!-- BADGES_START -->

![Badge](https://gist.githubusercontent.com/thedjpetersen/dbf2e705dd2e2ebd6c79c71b841b06d4/raw/30dcbdf6a47c8094e3e637ee10e605662b11b1c4/build.svg)
![Badge](https://gist.githubusercontent.com/thedjpetersen/dbf2e705dd2e2ebd6c79c71b841b06d4/raw/3eb52c58d0105b50dc49839810605c45c4bdba04/coverage.svg)
![Badge](https://gist.githubusercontent.com/thedjpetersen/dbf2e705dd2e2ebd6c79c71b841b06d4/raw/4465959f17055aa9647f49c7f66c70e402243218/dependencies.svg)
![Badge](https://gist.githubusercontent.com/thedjpetersen/dbf2e705dd2e2ebd6c79c71b841b06d4/raw/2aff73e846aadc599b276ed66891c048df025430/license.svg)
![Badge](https://gist.githubusercontent.com/thedjpetersen/dbf2e705dd2e2ebd6c79c71b841b06d4/raw/38153db15c47cfeaa29aef2df49b17aa9f41c395/release.svg)

<!-- BADGES_END -->

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/thedjpetersen/flow-like-water">
    <img src="images/FlowControl.png" alt="Logo" width="250" height="250">
  </a>

# My Project

<h3 align="center">Flow like water 🤙</h3>

  <p align="center">
    Flow like water and move easily through states.
    <br />
    <a href="https://github.com/thedjpetersen/flow-like-water"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/thedjpetersen/flow-like-water/issues">Report Bug</a>
    ·
    <a href="https://github.com/thedjpetersen/flow-like-water/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#api">API</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

When working with many different states and transitions it can be difficult to keep track of everything as a pipeline. This library gives you a way to treat each chunk as a state and then define the transitions between them. You can also define conditions for each transition and even retry failed transitions.

In addition we can group tasks together and execute them collectively. This allows us to manage the execution of multiple tasks and even other task groups.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To get setup we just need to install the library locally and then we can start defining
our states and transitions.

### Installation

```sh
npm install flow-like-water
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## API

### `Task` Class API

| Method      | Arguments                                                                                                                                                                            | Description                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constructor | `options: { id: TaskId; execute: () => Promise<void \| TaskId \| TaskGroupId>; checkCondition: () => Promise<boolean>; nextTasks?: TaskId[]; retries?: number; waitTime?: number; }` | Initializes a new `Task` instance with specified options.                                                                                                                       |
| runTask     | -                                                                                                                                                                                    | Executes the task, managing its state and execution time. Returns a promise with the result. Throws an error if the execution fails or the post-execution condition is not met. |
| run         | -                                                                                                                                                                                    | Executes the task with retry logic. If the task fails, it retries the execution based on the specified retries and wait time.                                                   |

### `TaskGroup` Class API

| Method      | Arguments                       | Description                                                         |
| ----------- | ------------------------------- | ------------------------------------------------------------------- |
| Constructor | `id: TaskGroupId`               | Constructs a new instance of `TaskGroup` with a unique identifier.  |
| addChild    | `task: Task \| TaskGroup`       | Adds a task or task group to the collection.                        |
| removeChild | `taskId: TaskId \| TaskGroupId` | Removes a task or task group from the collection by its identifier. |

### `FlowControl` Class API

| Method             | Arguments                  | Description                                                       |
| ------------------ | -------------------------- | ----------------------------------------------------------------- |
| Constructor        | -                          | Initializes a new `FlowControl` instance.                         |
| addGroup           | `taskGroup: TaskGroup`     | Adds a task group to the collection.                              |
| removeGroup        | `taskGroupId: TaskGroupId` | Removes a task group from the collection using its ID.            |
| getTaskGroups      | -                          | Retrieves all task groups in the collection.                      |
| getTaskGroup       | `taskGroupId: TaskGroupId` | Retrieves a specific task group by its ID.                        |
| run                | -                          | Executes all task groups managed by the FlowControl instance.     |
| getSerializedState | -                          | Serializes the state of all task groups into a structured format. |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For a full usage example please checkout the example listed in the [examples directory](https://github.com/thedjpetersen/flow-like-water/tree/main/examples)_

_You can run the example code by running `npm run example` from the root directory_

```typescript
// Import the necessary classes from the library
import { Task, TaskGroup, FlowControl } from "./your-library-path";

/*
 * Example Task Execution Logic
 *
 * This function simulates a task. Replace it with your actual task logic.
 * For instance, this could be a network request, file operation, etc.
 */
async function sampleTaskExecution() {
  console.log("Executing sample task...");
  // Add your task logic here
}

/*
 * Example Condition Check
 *
 * This function simulates checking a condition before executing a task.
 * Replace it with your actual condition logic.
 * For example, checking if a file exists before trying to read it.
 */
async function sampleConditionCheck() {
  console.log("Checking condition for task execution...");
  // Add your condition logic here
  return true; // Return true if the condition is met, false otherwise
}

// Create a new task instance
// This task will use the sample execution logic and condition check defined above
const task1 = new Task({
  id: "task1",
  execute: sampleTaskExecution,
  checkCondition: sampleConditionCheck,
  retries: 2, // Number of retries if the task fails
  waitTime: 1500, // Waiting time in milliseconds before each retry
});

// You can define more tasks similar to task1
// For simplicity, we're reusing the same task logic and condition for task2
const task2 = new Task({
  id: "task2",
  execute: sampleTaskExecution,
  checkCondition: sampleConditionCheck,
  retries: 1,
  waitTime: 1000,
});

// Create a task group and assign an identifier to it
// Task groups can contain multiple tasks and even other task groups
const group = new TaskGroup("group1");

// Add tasks to the group
// Tasks are managed within the group and can be executed collectively
group.addChild(task1);
group.addChild(task2);

// Create an instance of FlowControl
// FlowControl is used to manage and execute task groups
const flowControl = new FlowControl();

// Add the group to the FlowControl
// This allows the FlowControl to manage the execution of this group
flowControl.addGroup(group);

flowControl.on("taskStarted", (task) => {
  console.log(`Task ${task.id} has started.`);
});

flowControl.on("taskCompleted", (task) => {
  console.log(`Task ${task.id} has completed.`);
});

// Execute all task groups managed by the FlowControl instance
// This will run all tasks in 'group1', handling retries and condition checks
flowControl
  .run()
  .then(() => {
    console.log("All tasks in all groups have been executed successfully.");
  })
  .catch((error) => {
    console.error("An error occurred during task group execution:", error);
  });
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

DJ Petersen - [@thedjpetersen](https://twitter.com/thedjpetersen)

Project Link: [https://github.com/thedjpetersen/flow-like-water](https://github.com/thedjpetersen/flow-like-water)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [ChatGPT](https://chat.openai.com/c/894827ae-a7f8-4de6-82a7-549c067f5a30)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
