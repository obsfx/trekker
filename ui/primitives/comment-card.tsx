import type { ReactNode } from 'react';

import { AuthorAvatar } from '@/ui/primitives/author-avatar.tsx';

interface CommentCardProps {
  author: string;
  time: string;
  timeTitle: string;
  edited: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

export function CommentCard({
  author,
  time,
  timeTitle,
  edited,
  actions,
  children,
}: CommentCardProps) {
  return (
    <article className="group flex gap-2">
      <AuthorAvatar name={author} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-4 border border-line-muted px-2.5 py-1.5">
        <header className="flex h-5 items-center gap-1.5 text-mini">
          <span className="font-semibold text-fg-1">{author}</span>
          <time title={timeTitle} className="text-fg-4">
            {time}
          </time>
          {edited ? <span className="text-fg-4">edited</span> : null}
          {actions && (
            <span className="invisible ml-auto flex group-focus-within:visible group-hover:visible">
              {actions}
            </span>
          )}
        </header>
        {children}
      </div>
    </article>
  );
}
