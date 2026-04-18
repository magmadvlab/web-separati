import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlanCardProps {
  name: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  badgeColor?: string;
  selected: boolean;
  onSelect: () => void;
  gradient?: boolean;
}

export function PlanCard({
  name,
  price,
  period,
  features,
  badge,
  badgeColor = 'blue',
  selected,
  onSelect,
  gradient = false,
}: PlanCardProps) {
  const borderColor = selected ? 'border-blue-500 border-4' : 'border-gray-200 border-2';
  const bgColor = gradient ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-white';

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${borderColor} ${bgColor}`}
      onClick={onSelect}
    >
      {badge && (
        <div className={`absolute top-0 right-0 bg-${badgeColor}-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg`}>
          {badge}
        </div>
      )}
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h4 className={`text-2xl font-bold mb-2 ${gradient ? 'text-white' : 'text-gray-900'}`}>
            {name}
          </h4>
          <div className={`text-4xl font-bold mb-1 ${gradient ? 'text-white' : 'text-gray-900'}`}>
            {price}
          </div>
          {period && (
            <p className={`text-sm ${gradient ? 'text-green-100' : 'text-gray-600'}`}>
              {period}
            </p>
          )}
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gradient ? 'text-white' : 'text-green-600'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {selected && (
          <Badge className="w-full justify-center bg-blue-600 text-white">
            Selezionato
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
