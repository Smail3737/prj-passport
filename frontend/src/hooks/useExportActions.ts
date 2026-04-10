import { useCallback, useMemo } from 'react';
import { SectionDefinition } from '../passport-schema';
import {
  buildExportFileBaseName,
  buildExportPayload,
  downloadFile,
  formatPayloadAsDocxBlob,
  formatPayloadAsPdfBlob,
  formatPayloadAsText,
} from '../export-utils';
import type { CompletenessInfo, ProjectPassport } from '../types';

interface UseExportActionsParams {
  selectedProject: ProjectPassport | null;
  sections: SectionDefinition[];
  completeness: CompletenessInfo | null;
}

interface UseExportActionsResult {
  exportTxt: () => void;
  exportJson: () => void;
  exportPdf: () => void;
  exportDocx: () => void;
}

export function useExportActions({
  selectedProject,
  sections,
  completeness,
}: UseExportActionsParams): UseExportActionsResult {
  const exportPayload = useMemo(() => {
    if (!selectedProject || !completeness) {
      return null;
    }

    return buildExportPayload(selectedProject, sections, completeness);
  }, [selectedProject, sections, completeness]);

  const exportTxt = useCallback(() => {
    if (!selectedProject || !exportPayload) {
      return;
    }

    const fileName = `${buildExportFileBaseName(selectedProject)}.txt`;
    const content = formatPayloadAsText(exportPayload);
    downloadFile(fileName, content, 'text/plain;charset=utf-8');
  }, [selectedProject, exportPayload]);

  const exportJson = useCallback(() => {
    if (!selectedProject || !exportPayload) {
      return;
    }

    const fileName = `${buildExportFileBaseName(selectedProject)}.json`;
    const content = JSON.stringify(exportPayload, null, 2);
    downloadFile(fileName, content, 'application/json;charset=utf-8');
  }, [selectedProject, exportPayload]);

  const exportPdf = useCallback(() => {
    if (!selectedProject || !exportPayload) {
      return;
    }

    try {
      const fileName = `${buildExportFileBaseName(selectedProject)}.pdf`;
      const pdfBlob = formatPayloadAsPdfBlob(exportPayload);
      downloadFile(fileName, pdfBlob, 'application/pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      window.alert('Failed to export PDF. Check console for details.');
    }
  }, [selectedProject, exportPayload]);

  const exportDocx = useCallback(async () => {
    if (!selectedProject || !exportPayload) {
      return;
    }

    try {
      const fileName = `${buildExportFileBaseName(selectedProject)}.docx`;
      const docxBlob = await formatPayloadAsDocxBlob(exportPayload);
      downloadFile(
        fileName,
        docxBlob,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    } catch (error) {
      console.error('Failed to export DOCX:', error);
      window.alert('Failed to export DOCX. Check console for details.');
    }
  }, [selectedProject, exportPayload]);

  return {
    exportTxt,
    exportJson,
    exportPdf: () => {
      exportPdf();
    },
    exportDocx: () => {
      void exportDocx();
    },
  };
}
