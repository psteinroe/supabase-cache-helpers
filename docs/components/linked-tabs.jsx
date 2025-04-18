'use client';

import { Tabs } from 'nextra/components';
import React from 'react';
import { useTabContext } from './tab-context';

export const LinkedTabs = ({ id, items, children }) => {
  const { selectedTabs, setSelectedTab } = useTabContext();
  const selectedTab = selectedTabs[id] || items[0];

  const index = items.indexOf(selectedTab);
  const selectedIndex = index !== -1 ? index : 0;

  return (
    <Tabs
      items={items}
      selectedIndex={selectedIndex}
      onChange={(index) => setSelectedTab(id, items[index])}
    >
      {children}
    </Tabs>
  );
};
