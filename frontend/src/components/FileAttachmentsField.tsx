import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { ChangeEvent, DragEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_TOTAL_DATA_CHARS,
  formatAttachmentSize,
  parseAttachmentsValue,
  type PassportAttachment,
  serializeAttachmentsValue,
} from '../file-attachments';

interface FileAttachmentsFieldProps {
  label: string;
  value: string;
  required?: boolean;
  helperText?: string;
  readOnly?: boolean;
  onChange: (nextValue: string) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:')) {
        reject(new Error(`Unsupported file format: ${file.name}`));
        return;
      }

      resolve(result);
    };

    reader.readAsDataURL(file);
  });
}

function toAttachment(file: File, dataUrl: string): PassportAttachment {
  return {
    id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
    dataUrl,
  };
}

export function FileAttachmentsField({
  label,
  value,
  required,
  helperText,
  readOnly,
  onChange,
}: FileAttachmentsFieldProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

  const [warning, setWarning] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState(false);

  const attachments = useMemo(() => parseAttachmentsValue(value), [value]);

  const addFiles = async (files: File[]): Promise<void> => {
    if (files.length === 0 || readOnly) {
      return;
    }

    const nextAttachments = [...attachments];
    const notices: string[] = [];
    let totalDataChars = nextAttachments.reduce((sum, item) => sum + item.dataUrl.length, 0);

    for (const file of files) {
      if (nextAttachments.length >= MAX_ATTACHMENT_COUNT) {
        notices.push(`Maximum ${MAX_ATTACHMENT_COUNT} files per passport reached.`);
        break;
      }

      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        notices.push(`"${file.name}" is larger than 5 MB and was skipped.`);
        continue;
      }

      const alreadyExists = nextAttachments.some(
        (item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified
      );
      if (alreadyExists) {
        notices.push(`"${file.name}" is already attached.`);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);

        if (totalDataChars + dataUrl.length > MAX_ATTACHMENT_TOTAL_DATA_CHARS) {
          notices.push(
            'Total attachments size limit reached (about 10 MB encoded). Remove old files before adding new ones.'
          );
          continue;
        }

        nextAttachments.push(toAttachment(file, dataUrl));
        totalDataChars += dataUrl.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to read ${file.name}`;
        notices.push(message);
      }
    }

    if (nextAttachments.length !== attachments.length) {
      onChange(serializeAttachmentsValue(nextAttachments));
    }

    setWarning(notices.join(' '));
  };

  const handleAddFiles = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    await addFiles(selectedFiles);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (readOnly) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (readOnly) {
      return;
    }

    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (readOnly) {
      return;
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    dragDepthRef.current = 0;
    setIsDragActive(false);

    if (readOnly) {
      return;
    }

    const droppedFiles = Array.from(event.dataTransfer.files || []);
    void addFiles(droppedFiles);
  };

  const handleRemove = (attachmentId: string): void => {
    const nextAttachments = attachments.filter((item) => item.id !== attachmentId);
    onChange(serializeAttachmentsValue(nextAttachments));
    setWarning('');
  };

  const handleDownload = (attachment: PassportAttachment): void => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {required ? `${label} *` : label}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          disabled={Boolean(readOnly)}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          Attach files
        </Button>
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(event) => {
          void handleAddFiles(event);
        }}
      />

      <Box
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!readOnly) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (readOnly) {
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? -1 : 0}
        sx={{
          borderRadius: 2,
          border: '1px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.selected' : 'background.paper',
          p: 1.5,
          cursor: readOnly ? 'default' : 'pointer',
          transition: 'border-color 160ms ease, background-color 160ms ease',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {readOnly
            ? 'File attachments are read-only.'
            : 'Drag and drop files here, or click to choose files.'}
        </Typography>
      </Box>

      {helperText && (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}

      {warning && (
        <Alert severity="warning" variant="outlined">
          {warning}
        </Alert>
      )}

      {attachments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No attached files.
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {attachments.map((attachment) => (
            <Paper key={attachment.id} variant="outlined" sx={{ p: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                <Stack sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {attachment.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatAttachmentSize(attachment.size)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <Button size="small" variant="text" onClick={() => handleDownload(attachment)}>
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    disabled={Boolean(readOnly)}
                    onClick={() => handleRemove(attachment.id)}
                  >
                    Remove
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
