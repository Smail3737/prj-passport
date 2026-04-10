import { useEffect, useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { formatDisplayDate, getProjectName } from "../project-utils";
import {
  HOSTING_FIELD_OPTIONS,
  LEAD_SOURCE_FIELD_OPTIONS,
  LEAD_STATUS_FIELD_OPTIONS,
  MAIN_STACK_FIELD_OPTIONS,
  PASSPORT_TEMPLATE_FIELD_OPTIONS,
  PLATFORM_FIELD_OPTIONS,
  PRIORITY_FIELD_OPTIONS,
} from "../select-options";
import type { ProjectPassport } from "../types";

interface ProjectHeaderCardProps {
  selectedProject: ProjectPassport;
  isAiAvailable: boolean;
  canEditField: (fieldId: string) => boolean;
  onFieldChange: (fieldId: string, value: string) => void;
  onOpenPromptDialog: () => void;
  onExportTxt: () => void;
  onExportJson: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
}

export function ProjectHeaderCard({
  selectedProject,
  isAiAvailable,
  canEditField,
  onFieldChange,
  onOpenPromptDialog,
  onExportTxt,
  onExportJson,
  onExportPdf,
  onExportDocx,
}: ProjectHeaderCardProps): JSX.Element {
  const isLead = selectedProject.fields.passportEntity === "Lead";
  const nameFieldId = isLead ? "leadName" : "projectName";
  const nameValue = selectedProject.fields[nameFieldId] || "";
  const namePlaceholder = isLead ? "Untitled Lead" : "Untitled Passport";

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(nameValue);
  const [exportFormat, setExportFormat] = useState("");

  const canEditName = canEditField(nameFieldId);

  useEffect(() => {
    setNameDraft(nameValue);
    setIsEditingName(false);
  }, [selectedProject.id, nameValue]);

  const startNameEdit = () => {
    if (!canEditName) {
      return;
    }

    setNameDraft(nameValue);
    setIsEditingName(true);
  };

  const cancelNameEdit = () => {
    setNameDraft(nameValue);
    setIsEditingName(false);
  };

  const saveNameEdit = () => {
    if (!canEditName) {
      return;
    }

    onFieldChange(nameFieldId, nameDraft.trim());
    setIsEditingName(false);
  };

  const handleExportChange = (event: SelectChangeEvent<string>) => {
    const format = event.target.value;
    setExportFormat(format);

    switch (format) {
      case "txt":
        onExportTxt();
        break;
      case "json":
        onExportJson();
        break;
      case "pdf":
        onExportPdf();
        break;
      case "docx":
        onExportDocx();
        break;
      default:
        break;
    }

    setExportFormat("");
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
        <Box>
          {isEditingName ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
              sx={{ mb: 1.25 }}
            >
              <TextField
                autoFocus
                fullWidth
                variant="standard"
                placeholder={namePlaceholder}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveNameEdit();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelNameEdit();
                  }
                }}
                sx={{
                  maxWidth: { md: 580 },
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "1.75rem", md: "2.125rem" },
                    fontWeight: 700,
                    lineHeight: 1.08,
                    py: 0,
                  },
                }}
              />
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Accept">
                  <span>
                    <IconButton color="primary" onClick={saveNameEdit} aria-label="Accept name change" disabled={!canEditName}>
                      <CheckIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton onClick={cancelNameEdit} aria-label="Cancel name change">
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
              <Typography
                variant="h4"
                sx={{ cursor: canEditName ? "pointer" : "default" }}
                onClick={startNameEdit}
              >
                {getProjectName(selectedProject)}
              </Typography>
              <Tooltip title={canEditName ? "Edit name" : "You do not have permission"}>
                <span>
                  <IconButton size="small" onClick={startNameEdit} aria-label="Edit project name" disabled={!canEditName}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 1.5 }}
          >
            {isLead ? (
              <>
                <TextField
                  select
                  size="small"
                  label="Lead Status"
                  value={selectedProject.fields.leadStatus || "New"}
                  onChange={(event) => onFieldChange("leadStatus", event.target.value)}
                  sx={{ minWidth: 180 }}
                  disabled={!canEditField("leadStatus")}
                >
                  {LEAD_STATUS_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Priority"
                  value={selectedProject.fields.priority || ""}
                  onChange={(event) => onFieldChange("priority", event.target.value)}
                  sx={{ minWidth: 160 }}
                  disabled={!canEditField("priority")}
                >
                  <MenuItem value="">Not selected</MenuItem>
                  {PRIORITY_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Lead Source"
                  value={selectedProject.fields.leadSource || ""}
                  onChange={(event) => onFieldChange("leadSource", event.target.value)}
                  sx={{ minWidth: 180 }}
                  disabled={!canEditField("leadSource")}
                >
                  <MenuItem value="">Not selected</MenuItem>
                  {LEAD_SOURCE_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            ) : (
              <>
                <TextField
                  select
                  size="small"
                  label="Passport Template"
                  value={selectedProject.fields.passportTemplate || "Standard"}
                  onChange={(event) => onFieldChange("passportTemplate", event.target.value)}
                  sx={{ minWidth: 210 }}
                  disabled={!canEditField("passportTemplate")}
                >
                  {PASSPORT_TEMPLATE_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Main Stack"
                  value={selectedProject.fields.mainStack || ""}
                  onChange={(event) => onFieldChange("mainStack", event.target.value)}
                  sx={{ minWidth: 170 }}
                  disabled={!canEditField("mainStack")}
                >
                  <MenuItem value="">Not selected</MenuItem>
                  {MAIN_STACK_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Platform"
                  value={selectedProject.fields.platform || ""}
                  onChange={(event) => onFieldChange("platform", event.target.value)}
                  sx={{ minWidth: 170 }}
                  disabled={!canEditField("platform")}
                >
                  <MenuItem value="">Not selected</MenuItem>
                  {PLATFORM_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Hosting"
                  value={selectedProject.fields.hostingDeployment || ""}
                  onChange={(event) => onFieldChange("hostingDeployment", event.target.value)}
                  sx={{ minWidth: 220 }}
                  disabled={!canEditField("hostingDeployment")}
                >
                  <MenuItem value="">Not selected</MenuItem>
                  {HOSTING_FIELD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip color="primary" label={`Entity: ${isLead ? "Lead" : "Project"}`} />
            {isLead ? (
              <>
                <Chip label={`Status: ${selectedProject.fields.leadStatus || "New"}`} />
                <Chip label={`Source: ${selectedProject.fields.leadSource || "Not selected"}`} />
                <Chip label={`Priority: ${selectedProject.fields.priority || "Not selected"}`} />
              </>
            ) : (
              <>
                <Chip color="primary" label={`Template: ${selectedProject.fields.passportTemplate || "Standard"}`} />
                <Chip label={`Type: ${selectedProject.fields.projectType || "Not selected"}`} />
              </>
            )}
          </Stack>
        </Box>

        <Stack spacing={1} alignItems={{ xs: "flex-start", md: "flex-end" }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              size="small"
              onClick={onOpenPromptDialog}
              disabled={!isAiAvailable}
            >
              Generate AI Prompt
            </Button>
            <TextField
              select
              size="small"
              label="Export"
              value={exportFormat}
              onChange={handleExportChange}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="" disabled>
                Select format
              </MenuItem>
              <MenuItem value="txt">TXT</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="docx">DOCX</MenuItem>
            </TextField>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Created: {formatDisplayDate(selectedProject.createdAt)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Updated: {formatDisplayDate(selectedProject.updatedAt)}
          </Typography>
          {!isAiAvailable && (
            <Typography variant="caption" color="secondary.main">
              AI prompt generation is unavailable until AI connection is healthy.
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
