import { Box, MenuItem, TextField } from '@mui/material';
import { FieldDefinition } from '../passport-schema';
import { BlockTextEditor } from './BlockTextEditor';
import { FileAttachmentsField } from './FileAttachmentsField';
import { PeopleMultiField } from './PeopleMultiField';

interface FieldControlProps {
  field: FieldDefinition;
  value: string;
  isHighlighted: boolean;
  readOnly?: boolean;
  onChange: (fieldId: string, value: string) => void;
  registerFieldRef: (fieldId: string, node: HTMLDivElement | null) => void;
}

export function FieldControl({
  field,
  value,
  isHighlighted,
  readOnly,
  onChange,
  registerFieldRef,
}: FieldControlProps): JSX.Element {
  const isFullWidth =
    field.layout === 'full' || field.type === 'textarea' || field.type === 'files' || field.type === 'people';
  const fieldLabel = field.label;

  return (
    <Box
      ref={(node) => {
        registerFieldRef(field.id, node);
      }}
      sx={{
        gridColumn: isFullWidth ? '1 / -1' : 'auto',
        borderRadius: 2,
        p: 1,
        border: '1px solid',
        borderColor: isHighlighted ? 'divider' : 'transparent',
        bgcolor: 'transparent',
        boxShadow: 'none',
        transition: 'border-color 180ms ease',
      }}
    >
      {field.type === 'textarea' ? (
        <BlockTextEditor
          label={fieldLabel}
          value={value}
          required={field.required}
          placeholder={field.placeholder}
          helperText={field.helperText}
          readOnly={Boolean(readOnly) || Boolean(field.readOnly)}
          onChange={(nextValue) => onChange(field.id, nextValue)}
        />
      ) : field.type === 'files' ? (
        <FileAttachmentsField
          label={fieldLabel}
          value={value}
          required={field.required}
          helperText={field.helperText}
          readOnly={Boolean(readOnly) || Boolean(field.readOnly)}
          onChange={(nextValue) => onChange(field.id, nextValue)}
        />
      ) : field.type === 'people' ? (
        <PeopleMultiField
          label={fieldLabel}
          value={value}
          required={field.required}
          options={field.options}
          placeholder={field.placeholder}
          helperText={field.helperText}
          readOnly={Boolean(readOnly) || Boolean(field.readOnly)}
          onChange={(nextValue) => onChange(field.id, nextValue)}
        />
      ) : (
        <TextField
          fullWidth
          size="small"
          label={fieldLabel}
          required={field.required}
          placeholder={field.placeholder}
          value={value}
          type={field.type === 'select' ? 'text' : field.type}
          select={field.type === 'select'}
          InputProps={{
            readOnly: Boolean(readOnly) || Boolean(field.readOnly),
          }}
          disabled={Boolean(readOnly) || Boolean(field.readOnly)}
          helperText={field.helperText}
          onChange={(event) => {
            onChange(field.id, event.target.value);
          }}
        >
          {field.type === 'select' ? (
            [<MenuItem key="placeholder" value="">Not selected</MenuItem>].concat(
              (field.options || []).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))
            )
          ) : (
            <></>
          )}
        </TextField>
      )}
    </Box>
  );
}
