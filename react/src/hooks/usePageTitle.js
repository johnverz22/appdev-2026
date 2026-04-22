import { useEffect } from 'react';

const APP_NAME = 'AppDev';

/**
 * Sets the browser tab title for the current page.
 *
 * Usage:
 *   usePageTitle('Catalog');        // → "Catalog | AppDev"
 *   usePageTitle('Login');          // → "Login | AppDev"
 *   usePageTitle(null);             // → "AppDev"  (home/dashboard)
 *
 * @param {string|null} title - The page-specific title, or null for the app name only.
 */
export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;

        // Reset to app name when the component unmounts (page navigation)
        return () => {
            document.title = APP_NAME;
        };
    }, [title]);
}
