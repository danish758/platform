'use client';

import { createContext, useContext, useState, type FC, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = { value: string; setValue: (value: string) => void };
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`<${component}> must be used inside <Tabs>`);
  return context;
}

type TabsProps = { defaultValue: string; children: ReactNode; className?: string };

export const Tabs: FC<TabsProps> = ({ defaultValue, children, className }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div role="tablist" className={cn('flex gap-6 border-b border-border', className)} {...props} />
);

type TabsTriggerProps = { value: string; children: ReactNode; className?: string };

export const TabsTrigger: FC<TabsTriggerProps> = ({ value, children, className }) => {
  const { value: activeValue, setValue } = useTabsContext('TabsTrigger');
  const selected = activeValue === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={cn(
        '-mb-px border-b-2 border-transparent pb-3 text-sm font-semibold text-muted-foreground transition-colors',
        'hover:text-foreground',
        selected && 'border-primary text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
};

type TabsContentProps = { value: string; children: ReactNode; className?: string };

export const TabsContent: FC<TabsContentProps> = ({ value, children, className }) => {
  const { value: activeValue } = useTabsContext('TabsContent');
  if (activeValue !== value) return null;
  return (
    <div role="tabpanel" className={cn('flex flex-col gap-5 pt-6', className)}>
      {children}
    </div>
  );
};
