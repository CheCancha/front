import {
  Complex,
  ContactPhone,
  Schedule,
  Court,
  Image,
  Sport,
  PriceRule,
  SubscriptionCycle,
  SubscriptionPlan,
  SubscriptionStatus,
  Coupon,
  Booking,
} from "@prisma/client";

export type CourtWithRelations = Court & {
  sport: Sport;
  priceRules: (PriceRule | NewPriceRule)[];
};

export type FullComplexData = Complex & {
  schedule: Schedule | null;
  courts: CourtWithRelations[];
  images: Image[];
  amenities: Sport[];
  contactPhones: ContactPhone[];
};

export interface NewPriceRule {
  tempId: string;
  startTime: number;
  endTime: number;
  price: number;
  depositAmount: number;
}

export interface NewCourt {
  tempId: string;
  name: string;
  sportId: string;
  slotDurationMinutes: number;
  priceRules: NewPriceRule[];
  isNew: true;
}

export type ComplexWithManager = {
  id: string;
  name: string;
  manager: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionCycle: SubscriptionCycle | null;
  trialEndsAt: Date | null;
  subscribedAt: Date | null;
  onboardingCompleted: boolean;
  hasCourts: boolean;
  hasSchedule: boolean;
  hasPaymentInfo: boolean;
};

export type CourtWithSportAndPriceRules = Court & {
  sport: Sport;
  priceRules: PriceRule[];
};

export type ComplexWithCourts = Complex & {
  courts: CourtWithSportAndPriceRules[];
  schedule: Schedule | null;
};

export type BlockedSlotEvent = {
  id: string;
  type: "BLOCKED_SLOT";
  date: Date | string;
  startTime: number;
  startMinute: number;
  endTime: string;
  court: { id: string; name: string };
  user: { name: string };
  status: "BLOQUEADO";
};

export type FixedSlotEvent = {
  id: string;
  type: "FIXED_SLOT";
  date: Date | string;
  startTime: number;
  startMinute: number;
  endTime: string;
  court: { id: string; name: string };
  user: { name: string };
  status: "ABONO" | "ENTRENAMIENTO";
  fixedSlotId: string;
};

export type CourtWithSport = Court & { sport: { name: string } };
export type BookingWithDetails = Booking & {
  court: { id: string; name: string; slotDurationMinutes: number };
  user?: { name: string | null; phone: string | null } | null;
  coupon?: Coupon | null;
};
// Un "Booking" como lo formatea la API
export type BookingEvent = BookingWithDetails & { type: "BOOKING" };

// El nuevo estado solo puede ser uno de estos dos
export type CalendarEvent = BookingEvent | BlockedSlotEvent | FixedSlotEvent;
