import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from './components/Editor';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';
import ThemeSelector from './components/ThemeSelector';
import { runCode, initializePyodide } from './services/executionService';
import { AppTheme, DEFAULT_THEME, ExecutionTrace } from './types';
import { DEFAULT_PYTHON_CODE, PATCH_NOTES } from './constants';
import { Code2, Loader2, GripVertical, RotateCcw, X, Columns, Maximize, Monitor, ChevronDown, ChevronRight } from 'lucide-react';

const MarkdownRenderer: React.FC<{ content: string; theme: AppTheme }> = ({ content, theme }) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = (keyPrefix: string) => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`${keyPrefix}-ul`} className="list-disc pl-5 mb-4 space-y-1">
                    {[...listItems]}
                </ul>
            );
            listItems = [];
        }
    };

    const processInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{ color: theme.colors.text }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code key={i} className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.border}` }}>
                        {part.slice(1, -1)}
                    </code>
                );
            }
            return part;
        });
    };

    lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList(`line-${i}`);
            return;
        }

        if (trimmed.startsWith('# ')) {
            flushList(`line-${i}`);
            elements.push(
                <h1 key={`h1-${i}`} className="text-xl font-bold mb-4 mt-2 pb-2 border-b" style={{ borderColor: theme.colors.border }}>
                    {trimmed.slice(2)}
                </h1>
            );
        } else if (trimmed.startsWith('## ')) {
            flushList(`line-${i}`);
            elements.push(
                <h2 key={`h2-${i}`} className="text-lg font-semibold mb-3 mt-6" style={{ color: theme.colors.primary }}>
                    {trimmed.slice(3)}
                </h2>
            );
        } else if (trimmed.startsWith('- ')) {
            listItems.push(
                <li key={`li-${i}`} className="opacity-90 leading-relaxed">
                    {processInline(trimmed.slice(2))}
                </li>
            );
        } else {
            flushList(`line-${i}`);
            elements.push(
                <p key={`p-${i}`} className="mb-2 text-sm opacity-80 leading-relaxed">
                    {processInline(trimmed)}
                </p>
            );
        }
    });

    flushList('final');
    return <div className="p-2">{elements}</div>;
};

const PatchGroup: React.FC<{ title: string, content: string, theme: AppTheme }> = ({ title, content, theme }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="py-2">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 w-full text-left hover:opacity-80">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <h2 className="text-md font-semibold">{title}</h2>
            </button>
            {isExpanded && (
                <div className="pl-6 mt-2 text-sm leading-relaxed border-l ml-2" style={{borderColor: theme.colors.border}}>
                     <MarkdownRenderer content={content} theme={theme} />
                </div>
            )}
        </div>
    )
}

const CollapsiblePatchNotes: React.FC<{ content: string; theme: AppTheme }> = ({ content, theme }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const notesByVersion = content.trim().split(/(?=\n# )/).map(s => s.trim()).filter(Boolean).map(block => {
        const lines = block.split('\n');
        const title = lines[0].substring(2); // remove '# '
        const restOfContent = lines.slice(1).join('\n');
        return { title, content: restOfContent };
    });

    return (
        <div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 w-full text-left p-2 -ml-2 rounded hover:bg-black/5">
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <span className="font-bold text-lg">Patch Notes</span>
            </button>
            {isExpanded && (
                <div className="pl-4 mt-2">
                    {notesByVersion.map(({title, content}, index) => (
                        <PatchGroup key={index} title={title} content={content} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    )
}


const App: React.FC = () => {
    const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);
    const [code, setCode] = useState<string>(DEFAULT_PYTHON_CODE);
    const [trace, setTrace] = useState<ExecutionTrace | null>(null);
    const [stepIndex, setStepIndex] = useState<number>(-1);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);
    const [selectedLine, setSelectedLine] = useState<number | null>(null);
    const [userInputs, setUserInputs] = useState<string[]>([]);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Settings
    const [maxSteps, setMaxSteps] = useState<number>(1000);

    // Layout State
    const [visualizerWidth, setVisualizerWidth] = useState<number>(480);
    const [isResizingVisualizer, setIsResizingVisualizer] = useState<boolean>(false);
    const [layoutMode, setLayoutMode] = useState<'split' | 'editor' | 'visualizer'>('split');
    const [isSplitReversed, setIsSplitReversed] = useState<boolean>(false);

    // Apply body background
    useEffect(() => {
        document.body.style.backgroundColor = theme.colors.background;
        document.body.style.color = theme.colors.text;
    }, [theme]);

    // Initialize Pyodide on mount
    useEffect(() => {
        const init = async () => {
            try {
                await initializePyodide();
                setIsReady(true);
            } catch (e) {
                console.error("Failed to load Python environment", e);
            }
        };
        if ((window as any).loadPyodide) {
            init();
        } else {
            const checkInterval = setInterval(() => {
                if ((window as any).loadPyodide) {
                    clearInterval(checkInterval);
                    init();
                }
            }, 500);
        }
    }, []);

    // Resize Handlers
    const startResizingVisualizer = React.useCallback(() => setIsResizingVisualizer(true), []);

    const stopResizing = React.useCallback(() => {
        setIsResizingVisualizer(false);
    }, []);

    const resize = React.useCallback((e: MouseEvent) => {
        if (isResizingVisualizer) {
            let newWidth;
            if (isSplitReversed) {
                newWidth = e.clientX;
            } else {
                newWidth = document.body.clientWidth - e.clientX;
            }
            setVisualizerWidth(Math.max(300, Math.min(newWidth, document.body.clientWidth * 0.8)));
        }
    }, [isResizingVisualizer, isSplitReversed]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    const handleRun = async () => {
        setIsAnalyzing(true);
        setTrace(null);
        setStepIndex(-1);
        setUserInputs([]); // Reset inputs on fresh run

        try {
            await new Promise(r => setTimeout(r, 100));
            const result = await runCode(code, maxSteps, []);

            setTrace(result);
            if (result.steps && result.steps.length > 0) {
                setStepIndex(0);
            } else if (result.error) {
                setTrace(result);
            }
        } catch (error: any) {
            console.error("Execution error:", error);
            setTrace({
                steps: [],
                error: error.message || "An unexpected error occurred."
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "'") {
                e.preventDefault();
                handleRun();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleRun]);

    const handleInputSubmit = async (value: string) => {
        if (!trace) return;

        setIsAnalyzing(true);
        const newInputs = [...userInputs, value];
        setUserInputs(newInputs);

        try {
            // Re-run execution with accumulated inputs
            const result = await runCode(code, maxSteps, newInputs);
            setTrace(result);
            // Jump to the latest step which is likely just after the input
            if (result.steps.length > 0) {
                setStepIndex(result.steps.length - 1);
            }
        } catch (error: any) {
            console.error("Input execution error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleResetIDE = () => {
        if (window.confirm("Are you sure you want to reset the IDE? This will clear your code and settings.")) {
            setCode(DEFAULT_PYTHON_CODE);
            setTrace(null);
            setStepIndex(-1);
            setSelectedLine(null);
            setMaxSteps(1000);
            setUserInputs([]);
        }
    };

    const currentStep = trace && trace.steps && stepIndex >= 0 && stepIndex < trace.steps.length
        ? trace.steps[stepIndex]
        : null;

    const prevStep = trace && trace.steps && stepIndex > 0 && stepIndex < trace.steps.length
        ? trace.steps[stepIndex - 1]
        : null;

    // Calculate highlighted steps based on selected line
    const highlightedSteps = React.useMemo(() => {
        if (!trace || !trace.steps || selectedLine === null) return [];
        return trace.steps
            .map((step, idx) => ({ idx, line: step.line }))
            .filter(item => item.line === selectedLine)
            .map(item => item.idx);
    }, [trace, selectedLine]);

    return (
        <div className={`flex flex-col h-screen w-full overflow-hidden transition-colors duration-300 ${isResizingVisualizer ? 'cursor-col-resize select-none' : ''}`}
            style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar - Now Patch Notes */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-80 shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ backgroundColor: theme.colors.sidebar, color: theme.colors.text }}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.colors.border }}>
                        <span className="font-bold text-lg">Menu</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded hover:bg-black/10">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
                        <CollapsiblePatchNotes content={PATCH_NOTES} theme={theme} />
                    </div>

                    <div className="p-4 border-t text-center text-xs opacity-50 font-mono" style={{ borderColor: theme.colors.border }}>
                        pyviz by asq
                    </div>
                </div>
            </div>

            {/* Navbar */}
            <header className="flex-none h-14 border-b px-4 flex items-center justify-between"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left rounded-md p-1 -ml-1"
                        title="View Patch Notes"
                    >
                        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${theme.colors.primary}66` }}>
                            <img src="/pyviz_logo.png" alt="pyviz logo" width={20} height={20} style={{ objectFit: 'contain' }} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-lg tracking-tight leading-none">pyviz</h1>
                            <span className="text-[10px] font-medium opacity-50 select-none italic leading-none mt-1">Not the library &lt;3</span>
                        </div>
                    </button>

                    {!isReady && (
                        <span className="flex items-center text-xs ml-2 opacity-70">
                            <Loader2 className="animate-spin mr-1" size={12} />
                            Loading Engine...
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Layout Controls */}
                    <div className="flex items-center bg-black/5 rounded p-0.5 border" style={{ borderColor: theme.colors.border }}>
                        <button
                            onClick={() => setLayoutMode('editor')}
                            className={`p-1.5 rounded transition-all ${layoutMode === 'editor' ? 'shadow-sm' : 'hover:bg-black/5 opacity-50 hover:opacity-100'}`}
                            style={{
                                backgroundColor: layoutMode === 'editor' ? theme.colors.primary : 'transparent',
                                color: layoutMode === 'editor' ? '#ffffff' : theme.colors.text
                            }}
                            title="Editor Only"
                        >
                            <Maximize size={14} />
                        </button>
                        <button
                            onClick={() => {
                                if (layoutMode === 'split') {
                                    setIsSplitReversed(!isSplitReversed);
                                } else {
                                    setLayoutMode('split');
                                    setIsSplitReversed(false);
                                }
                            }}
                            className={`p-1.5 rounded transition-all ${layoutMode === 'split' ? 'shadow-sm' : 'hover:bg-black/5 opacity-50 hover:opacity-100'}`}
                            style={{
                                backgroundColor: layoutMode === 'split' ? theme.colors.primary : 'transparent',
                                color: layoutMode === 'split' ? '#ffffff' : theme.colors.text
                            }}
                            title={isSplitReversed ? "Split View (Visualizer Left)" : "Split View (Editor Left)"}
                        >
                            <Columns size={14} />
                        </button>
                        <button
                            onClick={() => setLayoutMode('visualizer')}
                            className={`p-1.5 rounded transition-all ${layoutMode === 'visualizer' ? 'shadow-sm' : 'hover:bg-black/5 opacity-50 hover:opacity-100'}`}
                            style={{
                                backgroundColor: layoutMode === 'visualizer' ? theme.colors.primary : 'transparent',
                                color: layoutMode === 'visualizer' ? '#ffffff' : theme.colors.text
                            }}
                            title="Visualizer Only"
                        >
                            <Monitor size={14} />
                        </button>
                    </div>

                    <div className="hidden md:block h-4 w-px opacity-20" style={{ backgroundColor: theme.colors.text }}></div>

                    <button
                        onClick={handleResetIDE}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded border hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all hidden md:flex"
                        style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}
                        title="Reset Code and State"
                    >
                        <RotateCcw size={14} />
                        Reset IDE
                    </button>

                    <div className="hidden md:block h-4 w-px opacity-20" style={{ backgroundColor: theme.colors.text }}></div>

                    <span className="text-xs font-mono opacity-50 px-2 py-1 rounded border hidden sm:block" style={{ borderColor: theme.colors.border }}>Python 3.11</span>

                    <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
                </div>
            </header>

            {/* Main Content Grid */}
            <main className={`flex-1 flex overflow-hidden relative ${isSplitReversed ? 'flex-row-reverse' : ''}`}>

                {/* Left Column: Editor & Controls */}
                {(layoutMode === 'split' || layoutMode === 'editor') && (
                    <div className={`flex flex-col min-w-0 h-full ${layoutMode === 'editor' ? 'w-full' : 'flex-1'}`}>
                        {/* Top: Controls & Editor */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-none p-4 pb-0">
                                <Controls
                                    onRun={handleRun}
                                    onNext={() => setStepIndex(prev => Math.min(prev + 1, (trace?.steps.length || 1) - 1))}
                                    onPrev={() => setStepIndex(prev => Math.max(prev - 1, 0))}
                                    onSeek={(step) => setStepIndex(step)}
                                    onReset={() => setStepIndex(0)}
                                    onMaxStepsChange={setMaxSteps}
                                    currentStep={stepIndex}
                                    totalSteps={trace?.steps.length || 0}
                                    isRunning={isAnalyzing || !isReady}
                                    maxSteps={maxSteps}
                                    theme={theme}
                                    highlightedSteps={highlightedSteps}
                                />
                            </div>

                            <div className="flex-1 p-4 pt-0 overflow-hidden">
                                <CodeEditor
                                    code={code}
                                    onChange={(val) => setCode(val || "")}
                                    language="python"
                                    theme={theme}
                                    activeLine={currentStep?.line || null}
                                    onLineSelect={setSelectedLine}
                                    onRun={handleRun}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Visualizer Resizer Handle */}
                {layoutMode === 'split' && (
                    <div
                        className="w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors flex items-center justify-center z-20 hover:opacity-100 opacity-0 bg-transparent hover:bg-opacity-50"
                        style={{ backgroundColor: isResizingVisualizer ? theme.colors.primary : 'transparent' }}
                        onMouseDown={startResizingVisualizer}
                    >
                    </div>
                )}

                {/* Right: Visualizer */}
                {(layoutMode === 'split' || layoutMode === 'visualizer') && (
                    <div
                        className={`flex flex-col shadow-xl z-10 ${layoutMode === 'visualizer' ? 'w-full' : 'flex-none'} ${layoutMode === 'split' ? (isSplitReversed ? 'border-r' : 'border-l') : ''}`}
                        style={{
                            width: layoutMode === 'split' ? visualizerWidth : '100%',
                            backgroundColor: theme.colors.sidebar,
                            borderColor: theme.colors.border
                        }}
                    >
                        <div className="flex-none h-10 border-b flex items-center px-4 gap-2" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                            <GripVertical size={14} className="opacity-50" />
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Visualizer</span>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            {trace?.error ? (
                                <div className="p-6 text-center">
                                    <p style={{ color: theme.colors.error }} className="font-medium mb-2">Execution Error</p>
                                    <p className="text-sm opacity-80 break-words font-mono text-left bg-black/10 p-2 rounded">{trace.error}</p>
                                </div>
                            ) : (
                                <Visualizer
                                    step={currentStep}
                                    prevStep={prevStep}
                                    theme={theme}
                                    loading={isAnalyzing}
                                    isWaitingForInput={trace?.needsInput || false}
                                    onInput={handleInputSubmit}
                                />
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;