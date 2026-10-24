import { useContext } from 'react';

import { ServicesContext } from '@/ui/context/services/services-context.ts';

export const useServices = () => {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used inside ServicesProvider');
  }
  return services;
};
