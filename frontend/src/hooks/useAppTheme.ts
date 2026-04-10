import { useCallback, useEffect, useMemo, useState } from 'react';
import { createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { THEME_STORAGE_KEY } from '../config';
import { loadThemeMode } from '../project-utils';

const BRAND_COLORS = {
  white: '#FFFFFF',
  ink: '#2f303f',
  accent: '#50b1a2',
} as const;

export function useAppTheme(): {
  themeMode: PaletteMode;
  toggleTheme: () => void;
  theme: ReturnType<typeof createTheme>;
} {
  const [themeMode, setThemeMode] = useState<PaletteMode>(loadThemeMode);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = useMemo(() => {
    const isDark = themeMode === 'dark';
    const secondaryMain = isDark ? BRAND_COLORS.white : BRAND_COLORS.ink;
    const secondaryContrastText = isDark ? BRAND_COLORS.ink : BRAND_COLORS.white;
    const scrollbarTrack = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(47, 48, 63, 0.12)';
    const scrollbarThumb = isDark ? 'rgba(80, 177, 162, 0.65)' : 'rgba(80, 177, 162, 0.72)';
    const scrollbarThumbHover = isDark ? 'rgba(80, 177, 162, 0.85)' : 'rgba(63, 148, 136, 0.9)';

    return createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: BRAND_COLORS.accent,
          light: '#7fcdc1',
          dark: '#3f9488',
          contrastText: BRAND_COLORS.ink,
        },
        secondary: {
          main: secondaryMain,
          light: isDark ? '#FFFFFF' : '#595a70',
          dark: isDark ? '#d8d8df' : '#1f202a',
          contrastText: secondaryContrastText,
        },
        error: {
          main: secondaryMain,
          contrastText: secondaryContrastText,
        },
        warning: {
          main: BRAND_COLORS.accent,
          contrastText: BRAND_COLORS.ink,
        },
        info: {
          main: BRAND_COLORS.accent,
          contrastText: BRAND_COLORS.ink,
        },
        success: {
          main: BRAND_COLORS.accent,
          contrastText: BRAND_COLORS.ink,
        },
        text: {
          primary: isDark ? BRAND_COLORS.white : BRAND_COLORS.ink,
          secondary: isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(47, 48, 63, 0.72)',
        },
        background: {
          default: isDark ? BRAND_COLORS.ink : BRAND_COLORS.white,
          paper: isDark ? '#3a3b4d' : BRAND_COLORS.white,
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(47, 48, 63, 0.16)',
        action: {
          active: isDark ? BRAND_COLORS.white : BRAND_COLORS.ink,
          hover: isDark ? 'rgba(80, 177, 162, 0.12)' : 'rgba(80, 177, 162, 0.10)',
          selected: isDark ? 'rgba(80, 177, 162, 0.22)' : 'rgba(80, 177, 162, 0.16)',
        },
      },
      shape: {
        borderRadius: 12,
      },
      typography: {
        fontFamily: `'IBM Plex Sans', 'Segoe UI', sans-serif`,
        h4: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        subtitle2: { fontWeight: 600 },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            '*': {
              scrollbarWidth: 'thin',
              scrollbarColor: `${scrollbarThumb} ${scrollbarTrack}`,
            },
            '*::-webkit-scrollbar': {
              width: '11px',
              height: '11px',
            },
            '*::-webkit-scrollbar-track': {
              background: scrollbarTrack,
              borderRadius: '10px',
            },
            '*::-webkit-scrollbar-thumb': {
              backgroundColor: scrollbarThumb,
              borderRadius: '10px',
              border: `2px solid ${scrollbarTrack}`,
            },
            '*::-webkit-scrollbar-thumb:hover': {
              backgroundColor: scrollbarThumbHover,
            },
            '*::-webkit-scrollbar-corner': {
              background: scrollbarTrack,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: 10,
            },
          },
        },
      },
    });
  }, [themeMode]);

  return {
    themeMode,
    toggleTheme,
    theme,
  };
}
