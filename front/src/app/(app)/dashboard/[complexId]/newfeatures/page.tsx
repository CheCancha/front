import React from "react";
import {
  Store,
  Package,
  BarChart,
  Users,
  Trophy,
  Sparkles,
  HeartHandshake,
} from "lucide-react";

// --- Sección 1: Próximamente (Control Operativo) ---
const operationalFeatures = [
  {
    icon: Store,
    title: "Punto de Venta (POS) Integrado",
    description:
      "Centraliza tus cobros. Registra bebidas, snacks y alquileres al instante. Menos 'fiado', más control.",
  },
  {
    icon: Package,
    title: "Control de Stock e Inventario",
    description:
      "Profesionaliza la gestión de tu bar y tienda. Sabé exactamente qué tenés y cuándo reponer, todo desde la app.",
  },
  {
    icon: BarChart,
    title: "Métricas Clave de Negocio",
    description:
      "Dejá de usar planillas. Entendé cuánto ganaste hoy, qué cancha es más rentable y cuáles son tus horas pico. Decisiones con datos, no con percepciones.",
  },
];

// --- Sección 2: El Futuro (Crecimiento del Ecosistema) ---
const ecosystemFeatures = [
  {
    icon: Users,
    title: "El 'Muro Social' (Generador de Demanda)",
    description:
      "Tus jugadores publican 'falta 1' en sus redes y vos perdés un turno. Con el Muro Social, la app conecta jugadores y llena esos horarios vacíos automáticamente. Tu comunidad se convierte en tu mejor vendedor.",
  },
  {
    icon: Trophy,
    title: "Gestor de Torneos (Para Todos)",
    description:
      "Permitiremos que CUALQUIER jugador (o vos) organice torneos, gestione inscripciones y arme fixtures. ¿El beneficio para vos? Más actividad en tu complejo, nuevos clientes y un ecosistema del que nadie se quiere ir.",
  },
  {
    icon: Sparkles,
    title: "Matchmaking y Marketing con IA",
    description:
      "La IA analizará el comportamiento de los jugadores para sugerir partidos ('Matchmaking Inteligente') e identificará clientes 'dormidos' para que les envíes promociones de reactivación con un solo clic. Automatizás tu retención.",
  },
];

// --- Componente Reutilizable para la Lista de Features ---
const FeatureListItem = ({
  icon: Icon,
  title,
  description,
}: (typeof operationalFeatures)[0]) => (
  <li className="flex gap-4">
    <div className="flex-shrink-0">
      <div className="bg-brand-orange/10 p-3 rounded-lg">
        <Icon className="h-6 w-6 text-brand-orange" strokeWidth={2} />
      </div>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-gray-600">{description}</p>
    </div>
  </li>
);

// --- Componente de la Página ---
const newFeaturesPage = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* 1. Encabezado (Hero) */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-switzer font-bold text-brand-dark mb-4 tracking-tight">
          Tu complejo. Tu comunidad. Tu negocio.
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
          Dejá atrás el caos del WhatsApp y las planillas. Te presentamos el{" "}
          <span className="text-brand-blue font-switzer italic font-semibold">
            Ecosistema Che Cancha 360
          </span>
          , diseñado para resolver tus operaciones y potenciar tu crecimiento.
        </p>
      </div>

      {/* 2. Sección "Próximamente" (Control Operativo) */}
      <div className="mb-20">
        <div className="text-left mb-10">
          <span className="bg-orange-100 text-brand-orange font-semibold px-4 py-1 rounded-full text-sm">
            PRÓXIMAMENTE
          </span>
          <h2 className="text-3xl font-switzer font-bold text-gray-900 mt-4">
            Paso 1: Tomá el Control Operativo y Financiero
          </h2>
          <p className="text-lg text-gray-600 mt-2">
            Las herramientas que te faltaban para dejar de adivinar y empezar a
            saber.
          </p>
        </div>

        <ul className="space-y-8">
          {operationalFeatures.map((feature) => (
            <FeatureListItem
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </ul>
      </div>

      {/* 3. Sección "El Futuro" (Crecimiento del Ecosistema) */}
      <div className="mb-20">
        <div className="text-left mb-10">
          <span className="bg-gray-200 text-gray-700 font-semibold px-4 py-1 rounded-full text-sm">
            EL FUTURO DEL CRECIMIENTO
          </span>
          <h2 className="text-3xl font-switzer font-bold text-gray-900 mt-4">
            Paso 2: Activá tu Propio Motor de Ventas
          </h2>
          <p className="text-lg text-gray-600 mt-2">
            El verdadero crecimiento no viene de vos, sino de tu comunidad.
            Estamos construyendo las herramientas para que tus propios jugadores
            se conviertan en tus mejores vendedores.
          </p>
        </div>

        <ul className="space-y-8">
          {ecosystemFeatures.map((feature) => (
            <FeatureListItem
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </ul>
      </div>

      <div className="bg-white border-2 border-brand-orange rounded-xl p-8 md:p-12 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:gap-8">
          <div className="flex-shrink-0 text-center md:text-left mb-6 md:mb-0">
            <HeartHandshake
              className="h-20 w-20 text-brand-orange mx-auto md:mx-0"
              strokeWidth={1.5}
            />
          </div>

          <div>
            <h2 className="text-2xl font-switzer font-semibold text-gray-900 mb-3">
              Un Compromiso para Crecer Juntos
            </h2>
            <p className="text-gray-700 text-base mb-4">
              Che Cancha nació en Tostado para resolver los problemas que todos
              vivimos. Vimos el caos de los cuadernos y el WhatsApp, y supimos
              que podíamos crear algo mejor.
            </p>
            <p className="text-gray-700 text-base mb-4">
              Para que esta visión 360 funcione, te necesitamos. Esta hoja de
              ruta es una invitación a ser{" "}
              <strong className="text-brand-dark">socio fundador</strong> de
              este ecosistema.
            </p>
            <p className="text-gray-900 font-semibold">
              Al adoptar estas herramientas, no solo optimizás tu negocio: estás
              invirtiendo en profesionalizar el deporte amateur en nuestra
              ciudad, creando una comunidad más conectada y activa para todos.
            </p>
            <p className="text-gray-700 text-base mt-4">
              Tu feedback en esta etapa temprana es lo que nos permitirá
              construir algo que realmente funcione. Contamos con vos.
            </p>
          </div>
        </div>
      </div>
      {/* --- FIN DE LA NUEVA SECCIÓN --- */}
    </div>
  );
};

export default newFeaturesPage;
