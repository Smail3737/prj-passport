import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { ConverterStatus } from '../types';

interface TaskConverterPanelProps {
  selectedAiModel: string;
  availableAiModels: string[];
  isAnyProjectAnalyzing: boolean;
  aiConnectionStatus: ConverterStatus | null;
  converterInput: string;
  isSelectedProjectAnalyzing: boolean;
  selectedConverterStatus: ConverterStatus | null;
  onAiModelChange: (value: string) => void;
  onConverterInputChange: (value: string) => void;
  onAnalyzeDescription: () => void;
  onInsertConverterFile: () => void;
  onClearConverter: () => void;
}

export function TaskConverterPanel({
  selectedAiModel,
  availableAiModels,
  isAnyProjectAnalyzing,
  aiConnectionStatus,
  converterInput,
  isSelectedProjectAnalyzing,
  selectedConverterStatus,
  onAiModelChange,
  onConverterInputChange,
  onAnalyzeDescription,
  onInsertConverterFile,
  onClearConverter,
}: TaskConverterPanelProps): JSX.Element {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="h6">Task Converter</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            select
            size="small"
            label="AI Model"
            value={selectedAiModel}
            onChange={(event) => onAiModelChange(event.target.value)}
            sx={{ minWidth: { xs: '100%', md: 260 } }}
            disabled={isAnyProjectAnalyzing}
          >
            <MenuItem value="">Default runtime model</MenuItem>
            {availableAiModels.map((model) => (
              <MenuItem key={model} value={model}>
                {model}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {aiConnectionStatus && (
          <Alert severity={aiConnectionStatus.severity} variant="outlined">
            {aiConnectionStatus.message}
          </Alert>
        )}
        <TextField
          label="Product Description"
          placeholder="Example: SaaS for business automation, stack Next.js + PostgreSQL, deploy on Vercel, repository ..., production ..."
          multiline
          minRows={6}
          value={converterInput}
          onChange={(event) => onConverterInputChange(event.target.value)}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" onClick={onAnalyzeDescription} disabled={isSelectedProjectAnalyzing}>
            {isSelectedProjectAnalyzing ? 'Analyzing...' : 'Analyze & Fill Fields'}
          </Button>
          <Button variant="outlined" onClick={onInsertConverterFile} disabled={isSelectedProjectAnalyzing}>
            Insert Text File
          </Button>
          <Button variant="outlined" onClick={onClearConverter} disabled={isSelectedProjectAnalyzing}>
            Clear
          </Button>
        </Stack>
        {isSelectedProjectAnalyzing && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Analysis in progress...
            </Typography>
            <LinearProgress sx={{ mt: 0.75 }} />
          </Box>
        )}
        {selectedConverterStatus && (
          <Alert severity={selectedConverterStatus.severity}>{selectedConverterStatus.message}</Alert>
        )}
      </Stack>
    </Paper>
  );
}
