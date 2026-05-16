import { Heading, Link, Section, Text } from '@react-email/components';

import { EmailShell } from './_components/email-shell';

type VerifyEmailProps = {
  name: string;
  verificationUrl: string;
};

export function VerifyEmail({ name, verificationUrl }: VerifyEmailProps) {
  return (
    <EmailShell preview="Conferma la tua email per attivare l'account Desko.">
      <Heading className="text-[26px] font-bold text-[#0E0F0C] mt-0 mb-4 leading-tight tracking-tight">
        Conferma la tua email.
      </Heading>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-6">
        Ciao {name}, grazie per aver creato un account Desko. Conferma la tua email
        cliccando il pulsante qui sotto. Il link scade tra 24 ore.
      </Text>
      <Section className="my-8">
        <Link
          href={verificationUrl}
          className="inline-block rounded-md bg-[#E8B931] px-6 py-3 text-[15px] font-semibold text-[#2B1F00] no-underline"
        >
          Conferma email
        </Link>
      </Section>
      <Text className="text-[13px] text-[#868685] leading-relaxed">
        Oppure copia e incolla questo link nel browser:
        <br />
        <Link href={verificationUrl} className="text-[#454745] break-all">
          {verificationUrl}
        </Link>
      </Text>
      <Text className="text-[12px] text-[#868685] mt-8 leading-relaxed">
        Se non hai creato tu questo account, ignora questa email — non verrà fatto nulla.
      </Text>
    </EmailShell>
  );
}

export default VerifyEmail;
