// File: src/components/theme-provider.tsx
import React, {createContext, useContext, useEffect, useState} from 'react';

// Define theme types
type Theme = 'dark' | 'light' | 'system';

// Constants
const MEDIA_QUERY_DARK_MODE = '(prefers-color-scheme: dark)';
const THEME_CLASSES = ['light', 'dark'];
const DEFAULT_THEME: Theme = 'system';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    // eslint-disable-next-line no-unused-vars
    setTheme: (theme: Theme) => void;
};

// Create context with a more minimal initial state
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

// Helper function to apply theme to document root
function applyThemeToDOM(theme: Theme): void {
    const root = window.document.documentElement;
    root.classList.remove(...THEME_CLASSES);

    if (theme === 'system') {
        const systemTheme = window.matchMedia(MEDIA_QUERY_DARK_MODE).matches
            ? 'dark'
            : 'light';
        root.classList.add(systemTheme);
        return;
    }

    root.classList.add(theme);
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = 'ui-theme'
}: ThemeProviderProps) {
    // Safe localStorage access with type handling
    const getStoredTheme = (): Theme | null => {
        try {
            const storedTheme = window.localStorage.getItem(storageKey);
            return (storedTheme as Theme) || null;
        } catch (e) {
            console.warn('Unable to access localStorage:', e);
            return null;
        }
    };

    const [theme, setTheme] = useState<Theme>(
        () => getStoredTheme() || defaultTheme
    );

    // Apply theme changes to DOM
    useEffect(() => {
        applyThemeToDOM(theme);
    }, [theme]);

    // Create theme setter function
    const updateTheme = (newTheme: Theme) => {
        try {
            window.localStorage.setItem(storageKey, newTheme);
        } catch (e) {
            console.warn('Unable to save theme to localStorage:', e);
        }
        setTheme(newTheme);
    };

    // Create the context value object
    const contextValue: ThemeProviderState = {
        theme,
        setTheme: updateTheme,
    };

    return (
        <ThemeProviderContext.Provider value={contextValue}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = (): ThemeProviderState => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider component');
    }

    return context;
};
