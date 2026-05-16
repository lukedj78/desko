import { Utensils } from 'lucide-react';

import { Eyebrow } from '@/components/ui/eyebrow';
import { getCurrentUser } from '@desko/auth/server';
import { getLunchProposalsForDate, getRestaurants } from '@desko/queries/lunch';
import { searchUsers } from '@desko/queries/presence';

import { CreateProposalButton } from './_components/create-proposal-button';
import { LunchProposalsList } from './_components/lunch-proposals-list';
import { RestaurantsGrid } from './_components/restaurants-grid';

export const metadata = { title: 'Pausa pranzo' };
export const dynamic = 'force-dynamic';

const isoToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isoTomorrow = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDayLabel = (iso: string) => {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(d);
};

export default async function LunchPage() {
  const today = isoToday();
  const tomorrow = isoTomorrow();

  const [me, restaurants, todayProposals, tomorrowProposals, allUsers] = await Promise.all([
    getCurrentUser(),
    getRestaurants(),
    getLunchProposalsForDate(today),
    getLunchProposalsForDate(tomorrow),
    searchUsers('', 200),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Pausa pranzo</Eyebrow>
            <h1 className="font-sans text-3xl md:text-4xl font-bold leading-tight tracking-[-0.4px]">
              Pranziamo insieme.
            </h1>
            <p className="text-base text-muted-foreground">
              Crea una proposta, scegli un ristorante in zona, invita i colleghi.
              Pubblica visibile a tutti, privata solo agli invitati.
            </p>
          </div>
          <CreateProposalButton restaurants={restaurants} invitableUsers={allUsers} />
        </div>

        {/* Oggi */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h2 className="text-xl font-bold">Oggi</h2>
            <span className="text-xs text-muted-foreground capitalize">{formatDayLabel(today)}</span>
          </div>
          <LunchProposalsList proposals={todayProposals} myUserId={me.id} emptyAction />
        </div>

        {/* Domani — solo se ci sono proposte visibili */}
        {tomorrowProposals.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <h2 className="text-xl font-bold">Domani</h2>
              <span className="text-xs text-muted-foreground capitalize">{formatDayLabel(tomorrow)}</span>
            </div>
            <LunchProposalsList proposals={tomorrowProposals} myUserId={me.id} />
          </div>
        ) : null}

        {/* Ristoranti */}
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-center gap-2">
              <Utensils className="size-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">Ristoranti in zona</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {restaurants.length} luoghi · zona Gae Aulenti
            </span>
          </div>
          <RestaurantsGrid restaurants={restaurants} />
        </div>

        {/* Privacy footer */}
        <p className="text-xs text-muted-foreground">
          Le proposte pubbliche sono visibili a tutti i colleghi attivi (anche chi è in
          remoto). Le proposte private sono visibili solo agli invitati.
        </p>
      </div>
    </div>
  );
}
