'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Star Rating Component
interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      // Toggle off if clicking same rating
      onChange(rating === value ? 0 : rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              'focus:outline-none transition-all duration-150',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => handleClick(star)}
          >
            <Star
              className={cn(
                sizeMap[size],
                'transition-colors duration-150',
                (hover || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      )}
    </div>
  );
}

// Rating Summary Component
interface RatingSummaryProps {
  averageRating: number;
  totalRatings: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

export function RatingSummary({ averageRating, totalRatings, distribution }: RatingSummaryProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">
          {averageRating.toFixed(1)}
        </div>
        <div className="flex flex-col">
          <StarRating value={Math.round(averageRating)} readonly size="sm" />
          <span className="text-sm text-muted-foreground">
            {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </span>
        </div>
      </div>

      {/* Rating Distribution */}
      {totalRatings > 0 && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm w-8">{star} ★</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${(distribution[star as keyof typeof distribution] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12">
                {distribution[star as keyof typeof distribution]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StarRating;
