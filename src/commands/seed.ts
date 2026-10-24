import plur from 'plur';
import { Command } from 'commander';
import { DbClient } from '@/src/db/client';
import { EpicService } from '@/src/services/epic';
import { TaskService } from '@/src/services/task';
import { DependencyService } from '@/src/services/dependency';
import { Output } from '@/src/utils/output';
import type { EpicStatus, Priority, TaskStatus } from '@/src/types';
import type { SeedCommandOptions } from '@/src/types/options';

interface SeedTask {
  epicIndex: number | null;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  tags: string;
}

interface SeedEpic {
  title: string;
  description: string;
  priority: Priority;
  status: EpicStatus;
}

interface SeedSubtask {
  parentIndex: number;
  title: string;
  status: TaskStatus;
  priority: Priority;
}

const SAMPLE_EPICS: SeedEpic[] = [
  {
    title: 'User Authentication',
    description: 'Implement user authentication and authorization system',
    priority: 0,
    status: 'in_progress',
  },
  {
    title: 'Dashboard',
    description: 'Build the main dashboard with analytics and metrics',
    priority: 1,
    status: 'todo',
  },
  {
    title: 'API Development',
    description: 'Design and implement RESTful API endpoints',
    priority: 1,
    status: 'in_progress',
  },
  {
    title: 'Testing & QA',
    description: 'Set up testing infrastructure and write tests',
    priority: 2,
    status: 'todo',
  },
];

const SAMPLE_TASKS: SeedTask[] = [
  // Auth tasks
  {
    epicIndex: 0,
    title: 'Set up OAuth 2.0 provider',
    description: 'Configure OAuth 2.0 with Google and GitHub providers',
    priority: 0,
    status: 'completed',
    tags: 'backend,security',
  },
  {
    epicIndex: 0,
    title: 'Implement JWT token handling',
    description: 'Create JWT generation, validation, and refresh logic',
    priority: 1,
    status: 'in_progress',
    tags: 'backend,security',
  },
  {
    epicIndex: 0,
    title: 'Build login page',
    description: 'Create responsive login page with social login buttons',
    priority: 1,
    status: 'todo',
    tags: 'frontend,ui',
  },
  {
    epicIndex: 0,
    title: 'Add password reset flow',
    description: 'Implement forgot password and reset password functionality',
    priority: 2,
    status: 'todo',
    tags: 'backend,frontend',
  },
  // Dashboard tasks
  {
    epicIndex: 1,
    title: 'Design dashboard layout',
    description: 'Create wireframes and mockups for the main dashboard',
    priority: 1,
    status: 'completed',
    tags: 'design,ui',
  },
  {
    epicIndex: 1,
    title: 'Implement chart components',
    description: 'Build reusable chart components using Chart.js',
    priority: 2,
    status: 'in_progress',
    tags: 'frontend,ui',
  },
  {
    epicIndex: 1,
    title: 'Add real-time data updates',
    description: 'Implement WebSocket connection for live dashboard updates',
    priority: 2,
    status: 'todo',
    tags: 'frontend,backend',
  },
  // API tasks
  {
    epicIndex: 2,
    title: 'Define API schema',
    description: 'Document API endpoints using OpenAPI specification',
    priority: 1,
    status: 'completed',
    tags: 'backend,docs',
  },
  {
    epicIndex: 2,
    title: 'Implement user endpoints',
    description: 'Create CRUD endpoints for user management',
    priority: 1,
    status: 'completed',
    tags: 'backend',
  },
  {
    epicIndex: 2,
    title: 'Add rate limiting',
    description: 'Implement rate limiting middleware for API protection',
    priority: 2,
    status: 'in_progress',
    tags: 'backend,security',
  },
  {
    epicIndex: 2,
    title: 'Set up API versioning',
    description: 'Implement v1/v2 API versioning strategy',
    priority: 3,
    status: 'todo',
    tags: 'backend',
  },
  // Testing tasks
  {
    epicIndex: 3,
    title: 'Set up Jest testing framework',
    description: 'Configure Jest with TypeScript support',
    priority: 1,
    status: 'completed',
    tags: 'testing,devops',
  },
  {
    epicIndex: 3,
    title: 'Write unit tests for auth module',
    description: 'Create comprehensive unit tests for authentication logic',
    priority: 2,
    status: 'todo',
    tags: 'testing',
  },
  {
    epicIndex: 3,
    title: 'Set up E2E testing with Playwright',
    description: 'Configure Playwright for end-to-end testing',
    priority: 3,
    status: 'todo',
    tags: 'testing,devops',
  },
  // Tasks without epic
  {
    epicIndex: null,
    title: 'Update README documentation',
    description: 'Add installation instructions and usage examples',
    priority: 3,
    status: 'todo',
    tags: 'docs',
  },
  {
    epicIndex: null,
    title: 'Configure CI/CD pipeline',
    description: 'Set up GitHub Actions for automated testing and deployment',
    priority: 2,
    status: 'in_progress',
    tags: 'devops',
  },
];

const SAMPLE_SUBTASKS: SeedSubtask[] = [
  {
    parentIndex: 1, // JWT token handling
    title: 'Implement access token generation',
    status: 'completed',
    priority: 1,
  },
  {
    parentIndex: 1,
    title: 'Implement refresh token logic',
    status: 'in_progress',
    priority: 1,
  },
  {
    parentIndex: 1,
    title: 'Add token blacklisting',
    status: 'todo',
    priority: 2,
  },
  {
    parentIndex: 5, // Chart components
    title: 'Create bar chart component',
    status: 'completed',
    priority: 2,
  },
  {
    parentIndex: 5,
    title: 'Create line chart component',
    status: 'in_progress',
    priority: 2,
  },
  {
    parentIndex: 5,
    title: 'Create pie chart component',
    status: 'todo',
    priority: 3,
  },
];

// Task indices for dependency references
const TASK_JWT = 1;
const TASK_LOGIN = 2;
const TASK_PASSWORD_RESET = 3;
const TASK_DASHBOARD_LAYOUT = 4;
const TASK_CHART_COMPONENTS = 5;
const TASK_REALTIME = 6;
const TASK_USER_ENDPOINTS = 8;
const TASK_RATE_LIMITING = 9;
const TASK_JEST_SETUP = 11;
const TASK_UNIT_TESTS_AUTH = 12;
const TASK_E2E_TESTING = 13;

// Dependencies: [taskIndex, dependsOnTaskIndex]
const SAMPLE_DEPENDENCIES = [
  [TASK_LOGIN, TASK_JWT],
  [TASK_PASSWORD_RESET, TASK_JWT],
  [TASK_REALTIME, TASK_CHART_COMPONENTS],
  [TASK_REALTIME, TASK_DASHBOARD_LAYOUT],
  [TASK_RATE_LIMITING, TASK_USER_ENDPOINTS],
  [TASK_UNIT_TESTS_AUTH, TASK_JEST_SETUP],
  [TASK_E2E_TESTING, TASK_JEST_SETUP],
];

export const seedCommand = new Command('seed')
  .description('Seed the database with sample data (development only)')
  .option('--force', 'Skip confirmation prompt')
  .action((options: SeedCommandOptions) => {
    try {
      if (!DbClient.isTrekkerInitialized()) {
        Output.error("Trekker is not initialized. Run 'trekker init' first.");
        process.exit(1);
      }

      if (!options.force) {
        Output.info('This will create sample epics, tasks, and dependencies.');
        Output.info('Use --force to skip this confirmation.\n');
      }

      const epicIds: string[] = [];
      const taskIds: string[] = [];

      // Create epics
      Output.info('Creating epics...');
      for (const epicData of SAMPLE_EPICS) {
        const epic = EpicService.createEpic({
          title: epicData.title,
          description: epicData.description,
          priority: epicData.priority,
          status: epicData.status,
        });
        epicIds.push(epic.id);
        Output.info(`  Created ${epic.id}: ${epic.title}`);
      }

      // Create tasks
      Output.info('\nCreating tasks...');
      for (const taskData of SAMPLE_TASKS) {
        let epicId: string | undefined;
        if (taskData.epicIndex !== null) {
          epicId = epicIds[taskData.epicIndex];
        }
        const task = TaskService.createTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          tags: taskData.tags,
          epicId,
        });
        taskIds.push(task.id);
        Output.info(`  Created ${task.id}: ${task.title}`);
      }

      // Create subtasks
      Output.info('\nCreating subtasks...');
      for (const subtaskData of SAMPLE_SUBTASKS) {
        const subtask = TaskService.createTask({
          title: subtaskData.title,
          priority: subtaskData.priority,
          status: subtaskData.status,
          parentTaskId: taskIds[subtaskData.parentIndex],
        });
        Output.info(
          `  Created ${subtask.id}: ${subtask.title} (subtask of ${taskIds[subtaskData.parentIndex]})`
        );
      }

      // Create dependencies
      Output.info('\nCreating dependencies...');
      for (const [taskIndex, dependsOnIndex] of SAMPLE_DEPENDENCIES) {
        const taskId = taskIds[taskIndex];
        const dependsOnId = taskIds[dependsOnIndex];
        DependencyService.addDependency(taskId, dependsOnId);
        Output.info(`  ${taskId} depends on ${dependsOnId}`);
      }

      Output.success(
        `\nSeed complete! Created ${epicIds.length} ${plur('epic', epicIds.length)}, ${taskIds.length} ${plur('task', taskIds.length)}, ${SAMPLE_SUBTASKS.length} ${plur('subtask', SAMPLE_SUBTASKS.length)}, and ${SAMPLE_DEPENDENCIES.length} ${plur('dependency', SAMPLE_DEPENDENCIES.length)}.`
      );
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
