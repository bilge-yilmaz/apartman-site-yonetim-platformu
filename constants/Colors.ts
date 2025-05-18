/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#3457D5';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f8f9fa',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  primary: '#3457D5',
  secondary: '#F8B630', 
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196F3',
  lightGray: '#e0e0e0',
  darkGray: '#333333',
  background: '#f8f9fa',
  white: '#ffffff',
  black: '#1a1a1a',
  cardShadow: 'rgba(0, 0, 0, 0.05)',
};

export default Colors;
