import { Heading, Hr, Link, Section, Text } from '@react-email/components';

import { EmailShell } from './_components/email-shell';

type InviteEmailProps = {
  inviteeName: string;
  inviterName: string;
  inviterEmail: string;
  acceptUrl: string;
  role: 'user' | 'admin' | 'hr_analytics';
};

const ROLE_LABELS: Record<InviteEmailProps['role'], string> = {
  user: 'Utente',
  admin: 'Amministratore',
  hr_analytics: 'HR Analytics',
};

export function InviteEmail({
  inviteeName,
  inviterName,
  inviterEmail,
  acceptUrl,
  role,
}: InviteEmailProps) {
  return (
    <EmailShell preview={`${inviterName} ti ha invitato su Desko.`}>
      <Heading className="text-[26px] font-bold text-[#0E0F0C] mt-0 mb-4 leading-tight tracking-tight">
        Sei stato invitato su Desko.
      </Heading>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-4">
        Ciao {inviteeName}, <strong>{inviterName}</strong> ({inviterEmail}) ti ha invitato
        a usare Desko, lo strumento interno per coordinarti con i colleghi quando sei in
        ufficio.
      </Text>

      <Section className="my-6 p-4 bg-[#FBEFD0] rounded-md border border-[#E8B931]">
        <Text className="m-0 text-[13px] text-[#5A4500] uppercase tracking-wide font-semibold">
          Il tuo ruolo
        </Text>
        <Text className="m-0 mt-1 text-[18px] text-[#2B1F00] font-bold">
          {ROLE_LABELS[role]}
        </Text>
      </Section>

      <Text className="text-[15px] text-[#454745] leading-relaxed mb-6">
        Clicca qui sotto per accettare l&apos;invito e impostare la tua password. Il link
        scade tra 7 giorni.
      </Text>

      <Section className="my-6">
        <Link
          href={acceptUrl}
          className="inline-block rounded-md bg-[#E8B931] px-6 py-3 text-[15px] font-semibold text-[#2B1F00] no-underline"
        >
          Accetta invito
        </Link>
      </Section>

      <Hr className="border-[#E0DCD0] my-6" />

      <Text className="text-[13px] text-[#868685] leading-relaxed">
        <strong className="text-[#454745]">Cos&apos;è Desko?</strong>
        <br />
        Un tool informativo per sapere chi sarà in ufficio quando vuoi venire anche tu —
        zero controllo, zero gamification, solo coordinamento volontario.
      </Text>

      <Text className="text-[12px] text-[#868685] mt-6 leading-relaxed">
        Se non conosci {inviterName} o pensi sia un errore, ignora questa email — l&apos;invito
        scade automaticamente.
      </Text>
    </EmailShell>
  );
}

export default InviteEmail;
