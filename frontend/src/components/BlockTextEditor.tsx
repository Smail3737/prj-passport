import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { Box, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

type BlockType = 'text' | 'bullet' | 'todo';
type PersistMode = 'debounced' | 'immediate';
type EditorInput = HTMLInputElement | HTMLTextAreaElement;

interface EditorBlock {
  id: string;
  type: BlockType;
  text: string;
  checked: boolean;
}

interface BlockTextEditorProps {
  label: string;
  value: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

const PERSIST_DEBOUNCE_MS = 450;

function createBlock(type: BlockType = 'text', text = '', checked = false): EditorBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    text,
    checked,
  };
}

function parseLineToBlock(rawLine: string): EditorBlock {
  const trimmed = rawLine.trim();

  const todoMatch = trimmed.match(/^[-*]\s+\[( |x|X)\]\s*(.*)$/);
  if (todoMatch) {
    return createBlock('todo', todoMatch[2] || '', todoMatch[1].toLowerCase() === 'x');
  }

  const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
  if (bulletMatch) {
    return createBlock('bullet', bulletMatch[1] || '', false);
  }

  return createBlock('text', trimmed, false);
}

function parseValueToBlocks(value: string): EditorBlock[] {
  const normalized = value.replace(/\r\n/g, '\n');

  if (!normalized.trim()) {
    return [createBlock('text', '')];
  }

  const blocks = normalized.split('\n').map((line) => parseLineToBlock(line));
  return blocks.length > 0 ? blocks : [createBlock('text', '')];
}

function serializeBlocks(blocks: EditorBlock[]): string {
  return blocks
    .map((block) => {
      const text = block.text;

      if (block.type === 'bullet') {
        return `- ${text}`;
      }

      if (block.type === 'todo') {
        return `- [${block.checked ? 'x' : ' '}] ${text}`;
      }

      return text;
    })
    .join('\n')
    .trimEnd();
}

function getBlockPrefix(block: EditorBlock): string {
  if (block.type === 'bullet') {
    return '•';
  }

  return '';
}

export function BlockTextEditor({
  label,
  value,
  placeholder,
  helperText,
  required,
  readOnly,
  onChange,
}: BlockTextEditorProps): JSX.Element {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => parseValueToBlocks(value));
  const [activeBlockId, setActiveBlockId] = useState<string>('');

  const inputRefs = useRef<Record<string, EditorInput | null>>({});
  const lastCommittedRef = useRef<string>(serializeBlocks(parseValueToBlocks(value)));
  const pendingPersistRef = useRef<string | null>(null);
  const persistTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const parsed = parseValueToBlocks(value);
    const normalized = serializeBlocks(parsed);

    if (normalized !== lastCommittedRef.current) {
      if (persistTimeoutRef.current) {
        window.clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }

      pendingPersistRef.current = null;
      setBlocks(parsed);
      lastCommittedRef.current = normalized;
    }
  }, [value]);

  useEffect(() => {
    if (!activeBlockId && blocks[0]) {
      setActiveBlockId(blocks[0].id);
    }
  }, [activeBlockId, blocks]);

  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) {
        window.clearTimeout(persistTimeoutRef.current);
      }
    };
  }, []);

  const clearPersistTimer = (): void => {
    if (!persistTimeoutRef.current) {
      return;
    }

    window.clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = null;
  };

  const flushPendingPersist = (): void => {
    clearPersistTimer();

    if (pendingPersistRef.current === null) {
      return;
    }

    onChange(pendingPersistRef.current);
    pendingPersistRef.current = null;
  };

  const schedulePersist = (serialized: string, mode: PersistMode): void => {
    if (mode === 'immediate') {
      pendingPersistRef.current = null;
      clearPersistTimer();
      onChange(serialized);
      return;
    }

    pendingPersistRef.current = serialized;
    clearPersistTimer();

    persistTimeoutRef.current = window.setTimeout(() => {
      if (pendingPersistRef.current !== null) {
        onChange(pendingPersistRef.current);
        pendingPersistRef.current = null;
      }

      persistTimeoutRef.current = null;
    }, PERSIST_DEBOUNCE_MS);
  };

  const commitBlocks = (nextBlocks: EditorBlock[], persistMode: PersistMode = 'debounced'): EditorBlock[] => {
    const safeBlocks = nextBlocks.length > 0 ? nextBlocks : [createBlock('text', '')];

    setBlocks(safeBlocks);

    if (!safeBlocks.some((block) => block.id === activeBlockId)) {
      setActiveBlockId(safeBlocks[0].id);
    }

    const serialized = serializeBlocks(safeBlocks);
    const hasChanged = serialized !== lastCommittedRef.current;

    lastCommittedRef.current = serialized;

    if (hasChanged) {
      schedulePersist(serialized, persistMode);
    }

    return safeBlocks;
  };

  const focusBlock = (blockId: string, cursor: 'start' | 'end' | number = 'end'): void => {
    window.requestAnimationFrame(() => {
      const node = inputRefs.current[blockId];
      if (!node) {
        return;
      }

      node.focus();

      if (typeof node.selectionStart !== 'number' || typeof node.selectionEnd !== 'number') {
        return;
      }

      if (cursor === 'start') {
        node.setSelectionRange(0, 0);
        return;
      }

      const textLength = node.value.length;

      if (cursor === 'end') {
        node.setSelectionRange(textLength, textLength);
        return;
      }

      const safeCursor = Math.max(0, Math.min(cursor, textLength));
      node.setSelectionRange(safeCursor, safeCursor);
    });
  };

  const getBlockIndex = (blockId: string): number => blocks.findIndex((block) => block.id === blockId);

  const updateBlock = (
    blockId: string,
    updater: (block: EditorBlock) => EditorBlock,
    persistMode: PersistMode = 'debounced'
  ): void => {
    const nextBlocks = blocks.map((block) => (block.id === blockId ? updater(block) : block));
    commitBlocks(nextBlocks, persistMode);
  };

  const removeBlock = (blockId: string): void => {
    const index = getBlockIndex(blockId);
    if (index < 0) {
      return;
    }

    if (blocks.length === 1) {
      const empty = createBlock('text', '');
      commitBlocks([empty], 'immediate');
      setActiveBlockId(empty.id);
      focusBlock(empty.id);
      return;
    }

    const nextBlocks = blocks.filter((block) => block.id !== blockId);
    const fallback = nextBlocks[Math.max(0, index - 1)] || nextBlocks[0];

    commitBlocks(nextBlocks, 'immediate');

    if (fallback) {
      setActiveBlockId(fallback.id);
      focusBlock(fallback.id, 'end');
    }
  };

  const convertBlockType = (blockId: string, nextType: BlockType, checked = false): void => {
    updateBlock(
      blockId,
      (block) => ({
        ...block,
        type: nextType,
        checked: nextType === 'todo' ? checked : false,
      }),
      'immediate'
    );
  };

  const toggleTodoChecked = (blockId: string): void => {
    updateBlock(
      blockId,
      (block) => {
        if (block.type !== 'todo') {
          return {
            ...block,
            type: 'todo',
            checked: true,
          };
        }

        return {
          ...block,
          checked: !block.checked,
        };
      },
      'immediate'
    );
  };

  const splitBlockAtCursor = (blockId: string, cursorPosition: number): void => {
    const index = getBlockIndex(blockId);
    if (index < 0) {
      return;
    }

    const block = blocks[index];
    const safeCursor = Math.max(0, Math.min(cursorPosition, block.text.length));
    const before = block.text.slice(0, safeCursor);
    const after = block.text.slice(safeCursor);

    const nextBlocks = [...blocks];
    nextBlocks[index] = {
      ...block,
      text: before,
    };

    const newBlock = createBlock(block.type, after, false);
    nextBlocks.splice(index + 1, 0, newBlock);

    commitBlocks(nextBlocks, 'immediate');
    setActiveBlockId(newBlock.id);
    focusBlock(newBlock.id, 'start');
  };

  const insertEmptyBlockBelow = (blockId: string, type: BlockType = 'text'): void => {
    const index = getBlockIndex(blockId);
    if (index < 0) {
      return;
    }

    const nextBlocks = [...blocks];
    const newBlock = createBlock(type, '', false);
    nextBlocks.splice(index + 1, 0, newBlock);

    commitBlocks(nextBlocks, 'immediate');
    setActiveBlockId(newBlock.id);
    focusBlock(newBlock.id, 'start');
  };

  const mergeWithPrevious = (blockId: string): void => {
    const index = getBlockIndex(blockId);
    if (index <= 0) {
      return;
    }

    const previous = blocks[index - 1];
    const current = blocks[index];
    const previousLength = previous.text.length;

    const nextBlocks = [...blocks];
    nextBlocks[index - 1] = {
      ...previous,
      text: `${previous.text}${current.text}`,
    };
    nextBlocks.splice(index, 1);

    commitBlocks(nextBlocks, 'immediate');
    setActiveBlockId(previous.id);
    focusBlock(previous.id, previousLength);
  };

  const mergeWithNext = (blockId: string): void => {
    const index = getBlockIndex(blockId);
    if (index < 0 || index >= blocks.length - 1) {
      return;
    }

    const current = blocks[index];
    const next = blocks[index + 1];
    const cursorPosition = current.text.length;

    const nextBlocks = [...blocks];
    nextBlocks[index] = {
      ...current,
      text: `${current.text}${next.text}`,
    };
    nextBlocks.splice(index + 1, 1);

    commitBlocks(nextBlocks, 'immediate');
    setActiveBlockId(current.id);
    focusBlock(current.id, cursorPosition);
  };

  const pasteAsBlocks = (blockId: string, pastedText: string, selectionStart: number, selectionEnd: number): void => {
    const index = getBlockIndex(blockId);
    if (index < 0) {
      return;
    }

    const current = blocks[index];
    const before = current.text.slice(0, selectionStart);
    const after = current.text.slice(selectionEnd);
    const normalized = pastedText.replace(/\r\n/g, '\n');
    const rawLines = normalized.split('\n');

    const parsedBlocks = rawLines.map((line) => parseLineToBlock(line));

    if (parsedBlocks.length === 0) {
      return;
    }

    const first = {
      ...parsedBlocks[0],
      text: `${before}${parsedBlocks[0].text}`,
      type: parsedBlocks[0].type === 'text' && current.type !== 'text' ? current.type : parsedBlocks[0].type,
      checked:
        parsedBlocks[0].type === 'todo'
          ? parsedBlocks[0].checked
          : current.type === 'todo'
            ? current.checked
            : false,
    };

    const lastIndex = parsedBlocks.length - 1;
    const last = {
      ...parsedBlocks[lastIndex],
      text: `${parsedBlocks[lastIndex].text}${after}`,
    };

    const adjusted = [...parsedBlocks];
    adjusted[0] = first;
    adjusted[lastIndex] = last;

    const nextBlocks = [...blocks];
    nextBlocks.splice(index, 1, ...adjusted);

    commitBlocks(nextBlocks, 'immediate');

    const focusTarget = adjusted[adjusted.length - 1];
    if (focusTarget) {
      setActiveBlockId(focusTarget.id);
      const cursor = Math.max(0, focusTarget.text.length - after.length);
      focusBlock(focusTarget.id, cursor);
    }
  };

  const handleBlockKeyDown = (event: React.KeyboardEvent<EditorInput>, block: EditorBlock): void => {
    if (readOnly) {
      return;
    }

    const input = event.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const isCollapsed = selectionStart === selectionEnd;
    const atStart = isCollapsed && selectionStart === 0;
    const atEnd = isCollapsed && selectionStart === block.text.length;
    const index = getBlockIndex(block.id);

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      // When cursor is at the start, keep Enter insertion below the current line.
      if (selectionStart === 0 && selectionEnd === 0) {
        insertEmptyBlockBelow(block.id, block.type);
        return;
      }

      splitBlockAtCursor(block.id, selectionStart);
      return;
    }

    if (event.key === 'Backspace' && atStart) {
      if (!block.text) {
        if (block.type !== 'text') {
          event.preventDefault();
          convertBlockType(block.id, 'text');
          return;
        }

        if (blocks.length > 1) {
          event.preventDefault();
          removeBlock(block.id);
          return;
        }
      }

      if (index > 0) {
        event.preventDefault();
        mergeWithPrevious(block.id);
      }

      return;
    }

    if (event.key === 'Delete' && atEnd) {
      if (!block.text && block.type !== 'text') {
        event.preventDefault();
        convertBlockType(block.id, 'text');
        return;
      }

      if (index >= 0 && index < blocks.length - 1) {
        event.preventDefault();
        mergeWithNext(block.id);
      }

      return;
    }

    if (event.key === 'ArrowUp' && atStart) {
      if (index > 0) {
        event.preventDefault();
        const previous = blocks[index - 1];
        setActiveBlockId(previous.id);
        focusBlock(previous.id, 'end');
      }

      return;
    }

    if (event.key === 'ArrowDown' && atEnd) {
      if (index >= 0 && index < blocks.length - 1) {
        event.preventDefault();
        const next = blocks[index + 1];
        setActiveBlockId(next.id);
        focusBlock(next.id, 'start');
      }
    }
  };

  const activeBlock = blocks.find((block) => block.id === activeBlockId) || blocks[0];

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {required ? `${label} *` : label}
        </Typography>

        <Stack direction="row" spacing={0.25}>
          <Tooltip title="Text block">
            <span>
              <IconButton
                size="small"
                disabled={readOnly || !activeBlock}
                onClick={() => {
                  if (activeBlock) {
                    convertBlockType(activeBlock.id, 'text');
                  }
                }}
                sx={{ opacity: activeBlock?.type === 'text' ? 1 : 0.6 }}
              >
                <NotesRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Bullet list item">
            <span>
              <IconButton
                size="small"
                disabled={readOnly || !activeBlock}
                onClick={() => {
                  if (activeBlock) {
                    convertBlockType(activeBlock.id, 'bullet');
                  }
                }}
                sx={{ opacity: activeBlock?.type === 'bullet' ? 1 : 0.6 }}
              >
                <FormatListBulletedRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="To-do item">
            <span>
              <IconButton
                size="small"
                disabled={readOnly || !activeBlock}
                onClick={() => {
                  if (activeBlock) {
                    convertBlockType(activeBlock.id, 'todo', activeBlock.checked);
                  }
                }}
                sx={{ opacity: activeBlock?.type === 'todo' ? 1 : 0.6 }}
              >
                <TaskAltRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
        <Stack spacing={0.4}>
          {blocks.map((block, index) => (
            <Box
              key={block.id}
              sx={{
                borderRadius: 1.5,
                bgcolor: 'transparent',
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={0.6} sx={{ py: 0.2 }}>
                <Box sx={{ minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 0.45 }}>
                  {block.type === 'todo' ? (
                    <IconButton
                      size="small"
                      disabled={readOnly}
                      onClick={() => toggleTodoChecked(block.id)}
                      sx={{ p: 0.2, color: 'text.secondary' }}
                      aria-label={block.checked ? 'Mark todo as not done' : 'Mark todo as done'}
                    >
                      {block.checked ? (
                        <CheckBoxOutlinedIcon fontSize="small" />
                      ) : (
                        <CheckBoxOutlineBlankOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {getBlockPrefix(block)}
                    </Typography>
                  )}
                </Box>

                <TextField
                  fullWidth
                  multiline
                  maxRows={10}
                  variant="standard"
                  value={block.text}
                  placeholder={index === 0 ? placeholder : 'Type text'}
                  onFocus={() => setActiveBlockId(block.id)}
                  onBlur={flushPendingPersist}
                  onChange={(event) => {
                    const nextText = event.target.value;
                    updateBlock(block.id, (current) => ({ ...current, text: nextText }), 'debounced');
                  }}
                  onKeyDown={(event) => handleBlockKeyDown(event, block)}
                  onPaste={(event) => {
                    if (readOnly) {
                      return;
                    }

                    const text = event.clipboardData.getData('text/plain');
                    if (!text || !text.includes('\n')) {
                      return;
                    }

                    event.preventDefault();
                    const selectionStart = event.currentTarget.selectionStart ?? block.text.length;
                    const selectionEnd = event.currentTarget.selectionEnd ?? block.text.length;
                    pasteAsBlocks(block.id, text, selectionStart, selectionEnd);
                  }}
                  InputProps={{
                    readOnly,
                    disableUnderline: true,
                    sx: {
                      px: 1,
                      py: 0.35,
                      borderRadius: 1,
                      alignItems: 'flex-start',
                      bgcolor: 'transparent',
                      '& .MuiInputBase-input': {
                        lineHeight: 1.45,
                      },
                      '&:hover': {
                        bgcolor: 'transparent',
                      },
                      '&.Mui-focused': {
                        bgcolor: 'transparent',
                      },
                    },
                  }}
                  inputRef={(node) => {
                    inputRefs.current[block.id] = node;
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>

      {helperText && (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}
    </Stack>
  );
}
