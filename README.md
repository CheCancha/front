# CheCancha - Plataforma SaaS para la Gestión de Complejos Deportivos

La solución SaaS que profesionaliza la reserva de canchas, desde la gestión hasta el pago.

CheCancha es una aplicación web **Full Stack** diseñada para modernizar y automatizar la administración de complejos deportivos.  
El proyecto nació de la necesidad de reemplazar métodos de reserva informales y propensos a errores (WhatsApp, cuadernos) por un sistema digital centralizado, eficiente y escalable.

🔗 [Ver Demo en Vivo](https://checancha.com/)

---

## 🚀 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)  
- **Lenguaje:** TypeScript  
- **Frontend:** React & Tailwind CSS (UI moderna y responsiva)  
- **Backend:** Next.js API Routes (Serverless Functions)  
- **Base de Datos:** PostgreSQL (Vercel Postgres, Neon, etc.)  
- **ORM:** Prisma  
- **Autenticación:** NextAuth.js v5 (OAuth con Google + Email/Password)  
- **Pagos:** Mercado Pago SDK (multi-vendedor)  
- **Manejo de Archivos:** Cloudinary o Vercel Blob  
- **Notificaciones:** Resend & React Email  
- **Validación:** Zod  

---

## ⚙️ Arquitectura y Características Técnicas Clave

### 1. Dashboard de Administración (Manager)
- **Calendario Interactivo:** Vista de agenda que renderiza reservas desde la API (`/api/complex/[id]/bookings`).  
- **Gestión de Horarios y Precios:** Backend con *PriceRules* y *Schedules* para asegurar disponibilidad y precios correctos.  
- **Seguridad de Rutas:** Middleware y lógica en Route Handlers para que solo el *Manager* gestione sus recursos.  

### 2. Portal de Reservas (Cliente)
- **Autenticación Segura:** Registro y login con NextAuth.js.  
- **Disponibilidad en Tiempo Real:** Widget que consulta `/api/complexes/public/[id]/availability` y previene el doble-booking.  

### 3. Integración de Pagos Multi-Vendedor
- **Conexión vía OAuth:** Cada administrador conecta su cuenta de Mercado Pago.  
- **Preferencias Dinámicas:** El endpoint `/api/bookings/create-preference` genera preferencias con los tokens propios del complejo.  
- **Webhook Robusto (`/api/webhooks/mercado-pago`):**  
  - Identifica al vendedor por `user_id`.  
  - Verifica autenticidad del pago con su `accessToken`.  
  - Actualiza reservas (PENDIENTE → CONFIRMADO) y registra el pago en DB.  

### 4. Base de Datos con Prisma
- **Esquema Relacional:** Relaciones claras entre `User`, `Complex`, `Court`, `Booking` y `PriceRule`.  
- **Migraciones Seguras:** Con `prisma migrate dev`.  

---

## 🛠️ Instalación y Puesta en Marcha Local

Clonar el repositorio:

```bash
git clone https://github.com/IWeppler/checancha
cd checancha
