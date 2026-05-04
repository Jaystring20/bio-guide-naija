/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your VeriDIA verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brand}>VeriDIA</Text>
          <Text style={tagline}>Your lab-to-nutrition companion</Text>
        </Section>
        <Heading style={h1}>Confirm it's really you</Heading>
        <Text style={text}>
          Use the code below to confirm your identity in VeriDIA:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code expires shortly. If you didn't request it, you can safely
          ignore this email.
        </Text>
        <Text style={footerSmall}>
          VeriDIA · Built for Nigerians, by Nigerians · NDPA 2023 compliant
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#1C3B70',
  margin: '0 0 16px',
}
const text = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#1C3B70',
  letterSpacing: '6px',
  textAlign: 'center' as const,
  backgroundColor: '#f3f4f6',
  padding: '16px',
  borderRadius: '12px',
  margin: '0 0 24px',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '14px', color: '#6b7280', margin: '0 0 12px' }
const footerSmall = { fontSize: '12px', color: '#9ca3af', margin: '0' }
