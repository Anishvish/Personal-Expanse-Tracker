import {
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperLightTheme,
} from 'react-native-paper';

const palette = {
  primary: '#0f766e',
  secondary: '#f59e0b',
  tertiary: '#2563eb',
  accent: '#ef4444',
  backgroundLight: '#eef4f2',
  backgroundDark: '#08141d',
  surfaceLight: '#ffffff',
  surfaceDark: '#11212d',
  textLight: '#102033',
  textDark: '#eaf1fb',
  outlineLight: '#cfded9',
  outlineDark: '#284153',
};

export const lightTheme = {
  ...PaperLightTheme,
  colors: {
    ...PaperLightTheme.colors,
    primary: palette.primary,
    secondary: palette.secondary,
    tertiary: palette.tertiary,
    error: palette.accent,
    background: palette.backgroundLight,
    surface: palette.surfaceLight,
    surfaceVariant: '#ddebe6',
    primaryContainer: '#b9e4d7',
    secondaryContainer: '#fde3b3',
    tertiaryContainer: '#cddff9',
    outline: palette.outlineLight,
    onBackground: palette.textLight,
    onSurface: palette.textLight,
  },
};

export const darkTheme = {
  ...PaperDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    primary: '#34d399',
    secondary: '#fbbf24',
    tertiary: '#60a5fa',
    error: '#f87171',
    background: palette.backgroundDark,
    surface: palette.surfaceDark,
    surfaceVariant: '#1b3140',
    primaryContainer: '#164e46',
    secondaryContainer: '#5a4108',
    tertiaryContainer: '#17365f',
    outline: palette.outlineDark,
    onBackground: palette.textDark,
    onSurface: palette.textDark,
  },
};
