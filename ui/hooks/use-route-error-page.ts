import { isRouteErrorResponse, useRouteError } from 'react-router';

import { Errors } from '@/ui/lib/errors.ts';

export const useRouteErrorPage = () => {
  const error = useRouteError();
  let message = Errors.of(error).message;
  if (isRouteErrorResponse(error)) {
    message = `${String(error.status)} ${error.statusText}`;
  }
  return {
    message,
    reload: () => {
      window.location.reload();
    },
  };
};
