import { Heading, Link, Section, Text } from '@react-email/components';

import { EmailShell } from './_components/email-shell';

type ResetPasswordEmailProps = {
  name: string;
  resetUrl: string;
};

export function ResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  return (
    <EmailShell preview="Reset della tua password Desko.">
      <Heading className="text-[26px] font-bold text-[#0E0F0C] mt-0 mb-4 leading-tight tracking-tight">
        Reimposta la tua password.
      </Heading>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-6">
        Ciao {name}, abbiamo ricevuto una richiesta di reset password per il tuo account.
        Clicca il pulsante qui sotto per impostare una nuova password. Il link scade tra
        1 ora.
      </Text>
      <Section className="my-8">
        <Link
          href={resetUrl}
          className="inline-block rounded-md bg-[#0E0F0C] px-6 py-3 text-[15px] font-semibold text-white no-underline"
        >
          Imposta nuova password
        </Link>
      </Section>
      <Text className="text-[13px] text-[#868685] leading-relaxed">
        Oppure copia e incolla questo link nel browser:
        <br />
        <Link href={resetUrl} className="text-[#454745] break-all">
          {resetUrl}
        </Link>
      </Text>
      <Text className="text-[12px] text-[#868685] mt-8 leading-relaxed">
        Se non hai chiesto tu questo reset, ignora questa email. La tua password attuale
        resta valida — non verrà fatta alcuna modifica al tuo account.
      </Text>
    </EmailShell>
  );
}

export default ResetPasswordEmail;
