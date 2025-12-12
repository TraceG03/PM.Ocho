import { useEffect } from 'react';
import { useSiteManagerStore } from '../store/siteManagerStoreWeb';

export const useSupabaseSync = () => {
  const loadAllData = useSiteManagerStore((state) => state.loadAllData);
  const isLoading = useSiteManagerStore((state) => state.isLoading);

  useEffect(() => {
    // Load all data from Supabase when the app starts
    loadAllData();
  }, [loadAllData]);

  return { isLoading };
};

