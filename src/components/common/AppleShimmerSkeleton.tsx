import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card } from './Card';
import { Skeleton } from './Primitives';
import { translations } from '../../i18n/translations';

export const AppleShimmerSkeleton: React.FC = () => {
  const language = useAppStore((s) => s.language);
  const text = translations[language].common.syncingCloud;

  return (
    <main
      role="status"
      aria-busy="true"
      aria-label={text}
      className="min-h-screen bg-canvas px-4 py-8 flex items-center justify-center"
    >
      <Card className="w-full max-w-md space-y-5" padding="lg">
        <div className="space-y-2">
          <Skeleton className="w-32" />
          <Skeleton className="w-56 max-w-full" />
        </div>
        <Skeleton shape="rectangle" className="h-28 w-full" />
        <div className="space-y-2">
          <Skeleton className="w-full" />
          <Skeleton className="w-4/5" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-positive animate-pulse" />
          <span>{text}</span>
        </div>
      </Card>
    </main>
  );
};
