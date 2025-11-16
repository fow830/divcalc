'use client';

import { APP_VERSION, COMMIT_HASH, COMMIT_DATE, GIT_BRANCH } from '@/lib/version';

export function VersionBadge() {
  const isProduction = GIT_BRANCH === 'production' || GIT_BRANCH === 'main' || GIT_BRANCH === 'master';
  const isDev = GIT_BRANCH === 'dev' || GIT_BRANCH === 'Dev' || GIT_BRANCH === 'development';
  const branchColor = isProduction 
    ? 'text-red-500' 
    : isDev 
    ? 'text-green-500' 
    : 'text-blue-500';
  
  return (
    <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-2 rounded border shadow-sm">
      <div className="space-y-1">
        <div className="font-medium">v{APP_VERSION}</div>
        <div className={`text-[10px] font-semibold ${branchColor}`}>
          {GIT_BRANCH}
        </div>
        <div className="text-[10px] opacity-75">
          <div>Commit: {COMMIT_HASH}</div>
          <div>{COMMIT_DATE}</div>
        </div>
      </div>
    </div>
  );
}

