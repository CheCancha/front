"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Calendar, User, Mail, Phone, Loader2, Edit3 } from "lucide-react";

type Booking = {
  id: string;
  court: string;
  date: string;
  startTime: string;
  status: string;
  complex: string;
};

type BookingResponse = {
  id: string;
  court: string;
  date: string;
  startTime: string;
  status: string;
  complex?: string;
};

type ProfileResponse = {
  phone?: string;
  bookings?: BookingResponse[];
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [phone, setPhone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const user = session?.user;

  // --- Cargar datos del backend ---
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Error al cargar el perfil");
        const data: ProfileResponse = await res.json();

        setPhone(data.phone || "");
        // Mapear reservas para asegurarnos de que startTime sea string formateado
        const bookings: Booking[] = (data.bookings || []).map((b: BookingResponse) => ({
          id: b.id,
          court: b.court,
          date: b.date,
          startTime: b.startTime,
          status: b.status,
          complex: b.complex || "Complejo sin nombre",
        }));
        setUserBookings(bookings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <p>Acceso denegado.</p>;
  }

  // --- Actualizar datos del perfil ---
  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("phone", phone);
      if (password) formData.append("password", password);
      if (profileImage) formData.append("profileImage", profileImage);

      const res = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al actualizar el perfil");
      alert("Perfil actualizado correctamente");
      setPassword("");
      setProfileImage(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el perfil");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Información Personal */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-4">Información Personal</h2>

          {/* Nombre */}
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-500" />
            <span className="text-gray-800">
              {user?.name || "No especificado"}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-500" />
            <span className="text-gray-800">
              {user?.email || "No especificado"}
            </span>
          </div>

          {/* Teléfono editable */}
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-500" />
            {isEditingPhone ? (
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border rounded px-2 py-1 text-gray-800"
              />
            ) : (
              <span className="text-gray-800">
                {phone || "No especificado"}
              </span>
            )}
            <button
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditingPhone(!isEditingPhone)}
            >
              <Edit3 size={16} />
            </button>
          </div>

          {/* Contraseña editable */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Contraseña</span>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-2 py-1 text-gray-800 flex-1"
            />
          </div>

          {/* Imagen de perfil */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500">Imagen de Perfil</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
              className="border rounded px-2 py-1 text-gray-800"
            />
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleUpdateProfile}
            disabled={updating}
            className="bg-black text-white px-4 py-2 rounded hover:opacity-90 transition duration-300"
          >
            {updating ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

        {/* Historial de Reservas */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Mis Próximas Reservas</h2>
          <ul className="divide-y divide-gray-200">
            {userBookings.map((booking) => (
              <li
                key={booking.id}
                className="py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {booking.complex}
                  </p>{" "}
                  {/* Nombre del complejo */}
                  <p className="text-gray-700">{booking.court}</p>{" "}
                  {/* Nombre de la cancha */}
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={14} />
                    {booking.date} a las {booking.startTime} hs
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.status === "Confirmado"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {booking.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}