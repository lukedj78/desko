import { Heading, Hr, Link, Section, Text } from '@react-email/components';

import { EmailShell } from './_components/email-shell';

type BanNoticeEmailProps = {
  name: string;
  reason: string;
  expiresAt: string | null; // formatted date string, null = perma-ban
  contactSupportUrl: string;
};

/**
 * Notifica inviata all'utente quando il suo account viene bannato.
 * Trasparente sul motivo + canale di appello.
 */
export function BanNoticeEmail({
  name,
  reason,
  expiresAt,
  contactSupportUrl,
}: BanNoticeEmailProps) {
  return (
    <EmailShell preview="Il tuo accesso a Desko è stato sospeso.">
      <Heading className="text-[26px] font-bold text-[#0E0F0C] mt-0 mb-4 leading-tight tracking-tight">
        Accesso sospeso.
      </Heading>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-4">
        Ciao {name}, il tuo accesso a Desko è stato sospeso da un amministratore.
      </Text>

      <Section className="my-6 p-4 bg-[#FAE2E3] rounded-md border border-[#C73E44]">
        <Text className="m-0 text-[13px] text-[#8B2229] uppercase tracking-wide font-semibold">
          Motivo
        </Text>
        <Text className="m-0 mt-2 text-[14px] text-[#0E0F0C] leading-relaxed">
          {reason}
        </Text>
      </Section>

      <Section className="my-6 p-4 bg-[#F4F2EC] rounded-md border border-[#E0DCD0]">
        <Text className="m-0 text-[13px] text-[#868685] uppercase tracking-wide font-semibold">
          Durata
        </Text>
        <Text className="m-0 mt-2 text-[14px] text-[#0E0F0C] leading-relaxed">
          {expiresAt ? (
            <>
              La sospensione termina automaticamente il{' '}
              <strong>{expiresAt}</strong>. Dopo quella data potrai accedere normalmente.
            </>
          ) : (
            <>Sospensione a tempo indeterminato.</>
          )}
        </Text>
      </Section>

      <Text className="text-[15px] text-[#454745] leading-relaxed mb-6">
        Se pensi sia un errore o vuoi fare appello, contatta il supporto IT.
      </Text>

      <Section className="my-6">
        <Link
          href={contactSupportUrl}
          className="inline-block rounded-md bg-[#0E0F0C] px-6 py-3 text-[15px] font-semibold text-white no-underline"
        >
          Contatta supporto
        </Link>
      </Section>

      <Hr className="border-[#E0DCD0] my-6" />

      <Text className="text-[12px] text-[#868685] leading-relaxed">
        Le tue presenze passate restano nel sistema secondo la retention policy aziendale.
        Se vuoi richiedere la cancellazione completa dei tuoi dati (diritto all&apos;oblio
        GDPR), allega la richiesta al messaggio al supporto.
      </Text>
    </EmailShell>
  );
}

export default BanNoticeEmail;
