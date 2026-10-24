import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../ui/stories/**/*.mdx',
    '../ui/stories/**/*.stories.tsx',
    '../ui/alternatives/**/*.stories.tsx',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  viteFinal: (viteConfig) => {
    return { ...viteConfig, root: undefined };
  },
};

export default config;
