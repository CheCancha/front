"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calendar,
  Phone,
  Edit3,
  ShieldCheck,
  X,
  AlertTriangle,
  BellRing,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PasswordInput } from "@/shared/components/ui/Input";
import { format, differenceInHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Award, Clock, Star, Trophy } from "lucide-react";
import { Spinner } from "@/shared/components/ui/Spinner";
import { ModalProfile } from "@/shared/components/ui/ModalProfile";
import { Button } from "@/shared/components/ui/button";
import { NotificationToggle } from "@/shared/components/ui/NotificationToggle";
import { cn } from "@/lib/utils";

// --- TIPOS  ---
type Booking = {
  id: string;
  court: string;
  date: string;
  startTime: string;
  status: string;
  complex: string;
  complexId: string;
  cancellationPolicyHours: number;
  hasReview: boolean;
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
  isNotificationsEnabled?: boolean;
};

// --- COMPONENTES AUXILIARES ---
const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center p-4 bg-white border rounded-xl">
    <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-brand-dark">{value}</p>
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
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  
  // --- ESTADOS PARA CANCELACIÓN ---
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const user = session?.user;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isUpdatingPassword },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const fetchProfile = async () => {
    if (!loading) setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Error al cargar el perfil");
      const data: ProfileResponse = await res.json();
      setPhone(data.phone || "");
      setUserBookings(data.bookings || []);
      setStats(data.stats || null);
      setIsNotificationsEnabled(data.isNotificationsEnabled || false);
    } catch (err) {
      toast.error("No se pudo cargar tu información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

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

  const handleOpenRatingModal = (booking: Booking) => {
    setBookingToRate(booking);
    setRating(0);
    setComment("");
    setIsRatingModalOpen(true);
  };

  const handlePostReview = async () => {
    if (!bookingToRate || rating === 0) {
      toast.error("Por favor, seleccioná una calificación de 1 a 5 estrellas.");
      return;
    }
    setIsSubmittingReview(true);
    const toastId = toast.loading("Enviando calificación...");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingToRate.id,
          complexId: bookingToRate.complexId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar la calificación.");
      }

      toast.success("¡Gracias por tu calificación!", { id: toastId });
      setIsRatingModalOpen(false);
      await fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido", {
        id: toastId,
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // --- LÓGICA DE CANCELACIÓN ---
  const handleOpenCancelModal = (booking: Booking) => {
    setBookingToCancel(booking);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    const toastId = toast.loading("Cancelando reserva...");
    try {
      const res = await fetch(`/api/bookings/${bookingToCancel.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo cancelar la reserva.");
      }
      toast.success("Reserva cancelada correctamente.", { id: toastId });
      setIsCancelModalOpen(false);
      setBookingToCancel(null);
      await fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido", {
        id: toastId,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancellationTimely = useMemo(() => {
    if (!bookingToCancel) return false;
    const now = new Date();
    const bookingDate = parseISO(bookingToCancel.date);
    const hoursDifference = differenceInHours(bookingDate, now);
    return hoursDifference >= bookingToCancel.cancellationPolicyHours;
  }, [bookingToCancel]);

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

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="min-h-screen p-4 sm:p-6">
        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Perfil y Seguridad */}
          <div className="lg:col-span-1 space-y-8">
            {/* Tarjeta de Información Personal */}
            <div className="bg-white p-6 rounded-2xl border">
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
                  className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-orange hover:text-brand-dark transition-colors disabled:bg-gray-400 flex items-center justify-center cursor-pointer"
                >
                  {isUpdatingInfo ? <Spinner /> : "Guardar Información"}
                </button>
              </form>
            </div>

            {/* Tarjeta de Información Personal */}
            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BellRing size={20} /> Notificaciones
              </h3>
              <NotificationToggle initialState={isNotificationsEnabled} />
            </div>


            {/* Tarjeta de Seguridad */}
            <div className="bg-white p-6 rounded-2xl border">
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
                  className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-orange hover:text-brand-dark transition-colors disabled:bg-gray-400 flex items-center justify-center cursor-pointer"
                >
                  {isUpdatingPassword ? <Spinner /> : "Cambiar Contraseña"}
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: KPIs y Reservas */}
          <div className="lg:col-span-2 space-y-8">
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
            <div className="bg-white p-6 rounded-2xl border">
              <h2 className="text-xl font-semibold mb-4">Mis Reservas</h2>
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  {["Próximas", "Completadas", "Historial"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setBookingFilter(tab)}
                      className={`${
                        bookingFilter === tab
                          ? "border-brand-secondary text-brand-secondary"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              {filteredBookings.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold text-brand-dark">
                          {booking.complex}
                        </p>
                        <p className="text-gray-700">{booking.court}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Calendar size={14} />
                          {format(
                            parseISO(booking.date),
                            "eeee dd 'de' MMMM, yyyy",
                            { locale: es }
                          )}
                          a las {booking.startTime} hs
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            booking.status === "CONFIRMADO"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "PENDIENTE"
                              ? "bg-yellow-100 text-yellow-800"
                              : booking.status === "COMPLETADO"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                        {/* Botón de Cancelar para reservas próximas */}       
                        {bookingFilter === "Próximas" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenCancelModal(booking)}
                          >
                            Cancelar                
                          </Button>
                        )}
                        {/* Botón de Calificar para reservas completadas */}
                        {bookingFilter === "Completadas" &&
                          !booking.hasReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRatingModal(booking)}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Calificar
                            </Button>
                          )}
                      </div>
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

      {/* Modal de Confirmación de Cancelación --- */}
      <ModalProfile
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirmar Cancelación"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0">
              <AlertTriangle
                className="h-6 w-6 text-red-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-0 text-left">
              <h3 className="text-lg leading-6 font-medium text-brand-dark">
                ¿Estás seguro de que querés cancelar esta reserva?
              </h3>
              <div className="mt-2">
                {isCancellationTimely ? (
                  <p className="text-sm text-gray-500">
                    Estás cancelando dentro del período permitido. El club será
                    notificado para coordinar la devolución de tu seña.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Estás cancelando fuera del período permitido. Según la
                    política del club, la seña no será reembolsada.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="w-full sm:ml-3 sm:w-auto"
            >
              {isCancelling ? <Spinner /> : "Sí, cancelar"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsCancelModalOpen(false)}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              No, volver
            </Button>
          </div>
        </div>
      </ModalProfile>

      <ModalProfile
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        title="Calificá tu experiencia"
      >
        <div className="p-6 space-y-6">
          <div>
            <p className="text-center font-medium">{bookingToRate?.complex}</p>
            <p className="text-center text-sm text-gray-500">
              {bookingToRate?.court}
            </p>
          </div>

          {/* Componente de Estrellas */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  className={cn(
                    "w-10 h-10 transition-colors",
                    star <= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 hover:text-yellow-300"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Campo de Comentario */}
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dejá un comentario (opcional)
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange"
              placeholder="¿Qué te pareció la cancha, las instalaciones, etc.?"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsRatingModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handlePostReview}
              disabled={isSubmittingReview || rating === 0}
            >
              {isSubmittingReview ? <Spinner /> : "Enviar Calificación"}
            </Button>
          </div>
        </div>
      </ModalProfile>
    </>
  );
}
