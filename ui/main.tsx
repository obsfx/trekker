import 'virtual:trekker-fonts.css';
import '@/ui/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/ui/app.tsx';
import { AppRouter } from '@/ui/app-router.ts';
import { AppServices } from '@/ui/lib/app-services.ts';
import { noticePort } from '@/ui/store/notice-store.ts';

const services = AppServices.create(noticePort);
const router = AppRouter.browser();
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App services={services} router={router} />
    </StrictMode>
  );
}
