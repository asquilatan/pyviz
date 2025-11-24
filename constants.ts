

export const DEFAULT_PYTHON_CODE = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def create_tree():
    root = TreeNode(10)
    root.left = TreeNode(5)
    root.right = TreeNode(15)
    root.left.left = TreeNode(2)
    root.left.right = TreeNode(7)
    return root

class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

def create_linked_list():
    head = Node(1)
    second = Node(2)
    third = Node(3)
    head.next = second
    second.next = third
    return head

class GraphNode:
    def __init__(self, val):
        self.val = val
        self.neighbors = []

def create_graph():
    a = GraphNode('A')
    b = GraphNode('B')
    c = GraphNode('C')
    a.neighbors = [b, c]
    b.neighbors = [c]
    c.neighbors = [a] # Cycle
    return a

def main():
    print("Initializing Structures...")
    
    # Tree Visualization
    my_tree = create_tree()
    
    # Linked List Visualization
    my_list = create_linked_list()
    
    # Graph Visualization (Object)
    my_graph = create_graph()

    # Graph Visualization (Adjacency List)
    my_adj_list = {
        'X': ['Y', 'Z'],
        'Y': ['Z'],
        'Z': ['X']
    }
    
    # Dictionary (Hash Map) Visualization
    student_scores = {
        'Alice': 95,
        'Bob': 88,
        'Charlie': 72
    }
    
    # List example
    numbers = [10, 50, 30, 20, 80, 10]
    numbers.sort()
    
    print("Done")

if __name__ == "__main__":
    main()
`;

export const PATCH_NOTES = `
# Patch Notes - v1.0.0
Posted on November 24, 2025 (9:00 AM)

- **Official Release**: Pyviz (not the library) is now at v1.0.0!
- **Under the Hood**: Minor bug fixes and performance improvements.

# Pre-release Beta Patch Notes

# Patch Notes - v0.9.2 (Previously v1.0.2)
Posted on November 24, 2025 (3:06 PM)

- **Logo**: Added a new project logo to improve branding.
- **Visibility**: Enhanced visibility of visual elements for better user experience.
- **Keyboard Shortcut**: Added Ctrl+' shortcut to run code from the editor.

# Patch Notes - v0.9.1 (Previously v1.0.1)
Posted on November 24, 2025 (6:58 AM)

## New Features
- **Sidebar Navigation**: Added a sleek sidebar for better navigation.
- **Interactive Inputs**: Supported \`input()\` function in Python. The IDE now pauses and prompts for user input!
- **Graph Visualization**: Added support for Hash Maps (Dictionaries) and Graph structures (Adjacency Lists & Object-based).
- **Inline Arrays**: Simple arrays are now displayed inline for better readability.
- **Terminal Panel**: Removed the fixed bottom terminal; output is now integrated into the step header or handled via input prompts.

## Improvements
- **Visualizer**: Graph nodes now color-code the "root" vs "children" for clarity.
- **Controls**: Added a visual timeline with markers for the selected line of code.
- **Editor**: Fixed cursor alignment issues by ensuring fonts are measured correctly.

## Bug Fixes
- Fixed an issue where infinite loops could crash the browser (added step limits).
- Fixed visualization resetting when stepping through code.

`;