import { createContext } from 'react';

import type { Services } from '@/ui/lib/services.ts';

export const ServicesContext = createContext<Services | null>(null);
