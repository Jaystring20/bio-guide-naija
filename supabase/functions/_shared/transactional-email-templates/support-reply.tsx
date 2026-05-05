/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface SupportReplyProps {
  name?: string
  message?: string
  resultUrl?: string
  agentName?: string
}

const SupportReplyEmail = ({
  name,
  message,
  resultUrl,
  agentName,
}: SupportReplyProps) => {
  const greeting = name ? `Hi ${name},` : 'Hello,'
  const paragraphs = (message || '').split(/\n+/).filter((p) => p.trim().length > 0)

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>A message from the VeriDIA support team</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>VeriDIA</Text>
            <Text style={tagline}>Support team</Text>
          </Section>

          <Heading style={h1}>{greeting}</Heading>

          {paragraphs.length === 0 ? (
            <Text style={text}>(no message)</Text>
          ) : (
            paragraphs.map((p, i) => (
              <Text key={i} style={text}>
                {p}
              </Text>
            ))
          )}

          {resultUrl && (
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button style={button} href={resultUrl}>
                Open my report
              </Button>
            </Section>
          )}

          <Text style={text}>
            — {agentName || 'The VeriDIA support team'}
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            This is a personal reply from VeriDIA support. You can reply to this
            email or message us on WhatsApp at +234 803 883 8094.
          </Text>
          <Text style={footerSmall}>
            VeriDIA · Built for Nigerians, by Nigerians · NDPA 2023 compliant
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SupportReplyEmail,
  subject: 'VeriDIA support — about your recent upload',
  displayName: 'Support reply',
  previewData: {
    name: 'David',
    message:
      "Sorry for the wait — looks like the first attempt didn't go through cleanly on our side. Please open VeriDIA and upload the lab photo one more time; results should appear within 30 seconds.\n\nReply here if it stalls again and I'll jump in.",
    resultUrl: 'https://getveridia.app/app/result/preview',
    agentName: 'Jeremiah, VeriDIA support',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = {
  borderBottom: '3px solid #2ECC71',
  paddingBottom: '12px',
  marginBottom: '24px',
}
const brand = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1C3B70',
  margin: '0',
  letterSpacing: '0.5px',
}
const tagline = { fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1C3B70',
  margin: '0 0 16px',
}
const text = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 14px',
}
const button = {
  backgroundColor: '#2ECC71',
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '16px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '14px', color: '#6b7280', margin: '0 0 12px', lineHeight: '1.5' }
const footerSmall = { fontSize: '12px', color: '#9ca3af', margin: '0' }
