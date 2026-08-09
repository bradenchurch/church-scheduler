import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getSession, onAuthStateChange } from '../lib/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin', 'leader', or null
  const [leaderId, setLeaderId] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      try {
        const { session } = await getSession();
        if (session && mounted) {
          await fetchRoleAndDetails(session);
        } else if (mounted) {
          setUser(null);
          setRole(null);
          setLeaderId(null);
          setToken(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error resolving session:", error);
        if (mounted) setLoading(false);
      }
    };

    resolveSession();

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session && mounted) {
        await fetchRoleAndDetails(session);
      } else if (mounted) {
        setUser(null);
        setRole(null);
        setLeaderId(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchRoleAndDetails = async (session) => {
    setUser(session.user);
    setToken(session.access_token);

    // Fetch role from leaders table
    try {
      const { data, error } = await supabase
        .from('leaders')
        .select('id, role')
        .eq('email', session.user.email)
        .single();

      if (error) {
        console.error("Error fetching leader details:", error);
      }

      if (data) {
        setLeaderId(data.id);
        setRole(data.role || 'leader'); // Default to leader if found but no explicit role
      } else {
        setLeaderId(null);
        setRole(null);
      }
    } catch (err) {
      console.error("Failed to fetch role:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, leaderId, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
