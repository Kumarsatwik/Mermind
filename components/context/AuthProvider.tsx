"use client";

import { createContext, useState, useEffect } from "react";
import { client } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: string | null;
}>({
  user: null,
  loading: true,
  error: null,
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client()
      .auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setError(null);
          setUser(session?.user || null);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to get session");
        setLoading(false);
      });

    const { data: listener } = client().auth.onAuthStateChange((e, session) => {
      setUser(session?.user || null);
      setError(null); // Clear any previous errors on auth state change
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
