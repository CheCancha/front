import {
  Complex,
  Schedule,
  Court,
  Image,
  Sport,
  PriceRule,
  SubscriptionCycle,
  SubscriptionPlan,
  SubscriptionStatus,
  Amenity,
  Image as PrismaImage,
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