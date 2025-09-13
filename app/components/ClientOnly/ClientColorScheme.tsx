import { useMantineColorScheme } from '@mantine/core';
import { useEffect } from 'react';

export function ClientColorScheme() {
    const { setColorScheme } = useMantineColorScheme();

    useEffect(() => {
        // Run immediately after hydration to apply correct theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentScheme = prefersDark ? 'dark' : 'light';

        // Update both Mantine state and DOM attribute
        setColorScheme(currentScheme);
        document.documentElement.setAttribute('data-mantine-color-scheme', currentScheme);

        // Listen for changes to system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const newScheme = e.matches ? 'dark' : 'light';
            setColorScheme(newScheme);

            // Update the DOM and cookie
            document.documentElement.setAttribute('data-mantine-color-scheme', newScheme);
            document.cookie = `mantine-color-scheme=${newScheme}; path=/; max-age=31536000`;
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [setColorScheme]);

    return null; // This component doesn't render anything
}
