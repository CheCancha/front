import {
  Wifi, Beer, Building, Flame, ParkingCircle, ShowerHead,
  Store, Swords, UtensilsCrossed, Baby, ThermometerSun,
  Lightbulb, Lock, PartyPopper, Video, PawPrint, GraduationCap, CircleHelp
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface Props extends LucideProps {
  iconName: string | null | undefined;
}

export const AmenityIcon = ({ iconName, ...props }: Props) => {
  switch (iconName) {
    case 'Wifi': return <Wifi {...props} />;
    case 'Beer': return <Beer {...props} />;
    case 'Building': return <Building {...props} />;
    case 'Flame': return <Flame {...props} />;
    case 'ParkingCircle': return <ParkingCircle {...props} />;
    case 'ShowerHead': return <ShowerHead {...props} />;
    case 'Store': return <Store {...props} />;
    case 'Swords': return <Swords {...props} />;
    case 'UtensilsCrossed': return <UtensilsCrossed {...props} />;
    case 'Baby': return <Baby {...props} />;
    case 'ThermometerSun': return <ThermometerSun {...props} />;
    case 'Lightbulb': return <Lightbulb {...props} />;
    case 'Lock': return <Lock {...props} />;
    case 'PartyPopper': return <PartyPopper {...props} />;
    case 'Video': return <Video {...props} />;
    case 'PawPrint': return <PawPrint {...props} />;
    case 'GraduationCap': return <GraduationCap {...props} />;
    default: return <CircleHelp {...props} />;
  }
};