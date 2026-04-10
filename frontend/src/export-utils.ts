import { jsPDF } from 'jspdf';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { SectionDefinition } from './passport-schema';
import { PROMPT_TEMPLATE_OPTIONS, PROMPT_TEMPLATE_TASK_FOCUS } from './config';
import { formatDateForInput, getProjectName } from './project-utils';
import { isAttachmentFieldId, summarizeAttachmentsValue } from './file-attachments';
import type {
  CompletenessInfo,
  PassportExportPayload,
  ProjectPassport,
  PromptTemplateId,
} from './types';

function toFileSafeSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'project-passport';
}

export function buildExportFileBaseName(project: ProjectPassport): string {
  const datePart = formatDateForInput(new Date()).replace(/-/g, '');
  return `${toFileSafeSegment(getProjectName(project))}-${datePart}`;
}

export function buildExportPayload(
  project: ProjectPassport,
  sections: SectionDefinition[],
  completeness: CompletenessInfo
): PassportExportPayload {
  return {
    generatedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: getProjectName(project),
      status: project.fields.status || '',
      projectType: project.fields.projectType || '',
      client: project.fields.client || '',
      communicationChannel: project.fields.communicationChannel || project.fields.leadContactChannel || '',
      communicatorPeople: project.fields.communicatorPeople || '',
      responsiblePeople: project.fields.responsiblePeople || project.fields.leadOwner || '',
      department: project.fields.department || '',
      designTool: project.fields.designTool || '',
      designToolUrl: project.fields.designToolUrl || '',
      mainStack: project.fields.mainStack || '',
      platform: project.fields.platform || '',
      hostingDeployment: project.fields.hostingDeployment || '',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    completeness: {
      percent: completeness.percent,
      missingImportantFields: completeness.missing,
    },
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      badge: section.badge,
      fields: section.fields.map((field) => {
        const rawValue = project.fields[field.id] || '';
        const value = isAttachmentFieldId(field.id)
          ? summarizeAttachmentsValue(rawValue)
          : rawValue;

        return {
          id: field.id,
          label: field.label,
          value,
        };
      }),
    })),
  };
}

function normalizeForSingleLine(value: string): string {
  return value.replace(/\s*\n+\s*/g, ' | ').trim();
}

export function formatPayloadAsText(payload: PassportExportPayload): string {
  const lines: string[] = [];

  lines.push('PROJECT PASSPORT');
  lines.push(`Generated at: ${payload.generatedAt}`);
  lines.push('');
  lines.push('Meta');
  lines.push(`- Name: ${payload.project.name}`);
  lines.push(`- Status: ${payload.project.status || '-'}`);
  lines.push(`- Project Type: ${payload.project.projectType || '-'}`);
  lines.push('- Client: ' + (payload.project.client || '-'));
  lines.push('- Communication Channel: ' + (payload.project.communicationChannel || '-'));
  lines.push('- Communicator(s): ' + (payload.project.communicatorPeople || '-'));
  lines.push('- Responsible Person(s): ' + (payload.project.responsiblePeople || '-'));
  lines.push('- Department: ' + (payload.project.department || '-'));
  lines.push('- Design Tool: ' + (payload.project.designTool || '-'));
  lines.push('- Design Tool Link: ' + (payload.project.designToolUrl || '-'));
  lines.push(`- Main Stack: ${payload.project.mainStack || '-'}`);
  lines.push(`- Platform: ${payload.project.platform || '-'}`);
  lines.push(`- Hosting / Deployment: ${payload.project.hostingDeployment || '-'}`);
  lines.push(`- Created At: ${payload.project.createdAt || '-'}`);
  lines.push(`- Updated At: ${payload.project.updatedAt || '-'}`);
  lines.push('');
  lines.push(`Completeness: ${payload.completeness.percent}%`);

  if (payload.completeness.missingImportantFields.length > 0) {
    lines.push('Missing Important Fields:');
    payload.completeness.missingImportantFields.forEach((field) => {
      lines.push(`- ${field.label}`);
    });
    lines.push('');
  } else {
    lines.push('Missing Important Fields: none');
    lines.push('');
  }

  payload.sections.forEach((section) => {
    const filledFields = section.fields.filter((field) => field.value.trim());
    if (filledFields.length === 0) {
      return;
    }

    lines.push(`${section.title}${section.badge ? ` [${section.badge}]` : ''}`);
    filledFields.forEach((field) => {
      lines.push(`- ${field.label}: ${normalizeForSingleLine(field.value)}`);
    });
    lines.push('');
  });

  return lines.join('\n').trim();
}

function getFieldValue(fields: Record<string, string>, fieldId: string, fallback = 'Not specified'): string {
  const value = fields[fieldId]?.trim();
  return value ? value : fallback;
}

function buildPromptContextFromSections(sections: SectionDefinition[], fields: Record<string, string>): string {
  const chunks: string[] = [];

  sections.forEach((section) => {
    const filledLines = section.fields
      .map((field) => {
        if (isAttachmentFieldId(field.id)) {
          return null;
        }

        const value = fields[field.id]?.trim();
        if (!value) {
          return null;
        }

        return `- ${field.label}: ${normalizeForSingleLine(value)}`;
      })
      .filter((line): line is string => Boolean(line));

    if (filledLines.length === 0) {
      return;
    }

    chunks.push(`## ${section.title}${section.badge ? ` [${section.badge}]` : ''}`);
    chunks.push(...filledLines);
    chunks.push('');
  });

  return chunks.join('\n').trim();
}

function buildLeadExpectedOutput(templateId: PromptTemplateId): string[] {
  if (templateId === 'lead-proposal') {
    return [
      '- Start with a personalized opening line for the client/lead contact.',
      '- Produce a client-ready proposal draft in Markdown.',
      '- Cover key content in this order: summary, context/goals, scope, approach, plan, commercial terms, risks, open questions, next step.',
      '- Do not use headings or section-title lines like "Executive Summary" or "Next Step".',
      '- In Proposed Scope, clearly split In Scope vs Out of Scope.',
      '- In Delivery Plan, propose phases with rough durations.',
      '- In Estimate & Commercial Terms, provide at least two commercial options with assumptions.',
      '- Do not invent exact budget or timeline numbers if they are not in context.',
      '- If data is missing, mark as `[Need input]` instead of inventing details.',
    ];
  }

  if (templateId === 'lead-discovery') {
    return [
      '- Provide grouped discovery questions (Business, Product, Technical, Delivery).',
      '- Prioritize questions by impact on estimate and delivery risk.',
      '- Mark top blockers that must be clarified before proposal.',
    ];
  }

  if (templateId === 'lead-followup') {
    return [
      '- Draft a concise follow-up message that can be sent to the client/manager.',
      '- Keep tone professional and action-oriented.',
      '- Include a clear call-to-action with concrete next step options.',
    ];
  }

  return [
    '- Provide concise qualification assessment.',
    '- List top risks and unknowns.',
    '- Suggest next actions and discovery questions.',
    '- If possible, provide rough implementation scope and stack assumptions.',
  ];
}

function buildLeadInstruction(templateId: PromptTemplateId, recipientName: string): string {
  if (templateId === 'lead-proposal') {
    return (
      'Generate a practical proposal draft, not generic advice. ' +
      `Start with exactly: "Hi ${recipientName}! We have carefully reviewed your request and are ready to offer the following terms." ` +
      'Do not output headings or standalone section names. ' +
      'Use only facts from context, mark unknowns as `[Need input]`, ' +
      'and ensure the output can be sent for internal review immediately.'
    );
  }

  return 'Be concrete, avoid generic advice, and use only facts available in the lead context.';
}

export function buildAiPromptText(
  project: ProjectPassport,
  sections: SectionDefinition[],
  completeness: CompletenessInfo,
  templateId: PromptTemplateId
): string {
  const fields = project.fields;
  const isLead = fields.passportEntity === 'Lead';
  const contextBlock = buildPromptContextFromSections(sections, fields);
  const missingImportant =
    completeness.missing.length > 0
      ? completeness.missing.map((item) => item.label).join(', ')
      : 'None';

  if (isLead) {
    const leadExpectedOutput = buildLeadExpectedOutput(templateId);
    const leadRecipientName = fields.client?.trim() || fields.leadName?.trim() || getProjectName(project);
    const leadRole =
      templateId === 'lead-proposal'
        ? 'You are a principal solutions architect preparing a client-ready proposal.'
        : 'You are a senior solutions engineer helping qualify an inbound lead.';

    return [
      '# Role',
      leadRole,
      '',
      '# Task Type',
      `${PROMPT_TEMPLATE_OPTIONS.find((option) => option.id === templateId)?.label || templateId}`,
      `${PROMPT_TEMPLATE_TASK_FOCUS[templateId]}`,
      '',
      '# Lead Snapshot',
      `- Lead Name: ${getFieldValue(fields, 'leadName', getProjectName(project))}`,
      `- Client / Company: ${getFieldValue(fields, 'client')}`,
      `- Lead Status: ${getFieldValue(fields, 'leadStatus', 'New')}`,
      `- Lead Source: ${getFieldValue(fields, 'leadSource', 'Not specified')}`,
      `- Priority: ${getFieldValue(fields, 'priority', 'Not specified')}`,
      `- Contact Person: ${getFieldValue(fields, 'leadContactPerson', 'Not specified')}`,
      '- Communication Channel: ' + (fields.communicationChannel?.trim() || fields.leadContactChannel?.trim() || 'Not specified'),
      '- Communicator(s): ' + (getFieldValue(fields, 'communicatorPeople', 'Not specified')),
      '- Responsible Person(s): ' + (fields.responsiblePeople?.trim() || fields.leadOwner?.trim() || 'Not specified'),
      `- Budget Range: ${getFieldValue(fields, 'leadBudget', 'Not specified')}`,
      '',
      '# Request',
      `- Summary: ${getFieldValue(fields, 'leadSummary')}`,
      `- Qualification Notes: ${getFieldValue(fields, 'leadQualificationNotes', 'Not specified')}`,
      `- Next Step: ${getFieldValue(fields, 'leadNextStep', 'Not specified')}`,
      `- Loss Reason: ${getFieldValue(fields, 'leadLossReason', 'Not specified')}`,
      '',
      '# Constraints',
      `- Missing Important Fields: ${missingImportant}`,
      '',
      '# Expected Output',
      ...leadExpectedOutput,
      '',
      '# Structured Context',
      contextBlock || 'No additional structured context provided.',
      '',
      '# Instruction',
      buildLeadInstruction(templateId, leadRecipientName),
    ].join('\n');
  }

  return [
    '# Role',
    'You are a senior software engineer working in an existing codebase.',
    '',
    '# Task Type',
    `${PROMPT_TEMPLATE_OPTIONS.find((option) => option.id === templateId)?.label || templateId}`,
    `${PROMPT_TEMPLATE_TASK_FOCUS[templateId]}`,
    '',
    '# Objective',
    `- Project Goal: ${getFieldValue(fields, 'businessGoal')}`,
    '',
    '# Project Snapshot',
    `- Project Name: ${getProjectName(project)}`,
    '- Client: ' + getFieldValue(fields, 'client'),
    '- Communication Channel: ' + (fields.communicationChannel?.trim() || fields.leadContactChannel?.trim() || 'Not specified'),
    '- Communicator(s): ' + getFieldValue(fields, 'communicatorPeople', 'Not specified'),
    '- Responsible Person(s): ' + (fields.responsiblePeople?.trim() || fields.leadOwner?.trim() || 'Not specified'),
    "- Department: " + getFieldValue(fields, "department"),
    "- Design Tool: " + getFieldValue(fields, "designTool"),
    "- Design Tool Link: " + getFieldValue(fields, "designToolUrl"),
    `- Project Type: ${getFieldValue(fields, 'projectType')}`,
    `- Status: ${getFieldValue(fields, 'status')}`,
    `- Priority: ${getFieldValue(fields, 'priority')}`,
    `- Main Stack: ${getFieldValue(fields, 'mainStack')}`,
    `- Platform: ${getFieldValue(fields, 'platform')}`,
    `- Hosting / Deployment: ${getFieldValue(fields, 'hostingDeployment')}`,
    `- Database: ${getFieldValue(fields, 'database')}`,
    `- Auth Strategy: ${getFieldValue(fields, 'authStrategy')}`,
    '',
    '# Scope & Acceptance',
    `- Business Goal: ${getFieldValue(fields, 'businessGoal')}`,
    `- Scope In: ${getFieldValue(fields, 'scopeIn')}`,
    `- Scope Out: ${getFieldValue(fields, 'scopeOut', 'None provided')}`,
    `- Definition of Done: ${getFieldValue(fields, 'definitionOfDone')}`,
    `- Acceptance Criteria: ${getFieldValue(fields, 'acceptanceCriteria')}`,
    '',
    '# Constraints',
    `- Scope In: ${getFieldValue(fields, 'scopeIn')}`,
    `- Scope Out: ${getFieldValue(fields, 'scopeOut', 'None provided')}`,
    `- Missing Important Fields: ${missingImportant}`,
    '',
    '# Access & Commands',
    `- Repository URL: ${getFieldValue(fields, 'repositoryUrl')}`,
    `- Docs URL: ${getFieldValue(fields, 'docsUrl', 'Not specified')}`,
    `- Staging URL: ${getFieldValue(fields, 'stagingUrl', 'Not specified')}`,
    `- Production URL: ${getFieldValue(fields, 'productionUrl', 'Not specified')}`,
    `- Install Command: ${getFieldValue(fields, 'runInstallCommand')}`,
    `- Start Command: ${getFieldValue(fields, 'runStartCommand')}`,
    `- Test Command: ${getFieldValue(fields, 'runTestCommand')}`,
    `- Build Command: ${getFieldValue(fields, 'runBuildCommand')}`,
    `- Secrets Reference: ${getFieldValue(fields, 'secretStorageReference', 'Not specified')}`,
    '',
    '# Expected Output',
    'Provide implementation summary, changed files, tests/checks run, and residual risks.',
    '',
    '# Working Boundaries',
    '- Keep changes minimal and aligned with current architecture.',
    '- Preserve existing behavior unless the task explicitly requires changes.',
    '- Do not expose or hardcode secrets.',
    '',
    '# Structured Context',
    contextBlock || 'No additional structured context provided.',
    '',
    '# Instruction',
    'Think step-by-step, keep changes minimal and safe, and validate before finalizing.',
  ].join('\n');
}

export function downloadFile(fileName: string, content: BlobPart, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function formatPayloadAsPdfBlob(payload: PassportExportPayload): Blob {
  const pdf = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = 44;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin;
  let y = margin;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight <= bottomLimit) {
      return;
    }

    pdf.addPage();
    y = margin;
  };

  const addWrappedLine = (text: string, fontSize = 11, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text || '-', contentWidth);
    const lineHeight = Math.max(14, Math.round(fontSize * 1.45));

    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      pdf.text(line, margin, y);
      y += lineHeight;
    });
  };

  const addSpacer = (size = 8) => {
    y += size;
  };

  addWrappedLine('Project Passport', 18, true);
  addWrappedLine(`Generated at: ${payload.generatedAt}`, 10, false);
  addSpacer(10);

  addWrappedLine('Meta', 13, true);
  addWrappedLine(`Name: ${payload.project.name}`);
  addWrappedLine(`Status: ${payload.project.status || '-'}`);
  addWrappedLine(`Project Type: ${payload.project.projectType || '-'}`);
  addWrappedLine('Client: ' + (payload.project.client || '-'));
  addWrappedLine('Communication Channel: ' + (payload.project.communicationChannel || '-'));
  addWrappedLine('Communicator(s): ' + (payload.project.communicatorPeople || '-'));
  addWrappedLine('Responsible Person(s): ' + (payload.project.responsiblePeople || '-'));
  addWrappedLine("Department: " + (payload.project.department || "-"));
  addWrappedLine("Design Tool: " + (payload.project.designTool || "-"));
  addWrappedLine("Design Tool Link: " + (payload.project.designToolUrl || "-"));
  addWrappedLine(`Main Stack: ${payload.project.mainStack || '-'}`);
  addWrappedLine(`Platform: ${payload.project.platform || '-'}`);
  addWrappedLine(`Hosting / Deployment: ${payload.project.hostingDeployment || '-'}`);
  addSpacer(10);

  addWrappedLine(`Completeness: ${payload.completeness.percent}%`, 12, true);
  if (payload.completeness.missingImportantFields.length > 0) {
    addWrappedLine('Missing Important Fields:', 11, true);
    payload.completeness.missingImportantFields.forEach((field) => {
      addWrappedLine(`- ${field.label}`);
    });
  } else {
    addWrappedLine('Missing Important Fields: none');
  }

  payload.sections.forEach((section) => {
    const filledFields = section.fields.filter((field) => field.value.trim());
    if (filledFields.length === 0) {
      return;
    }

    addSpacer(10);
    addWrappedLine(`${section.title}${section.badge ? ` [${section.badge}]` : ''}`, 12, true);
    filledFields.forEach((field) => {
      addWrappedLine(`${field.label}: ${normalizeForSingleLine(field.value)}`, 10, false);
    });
  });

  return pdf.output('blob');
}

export async function formatPayloadAsDocxBlob(payload: PassportExportPayload): Promise<Blob> {
  const children: Paragraph[] = [];

  children.push(new Paragraph({ text: 'Project Passport', heading: HeadingLevel.TITLE }));
  children.push(new Paragraph({ text: `Generated at: ${payload.generatedAt}` }));
  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Meta', heading: HeadingLevel.HEADING_1 }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Name: ', bold: true }), new TextRun(payload.project.name || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Status: ', bold: true }), new TextRun(payload.project.status || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Project Type: ', bold: true }),
        new TextRun(payload.project.projectType || '-'),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Client: ', bold: true }), new TextRun(payload.project.client || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Communication Channel: ', bold: true }),
        new TextRun(payload.project.communicationChannel || '-'),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Communicator(s): ', bold: true }), new TextRun(payload.project.communicatorPeople || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Responsible Person(s): ', bold: true }), new TextRun(payload.project.responsiblePeople || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Department: ', bold: true }),
        new TextRun(payload.project.department || '-'),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Design Tool: ', bold: true }), new TextRun(payload.project.designTool || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Design Tool Link: ', bold: true }), new TextRun(payload.project.designToolUrl || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Main Stack: ', bold: true }), new TextRun(payload.project.mainStack || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Platform: ', bold: true }), new TextRun(payload.project.platform || '-')],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Hosting / Deployment: ', bold: true }),
        new TextRun(payload.project.hostingDeployment || '-'),
      ],
    })
  );
  children.push(new Paragraph({ text: '' }));
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Completeness: ', bold: true }),
        new TextRun(`${payload.completeness.percent}%`),
      ],
    })
  );

  if (payload.completeness.missingImportantFields.length > 0) {
    children.push(new Paragraph({ text: 'Missing Important Fields:', heading: HeadingLevel.HEADING_2 }));
    payload.completeness.missingImportantFields.forEach((field) => {
      children.push(new Paragraph({ text: `- ${field.label}` }));
    });
  } else {
    children.push(new Paragraph({ text: 'Missing Important Fields: none' }));
  }

  payload.sections.forEach((section) => {
    const filledFields = section.fields.filter((field) => field.value.trim());
    if (filledFields.length === 0) {
      return;
    }

    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        text: `${section.title}${section.badge ? ` [${section.badge}]` : ''}`,
        heading: HeadingLevel.HEADING_2,
      })
    );

    filledFields.forEach((field) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${field.label}: `, bold: true }),
            new TextRun(normalizeForSingleLine(field.value)),
          ],
        })
      );
    });
  });

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
