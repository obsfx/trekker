import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { constants, gzip } from 'node:zlib';

import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, type BuildEnvironmentOptions, type Plugin, type PluginOption } from 'vite';
import * as v from 'valibot';
import { viteSingleFile } from 'vite-plugin-singlefile';

const PROJECT_ROOT = fileURLToPath(new URL('./', import.meta.url));
const UI_ROOT = join(PROJECT_ROOT, 'ui');
const EMBED_MODE = 'embed';
const EMBED_OUT_DIR = join(PROJECT_ROOT, 'dist/webui');
const FAVICON_PATH = '/favicon.svg';
const DEV_API_URL = process.env.TREKKER_DEV_API ?? 'http://localhost:4400';

const FONTS_MODULE = 'virtual:trekker-fonts.css';
const FONT_SUBSETS = ['latin-ext', 'latin'] as const;

interface FontSpec {
  family: string;
  pkg: string;
  weights: string;
}

const FONTS: readonly FontSpec[] = [
  { family: 'Google Sans Flex', pkg: 'google-sans-flex', weights: '100 1000' },
  { family: 'Google Sans Code', pkg: 'google-sans-code', weights: '300 800' },
];

const compress = promisify(gzip);

abstract class UiPlugins {
  private static readonly unicodeRanges = v.record(v.string(), v.string());

  static fontFaces(): Plugin {
    const resolvedId = `\0${FONTS_MODULE}`;
    return {
      name: 'trekker:font-faces',
      resolveId(source) {
        if (source === FONTS_MODULE) {
          return resolvedId;
        }
        return null;
      },
      async load(id) {
        if (id !== resolvedId) {
          return null;
        }
        const faces = await Promise.all(FONTS.map(UiPlugins.fontFacesOf));
        return faces.flat().join('\n');
      },
    };
  }

  private static async fontFacesOf(font: FontSpec): Promise<string[]> {
    const packageDir = `node_modules/@fontsource-variable/${font.pkg}`;
    const text = await readFile(join(PROJECT_ROOT, packageDir, 'unicode.json'), 'utf8');
    const ranges = v.parse(UiPlugins.unicodeRanges, JSON.parse(text));
    return FONT_SUBSETS.map((subset) => {
      const file = `@/${packageDir}/files/${font.pkg}-${subset}-wght-normal.woff2`;
      return `@font-face {
  font-family: '${font.family}';
  font-style: normal;
  font-display: swap;
  font-weight: ${font.weights};
  src: url('${file}') format('woff2-variations');
  unicode-range: ${ranges[subset] ?? ''};
}`;
    });
  }

  static inlineFavicon(): Plugin {
    return {
      name: 'trekker:inline-favicon',
      transformIndexHtml: {
        order: 'pre',
        async handler(html) {
          const svg = await readFile(join(UI_ROOT, `public${FAVICON_PATH}`));
          const dataUri = `data:image/svg+xml;base64,${svg.toString('base64')}`;
          return html.replace(`href="${FAVICON_PATH}"`, `href="${dataUri}"`);
        },
      },
    };
  }

  static gzipEmbed(): Plugin {
    return {
      name: 'trekker:gzip-embed',
      apply: 'build',
      enforce: 'post',
      async closeBundle() {
        const htmlPath = join(EMBED_OUT_DIR, 'index.html');
        const html = await readFile(htmlPath);
        const compressed = await compress(html, { level: constants.Z_BEST_COMPRESSION });
        await writeFile(`${htmlPath}.gz`, compressed);
        await rm(htmlPath);
      },
    };
  }
}

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    UiPlugins.fontFaces(),
  ];
  let build: BuildEnvironmentOptions = {};
  if (mode === EMBED_MODE) {
    plugins.push(viteSingleFile(), UiPlugins.inlineFavicon(), UiPlugins.gzipEmbed());
    build = { outDir: EMBED_OUT_DIR, emptyOutDir: true, copyPublicDir: false };
  }
  return {
    root: UI_ROOT,
    plugins,
    build,
    resolve: {
      alias: [{ find: /^@\//, replacement: PROJECT_ROOT }],
    },
    server: {
      proxy: {
        '/api': DEV_API_URL,
      },
    },
  };
});
