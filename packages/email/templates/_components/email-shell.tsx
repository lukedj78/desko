import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

/**
 * Layout condiviso per tutti i template email Desko.
 *
 * - Background canvas warm (#FAFAF7)
 * - Container 560px max, card bianca con border-radius 8 + bordo soft
 * - Header logo Desko (D ocra + wordmark)
 * - Footer con disclaimer privacy + link unsubscribe (placeholder)
 *
 * Uso:
 *   <EmailShell preview="...">
 *     <Heading>...</Heading>
 *     <Text>...</Text>
 *   </EmailShell>
 */

type EmailShellProps = {
  preview: string;
  children: ReactNode;
};

export function EmailShell({ preview, children }: EmailShellProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#FAFAF7] font-sans m-0 p-0">
          {/* Header brand */}
          <Container className="mx-auto max-w-[560px] pt-8 pb-4 px-6">
            <Section className="text-left">
              <table cellPadding={0} cellSpacing={0} role="presentation">
                <tr>
                  <td>
                    <div className="inline-block w-[28px] h-[28px] rounded-md bg-[#E8B931] text-[#2B1F00] text-center font-bold text-[14px] leading-[28px] align-middle mr-2">
                      D
                    </div>
                  </td>
                  <td>
                    <Text className="m-0 text-[#0E0F0C] text-[16px] font-bold tracking-tight align-middle">
                      Desko
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>
          </Container>

          {/* Card content */}
          <Container className="mx-auto max-w-[560px] bg-white px-8 py-10 rounded-lg border border-[#E0DCD0]">
            {children}
          </Container>

          {/* Footer */}
          <Container className="mx-auto max-w-[560px] pt-6 pb-10 px-6 text-center">
            <Hr className="border-[#E0DCD0] mb-6" />
            <Text className="m-0 text-[11px] text-[#868685] leading-relaxed">
              Tool interno aziendale · accesso riservato ai dipendenti
            </Text>
            <Text className="m-0 text-[11px] text-[#868685] leading-relaxed mt-2">
              Privacy first — la tua presenza è visibile solo ai colleghi che decidi tu.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
