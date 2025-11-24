
import React from 'react';
import { Play, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { AppTheme } from '../types';

interface ControlsProps {
    onRun: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (step: number) => void;
    onReset: () => void;
    onMaxStepsChange: (steps: number) => void;
    currentStep: number;
    totalSteps: number;
    isRunning: boolean;
    maxSteps: number;
    theme: AppTheme;
    highlightedSteps?: number[];
}

const Controls: React.FC<ControlsProps> = ({
    onRun, onNext, onPrev, onSeek, onReset, onMaxStepsChange,
    currentStep, totalSteps, isRunning, maxSteps, theme, highlightedSteps = []
}) => {

    const Button = ({ onClick, disabled, children, primary = false, title = "" }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            style={{
                backgroundColor: primary ? `${theme.colors.primary}66` : theme.colors.surface,
                color: primary ? '#fff' : theme.colors.text,
                border: `1px solid ${primary ? 'transparent' : theme.colors.border}`
            }}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col gap-3 p-3 rounded-lg border shadow-sm mb-4" style={{ backgroundColor: theme.colors.sidebar, borderColor: theme.colors.border }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button onClick={onRun} primary={true} disabled={isRunning} title="Run Analysis (Ctrl+')">
                        <Play size={16} className="mr-2" fill="currentColor" />
                        {isRunning ? "Running..." : "Run Analysis"}
                    </Button>

                    <div className="w-px h-6 mx-2" style={{ backgroundColor: theme.colors.border }}></div>

                    <Button onClick={onReset} disabled={totalSteps === 0} title="Reset Execution">
                        <RotateCcw size={16} />
                    </Button>

                    <div className="flex items-center gap-2 ml-2 px-2 py-1 rounded border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                        <span className="text-[10px] uppercase font-bold opacity-60">Limit</span>
                        <input
                            type="number"
                            value={maxSteps}
                            onChange={(e) => onMaxStepsChange(Math.max(10, parseInt(e.target.value) || 100))}
                            className="w-16 bg-transparent text-xs font-mono outline-none text-right"
                            style={{ color: theme.colors.text }}
                            title="Max Execution Steps"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                     <Button onClick={onPrev} disabled={currentStep <= 0}>
                        <SkipBack size={16} />
                    </Button>
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                         <span className="font-mono text-sm font-semibold" style={{ color: theme.colors.text }}>
                            {totalSteps > 0 ? `${currentStep + 1} / ${totalSteps}` : "--"}
                         </span>
                    </div>
                    <Button onClick={onNext} disabled={currentStep >= totalSteps - 1}>
                        <SkipForward size={16} />
                    </Button>
                </div>
            </div>

            {/* Timeline Slider */}
            <div className="w-full flex items-center gap-2 pt-1 relative">
                <span className="text-xs font-mono opacity-50">0</span>
                <div className="relative flex-1 h-6 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={Math.max(0, totalSteps - 1)}
                        value={currentStep === -1 ? 0 : currentStep}
                        onChange={(e) => onSeek(parseInt(e.target.value))}
                        disabled={totalSteps === 0}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer z-10 bg-transparent"
                        style={{
                            outline: 'none',
                        }}
                    />
                    {/* Track Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1.5 transform -translate-y-1/2 rounded-lg" style={{ backgroundColor: theme.colors.border }}></div>

                    {/* Execution Markers (Ticks) */}
                    {totalSteps > 0 && highlightedSteps.map((stepIdx) => (
                        <div
                            key={stepIdx}
                            className="absolute top-1/2 h-2 w-0.5 transform -translate-y-1/2 z-0 opacity-80"
                            style={{
                                left: `${(stepIdx / (totalSteps - 1)) * 100}%`,
                                backgroundColor: theme.colors.primary
                            }}
                        ></div>
                    ))}
                </div>
                <span className="text-xs font-mono opacity-50">{Math.max(0, totalSteps - 1)}</span>
            </div>

            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    background: ${theme.colors.primary};
                    cursor: pointer;
                    margin-top: 0px;
                    position: relative;
                    z-index: 20;
                    box-shadow: 0 0 0 2px ${theme.colors.surface};
                }
            `}</style>
        </div>
    );
};

export default Controls;
