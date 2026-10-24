import { ApiError } from '@/ui/lib/api-client.ts';
import type { AsyncResource } from '@/ui/lib/async-resource.ts';
import type { ProjectGateway } from '@/ui/lib/gateways.ts';
import type { NoticePort } from '@/ui/lib/notices.ts';
import type { ProjectInfo } from '@/ui/lib/project-shapes.ts';

export interface PrefixField {
  key: string;
  label: string;
}

export abstract class PrefixRules {
  static readonly fields: readonly PrefixField[] = [
    { key: 'issue_prefix', label: 'Tasks and subtasks' },
    { key: 'epic_prefix', label: 'Epics' },
    { key: 'comment_prefix', label: 'Comments' },
  ];

  private static readonly pattern = /^[A-Z][A-Z0-9]*$/;

  static normalize(value: string) {
    return value.trim().toUpperCase();
  }

  static problem(values: Record<string, string>, key: string) {
    const value = values[key] ?? '';
    if (!PrefixRules.pattern.test(value)) {
      return 'Use uppercase letters and digits, starting with a letter';
    }
    const clash = PrefixRules.fields.some((field) => {
      return field.key !== key && values[field.key] === value;
    });
    if (clash) {
      return 'Each prefix must be unique';
    }
    return null;
  }
}

export class ProjectSettings {
  private readonly gateway: ProjectGateway;
  private readonly project: AsyncResource<ProjectInfo>;
  private readonly notices: NoticePort;

  constructor(gateway: ProjectGateway, project: AsyncResource<ProjectInfo>, notices: NoticePort) {
    this.gateway = gateway;
    this.project = project;
    this.notices = notices;
  }

  async savePrefixes(values: Record<string, string>) {
    try {
      const info = await this.gateway.updateConfig(values);
      this.project.update(() => {
        return info;
      });
      this.notices.info('Prefixes saved');
      return true;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Saving prefixes'));
      return false;
    }
  }
}
