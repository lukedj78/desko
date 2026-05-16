'use client';

import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { RestaurantWithRating } from '@desko/queries/lunch';
import { rateRestaurant } from '@desko/server-actions/lunch';
import { cn } from '@/lib/utils';

const CUISINE_LABEL: Record<string, string> = {
  italian: 'Italiana', pizza: 'Pizza', sushi: 'Sushi', asian: 'Asiatica',
  salad: 'Insalate', burger: 'Burger', bistro: 'Bistrot', bakery: 'Bakery',
  fusion: 'Fusion', other: 'Altro',
};

function StarRating({
  value, onChange, pending,
}: { value: number; onChange: (v: number) => void; pending: boolean }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          disabled={pending}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
          aria-label={`Vota ${i} stelle`}
        >
          <Star
            className={cn(
              'size-4',
              display >= i ? 'fill-primary text-primary' : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function RestaurantsGrid({ restaurants }: { restaurants: RestaurantWithRating[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleRate = (restaurantId: string, score: number) => {
    setPendingId(restaurantId);
    startTransition(async () => {
      const res = await rateRestaurant({ restaurantId, score });
      setPendingId(null);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {restaurants.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-muted/50 text-xl shrink-0">
                {r.emoji ?? '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.address}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{CUISINE_LABEL[r.cuisine] ?? r.cuisine}</Badge>
              <Badge variant="secondary" className="font-mono">{r.priceRange}</Badge>
              {r.distanceM ? (
                <Badge variant="secondary" className="font-mono">~{r.distanceM}m</Badge>
              ) : null}
            </div>
            {r.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {r.description}
              </p>
            ) : null}
            <div className="flex items-center justify-between pt-1">
              <StarRating
                value={Math.round(r.ratingAvg)}
                onChange={(v) => handleRate(r.id, v)}
                pending={pendingId === r.id}
              />
              <span className="text-xs text-muted-foreground font-mono">
                {r.ratingCount > 0 ? `${r.ratingAvg.toFixed(1)} · ${r.ratingCount} voti` : 'Nessun voto'}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
