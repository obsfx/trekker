import { clsx } from 'clsx';

interface AuthorAvatarProps {
  name: string;
}

export function AuthorAvatar({ name }: AuthorAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'flex size-5 shrink-0 items-center justify-center rounded-pill text-micro font-semibold uppercase',
        {
          'bg-accent-subtle text-accent-emphasis': name === 'agent',
          'bg-primary-subtle text-primary-emphasis': name !== 'agent',
        }
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}
