'use client';

import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { rateRestaurant } from '@desko/server-actions/lunch';
import type { RestaurantWithRating } from '@desko/queries/lunch';

const CUISINE_LABEL: Record<string, string> = {
  italian: 'Italiana',
  pizza: 'Pizza',
  sushi: 'Sushi',
  asian: 'Asiatica',
  salad: 'Insalate',
  burger: 'Burger',
  bistro: 'Bistrot',
  bakery: 'Bakery',
  fusion: 'Fusion',
  other: 'Altro',
};

const PRICE_TONE: Record<string, string> = {
  '€': '#3D87C9',
  '€€': '#D4A625',
  '€€€': '#9C5BCC',
};

function StarRating({
  value,
  onChange,
  pending,
}: {
  value: number; // 0..5
  onChange: (v: number) => void;
  pending: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <Stack direction="row" spacing={0} alignItems="center">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = display >= i;
        return (
          <IconButton
            key={i}
            size="small"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onChange(i);
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            sx={{ p: 0.25, color: active ? 'primary.main' : 'text.disabled' }}
            aria-label={`Vota ${i} stelle`}
          >
            {active ? (
              <StarRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <StarBorderRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        );
      })}
    </Stack>
  );
}

export function RestaurantsGrid({
  restaurants,
}: {
  restaurants: RestaurantWithRating[];
}) {
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
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
      }}
    >
      {restaurants.map((r) => (
        <Card key={r.id} sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  backgroundColor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {r.emoji ?? '🍽️'}
              </Box>
              <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                  {r.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                  noWrap
                >
                  {r.address}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label={CUISINE_LABEL[r.cuisine] ?? r.cuisine}
                size="small"
                sx={{
                  backgroundColor: 'background.default',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              />
              <Chip
                label={r.priceRange}
                size="small"
                sx={{
                  backgroundColor: 'background.default',
                  color: PRICE_TONE[r.priceRange] ?? 'text.primary',
                  fontWeight: 700,
                  fontSize: 11,
                  fontFamily: 'var(--font-jetbrains)',
                }}
              />
              {r.distanceM ? (
                <Chip
                  label={`~${r.distanceM}m`}
                  size="small"
                  sx={{
                    backgroundColor: 'background.default',
                    fontWeight: 600,
                    fontSize: 11,
                    fontFamily: 'var(--font-jetbrains)',
                  }}
                />
              ) : null}
            </Stack>

            {r.description ? (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', lineHeight: 1.4 }}
              >
                {r.description}
              </Typography>
            ) : null}

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ pt: 0.5 }}
            >
              <StarRating
                value={Math.round(r.ratingAvg)}
                onChange={(v) => handleRate(r.id, v)}
                pending={pendingId === r.id}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontFamily: 'var(--font-jetbrains)',
                }}
              >
                {r.ratingCount > 0
                  ? `${r.ratingAvg.toFixed(1)} · ${r.ratingCount} voti`
                  : 'Nessun voto'}
              </Typography>
            </Stack>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}
