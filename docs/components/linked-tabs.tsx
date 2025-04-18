'use client';

import { Tabs } from 'nextra/components';
import React, { ReactNode } from 'react';
import { useTabContext } from './tab-context';

interface LinkedTabsProps {
  id: string;
  items: string[];
  children: ReactNode;
}

export const LinkedTabs: React.FC<LinkedTabsProps> = ({
  id,
  items,
  children,
}) => {
  const { selectedTabs, setSelectedTab } = useTabContext();
  const selectedTab = selectedTabs[id] || items[0];

  const index = items.indexOf(selectedTab);
  const selectedIndex = index !== -1 ? index : 0;

  return (
    <Tabs
      items={items}
      selectedIndex={selectedIndex}
      onChange={(index: number) => setSelectedTab(id, items[index])}
    >
      {children}
    </Tabs>
  );
};
