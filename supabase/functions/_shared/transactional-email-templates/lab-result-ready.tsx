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

interface LabResultReadyProps {
  name?: string
  profileName?: string
  resultUrl?: string
  hasCriticalAlert?: boolean
}

const LabResultReadyEmail = ({
  name,
  profileName,
  resultUrl,
  hasCriticalAlert,
}: LabResultReadyProps) => {
  const greeting = name ? `Hi ${name},` : 'Hello,'
  const subjectLine = profileName
    ? `${profileName}'s lab result is ready`
    : 'Your lab result is ready'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {hasCriticalAlert
          ? 'Important: critical biomarker detected — please review now'
          : 'Your VeriDIA lab interpretation and diet plan are ready to view'}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>VeriDIA</Text>
            <Text style={tagline}>Your lab-to-nutrition companion</Text>
          </Section>

          {hasCriticalAlert && (
            <Section style={alertBox}>
              <Text style={alertText}>
                ⚠️ Critical biomarker detected — please review your report and
                consult a healthcare professional as soon as possible.
              </Text>
            </Section>
          )}

          <Heading style={h1}>{subjectLine} ✅</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            We've finished interpreting{' '}
            {profileName ? `${profileName}'s` : 'your'} lab results and
            generated a personalised Nigerian diet plan. Tap below to view the
            full report — biomarkers, summary, food recommendations and a
            shopping checklist.
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={resultUrl || 'https://getveridia.app/app'}>
              View my report
            </Button>
          </Section>

          <Text style={smallText}>
            Button not working? Paste this link into your browser:
          </Text>
          <Text style={linkText}>{resultUrl || 'https://getveridia.app/app'}</Text>

          <Hr style={hr} />
          <Text style={footer}>
            VeriDIA gives information, not a medical diagnosis. Always discuss
            results with a qualified healthcare professional before changing
            medication or treatment.
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
  component: LabResultReadyEmail,
  subject: (data: Record<string, any>) =>
    data.hasCriticalAlert
      ? '⚠️ Critical: review your VeriDIA lab result now'
      : data.profileName
        ? `${data.profileName}'s VeriDIA lab result is ready`
        : 'Your VeriDIA lab result is ready',
  displayName: 'Lab result ready',
  previewData: {
    name: 'Aisha',
    profileName: 'Mama Ngozi',
    resultUrl: 'https://getveridia.app/app/result/preview',
    hasCriticalAlert: false,
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
const alertBox = {
  backgroundColor: '#FEF2F2',
  borderLeft: '4px solid #C0392B',
  padding: '14px 16px',
  borderRadius: '8px',
  margin: '0 0 20px',
}
const alertText = {
  fontSize: '15px',
  color: '#C0392B',
  fontWeight: 'bold' as const,
  margin: '0',
  lineHeight: '1.5',
}
const h1 = {
  fontSize: '24px',
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
const footer = { fontSize: '14px', color: '#6b7280', margin: '0 0 12px', lineHeight: '1.5' }
const footerSmall = { fontSize: '12px', color: '#9ca3af', margin: '0' }
