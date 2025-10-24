// Simple demo authentication system
// In a real app, you would use Supabase Auth or another auth provider

// Mock user for demo purposes
export const mockUser = {
  id: 'demo-user-12345',
  email: 'demo@auroracommerce.com',
  name: 'Demo User',
  avatar_url: null
};

// Demo authentication functions
export async function signInDemo() {
  // In a real app, this would handle actual authentication
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_auth', JSON.stringify(mockUser));
    window.dispatchEvent(new CustomEvent('authChange', { detail: mockUser }));
  }
  return { user: mockUser, error: null };
}

export async function signOutDemo() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demo_auth');
    window.dispatchEvent(new CustomEvent('authChange', { detail: null }));
  }
  return { error: null };
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('demo_auth');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// In a real app, you would use Supabase auth:
/*
import { createBrowserClient } from '@supabase/ssr';

export const supabaseAuth = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data.user, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
  });
  return { user: data.user, error };
}

export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut();
  return { error };
}
*/