"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type UserRole = "customer" | "pharmacist" | "admin";
type User = {
  userId: number;
  username: string;
  role: UserRole;
  linkedId: number;
  name?: string;
  customerId?: number;
  pharmacistId?: number;
} | null | undefined;

type AuthContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);