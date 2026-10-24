import { TrekkerLogo } from '@/ui/primitives/trekker-logo.tsx';

interface BrandMarkProps {
  projectName: string;
  projectPath: string;
}

export function BrandMark({ projectName, projectPath }: BrandMarkProps) {
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={projectPath}>
      <TrekkerLogo className="size-4 shrink-0 text-primary" />
      <span className="truncate text-sm font-semibold text-fg max-sm:sr-only">{projectName}</span>
    </span>
  );
}
