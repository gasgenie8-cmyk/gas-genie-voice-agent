/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#10B981',
                    hover: '#059669',
                    foreground: '#FFFFFF',
                },
                secondary: {
                    DEFAULT: '#1E293B',
                    hover: '#334155',
                    foreground: '#F8FAFC',
                },
                background: '#0F172A',
                foreground: '#F1F5F9',
                muted: '#1E293B',
                accent: '#06B6D4',
                destructive: '#EF4444',
                success: '#10B981',
                warning: '#F59E0B',
                card: {
                    DEFAULT: '#1E293B',
                    foreground: '#F1F5F9',
                },
                border: '#334155',
                ring: '#10B981',
            },
            fontFamily: {
                heading: ['Outfit', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '0.75rem',
                sm: '0.375rem',
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'fade-in': 'fade-in 0.5s ease-out',
                'slide-up': 'slide-up 0.5s ease-out',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
