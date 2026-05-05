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

interface FeedbackRequestProps {
  name?: string
  variant?: 'post_result' | 'post_signup'
  ctaUrl?: string
}

const FeedbackRequestEmail = ({ name, variant = 'post_result', ctaUrl }: FeedbackRequestProps) => {
  const greeting = name ? `Hi ${name},` : 'Hello,'
  const isResult = variant === 'post_result'
  const url = ctaUrl || (isResult ? 'https://getveridia.app/app?fb=1' : 'https://getveridia.app/app?fb=1')

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isResult
          ? 'How was your VeriDIA report? One quick thought helps us improve.'
          : 'What would make VeriDIA more useful for you?'}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>VeriDIA</Text>
            <Text style={tagline}>Your lab-to-nutrition companion</Text>
          </Section>

          <Heading style={h1}>
            {isResult ? 'How was your VeriDIA report?' : 'We built this for you — tell us how to make it better'}
          </Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {isResult
              ? "You recently received a lab interpretation from VeriDIA. We'd love to hear how it went — was the diet plan useful? Were the explanations clear? Even one sentence helps us serve Nigerian families better."
              : "We noticed you signed up for VeriDIA but haven't uploaded a lab result yet. We'd love to know what's holding you back — confusion, missing features, or something else? Your honest feedback shapes what we build next."}
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={url}>
              {isResult ? 'Share my feedback' : 'Tell us what you need'}
            </Button>
          </Section>

          <Text style={smallText}>Button not working? Paste this link into your browser:</Text>
          <Text style={linkText}>{url}</Text>

          <Hr style={hr} />
          <Text style={footer}>
            Your feedback goes straight to the team — we read every single message.
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
  component: FeedbackRequestEmail,
  subject: (data: Record<string, any>) =>
    data.variant === 'post_signup'
      ? 'What would make VeriDIA more useful for you?'
      : 'How was your VeriDIA report?',
  displayName: 'Feedback request',
  previewData: {
    name: 'Aisha',
    variant: 'post_result',
    ctaUrl: 'https://getveridia.app/app/result/preview?fb=1',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { borderBottom: '3px solid #2ECC71', paddingBottom: '12px', marginBottom: '24px' }
const brand = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1C3B70', margin: '0', letterSpacing: '0.5px' }
const tagline = { fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1C3B70', margin: '0 0 16px' }
const text = { fontSize: '16px', color: '#374151', lineHeight: '1.6', margin: '0 0 14px' }
const smallText = { fontSize: '13px', color: '#6b7280', margin: '24px 0 4px' }
const linkText = { fontSize: '13px', color: '#1C3B70', wordBreak: 'break-all' as const, margin: '0 0 16px' }
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
