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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your VeriDIA password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brand}>VeriDIA</Text>
          <Text style={tagline}>Your lab-to-nutrition companion</Text>
        </Section>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We got a request to reset the password for your VeriDIA account. Tap
          the button below to choose a new one. The link will expire in 1 hour.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Choose a new password
          </Button>
        </Section>
        <Text style={smallText}>
          Button not working? Paste this link into your browser:
        </Text>
        <Text style={linkText}>{confirmationUrl}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email — your password will not change.
        </Text>
        <Text style={footerSmall}>
          VeriDIA · Built for Nigerians, by Nigerians · NDPA 2023 compliant
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const smallText = { fontSize: '13px', color: '#6b7280', margin: '24px 0 4px' }
const linkText = {
  fontSize: '13px',
  color: '#1C3B70',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
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
const footer = { fontSize: '14px', color: '#6b7280', margin: '0 0 12px' }
const footerSmall = { fontSize: '12px', color: '#9ca3af', margin: '0' }
