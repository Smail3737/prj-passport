import {
  Alert,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { CompletenessInfo } from '../types';

interface CompletenessCardProps {
  completeness: CompletenessInfo;
  onJumpToField: (fieldId: string) => void;
}

export function CompletenessCard({ completeness, onJumpToField }: CompletenessCardProps): JSX.Element {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6">Completeness Indicator</Typography>
        </Box>
        <Typography variant="h4" color="primary.main">
          {completeness.percent}%
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={completeness.percent}
        sx={{ mt: 1.5, mb: 1.5, height: 10, borderRadius: 99 }}
      />

      <Typography variant="subtitle2" color="text.secondary">
        Missing important fields
      </Typography>

      {completeness.missing.length === 0 ? (
        <Alert severity="success" sx={{ mt: 1 }}>
          All key fields are filled.
        </Alert>
      ) : (
        <List dense sx={{ mt: 0.5 }}>
          {completeness.missing.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton onClick={() => onJumpToField(item.id)}>
                <ListItemText
                  primaryTypographyProps={{ color: 'secondary.main' }}
                  primary={item.label}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
