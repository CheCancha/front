// front/src/shared/entities/booking/bookingTypes.ts (o donde manejes tus types)
import { BookingPlayer } from "@prisma/client";

export type UserSnippet = {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
};

// El tipo que devuelve la API GET /players
export type BookingPlayerWithUser = BookingPlayer & { user: UserSnippet | null };

// El tipo que devuelve la API POST /users (para el buscador)
export type UserForSearch = {
    id: string;
    name: string;
    email: string | null;
};