// Chat UI Styles exports
// Theme and styling utilities

/**
 * Theme types
 */
export type Theme = 'bootstrap' | 'tailwind';

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  type: Theme;
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    surface?: string;
  };
  components?: {
    button?: string;
    input?: string;
    modal?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Bootstrap theme configuration
 */
export const bootstrapTheme: ThemeConfig = {
  type: 'bootstrap',
  colors: {
    primary: 'var(--bootstrap-primary)',
    secondary: 'var(--bootstrap-secondary)',
    background: 'var(--bootstrap-bg)',
    surface: 'var(--bootstrap-surface)',
  },
  components: {
    button: 'btn btn-primary',
    input: 'form-control',
    modal: 'modal',
  },
};

/**
 * Tailwind theme configuration
 */
export const tailwindTheme: ThemeConfig = {
  type: 'tailwind',
  colors: {
    primary: 'var(--tailwind-primary)',
    secondary: 'var(--tailwind-secondary)',
    background: 'var(--tailwind-bg)',
    surface: 'var(--tailwind-surface)',
  },
  components: {
    button: 'bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark',
    input: 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary',
  },
};

/**
 * Theme utility functions
 */
export class ThemeUtils {
  /**
   * Get theme configuration by type
   */
  static getTheme(theme: Theme): ThemeConfig {
    switch (theme) {
      case 'bootstrap':
        return bootstrapTheme;
      case 'tailwind':
        return tailwindTheme;
      default:
        return tailwindTheme;
    }
  }

  /**
   * Get component class for theme
   */
  static getComponentClass(
    theme: Theme,
    component: string,
    customClass?: string
  ): string {
    const themeConfig = this.getTheme(theme);
    const componentClass = themeConfig.components?.[component];

    if (componentClass && customClass) {
      return `${componentClass} ${customClass}`;
    }

    return componentClass || customClass || '';
  }

  /**
   * Get CSS variable value
   */
  static getCSSVariable(
    theme: Theme,
    variable: 'primary' | 'secondary' | 'background' | 'surface'
  ): string {
    const themeConfig = this.getTheme(theme);
    return themeConfig.colors?.[variable] || '';
  }
}
