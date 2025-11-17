const { execSync } = require('child_process');
const packageJson = require('./package.json');

const FALLBACKS = {
  version: 'dev',
  commit: 'local',
  date: '',
  branch: 'local',
};

function fromGit(command, fallback) {
  try {
    return execSync(command, { stdio: 'pipe' }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}

const versionMeta = {
  NEXT_PUBLIC_APP_VERSION:
    process.env.NEXT_PUBLIC_APP_VERSION ||
    packageJson.version ||
    FALLBACKS.version,
  NEXT_PUBLIC_GIT_COMMIT:
    process.env.NEXT_PUBLIC_GIT_COMMIT ||
    fromGit('git rev-parse --short HEAD', FALLBACKS.commit),
  NEXT_PUBLIC_GIT_COMMIT_DATE:
    process.env.NEXT_PUBLIC_GIT_COMMIT_DATE ||
    fromGit(
      "git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S'",
      FALLBACKS.date
    ),
  NEXT_PUBLIC_GIT_BRANCH:
    process.env.NEXT_PUBLIC_GIT_BRANCH ||
    fromGit('git rev-parse --abbrev-ref HEAD', FALLBACKS.branch),
};

Object.entries(versionMeta).forEach(([key, value]) => {
  process.env[key] = value;
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
