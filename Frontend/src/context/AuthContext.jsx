import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStoredUser, getToken, storeSession, clearSession } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("grassroots:unauthorized", onUnauthorized);
    return () => window.removeEventListener("grassroots:unauthorized", onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(getToken()),
      signIn: (token, user) => {
        storeSession(token, user);
        setUser(user);
      },
      signOut: () => {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
