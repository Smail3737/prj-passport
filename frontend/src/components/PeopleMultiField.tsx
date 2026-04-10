import { Autocomplete, Chip, Stack, TextField, Typography } from '@mui/material';
import { useMemo } from 'react';
import type { SelectOption } from '../passport-schema';

interface PeopleMultiFieldProps {
  label: string;
  value: string;
  options?: SelectOption[];
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange: (nextValue: string) => void;
}

function parsePeople(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      result.push(item);
    });

  return result;
}

function serializePeople(items: string[]): string {
  return items.join(', ');
}

function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    const value = item.trim();
    if (!value) {
      return;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(value);
  });

  return result;
}

export function PeopleMultiField({
  label,
  value,
  options,
  required,
  helperText,
  placeholder,
  readOnly,
  onChange,
}: PeopleMultiFieldProps): JSX.Element {
  const selectedPeople = useMemo(() => parsePeople(value), [value]);

  const optionLabels = useMemo(
    () =>
      (options || [])
        .map((option) => option.label.trim())
        .filter(Boolean),
    [options]
  );

  const availableOptions = useMemo(
    () => dedupeCaseInsensitive([...optionLabels, ...selectedPeople]),
    [optionLabels, selectedPeople]
  );

  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {required ? `${label} *` : label}
      </Typography>

      <Autocomplete<string, true, false, false>
        multiple
        disableCloseOnSelect
        options={availableOptions}
        value={selectedPeople}
        filterSelectedOptions
        disabled={Boolean(readOnly)}
        onChange={(_, nextSelected) => {
          onChange(serializePeople(nextSelected));
        }}
        noOptionsText="No people available"
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((person, index) => {
            const { key, ...chipProps } = getTagProps({ index });
            return <Chip key={key} {...chipProps} label={person} size="small" />;
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={placeholder || 'Select people'}
            helperText={helperText}
          />
        )}
      />
    </Stack>
  );
}
