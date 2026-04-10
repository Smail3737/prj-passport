import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { SectionDefinition } from '../passport-schema';
import { FieldControl } from './FieldControl';

interface SectionsPanelProps {
  sections: SectionDefinition[];
  fields: Record<string, string>;
  highlightedFieldId: string | null;
  onFieldChange: (fieldId: string, value: string) => void;
  registerFieldRef: (fieldId: string, node: HTMLDivElement | null) => void;
  canEditField?: (fieldId: string) => boolean;
}

export function SectionsPanel({
  sections,
  fields,
  highlightedFieldId,
  onFieldChange,
  registerFieldRef,
  canEditField,
}: SectionsPanelProps): JSX.Element {
  return (
    <>
      {sections.map((section) => (
        <Paper key={section.id} sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Box>
              <Typography variant="h6">
                {section.title}
              </Typography>
              {section.description && (
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              )}
            </Box>
            {section.badge && <Chip size="small" color="secondary" label={section.badge} />}
          </Stack>

          <Box
            sx={{
              mt: 1.5,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 1,
            }}
          >
            {section.fields.map((field) => (
              <FieldControl
                key={field.id}
                field={field}
                value={fields[field.id] || ''}
                isHighlighted={highlightedFieldId === field.id}
                onChange={onFieldChange}
                registerFieldRef={registerFieldRef}
                readOnly={canEditField ? !canEditField(field.id) : false}
              />
            ))}
          </Box>
        </Paper>
      ))}
    </>
  );
}
