import { Complex, Schedule, Court, Image, Sport, PriceRule } from "@prisma/client";

export type CourtWithRelations = Court & { 
  sport: Sport;
  priceRules: (PriceRule | NewPriceRule)[];
};

export type FullComplexData = Complex & {
  schedule: Schedule | null;
  courts: CourtWithRelations[]; 
  images: Image[];
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