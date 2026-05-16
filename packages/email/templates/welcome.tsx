import { Heading, Link, Section, Text } from '@react-email/components';

import { EmailShell } from './_components/email-shell';

type WelcomeEmailProps = {
  name: string;
  ctaUrl: string;
  invitedBy?: string;
};

export function WelcomeEmail({ name, ctaUrl, invitedBy }: WelcomeEmailProps) {
  return (
    <EmailShell preview="Benvenuto su Desko — sai chi sarà in ufficio quando ci sarai tu.">
      <Heading className="text-[26px] font-bold text-[#0E0F0C] mt-0 mb-4 leading-tight tracking-tight">
        Benvenuto su Desko, {name}.
      </Heading>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-4">
        {invitedBy
          ? `${invitedBy} ti ha invitato su Desko. `
          : 'Il tuo account è pronto. '}
        Desko risponde a una sola domanda — &ldquo;chi sarà in ufficio quando ci sarò
        io?&rdquo; — in due tap.
      </Text>
      <Text className="text-[16px] text-[#454745] leading-relaxed mb-6">
        Inizia dichiarando i tuoi giorni in ufficio per questa settimana o impostando un
        pattern ricorrente.
      </Text>
      <Section className="my-8">
        <Link
          href={ctaUrl}
          className="inline-block rounded-md bg-[#E8B931] px-6 py-3 text-[15px] font-semibold text-[#2B1F00] no-underline"
        >
          Apri Desko
        </Link>
      </Section>
      <Text className="text-[13px] text-[#868685] leading-relaxed">
        <strong className="text-[#454745]">Cosa puoi fare con Desko</strong>
        <br />
        · Dichiarare i giorni in cui sarai in ufficio
        <br />
        · Vedere chi del tuo team sarà presente in un dato giorno
        <br />
        · Indicare al volo se sei al 7° piano (stanza) o al 2° (co-working)
        <br />
        · Impostare un pattern ricorrente per non doverlo ripetere ogni settimana
      </Text>
    </EmailShell>
  );
}

export default WelcomeEmail;
