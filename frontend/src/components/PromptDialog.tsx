import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { ConverterStatus, PromptTemplateId, PromptTemplateOption } from '../types';

interface RegenerationPresetOption {
  id: string;
  label: string;
}

interface PromptDialogProps {
  open: boolean;
  promptTemplate: PromptTemplateId;
  promptTemplateOptions: PromptTemplateOption[];
  promptStatus: ConverterStatus | null;
  isAiAvailable: boolean;
  promptText: string;
  isPromptGenerating: boolean;
  regenerationPresetOptions: RegenerationPresetOption[];
  selectedRegenerationPreset: string;
  regenerationCustomPrompt: string;
  onClose: () => void;
  onPromptTemplateChange: (value: PromptTemplateId) => void;
  onRegenerationPresetChange: (value: string) => void;
  onRegenerationCustomPromptChange: (value: string) => void;
  onGenerateWithAi: () => void;
  onRegenerateWithAi: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function PromptDialog({
  open,
  promptTemplate,
  promptTemplateOptions,
  promptStatus,
  isAiAvailable,
  promptText,
  isPromptGenerating,
  regenerationPresetOptions,
  selectedRegenerationPreset,
  regenerationCustomPrompt,
  onClose,
  onPromptTemplateChange,
  onRegenerationPresetChange,
  onRegenerationCustomPromptChange,
  onGenerateWithAi,
  onRegenerateWithAi,
  onCopy,
  onDownload,
}: PromptDialogProps): JSX.Element {
  const isLeadProposalTemplate = promptTemplate === 'lead-proposal';
  const outputLabel = isLeadProposalTemplate ? 'Generated Proposal' : 'Generated Prompt';
  const generateButtonLabel = isLeadProposalTemplate ? 'Generate Proposal' : 'Generate with AI';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Generate AI Prompt</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            select
            size="small"
            label="Prompt Template"
            value={promptTemplate}
            onChange={(event) => onPromptTemplateChange(event.target.value as PromptTemplateId)}
          >
            {promptTemplateOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Alert severity="info" variant="outlined">
            {promptTemplateOptions.find((option) => option.id === promptTemplate)?.description}
          </Alert>

          {promptStatus && (
            <Alert severity={promptStatus.severity} variant="outlined">
              {promptStatus.message}
            </Alert>
          )}

          {!isAiAvailable && (
            <Alert severity="warning" variant="outlined">
              AI is unavailable. Prompt generation is temporarily disabled.
            </Alert>
          )}

          <TextField
            label={outputLabel}
            value={promptText}
            multiline
            minRows={20}
            InputProps={{ readOnly: true }}
          />

          <Stack spacing={1.25}>
            <Typography variant="subtitle2">Regenerate If Result Is Not Suitable</Typography>
            <TextField
              select
              size="small"
              label="Preset Refinement"
              value={selectedRegenerationPreset}
              onChange={(event) => onRegenerationPresetChange(event.target.value)}
            >
              <MenuItem value="">No preset (just regenerate)</MenuItem>
              {regenerationPresetOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Custom Refinement Prompt"
              placeholder="Example: Make it shorter, clearer, and add explicit acceptance criteria."
              value={regenerationCustomPrompt}
              onChange={(event) => onRegenerationCustomPromptChange(event.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPromptGenerating}>
          Close
        </Button>
        <Button onClick={onGenerateWithAi} variant="outlined" disabled={isPromptGenerating || !isAiAvailable}>
          {isPromptGenerating ? 'Generating...' : generateButtonLabel}
        </Button>
        <Button
          onClick={onRegenerateWithAi}
          variant="outlined"
          disabled={isPromptGenerating || !isAiAvailable || !promptText.trim()}
        >
          Regenerate with AI
        </Button>
        <Button
          onClick={onCopy}
          variant="outlined"
          disabled={isPromptGenerating || !isAiAvailable || !promptText.trim()}
        >
          Copy
        </Button>
        <Button
          onClick={onDownload}
          variant="contained"
          disabled={isPromptGenerating || !isAiAvailable || !promptText.trim()}
        >
          Download TXT
        </Button>
      </DialogActions>
    </Dialog>
  );
}
