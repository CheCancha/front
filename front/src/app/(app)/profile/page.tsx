"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calendar,
  Phone,
  Loader2,
  Edit3,
  ShieldCheck,
  Camera,
  X,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { PasswordInput } from "@/shared/components/ui/Input";

// --- TIPOS ---
type Booking = {
  id: string;
  court: string;
  date: string; 
  startTime: string;
  status: string;
  complex: string;
};

type ProfileResponse = {
  phone?: string;
  image?: string;
  bookings?: Booking[];
};

// --- Esquema de validación (sin cambios) ---
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
  const [phone, setPhone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState(
    session?.user?.image || ""
  );

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

  const imagePreview = useMemo(() => {
    if (profileImageFile) {
      return URL.createObjectURL(profileImageFile);
    }
    return (
      profileImageUrl ||
      `https://ui-avatars.com/api/?name=${
        user?.name || "User"
      }&background=random`
    );
  }, [profileImageFile, profileImageUrl, user?.name]);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/profile");
          if (!res.ok) throw new Error("Error al cargar el perfil");
          const data: ProfileResponse = await res.json();
          setPhone(data.phone || "");
          setProfileImageUrl(data.image || user?.image || "");
          setUserBookings(data.bookings || []);
        } catch (err) {
          toast.error("No se pudo cargar tu información.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [status, user?.image]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-brand-orange" />
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
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }
      const res = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo actualizar el perfil");

      if (data.profileImageUrl) {
        setProfileImageUrl(data.profileImageUrl);
      }

      await update({ image: data.profileImageUrl });
      toast.success("Perfil actualizado con éxito.", { id: toastId });
      setIsEditingPhone(false);
      setProfileImageFile(null);
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

          {/* Columna Derecha: Reservas */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Mis Últimas Reservas</h2>
            {userBookings.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {userBookings.map((booking) => (
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
                        {booking.date} a las {booking.startTime} hs
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
        </main>
      </div>
    </>
  );
}
