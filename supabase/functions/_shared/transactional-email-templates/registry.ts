/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as labResultReady } from './lab-result-ready.tsx'
import { template as feedbackRequest } from './feedback-request.tsx'
import { template as supportReply } from './support-reply.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'lab-result-ready': labResultReady,
  'feedback-request': feedbackRequest,
  'support-reply': supportReply,
}
