import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface TabContextType {
  selectedTabs: { [key: string]: string };
  setSelectedTab: (id: string, tab: string) => void;
}

const TabContext = createContext<TabContextType>({
  selectedTabs: {},
  setSelectedTab: () => {},
});

export const useTabContext = () => useContext(TabContext);

interface TabProviderProps {
  children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
  const [selectedTabs, setSelectedTabs] = useState<{ [key: string]: string }>(
    {},
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTabs = localStorage.getItem('selectedTabs');
      if (storedTabs) {
        try {
          const parsedTabs = JSON.parse(storedTabs) as {
            [key: string]: string;
          };
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

  const setSelectedTab = (id: string, tab: string) => {
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
