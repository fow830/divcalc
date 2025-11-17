// Информация о версии и коммите берётся из переменных окружения,
// которые задаются во время сборки (NEXT_PUBLIC_*). Это позволяет
// избежать изменений отслеживаемых файлов при деплое.

const FALLBACK_VERSION = 'dev';
const FALLBACK_COMMIT = 'local';
const FALLBACK_DATE = '';
const FALLBACK_BRANCH = 'local';

function resolveFromGit(command: string, fallback: string) {
  if (typeof window !== 'undefined') {
    return fallback;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require('child_process');
    return execSync(command, { stdio: 'pipe' }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}

function resolveVersionFallback(): string {
  if (typeof window !== 'undefined') {
    return FALLBACK_VERSION;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../package.json');
    return pkg.version || FALLBACK_VERSION;
  } catch {
    return FALLBACK_VERSION;
  }
}

const computedVersion =
  process.env.NEXT_PUBLIC_APP_VERSION || resolveVersionFallback();
const computedCommit =
  process.env.NEXT_PUBLIC_GIT_COMMIT ||
  resolveFromGit('git rev-parse --short HEAD', FALLBACK_COMMIT);
const computedDate =
  process.env.NEXT_PUBLIC_GIT_COMMIT_DATE ||
  resolveFromGit(
    "git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S'",
    FALLBACK_DATE
  );
const computedBranch =
  process.env.NEXT_PUBLIC_GIT_BRANCH ||
  resolveFromGit('git rev-parse --abbrev-ref HEAD', FALLBACK_BRANCH);

export const APP_VERSION: string = computedVersion;
export const COMMIT_HASH: string = computedCommit;
export const COMMIT_DATE: string = computedDate;
export const GIT_BRANCH: string = computedBranch;
