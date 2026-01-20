import { $ } from "bun";
import { build } from "esbuild";
import { spawn } from "child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const CLI = `${ROOT}packages/cli`;
const WEBAPP = `${ROOT}packages/webapp`;

async function buildCLI() {
  console.log("Building CLI...");
  await build({
    entryPoints: [`${CLI}/src/index.ts`],
    bundle: true,
    platform: "node",
    target: "node18",
    format: "esm",
    outfile: `${CLI}/dist/index.js`,
    external: ["commander", "drizzle-orm", "bun:sqlite"],
  });
}

async function buildWebapp() {
  console.log("Building webapp...");
  await $`cd ${WEBAPP} && bun --bun next build`;
}

async function bundleWebapp() {
  console.log("Bundling webapp...");

  const standalone = `${WEBAPP}/.next/standalone`;
  const dest = `${CLI}/webapp-dist`;

  // Find server.js location (handles monorepo nested paths)
  const result = await $`find ${standalone} -name "server.js" -not -path "*/node_modules/*"`.text();
  const serverJs = result.trim().split("\n")[0];
  const serverDir = serverJs.replace("/server.js", "");

  // Copy server files
  await $`cp -r ${serverDir}/. ${dest}/`;

  // Find and copy node_modules from standalone
  const nmResult = await $`find ${standalone} -maxdepth 3 -type d -name "node_modules"`.text();
  const nodeModules = nmResult.trim().split("\n")[0];
  if (nodeModules) {
    await $`cp -rL ${nodeModules} ${dest}/`;

    // Flatten Bun's .bun/node_modules structure to top level
    const bunNm = `${dest}/node_modules/.bun/node_modules`;
    const checkExists = await $`test -d ${bunNm} && echo yes || echo no`.text();
    if (checkExists.trim() === "yes") {
      await $`cp -rL ${bunNm}/. ${dest}/node_modules/`;
      await $`rm -rf ${dest}/node_modules/.bun`;
    }
  }

  // Copy static assets
  await $`cp -r ${WEBAPP}/.next/static ${dest}/.next/`;

  // Copy public if exists
  const hasPublic = await Bun.file(`${WEBAPP}/public`).exists();
  if (hasPublic) {
    await $`cp -r ${WEBAPP}/public ${dest}/`;
  }
}

async function clean() {
  console.log("Cleaning...");
  await $`rm -rf ${CLI}/dist ${CLI}/webapp-dist ${WEBAPP}/.next`;
}

async function buildAll() {
  await clean();
  await buildWebapp();
  await buildCLI();
  await bundleWebapp();
  console.log("\nBuild complete!");
}

function bumpVersion(type: "patch" | "minor" | "major"): string {
  const pkgPath = `${CLI}/package.json`;
  const pkg = require(pkgPath);
  const [major, minor, patch] = pkg.version.split(".").map(Number);

  if (type === "major") pkg.version = `${major + 1}.0.0`;
  else if (type === "minor") pkg.version = `${major}.${minor + 1}.0`;
  else pkg.version = `${major}.${minor}.${patch + 1}`;

  Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  return pkg.version;
}

async function publish(type: "patch" | "minor" | "major") {
  const version = bumpVersion(type);
  console.log(`Bumped to v${version}\n`);

  await buildAll();

  const tmp = await $`mktemp -d`.text().then((s) => s.trim());
  console.log(`\nPublishing from ${tmp}...`);

  try {
    await $`cp ${CLI}/package.json ${tmp}/`;
    await $`cp -r ${CLI}/dist ${tmp}/`;
    await $`cp -r ${CLI}/bin ${tmp}/`;
    await $`cp -r ${CLI}/webapp-dist ${tmp}/`;
    await $`cp ${ROOT}/README.md ${tmp}/`;
    await $`cp ${CLI}/.npmignore ${tmp}/ 2>/dev/null || true`;

    // Use spawn to avoid Bun shell issues with long npm output
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("npm", ["publish", "--access", "public"], {
        cwd: tmp,
        stdio: "inherit",
      });
      proc.on("close", (code: number | null) => {
        if (code === 0) resolve();
        else reject(new Error(`npm publish failed with code ${code}`));
      });
    });
    console.log("\nPublished!");
  } finally {
    await $`rm -rf ${tmp}`;
  }
}

const arg = Bun.argv[2] as "patch" | "minor" | "major" | undefined;

if (arg && ["patch", "minor", "major"].includes(arg)) {
  await publish(arg);
} else {
  await buildAll();
}
