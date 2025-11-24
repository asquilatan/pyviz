
import { ExecutionTrace } from "../types";

let pyodideInstance: any = null;

const PYTHON_TRACER_SCRIPT = `
import sys
import json
import io
import traceback
import types
import collections
import builtins
import ast

# Global configuration injected from JS
MAX_STEPS = globals().get('MAX_STEPS', 1000)
INPUT_QUEUE = globals().get('USER_INPUTS', [])

# Global Access Log for the current step
ACCESS_LOG = []

# Convert Pyodide proxy to list if needed
if hasattr(INPUT_QUEUE, 'to_py'):
    INPUT_QUEUE = INPUT_QUEUE.to_py()

class NeedsInputError(Exception):
    pass

# Override built-in input function
def custom_input(prompt=''):
    if len(INPUT_QUEUE) > 0:
        val = INPUT_QUEUE.pop(0)
        return val
    else:
        raise NeedsInputError("Waiting for input")

builtins.input = custom_input

# --- Array Access Tracking ---

class TrackedList(list):
    def __init__(self, iterable=None):
        if iterable is not None:
            super().__init__(iterable)
        else:
            super().__init__()
        # We use the object's ID as a unique identifier
        self._id = str(id(self))

    def __getitem__(self, index):
        # Log read access
        try:
            # Handle slice access? For now just simple index
            if isinstance(index, int):
                # Normalize index
                idx = index if index >= 0 else len(self) + index
                ACCESS_LOG.append({
                    "type": "read",
                    "arrayId": self._id,
                    "index": idx
                })
        except:
            pass
        return super().__getitem__(index)

    def __setitem__(self, index, value):
        # Log write access
        try:
            if isinstance(index, int):
                idx = index if index >= 0 else len(self) + index
                ACCESS_LOG.append({
                    "type": "write",
                    "arrayId": self._id,
                    "index": idx
                })
        except:
            pass
        super().__setitem__(index, value)

class ListTransformer(ast.NodeTransformer):
    def visit_List(self, node):
        # Transform [1, 2] -> TrackedList([1, 2])
        self.generic_visit(node)
        return ast.Call(
            func=ast.Name(id='TrackedList', ctx=ast.Load()),
            args=[node],
            keywords=[]
        )

# --- Tracer ---

class Tracer:
    def __init__(self):
        self.trace = []
        self.output_buffer = io.StringIO()
        self.original_stdout = sys.stdout
        self.step_count = 0

    def serialize(self, obj, depth=0, seen=None):
        if seen is None: seen = set()
        
        # Prevent infinite recursion for cyclic references or deep structures
        if depth > 10: return "..."

        obj_id = id(obj)
        if obj_id in seen:
            return {"__type__": "cyclic", "id": obj_id, "val": "⟳"}
        
        # Don't track simple primitives in seen
        if not isinstance(obj, (int, float, str, bool, type(None))):
            seen.add(obj_id)

        try:
            # Primitives
            if isinstance(obj, (int, float, bool, type(None))):
                return obj
            if isinstance(obj, str):
                return obj
            
            # Collections
            # Collections
            if isinstance(obj, TrackedList):
                return {'__type__': 'list', 'id': obj._id, 'items': [self.serialize(x, depth + 1, seen.copy()) for x in obj]}
            if isinstance(obj, list):
                return [self.serialize(x, depth + 1, seen.copy()) for x in obj]
            if isinstance(obj, tuple):
                return {'__type__': 'tuple', 'items': [self.serialize(x, depth + 1, seen.copy()) for x in obj]}
            if isinstance(obj, set):
                return {'__type__': 'set', 'items': [self.serialize(x, depth + 1, seen.copy()) for x in obj]}
            if isinstance(obj, collections.deque):
                return {'__type__': 'deque', 'items': [self.serialize(x, depth + 1, seen.copy()) for x in obj]}
            if isinstance(obj, dict):
                return {str(k): self.serialize(v, depth + 1, seen.copy()) for k, v in obj.items()}
            
            # Custom Objects (Classes)
            if hasattr(obj, '__dict__'):
                data = {k: self.serialize(v, depth + 1, seen.copy()) for k, v in obj.__dict__.items() if not k.startswith('__')}
                return {"__type__": "object", "id": obj_id, "class": type(obj).__name__, "data": data}
            
            # Fallback
            return str(obj)
        except Exception as e:
            return f"<Error: {str(e)}>"

    def snapshot(self, frame, event):
        # Limit check
        if self.step_count >= MAX_STEPS:
            return

        self.step_count += 1
        
        # Capture Stdout
        current_stdout = self.output_buffer.getvalue()

        # Capture Variables
        current_vars = {}

        if frame:
            for k, v in frame.f_locals.items():
                # Filter out system variables
                if k.startswith('__'): continue
                if k == 'tracer_instance': continue
                if isinstance(v, (types.ModuleType, types.FunctionType, types.MethodType, type)): continue
                if k == 'TrackedList': continue # Don't show the class itself

                # Serialize value
                serialized_val = self.serialize(v)

                type_label = type(v).__name__
                if isinstance(v, TrackedList):
                    type_label = 'list' # Hide implementation detail
                
                # If it's a TrackedList, we want to pass its ID so frontend can match accesses
                val_data = {
                    "type": type_label,
                    "value": serialized_val
                }
                
                # Attach ID for arrays (lists) to match with access log
                if isinstance(v, (list, TrackedList)):
                    val_data["id"] = str(id(v))

                current_vars[k] = val_data

        line_no = frame.f_lineno if frame else -1
        
        # Capture and Clear Access Log
        current_accesses = list(ACCESS_LOG)
        ACCESS_LOG.clear()

        self.trace.append({
            "line": line_no,
            "stdout": current_stdout,
            "variables": current_vars,
            "accesses": current_accesses,
            "explanation": f"Line {line_no}" if frame else "Execution Finished"
        })

    def trace_func(self, frame, event, arg):
        if event != 'line': return self.trace_func
        if frame.f_code.co_filename != '<string>': return self.trace_func

        self.snapshot(frame, event)
        return self.trace_func

# Execute
tracer = Tracer()
sys.stdout = tracer.output_buffer

last_frame = None

def global_trace(frame, event, arg):
    global last_frame
    if frame.f_code.co_filename == '<string>':
        last_frame = frame
    return tracer.trace_func(frame, event, arg)

result_metadata = {"needsInput": False}

try:
    # AST Transformation
    tree = ast.parse(user_code)
    transformer = ListTransformer()
    new_tree = transformer.visit(tree)
    ast.fix_missing_locations(new_tree)
    compiled_code = compile(new_tree, filename="<string>", mode="exec")

    sys.settrace(global_trace)
    # Execute compiled code
    exec(compiled_code, {'__name__': '__main__', 'TrackedList': TrackedList})
except NeedsInputError:
    # Gracefully stop trace and flag for input
    result_metadata["needsInput"] = True
except Exception:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    # Filter traceback to hide internal calls if possible, but standard is fine
    error_msg = traceback.format_exception_only(exc_type, exc_value)[0].strip()
    tracer.trace.append({
        "line": 0,
        "stdout": tracer.output_buffer.getvalue(),
        "variables": {},
        "accesses": [],
        "explanation": f"Error: {error_msg}"
    })
finally:
    sys.settrace(None)
    sys.stdout = tracer.original_stdout
    
    # Final Snapshot if not waiting for input
    if last_frame and not result_metadata["needsInput"]:
        tracer.snapshot(last_frame, 'return')

# Explicitly return JSON string
output = {
    "steps": tracer.trace,
    "needsInput": result_metadata["needsInput"]
}
json.dumps(output)
`;

export const initializePyodide = async () => {
    if (!pyodideInstance) {
        // @ts-ignore
        pyodideInstance = await loadPyodide();
    }
    return pyodideInstance;
};

export const runCode = async (code: string, maxSteps: number = 1000, inputs: string[] = []): Promise<ExecutionTrace> => {
    const pyodide = await initializePyodide();

    // Set variables in pyodide scope
    pyodide.globals.set("user_code", code);
    pyodide.globals.set("MAX_STEPS", maxSteps);
    pyodide.globals.set("USER_INPUTS", inputs);

    try {
        const resultJson = await pyodide.runPythonAsync(PYTHON_TRACER_SCRIPT);

        if (!resultJson) {
            throw new Error("Python execution returned no output.");
        }

        const result = JSON.parse(resultJson);
        const steps = result.steps;

        if (steps.length > 0 && steps[steps.length - 1].explanation.startsWith("Error:")) {
            const errorStep = steps.pop();
            return { steps, error: errorStep.explanation };
        }

        if (steps.length === 0 && !result.needsInput) {
            return { steps: [], error: "No execution steps captured." };
        }

        return {
            steps: steps,
            needsInput: result.needsInput
        };
    } catch (err: any) {
        console.error(err);
        return { steps: [], error: err.message || "Execution failed" };
    }
};
