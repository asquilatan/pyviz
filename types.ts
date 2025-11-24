
export interface VariableValue {
  type: string;
  value: any; // Can be string, number, boolean, object, array
}

export interface ExecutionStep {
  line: number;
  stdout: string;
  variables: Record<string, VariableValue>;
  explanation: string;
}

export interface ExecutionTrace {
  steps: ExecutionStep[];
  error?: string;
  needsInput?: boolean;
}

export interface ThemeColors {
  background: string;
  surface: string;
  sidebar: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  success: string;
  error: string;
  selection: string;
}

export interface AppTheme {
  name: string;
  colors: ThemeColors;
  isCustom?: boolean;
}

// --- Theme Helper Functions ---

const hslToHex = (hsl: string): string => {
    const parts = hsl.split(' ');
    if (parts.length !== 3) return '#000000';
    
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace('%', ''));
    const l = parseFloat(parts[2].replace('%', ''));
    
    const lVal = l / 100;
    const a = s * Math.min(lVal, 1 - lVal) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = lVal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

const mapPresetToTheme = (name: string, p: any): AppTheme => {
    return {
        name: name,
        colors: {
            background: hslToHex(p.background),
            surface: hslToHex(p.card),
            sidebar: hslToHex(p.card), // reusing card for sidebar usually works well
            border: hslToHex(p.border),
            text: hslToHex(p.foreground),
            textSecondary: hslToHex(p.secondaryForeground), // or mutedForeground if available
            primary: hslToHex(p.primary),
            accent: hslToHex(p.ring), // using ring/focus color as secondary accent
            selection: hslToHex(p.primary) + '40', // 25% opacity
            success: '#10b981', // defaults
            error: '#ef4444'
        }
    };
};

// --- Standard Themes ---

export const VSCODE_THEME: AppTheme = {
  name: "Dark+",
  colors: {
    background: "#1e1e1e",
    surface: "#1e1e1e",
    sidebar: "#252526",
    border: "#333333",
    text: "#d4d4d4",
    textSecondary: "#858585",
    primary: "#007acc",
    accent: "#ce9178",
    success: "#6a9955",
    error: "#f48771",
    selection: "#264f78"
  }
};

export const LIGHT_THEME: AppTheme = {
  name: "Paper",
  colors: {
    background: "#ffffff",
    surface: "#f8fafc",
    sidebar: "#f1f5f9",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#64748b",
    primary: "#0ea5e9",
    accent: "#6366f1",
    success: "#10b981",
    error: "#f43f5e",
    selection: "#bae6fd"
  }
};

export const DEFAULT_THEME: AppTheme = VSCODE_THEME;

// --- User Provided Presets ---

const RAW_PRESETS: Record<string, any> = {
  "Ascetic Red": {
    "background": "230 20% 11%",
    "foreground": "220 14% 71%",
    "card": "230 14% 15%",
    "cardForeground": "220 14% 71%",
    "primary": "349 87% 62%",
    "secondaryForeground": "220 14% 71%",
    "border": "230 10% 20%",
    "ring": "349 87% 62%"
  },
  "Monokai": {
    "background": "240 4% 16%",
    "foreground": "0 0% 95%",
    "card": "240 3% 20%",
    "cardForeground": "0 0% 95%",
    "primary": "95 82% 62%",
    "secondaryForeground": "0 0% 95%",
    "border": "240 3% 25%",
    "ring": "95 82% 62%"
  },
  "Tomorrow Night Blue": {
    "background": "220 28% 13%",
    "foreground": "0 0% 100%",
    "card": "218 30% 18%",
    "cardForeground": "0 0% 100%",
    "primary": "48 100% 75%",
    "secondaryForeground": "0 0% 100%",
    "border": "218 28% 25%",
    "ring": "48 100% 75%"
  },
  "Gruvbox Dark": {
    "background": "0 0% 16%",
    "foreground": "45 61% 81%",
    "card": "20 5% 22%",
    "cardForeground": "45 61% 81%",
    "primary": "42 96% 58%",
    "secondaryForeground": "45 61% 81%",
    "border": "22 8% 29%",
    "ring": "42 96% 58%"
  },
  "Solarized Dark": {
    "background": "195 100% 11%",
    "foreground": "188 10% 55%",
    "card": "195 82% 14%",
    "cardForeground": "188 10% 55%",
    "primary": "207 72% 48%",
    "secondaryForeground": "48 51% 88%",
    "border": "195 82% 14%",
    "ring": "207 72% 48%"
  },
  "Dracula": {
    "background": "231 15% 18%",
    "foreground": "60 30% 96%",
    "card": "232 14% 31%",
    "cardForeground": "60 30% 96%",
    "primary": "272 91% 77%",
    "secondaryForeground": "60 30% 96%",
    "border": "225 27% 51%",
    "ring": "272 91% 77%"
  },
  "Nord": {
    "background": "220 13% 22%",
    "foreground": "223 23% 88%",
    "card": "222 14% 28%",
    "cardForeground": "223 23% 88%",
    "primary": "196 35% 67%",
    "secondaryForeground": "223 23% 88%",
    "border": "221 16% 32%",
    "ring": "196 35% 67%"
  },
  "One Dark Pro": {
    "background": "220 13% 18%",
    "foreground": "220 10% 70%",
    "card": "220 13% 15%",
    "cardForeground": "220 10% 70%",
    "primary": "207 82% 65%",
    "secondaryForeground": "220 10% 70%",
    "border": "218 11% 26%",
    "ring": "207 82% 65%"
  },
  "PowerShell ISE": {
    "background": "217 98% 17%",
    "foreground": "0 0% 93%",
    "card": "217 98% 17%",
    "cardForeground": "0 0% 93%",
    "primary": "55 90% 81%",
    "secondaryForeground": "0 0% 93%",
    "border": "0 0% 93%",
    "ring": "55 90% 81%"
  },
  "Linux Terminal": {
    "background": "0 0% 0%",
    "foreground": "0 0% 100%",
    "card": "0 0% 11%",
    "cardForeground": "0 0% 100%",
    "primary": "120 100% 50%",
    "secondaryForeground": "0 0% 100%",
    "border": "0 0% 20%",
    "ring": "120 100% 50%"
  },
  "Matrix": {
    "background": "0 0% 0%",
    "foreground": "136 100% 50%",
    "card": "0 0% 5%",
    "cardForeground": "136 100% 50%",
    "primary": "136 100% 50%",
    "secondaryForeground": "136 100% 50%",
    "border": "136 100% 50%",
    "ring": "0 0% 100%"
  },
  "Old School Terminal": {
    "background": "0 0% 0%",
    "foreground": "41 100% 50%",
    "card": "0 0% 11%",
    "cardForeground": "41 100% 50%",
    "primary": "41 100% 50%",
    "secondaryForeground": "41 100% 50%",
    "border": "41 100% 50%",
    "ring": "0 0% 100%"
  },
  "Temple OS": {
    "background": "240 100% 33%",
    "foreground": "0 0% 100%",
    "card": "240 100% 40%",
    "cardForeground": "0 0% 100%",
    "primary": "60 100% 100%",
    "secondaryForeground": "0 0% 100%",
    "border": "0 0% 100%",
    "ring": "60 100% 50%"
  }
};

export const PRESET_THEMES: AppTheme[] = [
    DEFAULT_THEME, 
    LIGHT_THEME, 
    ...Object.entries(RAW_PRESETS).map(([name, data]) => mapPresetToTheme(name, data))
];
