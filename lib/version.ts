// Информация о версии и коммите берётся из переменных окружения,
// которые задаются во время сборки (NEXT_PUBLIC_*). Это позволяет
// избежать изменений отслеживаемых файлов при деплое.

const FALLBACK_VERSION = 'dev';
const FALLBACK_COMMIT = 'local';
const FALLBACK_DATE = '';
const FALLBACK_BRANCH = 'local';

export const APP_VERSION: string =
  process.env.NEXT_PUBLIC_APP_VERSION || FALLBACK_VERSION;
export const COMMIT_HASH: string =
  process.env.NEXT_PUBLIC_GIT_COMMIT || FALLBACK_COMMIT;
export const COMMIT_DATE: string =
  process.env.NEXT_PUBLIC_GIT_COMMIT_DATE || FALLBACK_DATE;
export const GIT_BRANCH: string =
  process.env.NEXT_PUBLIC_GIT_BRANCH || FALLBACK_BRANCH;
