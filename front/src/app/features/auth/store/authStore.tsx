"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem("userSession");
      if (session) {
        const parsedSession = JSON.parse(session);
        if (parsedSession.loggedIn) {
          setIsLoggedIn(true);
        }
      }
    } catch (error) {
      console.error("Error al leer la sesión:", error);
      setIsLoggedIn(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Función para iniciar sesión
  const login = (email: string) => {
    localStorage.setItem(
      "userSession",
      JSON.stringify({ email, loggedIn: true })
    );
    setIsLoggedIn(true);
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
