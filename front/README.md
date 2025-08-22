Arquitectura utilizada: FSD. Feature-Sliced-Design



El dashboard se divide en secciones lógicas, accesibles a través de una barra de navegación lateral (sidebar).

1. Vista General / Hoy (/dashboard)
Es la primera pantalla que ve el gestor. Ofrece un resumen de la actividad del día para tomar decisiones rápidas.

Métricas Clave del Día:
Reservas de Hoy: Número total de reservas para el día actual.
Ocupación: Porcentaje de horas reservadas sobre las horas disponibles.
Ingresos del Día: Suma de los precios de las reservas del día.
Timeline de Próximos Turnos: Una lista visual de las próximas 3-4 reservas, mostrando:
Hora de inicio.
Cancha reservada.
Nombre del cliente.
Estado del pago (ej: "Seña Pagada", "Pendiente").

Acceso Rápido: Un botón grande para "Crear Nueva Reserva" (para las que se toman por teléfono).

2. Calendario / Grilla (/dashboard/calendar)
Una vista completa del calendario para tener una perspectiva semanal o mensual.

Vista Semanal: Muestra todas las canchas en columnas y las horas en filas, similar a Google Calendar.

Bloques de Reserva: Cada reserva es un bloque de color con la información esencial.

Creación Manual: El gestor puede hacer clic en un espacio vacío para crear una nueva reserva manualmente.

Filtros: Poder filtrar la vista por cancha específica.

3. Reservas (/dashboard/bookings)
Un listado detallado de todas las reservas (pasadas y futuras).

Tabla de Reservas: Con columnas para Fecha, Hora, Cliente, Cancha, Precio y Estado del Pago.

Buscador y Filtros: Herramientas para buscar un cliente específico o filtrar por rango de fechas.

Acciones por Reserva: Posibilidad de marcar una reserva como "Completada" o "Cancelada".

4. Mi Complejo (/dashboard/settings)
El centro de configuración. Aquí es donde el gestor personaliza su negocio. Esta sección tendría sub-pestañas:

Canchas:

Un listado de sus canchas actuales.

Un formulario para añadir una nueva cancha (nombre, deporte, precio por hora).

Opciones para editar o desactivar canchas existentes.

Horarios:

Una interfaz visual para definir los horarios de apertura y cierre para cada día de la semana, tal como lo definimos en el schema.prisma.

Datos Generales: Formulario para editar el nombre, dirección y ciudad del complejo.

Pagos: Una sección para que el gestor conecte su cuenta de Mercado Pago, ingresando sus credenciales.

5. Clientes (/dashboard/customers)
Un CRM básico para gestionar la relación con los jugadores.

Listado de Clientes: Una tabla con todos los usuarios que han reservado al menos una vez.

Perfil del Cliente: Al hacer clic en un cliente, se puede ver su historial de reservas, frecuencia y gasto total.