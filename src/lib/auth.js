import { supabase } from './supabase';

export const signInWithOtp = async (email, redirectTo) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  return { error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
