import { createContext, useContext, type PropsWithChildren } from 'react';

const PluginCategoryContext = createContext<string | null>(null);

export function PluginCategoryProvider({
  category,
  children,
}: PropsWithChildren<{ category: string }>) {
  return (
    <PluginCategoryContext.Provider value={category}>
      {children}
    </PluginCategoryContext.Provider>
  );
}

export function usePluginCategories(categories: string[] = []) {
  const category = useContext(PluginCategoryContext);
  return [...new Set(category ? [category, ...categories] : categories)];
}
