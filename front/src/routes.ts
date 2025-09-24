// src/routes.ts

export const routes = {
  // --- Rutas Públicas (public) ---
  public: {
    home: "/",
    clubs: "/clubs",
    canchas: "/courts",
    inscripciones: "/inscriptions",
    forgotPassword: "/forgot",
    resetPassword: "/reset",
  },

  // --- Rutas de Autenticación (auth) ---
  auth: {
    ingreso: "/login",
    registro: "/register",
  },

  // --- Rutas de la App (app - para managers) ---
  app: {
    dashboardBase: "/dashboard",
    admin: "/admin",
    
    dashboard: (complexId: string) => `/dashboard/${complexId}`,
    reservations: (complexId: string) => `/dashboard/${complexId}/booking`,
    analytics: (complexId: string) => `/dashboard/${complexId}/analytics`,
    settings: (complexId: string) => `/dashboard/${complexId}/settings`,
    
    perfil: "/profile",
  },
};