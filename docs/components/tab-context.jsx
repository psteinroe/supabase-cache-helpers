'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const TabContext = createContext({
  selectedTabs: {},
  setSelectedTab: () => {},
});

export const useTabContext = () => useContext(TabContext);

export const TabProvider = ({ children }) => {
  const [selectedTabs, setSelectedTabs] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTabs = localStorage.getItem('selectedTabs');
      if (storedTabs) {
        try {
          const parsedTabs = JSON.parse(storedTabs);
          setSelectedTabs(parsedTabs);
        } catch (error) {
          console.error(
            'Failed to parse selectedTabs from localStorage',
            error,
          );
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedTabs', JSON.stringify(selectedTabs));
    }
  }, [selectedTabs]);

  const setSelectedTab = (id, tab) => {
    setSelectedTabs((prev) => ({
      ...prev,
      [id]: tab,
    }));
  };

  return (
    <TabContext.Provider value={{ selectedTabs, setSelectedTab }}>
      {children}
    </TabContext.Provider>
  );
};
