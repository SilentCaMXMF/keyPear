import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      api
        .get<{ user: User }>("/api/auth/me")
        .then(({ user }) => setUser(user))
        .catch(() => {
          Cookies.remove("accessToken");
          Cookies.remove("refreshToken");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { user: userData, accessToken, refreshToken } = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/api/auth/login", { email, password });

    Cookies.set("accessToken", accessToken, { expires: 1 / 96 });
    Cookies.set("refreshToken", refreshToken, { expires: 7 });
    setUser(userData);
  };

  const register = async (email: string, password: string, name?: string) => {
    const { user: userData, accessToken, refreshToken } = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/api/auth/register", { email, password, name });

    Cookies.set("accessToken", accessToken, { expires: 1 / 96 });
    Cookies.set("refreshToken", refreshToken, { expires: 7 });
    setUser(userData);
  };

  const logout = async () => {
    try {
      const refreshToken = Cookies.get("refreshToken");
      if (refreshToken) {
        await api.post("/api/auth/logout", { refreshToken });
      }
    } catch {
    } finally {
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
