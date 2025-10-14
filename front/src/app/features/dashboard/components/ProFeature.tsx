import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Star, Zap } from 'lucide-react';

interface ProFeaturePaywallProps {
  complexId: string;
  featureName: string;
  description: string;
}

export const ProFeaturePaywall: React.FC<ProFeaturePaywallProps> = ({ complexId, featureName, description }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white p-8 md:p-12 rounded-lg border shadow-sm">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 text-yellow-500 mb-6">
        <Star className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">
        Mejorá tu Plan para Acceder a {featureName}
      </h2>
      <p className="mt-2 max-w-lg text-gray-600">
        {description}
      </p>
      {/* <Button asChild className="mt-8 bg-gradient-to-r from-brand-orange to-brand-secondary text-white hover:brightness-110"> */}
      <Button asChild className="mt-8 bg-brand-orange hover:brightness-110">
        <Link href={`/dashboard/${complexId}/billing`}>
          <Zap className="mr-2 h-4 w-4" />
          Ver Planes Pro
        </Link>
      </Button>
    </div>
  );
};
