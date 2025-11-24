
import React, { useRef } from 'react';
import { AppTheme, PRESET_THEMES } from '../types';
import { Upload } from 'lucide-react';

interface ThemeSelectorProps {
    currentTheme: AppTheme;
    onThemeChange: (theme: AppTheme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic validation
                if (json.colors && json.name) {
                    onThemeChange({
                        ...json,
                        isCustom: true
                    });
                } else {
                    alert("Invalid theme file format. Needs 'name' and 'colors' object.");
                }
            } catch (err) {
                alert("Failed to parse theme JSON.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex items-center gap-2">
            <select
                className="text-xs p-1.5 rounded border outline-none cursor-pointer max-w-[140px]"
                value={currentTheme.name}
                onChange={(e) => {
                    const name = e.target.value;
                    const selected = PRESET_THEMES.find(t => t.name === name);
                    if (selected) onThemeChange(selected);
                }}
                style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                    borderColor: currentTheme.colors.border
                }}
            >
                {PRESET_THEMES.map(theme => (
                     <option key={theme.name} value={theme.name}>{theme.name}</option>
                ))}
                {currentTheme.isCustom && <option value={currentTheme.name}>{currentTheme.name} (Custom)</option>}
            </select>

            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded border hover:opacity-80 transition-opacity"
                title="Import Theme JSON"
                style={{
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                    borderColor: currentTheme.colors.border
                }}
            >
                <Upload size={14} />
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileUpload}
            />
        </div>
    );
};

export default ThemeSelector;
