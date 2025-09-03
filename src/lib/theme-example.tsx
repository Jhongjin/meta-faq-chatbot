'use client';

import { theme } from './theme';

/**
 * Example component demonstrating theme usage
 * This shows how to use the design tokens for colors and typography
 */
export const ThemeExample = () => {
  return (
    <div className="p-8 space-y-6">
      {/* Color Palette Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Color Palette</h2>
        
        {/* Primary Colors */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary-700">Primary Colors</h3>
          <div className="flex space-x-2">
            {Object.entries(theme.colors.primary).map(([shade, color]) => (
              <div key={shade} className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs mt-1 text-gray-600">{shade}</p>
                <p className="text-xs text-gray-500 font-mono">{color}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Colors */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-secondary-600">Secondary Colors</h3>
          <div className="flex space-x-2">
            {Object.entries(theme.colors.secondary).map(([shade, color]) => (
              <div key={shade} className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs mt-1 text-gray-600">{shade}</p>
                <p className="text-xs text-gray-500 font-mono">{color}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accent Colors */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-accent-500">Accent Colors</h3>
          <div className="flex space-x-2">
            {Object.entries(theme.colors.accent).map(([shade, color]) => (
              <div key={shade} className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs mt-1 text-gray-600">{shade}</p>
                <p className="text-xs text-gray-500 font-mono">{color}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gray Scale */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Gray Scale</h3>
          <div className="flex space-x-2">
            {Object.entries(theme.colors.gray).map(([shade, color]) => (
              <div key={shade} className="text-center">
                <div 
                  className="w-16 h-16 rounded-lg border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs mt-1 text-gray-600">{shade}</p>
                <p className="text-xs text-gray-500 font-mono">{color}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Typography Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Typography</h2>
        
        {/* Font Sizes */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Font Sizes</h3>
          <div className="space-y-1">
            {Object.entries(theme.typography.fontSize).map(([size, value]) => (
              <p key={size} style={{ fontSize: value }} className="text-gray-800">
                {size}: {value} - The quick brown fox jumps over the lazy dog
              </p>
            ))}
          </div>
        </div>

        {/* Font Weights */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Font Weights</h3>
          <div className="space-y-1">
            {Object.entries(theme.typography.fontWeight).map(([weight, value]) => (
              <p key={weight} style={{ fontWeight: value }} className="text-lg text-gray-800">
                {weight}: {value} - The quick brown fox jumps over the lazy dog
              </p>
            ))}
          </div>
        </div>

        {/* Line Heights */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Line Heights</h3>
          <div className="space-y-1">
            {Object.entries(theme.typography.lineHeight).map(([height, value]) => (
              <p key={height} style={{ lineHeight: value }} className="text-lg text-gray-800 max-w-md">
                {height}: {value} - The quick brown fox jumps over the lazy dog. This is a longer sentence to demonstrate the line height effect.
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Usage Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Button Examples */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Buttons</h3>
            <div className="space-y-2">
              <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Primary Button
              </button>
              <button className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Secondary Button
              </button>
              <button className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Accent Button
              </button>
            </div>
          </div>

          {/* Card Examples */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Cards</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Sample Card</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                This card demonstrates the use of theme colors, typography, and spacing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThemeExample;
