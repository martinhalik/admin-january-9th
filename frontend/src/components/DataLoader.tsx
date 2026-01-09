/**
 * DataLoader Component
 * 
 * Lazy loads employees and merchant accounts from Supabase only when needed.
 * No longer blocks initial app rendering - data is loaded on-demand by components.
 * 
 * This component now just renders children immediately for fast initial load.
 */

import React, { useEffect } from 'react';
import { loadEmployees, updateHierarchyData } from '../data/companyHierarchy';
import { loadMerchantAccounts, updateMerchantAccountsData } from '../data/accountOwnerAssignments';

interface DataLoaderProps {
  children: React.ReactNode;
}

export const DataLoader: React.FC<DataLoaderProps> = ({ children }) => {
  useEffect(() => {
    // Load data in the background (non-blocking) for better initial performance
    // This warms up the cache for when pages need the data
    async function preloadDataInBackground() {
      try {
        console.log('[DataLoader] Preloading data in background...');
        
        // Load employees in background (non-blocking)
        setTimeout(async () => {
          try {
            const employees = await loadEmployees();
            updateHierarchyData(employees);
            console.log(`[DataLoader] Background loaded ${employees.length} employees`);
          } catch (err) {
            console.error('[DataLoader] Error preloading employees:', err);
          }
        }, 1000); // Delay to let dashboard render first
        
        // Load merchant accounts in background (non-blocking)
        setTimeout(async () => {
          try {
            const accounts = await loadMerchantAccounts();
            updateMerchantAccountsData(accounts);
            console.log(`[DataLoader] Background loaded ${accounts.length} merchant accounts`);
          } catch (err) {
            console.error('[DataLoader] Error preloading accounts:', err);
          }
        }, 2000); // Delay to let dashboard render first
      } catch (err) {
        console.error('[DataLoader] Error in background preload:', err);
      }
    }

    preloadDataInBackground();
  }, []);

  // Render children immediately for fast initial load
  return <>{children}</>;
};

export default DataLoader;




