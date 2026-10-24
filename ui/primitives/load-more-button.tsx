import { Button } from '@/ui/primitives/button.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

interface LoadMoreButtonProps {
  loading: boolean;
  shown: number;
  total: number;
  next: number;
  onClick: () => void;
}

export function LoadMoreButton({ loading, shown, total, next, onClick }: LoadMoreButtonProps) {
  return (
    <Button variant="text" className="w-full justify-center" disabled={loading} onClick={onClick}>
      {loading && <Spinner className="size-3" />}
      Load {next} more
      <span className="font-normal text-fg-4">
        {shown} of {total}
      </span>
    </Button>
  );
}
