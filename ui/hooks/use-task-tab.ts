import { useState } from 'react';

type TaskTab = 'comments' | 'activity';

export const useTaskTab = () => {
  const [tab, setTab] = useState<TaskTab>('comments');
  return { tab, setTab };
};
