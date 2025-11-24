
import React, { useState, useEffect } from 'react';
import { AppTheme, ExecutionStep } from '../types';
import { Box, LayoutList, ListTree, BarChart3, GripHorizontal, RotateCw, Network, Table, Terminal } from 'lucide-react';

interface VisualizerProps {
    step: ExecutionStep | null;
    prevStep: ExecutionStep | null;
    theme: AppTheme;
    loading: boolean;
    isWaitingForInput?: boolean;
    onInput?: (value: string) => void;
}

// --- Helper Components (Defined outside to preserve state) ---

const NetworkGraph = ({ data, theme }: { data: any, theme: AppTheme }) => {
    const [nodes, setNodes] = useState<{ id: string, label: string }[]>([]);
    const [edges, setEdges] = useState<{ source: string, target: string }[]>([]);

    useEffect(() => {
        const extractedNodes = new Map<string, { id: string, label: string }>();
        const extractedEdges: { source: string, target: string }[] = [];

        // Case 1: Adjacency List (Dict)
        if (data.__type__ === undefined && typeof data === 'object' && !Array.isArray(data)) {
            Object.entries(data).forEach(([key, value]) => {
                const id = String(key);
                extractedNodes.set(id, { id, label: id });
                if (Array.isArray(value)) {
                    value.forEach((neighbor: any) => {
                        const targetId = String(neighbor);
                        extractedEdges.push({ source: id, target: targetId });
                        if (!extractedNodes.has(targetId)) {
                            extractedNodes.set(targetId, { id: targetId, label: targetId });
                        }
                    });
                }
            });
        }
        // Case 2: Object Graph
        else if (data.__type__ === 'object') {
            const queue = [data];
            const visited = new Set<string>();

            while (queue.length > 0) {
                const curr = queue.shift();
                const currId = String(curr.id || JSON.stringify(curr));
                
                if (visited.has(currId)) continue;
                visited.add(currId);
                
                const label = String(curr.data?.val ?? curr.data?.value ?? curr.class);
                extractedNodes.set(currId, { id: currId, label });

                const neighbors = curr.data?.neighbors ?? curr.data?.adj ?? curr.data?.edges;
                
                if (Array.isArray(neighbors)) {
                    neighbors.forEach((neighbor: any) => {
                        let targetId;
                        if (neighbor.__type__ === 'cyclic') {
                            targetId = String(neighbor.id);
                            extractedEdges.push({ source: currId, target: targetId });
                        } else if (neighbor.__type__ === 'object') {
                            targetId = String(neighbor.id);
                            extractedEdges.push({ source: currId, target: targetId });
                            queue.push(neighbor);
                        } else {
                            // Primitive neighbor in list? treating as label
                            targetId = String(neighbor);
                            if (!extractedNodes.has(targetId)) {
                                extractedNodes.set(targetId, { id: targetId, label: String(neighbor) });
                            }
                            extractedEdges.push({ source: currId, target: targetId });
                        }
                    });
                }
            }
        }
        
        setNodes(Array.from(extractedNodes.values()));
        setEdges(extractedEdges);

    }, [data]);

    if (nodes.length === 0) return <div className="text-xs opacity-50 italic">Empty Graph</div>;

    // Simple Circular Layout
    const width = 400;
    const height = 300;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    const getNodePos = (index: number, total: number) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    };

    return (
        <div className="flex justify-center my-2">
            <svg width={width} height={height} className="border rounded bg-opacity-5" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={theme.colors.border} />
                    </marker>
                </defs>
                
                {/* Edges */}
                {edges.map((edge, i) => {
                    const sourceIdx = nodes.findIndex(n => n.id === edge.source);
                    const targetIdx = nodes.findIndex(n => n.id === edge.target);
                    if (sourceIdx === -1 || targetIdx === -1) return null;

                    const sPos = getNodePos(sourceIdx, nodes.length);
                    const tPos = getNodePos(targetIdx, nodes.length);

                    return (
                        <line 
                            key={i}
                            x1={sPos.x} y1={sPos.y}
                            x2={tPos.x} y2={tPos.y}
                            stroke={theme.colors.border}
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node, i) => {
                    const pos = getNodePos(i, nodes.length);
                    return (
                        <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                            <circle 
                                r="20" 
                                fill={theme.colors.surface} 
                                stroke={theme.colors.primary} 
                                strokeWidth="2"
                            />
                            <text 
                                dy=".3em" 
                                textAnchor="middle" 
                                fontSize="12" 
                                fontWeight="bold" 
                                fill={theme.colors.text}
                                style={{ pointerEvents: 'none' }}
                            >
                                {node.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const GraphHashMap = ({ data, theme }: { data: any, theme: AppTheme }) => {
    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase" style={{ color: theme.colors.textSecondary }}>
                 <Table size={12}/> Dictionary
            </div>
            <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-1.5 items-center">
                 {Object.entries(data).map(([k, v], i) => (
                     <React.Fragment key={i}>
                         <div className="px-2 py-1 rounded text-xs font-mono font-bold text-right border shadow-sm"
                              style={{ 
                                  backgroundColor: theme.colors.surface, 
                                  color: theme.colors.primary,
                                  borderColor: theme.colors.border 
                              }}>
                              {k}
                         </div>
                         <div className="text-xs opacity-30">→</div>
                         <div className="overflow-hidden min-w-0">
                             <DataNode value={v} theme={theme} />
                         </div>
                     </React.Fragment>
                 ))}
                 {Object.keys(data).length === 0 && <span className="text-xs opacity-50 italic col-span-3">Empty</span>}
            </div>
        </div>
    )
}

const GraphNode = ({ data, visited = new Set(), label = '', isRoot = false, theme }: { data: any, visited?: Set<string>, label?: string, isRoot?: boolean, theme: AppTheme }) => {
    const id = JSON.stringify(data); 
    
    // Cycle Detection Logic
    if (visited.has(id) || (data.__type__ === 'cyclic')) {
            return (
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-dashed opacity-70" style={{ borderColor: theme.colors.textSecondary }}>
                <RotateCw size={12} />
            </div>
        );
    }
    visited.add(id);

    const borderColor = isRoot ? theme.colors.primary : theme.colors.border;
    const bgColor = isRoot ? `${theme.colors.primary}1A` : theme.colors.surface;
    const textColor = isRoot ? theme.colors.primary : theme.colors.text;
    const borderWidth = isRoot ? '2px' : '1px';

    if (data.__type__ === 'object') {
        const props = data.data || {};
        const value = props.val ?? props.value ?? props.data ?? '?';
        
        const hasNext = 'next' in props;
        const hasLeft = 'left' in props;
        const hasRight = 'right' in props;
        const hasChildren = 'children' in props && Array.isArray(props.children);

        // --- Linked List ---
        if (hasNext) {
            const nextNode = props.next;
            return (
                <div className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div className="min-w-[48px] h-12 px-3 flex items-center justify-center rounded-lg shadow-sm relative font-bold transition-all"
                                style={{ 
                                    border: `${borderWidth} solid ${borderColor}`,
                                    backgroundColor: bgColor,
                                    color: textColor,
                                }}>
                            {String(value)}
                            {label && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-[10px] uppercase tracking-wider px-1 bg-inherit whitespace-nowrap rounded" 
                                    style={{ color: borderColor, backgroundColor: theme.colors.background }}>
                                    {label}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mx-2 text-xl" style={{ color: theme.colors.textSecondary }}>
                            {nextNode !== null ? '→' : ''}
                    </div>

                    {nextNode !== null ? (
                        <GraphNode data={nextNode} visited={new Set(visited)} isRoot={false} theme={theme} />
                    ) : (
                        <span className="text-xs opacity-40 italic">None</span>
                    )}
                </div>
            );
        }

        // --- Binary Tree ---
        if (hasLeft || hasRight) {
            return (
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-opacity-10 shadow-sm relative font-bold z-10 transition-all"
                            style={{ 
                                border: `${borderWidth} solid ${borderColor}`,
                                backgroundColor: bgColor,
                                color: textColor
                            }}>
                        {String(value)}
                            {label && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[10px] uppercase tracking-wider px-1 bg-inherit whitespace-nowrap" 
                                    style={{ color: theme.colors.textSecondary, backgroundColor: theme.colors.background }}>
                                {label}
                            </div>
                            )}
                    </div>

                    {(props.left || props.right) && (
                        <div className="flex items-start gap-4 mt-4 pt-2 border-t border-dashed relative" style={{ borderColor: theme.colors.border }}>
                            <div className="flex flex-col items-center">
                                {props.left ? (
                                    <GraphNode data={props.left} visited={new Set(visited)} label="L" isRoot={false} theme={theme} />
                                ) : (
                                    <div className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center opacity-30 text-xs">null</div>
                                )}
                            </div>
                            <div className="flex flex-col items-center">
                                {props.right ? (
                                    <GraphNode data={props.right} visited={new Set(visited)} label="R" isRoot={false} theme={theme} />
                                ) : (
                                    <div className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center opacity-30 text-xs">null</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // --- Generic Tree ---
        if (hasChildren) {
                return (
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center rounded-md bg-opacity-10 shadow-sm relative font-bold z-10"
                            style={{ 
                                border: `${borderWidth} solid ${borderColor}`,
                                backgroundColor: bgColor,
                                color: textColor
                            }}>
                        {String(value)}
                    </div>

                    {props.children && props.children.length > 0 && (
                        <div className="flex items-start gap-2 mt-4 pt-2 border-t border-dashed" style={{ borderColor: theme.colors.border }}>
                            {props.children.map((child: any, idx: number) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <GraphNode data={child} visited={new Set(visited)} isRoot={false} theme={theme} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                );
        }
    }
    
    return <div className="text-xs italic opacity-50 border p-1 rounded">Complex Object</div>;
};

const GraphBarChart = ({ data, changedIndices, theme }: { data: any[], changedIndices: Set<number>, theme: AppTheme }) => {
    const numericData = data.filter(d => typeof d === 'number');
    if (numericData.length === 0) return null;

    const maxVal = Math.max(...numericData, 1);

    return (
        <div className="flex flex-col items-start mt-2 border-t pt-2 w-full" style={{ borderColor: theme.colors.border }}>
            <div className="flex items-end gap-1 h-32 w-full px-2">
                {data.map((item, idx) => {
                    const isNum = typeof item === 'number';
                    const height = isNum ? Math.max((item / maxVal) * 100, 5) : 5;
                    const isChanged = changedIndices.has(idx);

                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end group h-full">
                            <span className="text-[9px] mb-1 opacity-50 group-hover:opacity-100 transition-opacity text-center w-full truncate">{String(item)}</span>
                            <div 
                                className="w-full rounded-t-sm transition-all duration-300"
                                style={{
                                    height: `${height}%`,
                                    backgroundColor: isChanged ? theme.colors.accent : theme.colors.primary, 
                                    opacity: isChanged ? 1 : 0.7,
                                    border: isChanged ? `1px solid ${theme.colors.accent}` : 'none'
                                }}
                                title={`Index ${idx}: ${item}`}
                            />
                            <div className="text-[9px] mt-1 opacity-30 group-hover:opacity-100">{idx}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const GraphArray = ({ data, label, isDeque = false, prevData, theme }: { data: any[], label: string, isDeque?: boolean, prevData?: any[], theme: AppTheme }) => {
    const [showBarChart, setShowBarChart] = useState(false);
    
    const changedIndices = new Set<number>();
    if (prevData) {
        data.forEach((val, idx) => {
            const prevVal = prevData[idx];
            if (prevVal !== undefined && JSON.stringify(prevVal) !== JSON.stringify(val)) {
                changedIndices.add(idx);
            }
        });
    }
    
    const isNumeric = data.every(d => typeof d === 'number') && data.length > 0;

    return (
        <div className="flex flex-col items-start w-full">
                <div className="flex items-center justify-between w-full mb-2">
                    <div className="text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-2" style={{ backgroundColor: theme.colors.surface, color: theme.colors.textSecondary }}>
                        {isDeque ? <><LayoutList size={12}/> Stack / Queue</> : "Array / List"}
                    </div>
                    {isNumeric && !isDeque && (
                        <button 
                        onClick={() => setShowBarChart(!showBarChart)}
                        className="p-1 rounded hover:bg-black/10 transition-colors"
                        title="Toggle Bar Chart"
                        >
                            {showBarChart ? <Box size={14} className="text-opacity-50" /> : <BarChart3 size={14} />}
                        </button>
                    )}
                </div>

                {/* Bar Chart View */}
                {showBarChart && isNumeric ? (
                    <GraphBarChart data={data} changedIndices={changedIndices} theme={theme} />
                ) : (
                /* Standard Box View */
                <div className="flex items-center gap-0.5 flex-wrap">
                    {isDeque && <div className="text-xs opacity-30 mr-1">Front</div>}
                    {data.map((item, idx) => {
                        const isChanged = changedIndices.has(idx);
                        return (
                            <div key={idx} className="flex flex-col items-center group mb-2">
                                <div className="min-w-[40px] h-10 px-2 flex items-center justify-center border rounded-sm text-sm font-mono transition-all hover:-translate-y-1"
                                    style={{ 
                                        borderColor: isChanged ? theme.colors.accent : (isDeque ? theme.colors.accent : theme.colors.primary), 
                                        backgroundColor: isChanged ? `${theme.colors.accent}33` : theme.colors.surface, 
                                        color: isChanged ? theme.colors.text : theme.colors.text 
                                    }}>
                                    {String(item)}
                                </div>
                                <div className="text-[9px] mt-1 opacity-30 group-hover:opacity-100 font-mono" style={{ color: theme.colors.textSecondary }}>{idx}</div>
                            </div>
                        );
                    })}
                    {isDeque && <div className="text-xs opacity-30 ml-1">Back</div>}
                </div>
                )}
        </div>
    );
}

const DataNode = ({ name, value, type, theme }: { name?: string, value: any, type?: string, theme: AppTheme }) => {
    if (value === null) {
        return (
            <div className="flex items-center gap-2 font-mono text-sm">
                {name && <span style={{ color: theme.colors.text }}>{name}:</span>}
                <span className="italic opacity-50">None</span>
            </div>
        );
    }
    if (typeof value !== 'object') {
        let color = theme.colors.text;
        let displayValue = String(value);

        if (typeof value === 'number') color = theme.colors.success;
        if (typeof value === 'boolean') {
            color = theme.colors.primary;
            displayValue = value ? 'True' : 'False';
        }
        if (typeof value === 'string') {
            color = theme.colors.accent;
            displayValue = `"${value}"`;
        }

        return (
            <div className="flex items-center gap-2 font-mono text-sm">
                {name && <span style={{ color: theme.colors.text }}>{name}:</span>}
                <span style={{ color }}>{displayValue}</span>
            </div>
        );
    }
    
    // Array Handling
    if (Array.isArray(value)) {
        if (value.length === 0) {
                return (
                <div className="flex items-center gap-2 font-mono text-sm">
                    {name && <span style={{ color: theme.colors.text }}>{name}:</span>}
                    <span style={{ color: theme.colors.textSecondary }}>[]</span>
                </div>
            );
        }

        // Inline display for simple arrays (all primitives)
        const isSimple = value.every(v => v === null || typeof v !== 'object' || (typeof v === 'object' && v.__type__ === undefined && !Array.isArray(v)));
        if (isSimple) {
             return (
                <div className="flex items-center gap-2 font-mono text-sm">
                    {name && <span style={{ color: theme.colors.text }}>{name}:</span>}
                    <span style={{ color: theme.colors.textSecondary }}>[</span>
                    <span style={{ color: theme.colors.success }}>
                        {value.map(v => JSON.stringify(v)).join(', ')}
                    </span>
                    <span style={{ color: theme.colors.textSecondary }}>]</span>
                </div>
            );
        }

        return (
            <div className="font-mono text-sm">
                {name && <span style={{ color: theme.colors.text }}>{name}: </span>}
                <span style={{ color: theme.colors.textSecondary }}>[</span>
                <div className="pl-4 border-l ml-1 my-1" style={{ borderColor: theme.colors.border }}>
                    {value.map((item, idx) => (
                        <div key={idx} className="my-0.5">
                            <DataNode value={item} theme={theme} />
                        </div>
                    ))}
                </div>
                <span style={{ color: theme.colors.textSecondary }}>]</span>
            </div>
        );
    }
    if (['tuple', 'set', 'deque'].includes(value.__type__)) {
            const typeCharMap: any = { tuple: ['(',')'], set: ['{','}'], deque: ['deque([', '])'] };
            const [startChar, endChar] = typeCharMap[value.__type__] || ['<','>'];
            const items = value.items || [];
            if (items.length === 0) {
                return (
                <div className="flex items-center gap-2 font-mono text-sm">
                    {name && <span style={{ color: theme.colors.text }}>{name}:</span>}
                    <span style={{ color: theme.colors.textSecondary }}>{startChar}{endChar}</span>
                </div>
            );
        }
            return (
            <div className="font-mono text-sm">
                {name && <span style={{ color: theme.colors.text }}>{name}: </span>}
                <span style={{ color: theme.colors.textSecondary }}>{startChar}</span>
                <div className="pl-4 border-l ml-1 my-1" style={{ borderColor: theme.colors.border }}>
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="my-0.5">
                            <DataNode value={item} theme={theme} />
                        </div>
                    ))}
                </div>
                <span style={{ color: theme.colors.textSecondary }}>{endChar}</span>
            </div>
        );
    }
    if (value.__type__ === 'object') {
        const className = value.class || 'Object';
        const data = value.data || {};
        
        return (
            <div className="font-mono text-sm">
                    {name && <span style={{ color: theme.colors.text }}>{name}: </span>}
                    <span style={{ color: theme.colors.accent }}>{className}</span>
                    <span style={{ color: theme.colors.textSecondary }}> {'{'}</span>
                    <div className="pl-4 border-l ml-1 my-1" style={{ borderColor: theme.colors.border }}>
                    {Object.entries(data).map(([k, v]) => (
                            <div key={k} className="my-0.5">
                            <DataNode name={k} value={v} theme={theme} />
                            </div>
                    ))}
                    </div>
                    <span style={{ color: theme.colors.textSecondary }}>{'}'}</span>
            </div>
        );
    }
    // Handle Dict
    return (
        <div className="font-mono text-sm">
            {name && <span style={{ color: theme.colors.text }}>{name}: </span>}
            <span style={{ color: theme.colors.textSecondary }}>{'{'}</span>
            <div className="pl-4 border-l ml-1 my-1" style={{ borderColor: theme.colors.border }}>
                {Object.entries(value).map(([k, v]) => (
                    <div key={k} className="my-0.5">
                        <DataNode name={k} value={v} theme={theme} />
                    </div>
                ))}
            </div>
            <span style={{ color: theme.colors.textSecondary }}>{'}'}</span>
        </div>
    );
};

// --- Container Components (Pure logic) ---

const Visualizer: React.FC<VisualizerProps> = ({ step, prevStep, theme, loading, isWaitingForInput, onInput }) => {
    const [viewMode, setViewMode] = useState<'tree' | 'graph'>('graph');
    const [variableOrder, setVariableOrder] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");

    // Maintain variable order when step changes
    useEffect(() => {
        if (step) {
            const currentKeys = Object.keys(step.variables);
            setVariableOrder(prev => {
                const newKeys = currentKeys.filter(k => !prev.includes(k));
                return [...prev, ...newKeys];
            });
        }
    }, [step]);

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, name: string) => {
        e.dataTransfer.setData("text/plain", name);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetName: string) => {
        e.preventDefault();
        const draggedName = e.dataTransfer.getData("text/plain");
        if (draggedName === targetName) return;

        setVariableOrder(prev => {
            const newOrder = [...prev];
            const draggedIndex = newOrder.indexOf(draggedName);
            const targetIndex = newOrder.indexOf(targetName);
            
            if (draggedIndex > -1 && targetIndex > -1) {
                newOrder.splice(draggedIndex, 1);
                newOrder.splice(targetIndex, 0, draggedName);
            }
            return newOrder;
        });
    };

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onInput && inputValue) {
            onInput(inputValue);
            setInputValue("");
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-4" style={{ color: theme.colors.textSecondary }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                <p className="text-sm">Executing Python Code...</p>
            </div>
        );
    }

    if (!step && !isWaitingForInput) {
        return (
            <div className="h-full w-full flex items-center justify-center p-8 text-center" style={{ color: theme.colors.textSecondary }}>
                <p>Click "Run Analysis" to visualize execution.</p>
            </div>
        );
    }

    const sortedKeys = step ? Object.keys(step.variables).sort((a, b) => {
        const idxA = variableOrder.indexOf(a);
        const idxB = variableOrder.indexOf(b);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    }) : [];

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
            {/* Context Header */}
            <div className="flex-none p-4 pb-2 border-b space-y-2" style={{ borderColor: theme.colors.border }}>
                 {step && (
                 <div className="flex items-center justify-between">
                     <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                        LINE {step.line}
                    </span>
                 </div>
                 )}
                 
                 {isWaitingForInput ? (
                     <form onSubmit={handleInputSubmit} className="flex items-center gap-2 mt-2">
                        <Terminal size={14} style={{ color: theme.colors.textSecondary }} />
                        <input 
                            autoFocus
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter input..."
                            className="flex-1 text-xs font-mono p-2 rounded outline-none border transition-colors focus:ring-1"
                            style={{ 
                                backgroundColor: theme.colors.surface, 
                                color: theme.colors.text,
                                borderColor: theme.colors.primary,
                                ['--tw-ring-color' as any]: theme.colors.primary
                            }}
                        />
                        <button 
                            type="submit"
                            className="text-xs px-3 py-2 rounded font-bold transition-transform active:scale-95"
                            style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
                        >
                            Submit
                        </button>
                     </form>
                 ) : (
                    <div className="text-xs font-mono p-2 rounded max-h-20 overflow-y-auto" style={{ backgroundColor: theme.colors.surface, color: theme.colors.textSecondary }}>
                        <span className="opacity-50 select-none mr-2">$</span>
                        {step?.stdout || <span className="italic opacity-50">no output</span>}
                    </div>
                 )}
            </div>

            {/* View Toggle Tabs */}
            <div className="flex border-b" style={{ borderColor: theme.colors.border }}>
                <button
                    onClick={() => setViewMode('tree')}
                    className={`flex-1 p-2 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${viewMode === 'tree' ? 'border-b-2' : 'opacity-60 hover:opacity-100'}`}
                    style={{ 
                        borderColor: viewMode === 'tree' ? theme.colors.primary : 'transparent',
                        color: viewMode === 'tree' ? theme.colors.text : theme.colors.textSecondary,
                        backgroundColor: viewMode === 'tree' ? theme.colors.surface : 'transparent'
                    }}
                >
                    <ListTree size={14} /> Tree View
                </button>
                <button
                    onClick={() => setViewMode('graph')}
                    className={`flex-1 p-2 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${viewMode === 'graph' ? 'border-b-2' : 'opacity-60 hover:opacity-100'}`}
                    style={{ 
                        borderColor: viewMode === 'graph' ? theme.colors.primary : 'transparent',
                        color: viewMode === 'graph' ? theme.colors.text : theme.colors.textSecondary,
                        backgroundColor: viewMode === 'graph' ? theme.colors.surface : 'transparent'
                    }}
                >
                    <Network size={14} /> Graph View
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {(!step || Object.keys(step.variables).length === 0) ? (
                     <div className="text-sm italic opacity-50 p-2">No local variables</div>
                ) : (
                    viewMode === 'tree' ? (
                        <div className="space-y-4">
                            {sortedKeys.map((name) => {
                                const data = step.variables[name];
                                return (
                                    <div 
                                        key={name} 
                                        className="p-3 rounded-md border shadow-sm transition-colors hover:bg-opacity-50 group relative" 
                                        style={{ 
                                            backgroundColor: theme.colors.surface, 
                                            borderColor: theme.colors.border 
                                        }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, name)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, name)}
                                    >
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing">
                                            <GripHorizontal size={14} />
                                        </div>
                                        <DataNode name={name} value={data.value} type={data.type} theme={theme} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-8 p-4 overflow-auto h-full">
                            {sortedKeys.filter((key) => {
                                const val = step.variables[key]?.value;
                                if (!val) return false;
                                if (Array.isArray(val) && val.length > 0) return true;
                                if (val && (val.__type__ === 'deque' || val.__type__ === 'tuple' || val.__type__ === 'set')) return true;
                                if (val && val.__type__ === 'object' && val.data) {
                                    if ('next' in val.data) return true;
                                    if ('left' in val.data || 'right' in val.data) return true;
                                    if ('children' in val.data) return true;
                                    // Graph detection
                                    if ('neighbors' in val.data || 'adj' in val.data || 'edges' in val.data) return true;
                                }
                                // Adjacency List (Dict of Arrays) OR Plain Dictionary (Hash Map)
                                if (val && typeof val === 'object' && !val.__type__) {
                                    return true;
                                }
                                return false;
                            }).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-50 text-sm p-4 text-center">
                                    <p>No visualizable data structures (Arrays, Linked Lists, Trees, Graphs, Hash Maps) found.</p>
                                </div>
                            ) : (
                                sortedKeys.filter((key) => {
                                     // Same logic as above for filter
                                     const val = step.variables[key]?.value;
                                     if (!val) return false;
                                     if (Array.isArray(val) && val.length > 0) return true;
                                     if (val && (val.__type__ === 'deque' || val.__type__ === 'tuple' || val.__type__ === 'set')) return true;
                                     if (val && val.__type__ === 'object' && val.data) {
                                         if ('next' in val.data) return true;
                                         if ('left' in val.data || 'right' in val.data) return true;
                                         if ('children' in val.data) return true;
                                         if ('neighbors' in val.data || 'adj' in val.data || 'edges' in val.data) return true;
                                     }
                                     if (val && typeof val === 'object' && !val.__type__) {
                                         return true;
                                     }
                                     return false;
                                }).map((name) => {
                                    const data = step.variables[name];
                                    const val = data.value;
                                    const prevVar = prevStep?.variables[name];
                                    const prevVal = prevVar ? prevVar.value : undefined;
                                    
                                    let isGraph = false;
                                    let isHashMap = false;

                                    if (val && val.__type__ === 'object' && val.data) {
                                        if ('neighbors' in val.data || 'adj' in val.data || 'edges' in val.data) isGraph = true;
                                    }
                                    if (val && typeof val === 'object' && !val.__type__) {
                                        const values = Object.values(val);
                                        // Detect Adjacency List Graph
                                        if (values.length > 0 && values.every(v => Array.isArray(v))) {
                                            isGraph = true;
                                        } else {
                                            isHashMap = true;
                                        }
                                    }

                                    return (
                                        <div 
                                            key={name} 
                                            className="space-y-2 group relative border p-4 rounded-lg bg-opacity-10"
                                            style={{ 
                                                borderColor: theme.colors.border, 
                                                backgroundColor: theme.colors.surface 
                                            }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, name)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, name)}
                                        >
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing">
                                                <GripHorizontal size={14} />
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="text-xs font-bold px-2 py-1 rounded select-none" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
                                                    {name}
                                                </div>
                                                <span className="text-xs opacity-50 select-none">{data.type}</span>
                                                {isGraph && <span className="text-[10px] px-1 border rounded opacity-50">Graph</span>}
                                                {isHashMap && <span className="text-[10px] px-1 border rounded opacity-50">Map</span>}
                                            </div>
                                            
                                            <div className="overflow-x-auto min-h-[120px] flex items-center justify-start w-full">
                                                {Array.isArray(val) ? (
                                                    <GraphArray data={val} label={name} prevData={Array.isArray(prevVal) ? prevVal : undefined} theme={theme} />
                                                ) : (val.__type__ === 'deque') ? (
                                                    <GraphArray data={val.items || []} label={name} isDeque={true} prevData={prevVal && prevVal.__type__ === 'deque' ? prevVal.items : undefined} theme={theme} />
                                                ) : isGraph ? (
                                                    <NetworkGraph data={val} theme={theme} />
                                                ) : isHashMap ? (
                                                    <GraphHashMap data={val} theme={theme} />
                                                ) : (val.__type__ === 'object') ? (
                                                    <GraphNode data={val} label={name} isRoot={true} theme={theme} />
                                                ) : (
                                                    <span className="text-xs opacity-50">Preview not available</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default Visualizer;
