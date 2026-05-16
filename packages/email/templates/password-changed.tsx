import { Heading, Link, Section, Text } from '@react-email/components';

import { EmailShell } from './_components/email-shell';

type PasswordChangedEmailProps = {
  name: string;
  changedAt: string; // formatted date string
  device?: string;
  location?: string;
  contactSecurityUrl: string;
};

/**
 * Notifica di sicurezza inviata DOPO un cambio password andato a buon fine.
 * Pattern enterprise: l'utente legittimo conferma con un'occhiata ("ah sì, sono stato io"),
 * l'attaccante che ha resettato la password lascia un trail visibile alla vittima.
 */
export function PasswordChangedEmail({
  name,
  changedAt,
  device,
  location,
  contactSecurityUrl,
}: PasswordChangedEmailProps) {
  return (
    <EmailShell preview="La tua password Desko è stata cambiata.">
      <Heading className="text-[26px] font-bold text-[#0E0F0C] mt-0 mb-4 leading-tight tracking-tight">
        Password aggiornata.
      </Heading>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-4">
        Ciao {name}, la password del tuo account Desko è stata cambiata con successo.
      </Text>

      <Section className="my-6 p-4 bg-[#F4F2EC] rounded-md border border-[#E0DCD0]">
        <Text className="m-0 text-[13px] text-[#868685] uppercase tracking-wide font-semibold">
          Dettagli
        </Text>
        <Text className="m-0 mt-2 text-[14px] text-[#0E0F0C] leading-relaxed">
          <strong>Quando:</strong> {changedAt}
          {device ? (
            <>
              <br />
              <strong>Dispositivo:</strong> {device}
            </>
          ) : null}
          {location ? (
            <>
              <br />
              <strong>Posizione:</strong> {location}
            </>
          ) : null}
        </Text>
      </Section>

      <Text className="text-[15px] text-[#454745] leading-relaxed mb-6">
        <strong>Sei stato tu?</strong> Tutto ok, puoi ignorare questa email.
        <br />
        <strong>Non sei stato tu?</strong> Contatta subito l&apos;IT — qualcuno potrebbe
        aver compromesso il tuo account.
      </Text>

      <Section className="my-6">
        <Link
          href={contactSecurityUrl}
          className="inline-block rounded-md bg-[#C73E44] px-6 py-3 text-[15px] font-semibold text-white no-underline"
        >
          Non sono stato io · contatta IT
        </Link>
      </Section>
    </EmailShell>
  );
}

export default PasswordChangedEmail;
