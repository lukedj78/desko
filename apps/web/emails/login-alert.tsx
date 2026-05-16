import { Heading, Hr, Link, Section, Text } from '@react-email/components';

import { EmailShell } from './_components/email-shell';

type LoginAlertEmailProps = {
  name: string;
  loggedInAt: string; // formatted date string
  device: string;
  location?: string;
  ipAddress?: string;
  contactSecurityUrl: string;
};

/**
 * Notifica di sicurezza inviata a un utente quando viene rilevato un nuovo login
 * (nuovo dispositivo / nuova location). Pattern enterprise per confermare la
 * legittimità dell'accesso e dare visibility all'utente compromesso.
 */
export function LoginAlertEmail({
  name,
  loggedInAt,
  device,
  location,
  ipAddress,
  contactSecurityUrl,
}: LoginAlertEmailProps) {
  return (
    <EmailShell preview="Nuovo accesso al tuo account Desko.">
      <Heading className="text-[26px] font-bold text-[#0E0F0C] mt-0 mb-4 leading-tight tracking-tight">
        Nuovo accesso al tuo account.
      </Heading>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-4">
        Ciao {name}, abbiamo rilevato un accesso al tuo account Desko da un nuovo
        dispositivo o posizione.
      </Text>

      <Section className="my-6 p-4 bg-[#F4F2EC] rounded-md border border-[#E0DCD0]">
        <Text className="m-0 text-[13px] text-[#868685] uppercase tracking-wide font-semibold">
          Dettagli accesso
        </Text>
        <Text className="m-0 mt-2 text-[14px] text-[#0E0F0C] leading-relaxed">
          <strong>Quando:</strong> {loggedInAt}
          <br />
          <strong>Dispositivo:</strong> {device}
          {location ? (
            <>
              <br />
              <strong>Posizione:</strong> {location}
            </>
          ) : null}
          {ipAddress ? (
            <>
              <br />
              <strong>IP:</strong> {ipAddress}
            </>
          ) : null}
        </Text>
      </Section>

      <Text className="text-[15px] text-[#454745] leading-relaxed mb-6">
        <strong>Sei stato tu?</strong> Tutto ok, puoi ignorare questa email.
        <br />
        <strong>Non sei stato tu?</strong> Cambia subito la password e contatta l&apos;IT.
      </Text>

      <Section className="my-6">
        <Link
          href={contactSecurityUrl}
          className="inline-block rounded-md bg-[#C73E44] px-6 py-3 text-[15px] font-semibold text-white no-underline"
        >
          Non sono stato io · contatta IT
        </Link>
      </Section>

      <Hr className="border-[#E0DCD0] my-6" />

      <Text className="text-[12px] text-[#868685] leading-relaxed">
        Per sicurezza ti notifichiamo solo nuovi dispositivi/posizioni, non ogni singolo
        login. Se cambi sede di lavoro spesso, riceverai più avvisi nei primi giorni.
      </Text>
    </EmailShell>
  );
}

export default LoginAlertEmail;
