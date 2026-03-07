import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    actualTheme: 'light' | 'dark'; // What is actually applied when in 'auto'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const SETTINGS_KEY = 'coding-tracker-settings';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Try to load initial theme from settings
    const getInitialTheme = (): Theme => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.theme && ['light', 'dark', 'auto'].includes(parsed.theme)) {
                    return parsed.theme as Theme;
                }
            }
        } catch {
            // ignore
        }
        return 'dark'; // Default
    };

    const [theme, setTheme] = useState<Theme>(getInitialTheme);
    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const applyTheme = (currentTheme: Theme) => {
            let activeTheme: 'light' | 'dark' = 'dark';

            if (currentTheme === 'auto') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                activeTheme = systemPrefersDark ? 'dark' : 'light';
            } else {
                activeTheme = currentTheme;
            }

            setActualTheme(activeTheme);

            if (activeTheme === 'light') {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
            }
        };

        applyTheme(theme);

        // Sync to settings if it changed elsewhere (but keep other settings intact)
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            if (parsed.theme !== theme) {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...parsed, theme }));
            }
        } catch {
            // ignore
        }

        // Listen for system preference changes if in auto mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'auto') {
                applyTheme('auto');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Also listen for settings changes from other components (like Settings.tsx)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === SETTINGS_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed.theme && parsed.theme !== theme) {
                        setTheme(parsed.theme as Theme);
                    }
                } catch {
                    // ignore
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
