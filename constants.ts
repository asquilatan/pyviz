

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

# --- Algorithms ---

def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

def trap(height):
    if not height: return 0
    left, right = 0, len(height) - 1
    left_max, right_max = height[left], height[right]
    water = 0
    while left < right:
        if left_max < right_max:
            left += 1
            left_max = max(left_max, height[left])
            water += left_max - height[left]
        else:
            right -= 1
            right_max = max(right_max, height[right])
            water += right_max - height[right]
    return water

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
    
    # --- Algorithm Examples ---
    
    print("Running Binary Search...")
    search_arr = [1, 3, 5, 7, 9, 11]
    idx = binary_search(search_arr, 7)
    
    print("Running Bubble Sort...")
    sort_arr = [64, 34, 25, 12, 22, 11, 90]
    bubble_sort(sort_arr)
    
    print("Running Trapping Rain Water...")
    heights = [0,1,0,2,1,0,1,3,2,1,2,1]
    water = trap(heights)
    
    print("Done")

if __name__ == "__main__":
    main()
`;

export const PATCH_NOTES = `
# v1.0.1
Posted on November 24, 2025 (6:55 PM)

## New Features
- **Flexible Split View**: Added options for Editor Only, Visualizer Only, and a reversible split view to swap Editor and Visualizer positions. Just click the "Split" button to cycle through views.
- **Read Array Highlight**: Array elements now turn green when they are read.
- **New Default Code**: Added Binary Search, Bubble Sort, and Trapping Rain Water examples to the default code.

## Improvements & Bug Fixes
- **UI & Hover Effects**: Fixed issues with hover effects on arrays and bar charts.


# Initial Release (v1.0.0)
Posted on November 24, 2025

- **Official Release**: Pyviz (not the library) is now at v1.0.0!
- **Under the Hood**: Minor bug fixes and performance improvements.

# Pre-release Beta Patch Notes

# v0.9.2 (Previously v1.0.2)
Posted on November 24, 2025 (3:06 PM)

## New Features
- **Logo**: Added a new project logo to improve branding.
- **Keyboard Shortcut**: Added Ctrl+' shortcut to run code from the editor.

## Improvements
- **Visibility**: Enhanced visibility of visual elements for better user experience.

# v0.9.1 (Previously v1.0.1)
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