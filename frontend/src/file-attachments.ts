export interface PassportAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dataUrl: string;
}

export const ATTACHMENT_FIELD_IDS = new Set<string>(['projectAttachments', 'leadAttachments']);

export const MAX_ATTACHMENT_COUNT = 8;
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENT_TOTAL_DATA_CHARS = 10 * 1024 * 1024;

export function isAttachmentFieldId(fieldId: string): boolean {
  return ATTACHMENT_FIELD_IDS.has(fieldId);
}

function isValidAttachment(value: unknown): value is PassportAttachment {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.size === 'number' &&
    Number.isFinite(record.size) &&
    record.size >= 0 &&
    typeof record.type === 'string' &&
    typeof record.lastModified === 'number' &&
    Number.isFinite(record.lastModified) &&
    typeof record.dataUrl === 'string' &&
    record.dataUrl.startsWith('data:')
  );
}

export function parseAttachmentsValue(raw: string): PassportAttachment[] {
  if (!raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidAttachment);
  } catch {
    return [];
  }
}

export function serializeAttachmentsValue(attachments: PassportAttachment[]): string {
  if (attachments.length === 0) {
    return '';
  }

  return JSON.stringify(attachments);
}

export function formatAttachmentSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function summarizeAttachmentsValue(raw: string): string {
  const attachments = parseAttachmentsValue(raw);
  if (attachments.length === 0) {
    return '';
  }

  const topNames = attachments.slice(0, 3).map((item) => item.name).join(', ');
  const remaining = attachments.length - 3;

  if (remaining > 0) {
    return `${attachments.length} files: ${topNames}, +${remaining} more`;
  }

  return `${attachments.length} files: ${topNames}`;
}
