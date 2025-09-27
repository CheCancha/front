"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Phone, Loader2, Edit3, ShieldCheck, X } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PasswordInput } from "@/shared/components/ui/Input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Award, Clock, Star, Trophy } from "lucide-react";
import { Spinner } from "@/shared/components/ui/Spinner";

// --- TIPOS ---
type Booking = {
  id: string;
  court: string;
  date: string;
  startTime: string;
  status: string;
  complex: string;
};

type ProfileStats = {
  totalBookings: number;
  completedBookings: number;
  hoursPlayed: number;
  favoriteComplex: string | null;
};

type ProfileResponse = {
  phone?: string;
  image?: string;
  bookings?: Booking[];
  stats?: ProfileStats;
};

// --- COMPONENTE PARA LAS TARJETAS DE ESTADÍSTICAS ---
const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center p-4 bg-gray-100 rounded-xl">
    <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

// --- Esquema de validación ---
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida."),
    newPassword: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las nuevas contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [bookingFilter, setBookingFilter] = useState("Próximas");
  const [phone, setPhone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const user = session?.user;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isUpdatingPassword },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (status === "authenticated") {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/profile");
          if (!res.ok) throw new Error("Error al cargar el perfil");
          const data: ProfileResponse = await res.json();
          setPhone(data.phone || "");
          setUserBookings(data.bookings || []);
          setStats(data.stats || null);
        } catch (err) {
          toast.error("No se pudo cargar tu información.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [status, user]); // <-- CORRECCIÓN 1

  const filteredBookings = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // <-- CORRECCIÓN 2

    switch (bookingFilter) {
      case "Próximas":
        return userBookings.filter(
          (b) => b.status === "CONFIRMADO" && new Date(b.date) >= now
        );
      case "Completadas":
        return userBookings.filter((b) => b.status === "COMPLETADO");
      case "Historial":
        return userBookings.filter(
          (b) =>
            b.status === "CANCELADO" ||
            b.status === "PENDIENTE" ||
            (b.status === "CONFIRMADO" && new Date(b.date) < now)
        );
      default:
        return userBookings;
    }
  }, [userBookings, bookingFilter]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spinner />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <p className="text-center mt-10">
        Acceso denegado. Por favor, inicia sesión.
      </p>
    );
  }

  const handleUpdateInfo = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdatingInfo(true);
    const toastId = toast.loading("Actualizando información...");
    try {
      const formData = new FormData();
      formData.append("phone", phone);
      const res = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo actualizar el perfil");

      await update({ image: data.profileImageUrl });
      toast.success("Perfil actualizado con éxito.", { id: toastId });
      setIsEditingPhone(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido", {
        id: toastId,
      });
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    const toastId = toast.loading("Cambiando contraseña...");
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const responseData = await res.json();
      if (!res.ok)
        throw new Error(
          responseData.error || "No se pudo cambiar la contraseña"
        );

      toast.success("Contraseña cambiada con éxito.", { id: toastId });
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido", {
        id: toastId,
      });
    }
  };

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Perfil y Seguridad */}
          <div className="lg:col-span-1 space-y-8">
            {/* Tarjeta de Información Personal */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {user?.name}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <hr className="my-6" />
              <form onSubmit={handleUpdateInfo} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Phone size={20} className="text-gray-400" />
                  <div className="flex-grow">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-500"
                    >
                      Teléfono
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-gray-800 bg-transparent border-b focus:outline-none focus:border-brand-orange"
                      readOnly={!isEditingPhone}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(!isEditingPhone)}
                    className="text-gray-500 hover:text-brand-orange"
                  >
                    {isEditingPhone ? <X size={20} /> : <Edit3 size={18} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingInfo}
                  className="w-full bg-brand-orange text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-orange/90 transition-colors disabled:bg-brand-orange/50 flex items-center justify-center cursor-pointer"
                >
                  {isUpdatingInfo ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Guardar Información"
                  )}
                </button>
              </form>
            </div>

            {/* Tarjeta de Seguridad */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck size={20} /> Seguridad
              </h3>
              <form
                onSubmit={handleSubmit(handleChangePassword)}
                className="space-y-4"
              >
                <PasswordInput
                  label="Contraseña Actual"
                  register={register("currentPassword")}
                  error={errors.currentPassword?.message}
                  autoComplete="current-password"
                />
                <PasswordInput
                  label="Nueva Contraseña"
                  register={register("newPassword")}
                  error={errors.newPassword?.message}
                  autoComplete="new-password"
                />
                <PasswordInput
                  label="Confirmar Nueva Contraseña"
                  register={register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                />
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400 flex items-center justify-center cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Cambiar Contraseña"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: KPIs y Reservas */}
          <div className="lg:col-span-2 space-y-8">
            {/* --- SECCIÓN DE KPIs --- */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard
                  icon={Trophy}
                  label="Reservas Totales"
                  value={stats.totalBookings}
                />
                <StatCard
                  icon={Clock}
                  label="Horas Jugadas"
                  value={stats.hoursPlayed}
                />
                <StatCard
                  icon={Award}
                  label="Reservas Completadas"
                  value={stats.completedBookings}
                />
                <StatCard
                  icon={Star}
                  label="Tu Club Favorito"
                  value={stats.favoriteComplex || "-"}
                />
              </div>
            )}

            {/* --- SECCIÓN DE RESERVAS --- */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Mis Reservas</h2>

              {/* --- PESTAÑAS DE FILTRO --- */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  {["Próximas", "Completadas", "Historial"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setBookingFilter(tab)}
                      className={`${
                        bookingFilter === tab
                          ? "border-brand-orange text-brand-orange"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* LISTA DE RESERVAS FILTRADA */}
              {filteredBookings.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.complex}
                        </p>
                        <p className="text-gray-700">{booking.court}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Calendar size={14} />
                          {format(
                            new Date(booking.date),
                            "eeee dd 'de' MMMM, yyyy",
                            { locale: es }
                          )}{" "}
                          a las {booking.startTime} hs
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          booking.status === "CONFIRMADO"
                            ? "bg-blue-100 text-blue-800"
                            : booking.status === "PENDIENTE"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "COMPLETADO"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>Todavía no tenés reservas.</p>
                  <p className="text-sm">¡Buscá una cancha y empezá a jugar!</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
