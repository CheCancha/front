export const routes = {
  public: {
    home: "/",
    clubs: "/clubs",
    canchas: "/canchas",
    complexProfile: (slug: string) => `/canchas/${slug}`,
    inscripciones: "/inscriptions",
    forgotPassword: "/forgot",
    resetPassword: "/reset",
  },

  auth: {
    ingreso: "/login",
    registro: "/register",
  },

  app: {
    dashboardBase: "/dashboard",
    admin: "/admin",

    dashboard: (complexId: string) => `/dashboard/${complexId}`,
    reservations: (complexId: string) => `/dashboard/${complexId}/booking`,
    analytics: (complexId: string) => `/dashboard/${complexId}/financials`,
    settings: (complexId: string) => `/dashboard/${complexId}/settings`,
    marketing: (complexId: string) => `/dashboard/${complexId}/marketing`,
    customers: (complexId: string) => `/dashboard/${complexId}/customers`,
    newfeatures: (complexId: string) => `/dashboard/${complexId}/newfeatures`,

    perfil: "/profile",
    soporte: "/soporte",
  },
};
