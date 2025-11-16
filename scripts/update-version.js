// Скрипт для обновления версии в lib/version.ts
// Запускается автоматически при сборке

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
);

// Получаем информацию о коммите и ветке
let commitHash = 'unknown';
let commitDate = 'unknown';
let gitBranch = 'unknown';

try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  commitDate = execSync('git log -1 --format=%cd --date=format:"%Y-%m-%d %H:%M:%S"', { encoding: 'utf-8' }).trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  
  // Нормализуем название ветки для отображения
  if (gitBranch === 'main' || gitBranch === 'master') {
    gitBranch = 'production';
  } else if (gitBranch === 'stage' || gitBranch === 'staging') {
    gitBranch = 'stage';
  }
} catch (error) {
  console.warn('⚠️  Не удалось получить информацию о коммите (возможно, не git репозиторий)');
}

const versionFile = path.join(process.cwd(), 'lib', 'version.ts');
const content = `// Версия приложения и информация о коммите
// Автоматически обновляется при изменении package.json и сборке

export const APP_VERSION = '${packageJson.version}';
export const COMMIT_HASH = '${commitHash}';
export const COMMIT_DATE = '${commitDate}';
export const GIT_BRANCH = '${gitBranch}';
`;

fs.writeFileSync(versionFile, content, 'utf-8');
console.log(`✅ Версия обновлена до ${packageJson.version} в lib/version.ts`);
console.log(`   Коммит: ${commitHash}`);
console.log(`   Дата: ${commitDate}`);
console.log(`   Ветка: ${gitBranch}`);

