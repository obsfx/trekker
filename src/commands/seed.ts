import { Command } from "commander";
import { isTrekkerInitialized } from "../services/project";
import { createEpic } from "../services/epic";
import { createTask } from "../services/task";
import { addDependency } from "../services/dependency";
import { success, error, info } from "../utils/output";
import type { Priority } from "../types";

const SAMPLE_EPICS: Array<{ title: string; description: string; priority: Priority; status: string }> = [
  {
    title: "User Authentication",
    description: "Implement user authentication and authorization system",
    priority: 0,
    status: "in_progress",
  },
  {
    title: "Dashboard",
    description: "Build the main dashboard with analytics and metrics",
    priority: 1,
    status: "todo",
  },
  {
    title: "API Development",
    description: "Design and implement RESTful API endpoints",
    priority: 1,
    status: "in_progress",
  },
  {
    title: "Testing & QA",
    description: "Set up testing infrastructure and write tests",
    priority: 2,
    status: "todo",
  },
];

const SAMPLE_TASKS: Array<{ epicIndex: number | null; title: string; description: string; priority: Priority; status: string; tags: string }> = [
  // Auth tasks
  {
    epicIndex: 0,
    title: "Set up OAuth 2.0 provider",
    description: "Configure OAuth 2.0 with Google and GitHub providers",
    priority: 0,
    status: "completed",
    tags: "backend,security",
  },
  {
    epicIndex: 0,
    title: "Implement JWT token handling",
    description: "Create JWT generation, validation, and refresh logic",
    priority: 1,
    status: "in_progress",
    tags: "backend,security",
  },
  {
    epicIndex: 0,
    title: "Build login page",
    description: "Create responsive login page with social login buttons",
    priority: 1,
    status: "todo",
    tags: "frontend,ui",
  },
  {
    epicIndex: 0,
    title: "Add password reset flow",
    description: "Implement forgot password and reset password functionality",
    priority: 2,
    status: "todo",
    tags: "backend,frontend",
  },
  // Dashboard tasks
  {
    epicIndex: 1,
    title: "Design dashboard layout",
    description: "Create wireframes and mockups for the main dashboard",
    priority: 1,
    status: "completed",
    tags: "design,ui",
  },
  {
    epicIndex: 1,
    title: "Implement chart components",
    description: "Build reusable chart components using Chart.js",
    priority: 2,
    status: "in_progress",
    tags: "frontend,ui",
  },
  {
    epicIndex: 1,
    title: "Add real-time data updates",
    description: "Implement WebSocket connection for live dashboard updates",
    priority: 2,
    status: "todo",
    tags: "frontend,backend",
  },
  // API tasks
  {
    epicIndex: 2,
    title: "Define API schema",
    description: "Document API endpoints using OpenAPI specification",
    priority: 1,
    status: "completed",
    tags: "backend,docs",
  },
  {
    epicIndex: 2,
    title: "Implement user endpoints",
    description: "Create CRUD endpoints for user management",
    priority: 1,
    status: "completed",
    tags: "backend",
  },
  {
    epicIndex: 2,
    title: "Add rate limiting",
    description: "Implement rate limiting middleware for API protection",
    priority: 2,
    status: "in_progress",
    tags: "backend,security",
  },
  {
    epicIndex: 2,
    title: "Set up API versioning",
    description: "Implement v1/v2 API versioning strategy",
    priority: 3,
    status: "todo",
    tags: "backend",
  },
  // Testing tasks
  {
    epicIndex: 3,
    title: "Set up Jest testing framework",
    description: "Configure Jest with TypeScript support",
    priority: 1,
    status: "completed",
    tags: "testing,devops",
  },
  {
    epicIndex: 3,
    title: "Write unit tests for auth module",
    description: "Create comprehensive unit tests for authentication logic",
    priority: 2,
    status: "todo",
    tags: "testing",
  },
  {
    epicIndex: 3,
    title: "Set up E2E testing with Playwright",
    description: "Configure Playwright for end-to-end testing",
    priority: 3,
    status: "todo",
    tags: "testing,devops",
  },
  // Tasks without epic
  {
    epicIndex: null,
    title: "Update README documentation",
    description: "Add installation instructions and usage examples",
    priority: 3,
    status: "todo",
    tags: "docs",
  },
  {
    epicIndex: null,
    title: "Configure CI/CD pipeline",
    description: "Set up GitHub Actions for automated testing and deployment",
    priority: 2,
    status: "in_progress",
    tags: "devops",
  },
];

const SAMPLE_SUBTASKS: Array<{ parentIndex: number; title: string; status: string; priority: Priority }> = [
  {
    parentIndex: 1, // JWT token handling
    title: "Implement access token generation",
    status: "completed",
    priority: 1,
  },
  {
    parentIndex: 1,
    title: "Implement refresh token logic",
    status: "in_progress",
    priority: 1,
  },
  {
    parentIndex: 1,
    title: "Add token blacklisting",
    status: "todo",
    priority: 2,
  },
  {
    parentIndex: 5, // Chart components
    title: "Create bar chart component",
    status: "completed",
    priority: 2,
  },
  {
    parentIndex: 5,
    title: "Create line chart component",
    status: "in_progress",
    priority: 2,
  },
  {
    parentIndex: 5,
    title: "Create pie chart component",
    status: "todo",
    priority: 3,
  },
];

// Dependencies: [taskIndex, dependsOnTaskIndex]
const SAMPLE_DEPENDENCIES = [
  [2, 1], // Login page depends on JWT handling
  [3, 1], // Password reset depends on JWT handling
  [6, 5], // Real-time updates depends on chart components
  [6, 4], // Real-time updates depends on dashboard layout
  [9, 8], // Rate limiting depends on user endpoints
  [12, 11], // Unit tests for auth depends on Jest setup
  [13, 11], // E2E testing depends on Jest setup
];

export const seedCommand = new Command("seed")
  .description("Seed the database with sample data (development only)")
  .option("--force", "Skip confirmation prompt")
  .action((options) => {
    try {
      if (!isTrekkerInitialized()) {
        error("Trekker is not initialized. Run 'trekker init' first.");
        process.exit(1);
      }

      if (!options.force) {
        info("This will create sample epics, tasks, and dependencies.");
        info("Use --force to skip this confirmation.\n");
      }

      const epicIds: string[] = [];
      const taskIds: string[] = [];

      // Create epics
      info("Creating epics...");
      for (const epicData of SAMPLE_EPICS) {
        const epic = createEpic({
          title: epicData.title,
          description: epicData.description,
          priority: epicData.priority,
          status: epicData.status as "todo" | "in_progress" | "completed",
        });
        epicIds.push(epic.id);
        info(`  Created ${epic.id}: ${epic.title}`);
      }

      // Create tasks
      info("\nCreating tasks...");
      for (const taskData of SAMPLE_TASKS) {
        const task = createTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status as "todo" | "in_progress" | "completed",
          tags: taskData.tags,
          epicId: taskData.epicIndex !== null ? epicIds[taskData.epicIndex] : undefined,
        });
        taskIds.push(task.id);
        info(`  Created ${task.id}: ${task.title}`);
      }

      // Create subtasks
      info("\nCreating subtasks...");
      for (const subtaskData of SAMPLE_SUBTASKS) {
        const subtask = createTask({
          title: subtaskData.title,
          priority: subtaskData.priority,
          status: subtaskData.status as "todo" | "in_progress" | "completed",
          parentTaskId: taskIds[subtaskData.parentIndex],
        });
        info(`  Created ${subtask.id}: ${subtask.title} (subtask of ${taskIds[subtaskData.parentIndex]})`);
      }

      // Create dependencies
      info("\nCreating dependencies...");
      for (const [taskIndex, dependsOnIndex] of SAMPLE_DEPENDENCIES) {
        const taskId = taskIds[taskIndex];
        const dependsOnId = taskIds[dependsOnIndex];
        addDependency(taskId, dependsOnId);
        info(`  ${taskId} depends on ${dependsOnId}`);
      }

      success(`\nSeed complete! Created ${epicIds.length} epics, ${taskIds.length} tasks, ${SAMPLE_SUBTASKS.length} subtasks, and ${SAMPLE_DEPENDENCIES.length} dependencies.`);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
