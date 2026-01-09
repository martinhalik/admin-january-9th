import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Deal } from "../data/mockDeals";

interface RecentlyViewedContextType {
  recentlyViewed: Deal[];
  addToRecentlyViewed: (deal: Deal) => void;
  clearRecentlyViewed: () => void;
  exportRecentlyViewed: () => string;
}

const RecentlyViewedContext = createContext<
  RecentlyViewedContextType | undefined
>(undefined);

interface RecentlyViewedProviderProps {
  children: ReactNode;
}

export const RecentlyViewedProvider: React.FC<RecentlyViewedProviderProps> = ({
  children,
}) => {
  const [recentlyViewed, setRecentlyViewed] = useState<Deal[]>([]);

  // Load recently viewed deals from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("recentlyViewedDeals");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentlyViewed(parsed);
      } catch (error) {
        console.error(
          "Error parsing recently viewed deals from localStorage:",
          error
        );
      }
    }
  }, []);

  // Save to localStorage whenever recentlyViewed changes
  useEffect(() => {
    localStorage.setItem("recentlyViewedDeals", JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addToRecentlyViewed = (deal: Deal) => {
    setRecentlyViewed((prev) => {
      // Remove the deal if it already exists to avoid duplicates
      const filtered = prev.filter((d) => d.id !== deal.id);
      // Add the deal to the beginning and limit to 10 items
      return [deal, ...filtered].slice(0, 10);
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem("recentlyViewedDeals");
  };

  const exportRecentlyViewed = () => {
    return JSON.stringify(recentlyViewed, null, 2);
  };

  return (
    <RecentlyViewedContext.Provider
      value={{
        recentlyViewed,
        addToRecentlyViewed,
        clearRecentlyViewed,
        exportRecentlyViewed,
      }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error(
      "useRecentlyViewed must be used within a RecentlyViewedProvider"
    );
  }
  return context;
};
