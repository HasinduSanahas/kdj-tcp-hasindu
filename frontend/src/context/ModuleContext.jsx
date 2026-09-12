// src/context/ModuleContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// THE CORE REACT CONTEXT — Module Registry State
// ─────────────────────────────────────────────────────────────────────────────
// Fetches all modules from the backend on load.
// Every component that needs to know "is module X attached?" reads this context.
// The Sidebar uses attachedModules[] to dynamically render nav items.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllModules, attachModule, detachModule } from '../api/api';

const ModuleContext = createContext(null);

export function ModuleProvider({ children }) {
  const [modules, setModules]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toasts,  setToasts]    = useState([]);

  // ── Fetch all modules from backend ───────────────────────────────────────
  const fetchModules = useCallback(async () => {
    try {
      const res = await getAllModules();
      let fetchedModules = res.data.modules || [];
      
      // ✨ Force 'coming soon' modules to be detached regardless of DB state
      const comingSoon = ['lms_materials', 'seat_booking', 'staff_payroll', 'expense_tracker'];
      fetchedModules = fetchedModules.map(m => 
        comingSoon.includes(m.module_key) ? { ...m, status: 'detached' } : m
      );
      
      setModules(fetchedModules);
    } catch {
      addToast('Failed to fetch modules from backend', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  // ── Attach ───────────────────────────────────────────────────────────────
  const attach = async (moduleKey) => {
    try {
      const res = await attachModule(moduleKey);
      setModules(prev =>
        prev.map(m => m.module_key === moduleKey ? { ...m, status: 'attached' } : m)
      );
      addToast(`✅ ${res.data.module.display_name} attached!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Attach failed', 'error');
    }
  };

  // ── Detach ───────────────────────────────────────────────────────────────
  const detach = async (moduleKey) => {
    try {
      const res = await detachModule(moduleKey);
      setModules(prev =>
        prev.map(m => m.module_key === moduleKey ? { ...m, status: 'detached' } : m)
      );
      addToast(`🔌 ${res.data.module.display_name} detached`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Detach failed', 'error');
    }
  };

  // ── Toast helper ─────────────────────────────────────────────────────────
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const attachedModules = modules.filter(m => m.status === 'attached');
  const isAttached      = (key) => modules.find(m => m.module_key === key)?.status === 'attached';

  return (
    <ModuleContext.Provider value={{
      modules, attachedModules, loading,
      attach, detach, refresh: fetchModules, isAttached,
      toasts,
    }}>
      {children}
    </ModuleContext.Provider>
  );
}

export const useModules = () => useContext(ModuleContext);
