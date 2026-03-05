import tailwindAnimate from 'tailwindcss-animate';
import containerQuery from '@tailwindcss/container-queries';
import intersect from 'tailwindcss-intersect';

export default {
    darkMode: ['class'],
    content: [
        './index.html',
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
        './node_modules/streamdown/dist/**/*.js'
    ],
    safelist: ['border', 'border-border'],
    prefix: '',
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                borderColor: {
                    border: 'hsl(var(--border))'
                },
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    glow: 'hsl(var(--primary-glow))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    glow: 'hsl(var(--secondary-glow))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                    glow: 'hsl(var(--accent-glow))'
                },
                gold: {
                    DEFAULT: 'hsl(var(--gold))',
                    dark: 'hsl(var(--gold-dark))',
                    foreground: 'hsl(var(--gold-foreground))'
                },
                neon: {
                    pink: 'hsl(var(--neon-pink))',
                    cyan: 'hsl(var(--neon-cyan))',
                    yellow: 'hsl(var(--neon-yellow))',
                    green: 'hsl(var(--neon-green))'
                },
                'card-color': {
                    purple: 'hsl(var(--card-purple))',
                    pink: 'hsl(var(--card-pink))',
                    blue: 'hsl(var(--card-blue))',
                    green: 'hsl(var(--card-green))',
                    orange: 'hsl(var(--card-orange))',
                    yellow: 'hsl(var(--card-yellow))'
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))'
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    background: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            backgroundImage: {
                'gradient-purple-blue': 'var(--gradient-purple-blue)',
                'gradient-pink-orange': 'var(--gradient-pink-orange)',
                'gradient-cyan-blue': 'var(--gradient-cyan-blue)',
                'gradient-green-yellow': 'var(--gradient-green-yellow)',
                'gradient-gold': 'var(--gradient-gold)',
                'gradient-rainbow': 'var(--gradient-rainbow)',
                'gradient-neon-pink': 'var(--gradient-neon-pink)',
                'gradient-neon-cyan': 'var(--gradient-neon-cyan)',
                'gradient-neon-yellow': 'var(--gradient-neon-yellow)'
            },
            boxShadow: {
                'colorful': 'var(--shadow-colorful)',
                'neon': 'var(--shadow-neon)',
                'gold': 'var(--shadow-gold)',
                'heavy': 'var(--shadow-heavy)'
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                },
                'fade-in': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(10px)'
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                },
                'slide-in': {
                    from: {
                        opacity: '0',
                        transform: 'translateX(-20px)'
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateX(0)'
                    }
                },
                'pulse-scale': {
                    '0%, 100%': {
                        transform: 'scale(1)'
                    },
                    '50%': {
                        transform: 'scale(1.05)'
                    }
                },
                'bounce-soft': {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '50%': {
                        transform: 'translateY(-10px)'
                    }
                },
                'spin-slow': {
                    from: {
                        transform: 'rotate(0deg)'
                    },
                    to: {
                        transform: 'rotate(360deg)'
                    }
                },
                'wiggle': {
                    '0%, 100%': {
                        transform: 'rotate(-3deg)'
                    },
                    '50%': {
                        transform: 'rotate(3deg)'
                    }
                },
                'float': {
                    '0%, 100%': {
                        transform: 'translateY(0px)'
                    },
                    '50%': {
                        transform: 'translateY(-20px)'
                    }
                },
                'glow': {
                    '0%, 100%': {
                        filter: 'brightness(1)'
                    },
                    '50%': {
                        filter: 'brightness(1.3)'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'slide-in': 'slide-in 0.5s ease-out',
                'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
                'bounce-soft': 'bounce-soft 1s ease-in-out infinite',
                'spin-slow': 'spin-slow 3s linear infinite',
                'wiggle': 'wiggle 1s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite'
            }
        }
    },
    plugins: [
        tailwindAnimate,
        containerQuery,
        intersect,
        function ({addUtilities}) {
            addUtilities(
                {
                    '.border-t-solid': {'border-top-style': 'solid'},
                    '.border-r-solid': {'border-right-style': 'solid'},
                    '.border-b-solid': {'border-bottom-style': 'solid'},
                    '.border-l-solid': {'border-left-style': 'solid'},
                    '.border-t-dashed': {'border-top-style': 'dashed'},
                    '.border-r-dashed': {'border-right-style': 'dashed'},
                    '.border-b-dashed': {'border-bottom-style': 'dashed'},
                    '.border-l-dashed': {'border-left-style': 'dashed'},
                    '.border-t-dotted': {'border-top-style': 'dotted'},
                    '.border-r-dotted': {'border-right-style': 'dotted'},
                    '.border-b-dotted': {'border-bottom-style': 'dotted'},
                    '.border-l-dotted': {'border-left-style': 'dotted'},
                },
                ['responsive']
            );
        },
    ],
};
