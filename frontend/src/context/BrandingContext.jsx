import React, { createContext, useContext, useEffect, useMemo } from 'react';
import useAuthStore from '../store/useAuth';

const BrandingContext = createContext(null);

export const BrandingProvider = ({ children }) => {
    const { organization } = useAuthStore();

    const branding = useMemo(() => {
        return organization?.branding || {
            primaryColor: '#3b82f6',
            secondaryColor: '#1e293b',
            accentColor: '#8b5cf6',
            fontFamily: 'Inter',
        };
    }, [organization]);

    useEffect(() => {
        if (!branding) return;

        const root = document.documentElement;

        // Inject CSS Variables
        root.style.setProperty('--primary-color', branding.primaryColor);
        root.style.setProperty('--secondary-color', branding.secondaryColor);
        root.style.setProperty('--accent-color', branding.accentColor);
        root.style.setProperty('--font-family', branding.fontFamily);

        // Generate lighter/darker shades if needed (utility)
        // For simplicity, we'll stick to core tokens for now

        // Inject Custom CSS if provided
        if (branding.customCss) {
            let styleTag = document.getElementById('org-custom-css');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'org-custom-css';
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = branding.customCss;
        }

        return () => {
            // Optional: reset on unmount if needed
        };
    }, [branding]);

    return (
        <BrandingContext.Provider value={branding}>
            <div style={{ fontFamily: branding.fontFamily }}>
                {children}
            </div>
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
