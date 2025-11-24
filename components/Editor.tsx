
import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { AppTheme } from '../types';

interface CodeEditorProps {
    code: string;
    onChange: (value: string | undefined) => void;
    language: string;
    theme: AppTheme;
    activeLine: number | null;
    onLineSelect?: (line: number) => void;
    onRun?: () => void; // Added for the run functionality
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language, theme, activeLine, onLineSelect, onRun }) => {
    const editorRef = React.useRef<any>(null);
    const decorationsRef = React.useRef<any>([]);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Listen for cursor position changes to update active line selection
        editor.onDidChangeCursorPosition((e) => {
            if (onLineSelect) {
                onLineSelect(e.position.lineNumber);
            }
        });

        // Add keybinding for Ctrl+' to run code
        
        // Define custom theme based on AppTheme
        monaco.editor.defineTheme('custom-theme', {
            base: theme.name === 'Paper' ? 'vs' : 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': theme.colors.surface,
                'editor.foreground': theme.colors.text,
                'editorLineNumber.foreground': theme.colors.textSecondary,
                'editor.selectionBackground': theme.colors.selection,
                'editor.lineHighlightBackground': theme.colors.border + '40', // slightly transparent
            }
        });
        monaco.editor.setTheme('custom-theme');

        // Fix for cursor misalignment: Remeasure fonts after they load
        document.fonts.ready.then(() => {
            monaco.editor.remeasureFonts();
        });
    };

    // Update theme when it changes
    React.useEffect(() => {
        // Fix: Cast window to any to access monaco property
        if ((window as any).monaco) {
            (window as any).monaco.editor.defineTheme('custom-theme', {
                base: theme.name === 'Paper' ? 'vs' : 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': theme.colors.surface,
                    'editor.foreground': theme.colors.text,
                    'editorLineNumber.foreground': theme.colors.textSecondary,
                    'editor.selectionBackground': theme.colors.selection,
                    'editor.lineHighlightBackground': theme.colors.border + '40',
                }
            });
            (window as any).monaco.editor.setTheme('custom-theme');
        }
    }, [theme]);

    // Handle Active Line Decoration
    React.useEffect(() => {
        // Fix: Cast window to any to access monaco property
        if (!editorRef.current || !(window as any).monaco) return;

        const editor = editorRef.current;
        const monaco = (window as any).monaco;

        if (activeLine !== null) {
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
                {
                    range: new monaco.Range(activeLine, 1, activeLine, 1),
                    options: {
                        isWholeLine: true,
                        className: 'myLineDecoration',
                        glyphMarginClassName: 'myGlyphMarginClass',
                        linesDecorationsClassName: 'myLineDecoration' // Makes the number highlighting
                    }
                }
            ]);
            editor.revealLineInCenter(activeLine);
        } else {
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
        }
    }, [activeLine]);

    // Inject CSS for the active line highlight dynamically
    const styleId = 'editor-active-line-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .myLineDecoration {
                background: ${theme.colors.primary}33 !important; /* 20% opacity */
                border-left: 2px solid ${theme.colors.primary};
            }
        `;
        document.head.appendChild(style);
    } else {
        // Update color
         const style = document.getElementById(styleId);
         if(style) style.innerHTML = `
            .myLineDecoration {
                background: ${theme.colors.primary}33 !important;
                border-left: 2px solid ${theme.colors.primary};
            }
        `;
    }

    return (
        <div className="h-full w-full overflow-hidden rounded-md border" style={{ borderColor: theme.colors.border }}>
            <Editor
                height="100%"
                language={language}
                value={code}
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: { top: 16 }
                }}
            />
        </div>
    );
};

export default CodeEditor;
