import {
  BASE_SECTIONS,
  FieldDefinition,
  LEAD_SECTIONS,
  SectionDefinition,
  SelectOption,
  getConditionalSections,
} from './passport-schema';
import {
  FIELD_ICON_BY_ID,
  SECTION_ICONS,
} from './config';
import {
  STATIC_SELECT_OPTIONS_BY_FIELD_ID,
  StackDrivenSelectOptions,
  getStackDrivenOptions,
  withCurrentOption,
} from './select-options';

export function getFieldEmoji(fieldId: string): string | undefined {
  if (fieldId === 'mainStack' || fieldId === 'platform' || fieldId === 'hostingDeployment') {
    return undefined;
  }

  return FIELD_ICON_BY_ID[fieldId];
}

export function withEmojiPrefix(label: string, emoji?: string): string {
  return emoji ? `${emoji} ${label}` : label;
}

function buildEnhancedField(field: FieldDefinition, projectFields: Record<string, string>): FieldDefinition {
  const mainStack = projectFields.mainStack || '';
  const currentValue = projectFields[field.id] || '';
  let options: SelectOption[] | undefined;

  if (field.id === 'cms' || field.id === 'database' || field.id === 'storage' || field.id === 'authStrategy') {
    const stackOptions = getStackDrivenOptions(mainStack);
    const stackFieldId = field.id as keyof StackDrivenSelectOptions;
    options = stackOptions[stackFieldId];
  } else {
    options = STATIC_SELECT_OPTIONS_BY_FIELD_ID[field.id];
  }

  if (!options) {
    return field;
  }

  return {
    ...field,
    type: 'select',
    options: withCurrentOption(options, currentValue),
  };
}

export function getSectionEmoji(sectionId: string): string | undefined {
  if (sectionId.startsWith('stack-')) {
    return undefined;
  }

  if (SECTION_ICONS[sectionId]) {
    return SECTION_ICONS[sectionId];
  }

  if (sectionId.startsWith('hosting-')) {
    return '☁️';
  }

  return undefined;
}

function getSectionOrderRank(sectionId: string): number {
  if (sectionId === 'lead-header') {
    return 10;
  }

  if (sectionId === 'lead-brief') {
    return 20;
  }

  if (sectionId === 'lead-files') {
    return 30;
  }

  if (sectionId === 'passport-header') {
    return 10;
  }

  if (sectionId.startsWith('stack-')) {
    return 20;
  }

  if (sectionId.startsWith('hosting-')) {
    return 30;
  }

  if (sectionId === 'repositories-environments') {
    return 40;
  }

  if (sectionId === 'project-files') {
    return 45;
  }

  if (sectionId === 'project-intent') {
    return 50;
  }

  if (sectionId === 'test-assignment-template') {
    return 55;
  }

  if (sectionId === 'delivery-runbook') {
    return 60;
  }

  if (sectionId === 'technical-profile') {
    return 80;
  }

  return 999;
}

export function getProjectSections(fields: Record<string, string>): SectionDefinition[] {
  const isLeadEntity = fields.passportEntity === 'Lead';
  const isTestAssignmentTemplate = fields.passportTemplate === 'Test Assignment';
  const baseSections = isLeadEntity ? LEAD_SECTIONS : BASE_SECTIONS;
  const conditionalSections = isLeadEntity ? [] : getConditionalSections(fields);
  const rawSections = [...baseSections, ...conditionalSections].filter((section) => {
    if (isTestAssignmentTemplate && section.id === 'project-intent') {
      return false;
    }

    return true;
  });
  const sortedSections = rawSections
    .map((section, index) => ({
      section,
      index,
      rank: getSectionOrderRank(section.id),
    }))
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }

      return a.index - b.index;
    })
    .map((item) => item.section);

  return sortedSections.map((section) => {
    let visibleFields = section.fields;

    if (section.id === 'technical-profile') {
      visibleFields = section.fields.filter(
        (field) => field.id !== 'mainStack' && field.id !== 'platform' && field.id !== 'hostingDeployment'
      );
    }

    if (section.id === 'passport-header') {
      visibleFields = visibleFields.filter(
        (field) =>
          field.id !== 'passportTemplate'
      );
    }

    return {
      ...section,
      fields: visibleFields.map((field) => buildEnhancedField(field, fields)),
    };
  });
}
