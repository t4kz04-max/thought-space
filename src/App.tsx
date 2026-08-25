import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { HexColorPicker } from "react-colorful";
import "./App.css";

type NodeType = {
  id: number;
  position: [number, number, number];
  color: string;
  label: string;
  longLabel: string;
  size: number;
  textColor: string;
  textSize: number;
  shape: "sphere" | "box" | "dodecahedron" | "cylinder" | "cone" | "torus";
};

type EdgeType = {
  id: number;
  from: number;
  to: number;
  color: string;
  label: string;
  longLabel: string;
  width: number;
};

type GraphState = {
  nodes: NodeType[];
  edges: EdgeType[];
};

type DragPlaneVisual = {
  position: [number, number, number];
  quaternion: [number, number, number, number];
} | null;

/*
 * The starter scene is a small demo of what Thought Space is for, not just
 * a functional smoke test. It intentionally is NOT a single tree growing
 * in one direction — it's a hub with a few loosely-related clusters placed
 * at different distances and directions in X, Y *and* Z, some tightly
 * looped, some only weakly cross-linked, and a couple of nodes that sit
 * near a cluster in space without being connected to it at all. Rotating
 * or zooming should make that spatial structure obvious immediately,
 * without needing to read any of the labels.
 */
const initialNodes: NodeType[] = [
  // Hub — the shared reference point everything else is placed around.
  {
    id: 1,
    position: [0, 0.4, 0],
    color: "#f2b134",
    label: "Intelligence",
    longLabel:
      "The center of this demo map. Try dragging nodes, connecting two of them, or just orbiting the space.",
    size: 0.34,
    textColor: "#ffffff",
    textSize: 14,
    shape: "dodecahedron",
  },

  // Cluster: Data & Learning — foreground, closer to the camera.
  {
    id: 2,
    position: [-3.0, -0.9, 2.6],
    color: "#4c8dff",
    label: "Data",
    longLabel: "",
    size: 0.26,
    textColor: "#ffffff",
    textSize: 13,
    shape: "sphere",
  },
  {
    id: 3,
    position: [-2.1, -1.9, 1.3],
    color: "#3f7fe0",
    label: "Training",
    longLabel: "",
    size: 0.24,
    textColor: "#ffffff",
    textSize: 13,
    shape: "sphere",
  },
  {
    id: 4,
    position: [-1.0, -0.7, 2.0],
    color: "#4c8dff",
    label: "Machine Learning",
    longLabel: "",
    size: 0.28,
    textColor: "#ffffff",
    textSize: 13,
    shape: "box",
  },
  {
    id: 5,
    position: [-1.9, 0.5, 3.0],
    color: "#6aa0ff",
    label: "Neural Networks",
    longLabel: "",
    size: 0.24,
    textColor: "#ffffff",
    textSize: 13,
    shape: "sphere",
  },

  // Cluster: Reasoning & Language — to the right, mixed depth.
  {
    id: 6,
    position: [2.7, 1.0, -0.5],
    color: "#3ddc97",
    label: "Reasoning",
    longLabel: "",
    size: 0.27,
    textColor: "#ffffff",
    textSize: 13,
    shape: "sphere",
  },
  {
    id: 7,
    position: [3.6, -0.4, -1.8],
    color: "#33c78a",
    label: "LLM",
    longLabel: "",
    size: 0.3,
    textColor: "#ffffff",
    textSize: 13,
    shape: "cone",
  },
  {
    id: 8,
    position: [2.0, -1.3, -0.7],
    color: "#33c78a",
    label: "Language",
    longLabel: "",
    size: 0.24,
    textColor: "#ffffff",
    textSize: 13,
    shape: "sphere",
  },
  {
    id: 9,
    position: [2.8, 2.1, -2.0],
    color: "#5fe0b0",
    label: "Context",
    longLabel: "",
    size: 0.2,
    textColor: "#ffffff",
    textSize: 12,
    shape: "sphere",
  },

  // Cluster: Applications — background, farther from the camera.
  {
    id: 10,
    position: [0.6, -2.5, -4.6],
    color: "#b98dfb",
    label: "Agents",
    longLabel: "",
    size: 0.2,
    textColor: "#ffffff",
    textSize: 12,
    shape: "cylinder",
  },
  {
    id: 11,
    position: [-0.7, -3.1, -5.4],
    color: "#a67cf0",
    label: "Tools",
    longLabel: "",
    size: 0.18,
    textColor: "#ffffff",
    textSize: 12,
    shape: "sphere",
  },
  {
    id: 12,
    position: [1.7, -3.4, -5.0],
    color: "#a67cf0",
    label: "Products",
    longLabel: "",
    size: 0.18,
    textColor: "#ffffff",
    textSize: 12,
    shape: "sphere",
  },

  // Spatially close to a cluster, but deliberately left unconnected — a
  // small demonstration that proximity alone can carry meaning here.
  {
    id: 13,
    position: [3.2, 1.8, -1.1],
    color: "#7c8aa0",
    label: "Ethics",
    longLabel: "",
    size: 0.18,
    textColor: "#ffffff",
    textSize: 11,
    shape: "torus",
  },
  {
    id: 14,
    position: [-2.7, -2.4, 2.2],
    color: "#7c8aa0",
    label: "Compute",
    longLabel: "",
    size: 0.18,
    textColor: "#ffffff",
    textSize: 11,
    shape: "box",
  },
];

const initialEdges: EdgeType[] = [
  // Data & Learning — a tight local loop (not a straight chain).
  { id: 101, from: 2, to: 3, color: "#5c94ff", label: "", longLabel: "", width: 2.4 },
  { id: 102, from: 3, to: 4, color: "#5c94ff", label: "", longLabel: "", width: 2.4 },
  { id: 103, from: 4, to: 5, color: "#5c94ff", label: "", longLabel: "", width: 2.4 },
  { id: 104, from: 5, to: 2, color: "#5c94ff", label: "", longLabel: "", width: 2.4 },

  // Reasoning & Language — a local triangle.
  { id: 105, from: 6, to: 7, color: "#3ddc97", label: "", longLabel: "", width: 2.4 },
  { id: 106, from: 7, to: 8, color: "#3ddc97", label: "", longLabel: "", width: 2.4 },
  { id: 107, from: 8, to: 6, color: "#3ddc97", label: "", longLabel: "", width: 2.4 },

  // Applications — a small local pair.
  { id: 108, from: 10, to: 11, color: "#b98dfb", label: "", longLabel: "", width: 1.8 },
  { id: 109, from: 10, to: 12, color: "#b98dfb", label: "", longLabel: "", width: 1.8 },

  // Hub to cluster — strong, direct relationships.
  { id: 110, from: 1, to: 4, color: "#f2b134", label: "", longLabel: "", width: 2 },
  { id: 111, from: 1, to: 6, color: "#f2b134", label: "", longLabel: "", width: 2 },

  // Cross-cluster — weaker, longer-distance relationships.
  { id: 112, from: 1, to: 10, color: "#5c6780", label: "distantly related", longLabel: "", width: 1 },
  { id: 113, from: 7, to: 10, color: "#7c8aa0", label: "powers", longLabel: "", width: 1.4 },
  { id: 114, from: 5, to: 6, color: "#5c6780", label: "", longLabel: "", width: 1 },
];

const cloneNodes = (nodes: NodeType[]): NodeType[] =>
  nodes.map((node) => ({
    ...node,
    position: [...node.position] as [number, number, number],
  }));

const cloneEdges = (edges: EdgeType[]): EdgeType[] =>
  edges.map((edge) => ({ ...edge }));

const cloneGraph = (nodes: NodeType[], edges: EdgeType[]): GraphState => ({
  nodes: cloneNodes(nodes),
  edges: cloneEdges(edges),
});

// ================= Icons =================
// Small hand-authored line icons (no icon library dependency). Every
// icon-only control still carries a visible text label next to it, per
// the "labels, not icon-only controls" requirement.

function Icon({
  children,
  size = 16,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const IconBrand = () => (
  <Icon size={20}>
    <circle cx="6" cy="17" r="1.8" />
    <circle cx="18" cy="17" r="1.8" />
    <circle cx="12" cy="6" r="1.8" />
    <line x1="7.5" y1="16" x2="10.8" y2="7.6" />
    <line x1="16.5" y1="16" x2="13.2" y2="7.6" />
    <line x1="7.8" y1="17" x2="16.2" y2="17" />
  </Icon>
);

const IconSearch = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);

const IconUndo = () => (
  <Icon>
    <polyline points="9 14 4 9 9 4" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </Icon>
);

const IconRedo = () => (
  <Icon>
    <polyline points="15 14 20 9 15 4" />
    <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
  </Icon>
);

const IconPlus = () => (
  <Icon>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

const IconSave = () => (
  <Icon>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Icon>
);

const IconLoad = () => (
  <Icon>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Icon>
);

const IconReset = () => (
  <Icon>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Icon>
);

const IconEye = () => (
  <Icon>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

const IconMove = () => (
  <Icon>
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </Icon>
);

const IconEdit = () => (
  <Icon>
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Icon>
);

const IconLink = () => (
  <Icon>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);

const IconClose = () => (
  <Icon size={14}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

const HINT_STORAGE_KEY = "thought-space:hint-dismissed";

export default function App() {
  const [mode, setMode] = useState<"view" | "move" | "edit" | "connect">(
    "view",
  );

  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [connectFrom, setConnectFrom] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(
    new Set(),
  );
  const [highlightedEdges, setHighlightedEdges] = useState<Set<number>>(
    new Set(),
  );

  const [nodes, setNodes] = useState<NodeType[]>(initialNodes);
  const [edges, setEdges] = useState<EdgeType[]>(initialEdges);

  const initialHistory = [cloneGraph(initialNodes, initialEdges)];

  const [history, setHistory] = useState<GraphState[]>(initialHistory);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [dragPlaneVisual, setDragPlaneVisual] =
    useState<DragPlaneVisual>(null);

  const [showHint, setShowHint] = useState(() => {
    try {
      return window.localStorage.getItem(HINT_STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const dismissHint = () => {
    setShowHint(false);

    try {
      window.localStorage.setItem(HINT_STORAGE_KEY, "1");
    } catch {
      // Ignore storage errors (e.g. private browsing).
    }
  };

  /*
   * Refs are used so that pointermove/pointerup callbacks always have
   * access to the latest state even though they are registered on window.
   */
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  /*
   * Orbit controls are mounted for every mode so the camera can always be
   * repositioned. Whether it actually responds to input is toggled
   * imperatively through this ref (see GraphScene) rather than through a
   * React prop, so a node-drag can disable it instantly without waiting on
   * a render.
   */
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // ================= History =================

  const pushHistory = (newNodes: NodeType[], newEdges: EdgeType[]) => {
    const snapshot = cloneGraph(newNodes, newEdges);

    const nextHistory = historyRef.current
      .slice(0, historyIndexRef.current + 1)
      .concat(snapshot);

    const nextIndex = nextHistory.length - 1;

    historyRef.current = nextHistory;
    historyIndexRef.current = nextIndex;

    setHistory(nextHistory);
    setHistoryIndex(nextIndex);
  };

  const undo = () => {
    if (historyIndexRef.current <= 0) return;

    const prev = historyRef.current[historyIndexRef.current - 1];

    const restoredNodes = cloneNodes(prev.nodes);
    const restoredEdges = cloneEdges(prev.edges);

    setNodes(restoredNodes);
    setEdges(restoredEdges);

    const nextIndex = historyIndexRef.current - 1;

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);

    setSelectedNode((currentSelectedNode) =>
      restoredNodes.some((node) => node.id === currentSelectedNode)
        ? currentSelectedNode
        : null,
    );

    setSelectedEdge((currentSelectedEdge) =>
      restoredEdges.some((edge) => edge.id === currentSelectedEdge)
        ? currentSelectedEdge
        : null,
    );
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    const next = historyRef.current[historyIndexRef.current + 1];

    const restoredNodes = cloneNodes(next.nodes);
    const restoredEdges = cloneEdges(next.edges);

    setNodes(restoredNodes);
    setEdges(restoredEdges);

    const nextIndex = historyIndexRef.current + 1;

    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);

    setSelectedNode((currentSelectedNode) =>
      restoredNodes.some((node) => node.id === currentSelectedNode)
        ? currentSelectedNode
        : null,
    );

    setSelectedEdge((currentSelectedEdge) =>
      restoredEdges.some((edge) => edge.id === currentSelectedEdge)
        ? currentSelectedEdge
        : null,
    );
  };

  // ================= Graph helpers =================

  const getNode = (id: number) => nodes.find((node) => node.id === id)!;
  const getEdge = (id: number) => edges.find((edge) => edge.id === id)!;

  const updateNode = (
    id: number,
    data: Partial<NodeType>,
    saveHistory = true,
  ) => {
    const newNodes = nodesRef.current.map((node) =>
      node.id === id ? { ...node, ...data } : node,
    );

    setNodes(newNodes);

    if (saveHistory) {
      pushHistory(newNodes, edgesRef.current);
    }
  };

  const updateEdge = (
    id: number,
    data: Partial<EdgeType>,
    saveHistory = true,
  ) => {
    const newEdges = edgesRef.current.map((edge) =>
      edge.id === id ? { ...edge, ...data } : edge,
    );

    setEdges(newEdges);

    if (saveHistory) {
      pushHistory(nodesRef.current, newEdges);
    }
  };

  const changeMode = (
    nextMode: "view" | "move" | "edit" | "connect",
  ) => {
    setMode(nextMode);

    if (nextMode !== "connect") {
      setConnectFrom(null);
    }

    setDragPlaneVisual(null);
  };

  // ================= Add / Reset =================

  const handleAddNode = () => {
    const id = Date.now();

    const newNode: NodeType = {
      id,
      position: [0, 0, 0],
      color: "#ffffff",
      label: "",
      longLabel: "",
      size: 0.3,
      textColor: "#ffffff",
      textSize: 12,
      shape: "sphere",
    };

    const newNodes = [...nodesRef.current, newNode];

    setNodes(newNodes);
    pushHistory(newNodes, edgesRef.current);

    setSelectedNode(id);
    setSelectedEdge(null);
  };

  const handleReset = () => {
    setNodes([]);
    setEdges([]);

    setSelectedNode(null);
    setSelectedEdge(null);
    setConnectFrom(null);
    setDragPlaneVisual(null);

    pushHistory([], []);
  };

  // ================= File Save / Load =================

  const saveToFile = () => {
    const data = JSON.stringify(
      {
        nodes: nodesRef.current,
        edges: edgesRef.current,
      },
      null,
      2,
    );

    const blob = new Blob([data], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  const loadFromFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = JSON.parse(reader.result as string);

        const loadedNodes: NodeType[] = Array.isArray(result.nodes)
          ? result.nodes
          : [];

        const loadedEdges: EdgeType[] = Array.isArray(result.edges)
          ? result.edges
          : [];

        setNodes(loadedNodes);
        setEdges(loadedEdges);

        setSelectedNode(null);
        setSelectedEdge(null);
        setConnectFrom(null);
        setDragPlaneVisual(null);

        pushHistory(loadedNodes, loadedEdges);
      } catch {
        window.alert("graph.json could not be loaded.");
      }
    };

    reader.readAsText(file);

    // Allow selecting the same file again.
    e.target.value = "";
  };

  // ================= Search =================

  const handleSearch = () => {
    const query = search.trim();

    if (!query) {
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
      return;
    }

    const matchedNodeIds = nodesRef.current
      .filter((node) => node.label.includes(query))
      .map((node) => node.id);

    const matchedEdgeIds = edgesRef.current
      .filter((edge) => edge.label.includes(query))
      .map((edge) => edge.id);

    setHighlightedNodes(new Set(matchedNodeIds));
    setHighlightedEdges(new Set(matchedEdgeIds));

    /*
     * Searching also focuses the camera on the first match, the same way
     * a double-click does, so finding a node and looking at it is a
     * single action instead of "search, then go hunt for the highlight".
     */
    if (matchedNodeIds.length > 0) {
      const target = getNode(matchedNodeIds[0]);
      const controls = controlsRef.current;

      if (target && controls) {
        controls.target.set(
          target.position[0],
          target.position[1],
          target.position[2],
        );
        controls.update();
      }
    }

    window.setTimeout(() => {
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
    }, 1500);
  };

  const selectedNodeData =
    selectedNode !== null ? getNode(selectedNode) : null;

  const selectedEdgeData =
    selectedEdge !== null ? getEdge(selectedEdge) : null;

  return (
    <div className="app" data-mode={mode}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <IconBrand />
          </span>
          <div className="brand-text">
            <span className="brand-name">Thought Space</span>
            <span className="brand-sub">3D Concept Mapper</span>
          </div>
        </div>

        <div className="search-group">
          <IconSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search nodes or edges"
          />
        </div>

        <div className="topbar-actions">
          <button onClick={undo} disabled={historyIndex <= 0}>
            <IconUndo />
            <span>Undo</span>
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <IconRedo />
            <span>Redo</span>
          </button>

          <span className="topbar-divider" />

          <button className="primary" onClick={handleAddNode}>
            <IconPlus />
            <span>Add Node</span>
          </button>

          <button onClick={saveToFile}>
            <IconSave />
            <span>Save</span>
          </button>

          <label className="file-button">
            <IconLoad />
            <span>Load</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={loadFromFile}
            />
          </label>

          <button className="ghost" onClick={handleReset}>
            <IconReset />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {showHint && (
        <div className="hint-bar">
          <span>
            Drag to orbit the space · Double-click a node to focus on it ·
            In Move mode, drag a node and scroll to push it in depth
          </span>
          <button
            className="hint-close"
            onClick={dismissHint}
            aria-label="Dismiss hint"
          >
            <IconClose />
          </button>
        </div>
      )}

      <aside className={mode === "edit" ? "edit-panel open" : "edit-panel"}>
        {selectedNodeData ? (
          <>
            <div className="edit-panel-header">
              <span
                className="chip-dot"
                style={{ background: selectedNodeData.color }}
              />
              <h3>Node</h3>
              <button
                className="ghost small"
                onClick={() => setSelectedNode(null)}
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>

            <div className="field">
              <div className="field-label">Label</div>
              <input
                value={selectedNodeData.label}
                onChange={(event) =>
                  updateNode(
                    selectedNodeData.id,
                    {
                      label: event.target.value,
                    },
                    false,
                  )
                }
              />
            </div>

            <div className="field">
              <div className="field-label">Long Label</div>
              <textarea
                value={selectedNodeData.longLabel}
                onChange={(event) =>
                  updateNode(
                    selectedNodeData.id,
                    {
                      longLabel: event.target.value,
                    },
                    false,
                  )
                }
              />
            </div>

            <div className="field">
              <div className="field-label">Color</div>

              <HexColorPicker
                color={selectedNodeData.color}
                onChange={(color) =>
                  updateNode(selectedNodeData.id, { color })
                }
              />
            </div>

            <div className="field">
              <div className="field-label">
                Size: {selectedNodeData.size.toFixed(2)}
              </div>

              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={selectedNodeData.size}
                onChange={(event) =>
                  updateNode(selectedNodeData.id, {
                    size: Number(event.target.value),
                  })
                }
              />
            </div>

            <div className="field">
              <div className="field-label">Shape</div>

              <select
                value={selectedNodeData.shape}
                onChange={(event) =>
                  updateNode(selectedNodeData.id, {
                    shape: event.target.value as NodeType["shape"],
                  })
                }
              >
                <option value="sphere">Sphere</option>
                <option value="box">Box</option>
                <option value="dodecahedron">Dodecahedron</option>
                <option value="cylinder">Cylinder</option>
                <option value="cone">Cone</option>
                <option value="torus">Torus</option>
              </select>
            </div>

            <hr />

            <div className="field">
              <div className="field-label">Text Color</div>

              <HexColorPicker
                color={selectedNodeData.textColor}
                onChange={(textColor) =>
                  updateNode(selectedNodeData.id, { textColor })
                }
              />
            </div>

            <div className="field">
              <div className="field-label">
                Text Size: {selectedNodeData.textSize}
              </div>

              <input
                type="range"
                min={8}
                max={40}
                value={selectedNodeData.textSize}
                onChange={(event) =>
                  updateNode(selectedNodeData.id, {
                    textSize: Number(event.target.value),
                  })
                }
              />
            </div>

            <button
              className="danger-button"
              onClick={() => {
                const newNodes = nodesRef.current.filter(
                  (node) => node.id !== selectedNodeData.id,
                );

                const newEdges = edgesRef.current.filter(
                  (edge) =>
                    edge.from !== selectedNodeData.id &&
                    edge.to !== selectedNodeData.id,
                );

                setNodes(newNodes);
                setEdges(newEdges);

                pushHistory(newNodes, newEdges);

                setSelectedNode(null);
              }}
            >
              Delete Node
            </button>
          </>
        ) : selectedEdgeData ? (
          <>
            <div className="edit-panel-header">
              <span
                className="chip-dot"
                style={{ background: selectedEdgeData.color }}
              />
              <h3>Edge</h3>
              <button
                className="ghost small"
                onClick={() => setSelectedEdge(null)}
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>

            <div className="field">
              <div className="field-label">Label</div>

              <input
                value={selectedEdgeData.label}
                onChange={(event) =>
                  updateEdge(
                    selectedEdgeData.id,
                    {
                      label: event.target.value,
                    },
                    false,
                  )
                }
              />
            </div>

            <div className="field">
              <div className="field-label">Long Label</div>

              <textarea
                value={selectedEdgeData.longLabel}
                onChange={(event) =>
                  updateEdge(
                    selectedEdgeData.id,
                    {
                      longLabel: event.target.value,
                    },
                    false,
                  )
                }
              />
            </div>

            <div className="field">
              <div className="field-label">Color</div>

              <HexColorPicker
                color={selectedEdgeData.color}
                onChange={(color) =>
                  updateEdge(selectedEdgeData.id, { color })
                }
              />
            </div>

            <div className="field">
              <div className="field-label">
                Width: {selectedEdgeData.width}
              </div>

              <input
                type="range"
                min={1}
                max={10}
                value={selectedEdgeData.width}
                onChange={(event) =>
                  updateEdge(selectedEdgeData.id, {
                    width: Number(event.target.value),
                  })
                }
              />
            </div>

            <button
              className="danger-button"
              onClick={() => {
                const newEdges = edgesRef.current.filter(
                  (edge) => edge.id !== selectedEdgeData.id,
                );

                setEdges(newEdges);
                pushHistory(nodesRef.current, newEdges);

                setSelectedEdge(null);
              }}
            >
              Delete Edge
            </button>
          </>
        ) : (
          mode === "edit" && (
            <div className="edit-empty">
              <IconEdit />
              <p>Select a node or an edge in the space to edit it.</p>
            </div>
          )
        )}
      </aside>

      <Canvas
        camera={{
          /*
           * Deliberately off-axis (not a straight-on [0,0,z] view): looking
           * at the scene dead-on along one axis hides depth differences
           * along that axis until the user rotates. An oblique start lets
           * X, Y and Z separation all read at a glance, on the very first
           * frame.
           */
          position: [7, 4.5, 10],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#080b12"]} />
        <fog attach="fog" args={["#080b12", 14, 70]} />

        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} />

        <axesHelper args={[5]} />

        <Grid
          args={[40, 40]}
          position={[0, -4, 0]}
          cellColor="#1b2333"
          sectionColor="#2a3550"
          fadeDistance={45}
          fadeStrength={1.5}
          infiniteGrid
        />

        <GraphScene
          mode={mode}
          nodes={nodes}
          edges={edges}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          connectFrom={connectFrom}
          highlightedNodes={highlightedNodes}
          highlightedEdges={highlightedEdges}
          setSelectedNode={setSelectedNode}
          setSelectedEdge={setSelectedEdge}
          setConnectFrom={setConnectFrom}
          setNodes={setNodes}
          setEdges={setEdges}
          pushHistory={pushHistory}
          setDragPlaneVisual={setDragPlaneVisual}
          controlsRef={controlsRef}
        />

        {dragPlaneVisual && (
          <DragPlaneVisual plane={dragPlaneVisual} />
        )}

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan
          enableZoom
          rotateSpeed={0.8}
          zoomSpeed={0.8}
          panSpeed={0.8}
          minDistance={2}
          maxDistance={100}
        />
      </Canvas>

      {mode === "move" && dragPlaneVisual && (
        <div className="drag-indicator">
          <IconMove />
          <div>
            <strong>Depth</strong>
            <span>Scroll to push / pull</span>
          </div>
        </div>
      )}

      {(selectedNodeData || selectedEdgeData) && mode !== "edit" && (
        <button
          className="selection-chip"
          onClick={() => changeMode("edit")}
        >
          <span
            className="chip-dot"
            style={{
              background: selectedNodeData
                ? selectedNodeData.color
                : selectedEdgeData!.color,
            }}
          />
          <span className="chip-label">
            {selectedNodeData
              ? selectedNodeData.label || "Untitled node"
              : selectedEdgeData!.label || "Untitled edge"}
          </span>
          <span className="chip-action">Edit</span>
        </button>
      )}

      <nav className="mode-dock">
        <div className="mode-buttons">
          <button
            className={mode === "view" ? "mode-btn active" : "mode-btn"}
            onClick={() => changeMode("view")}
          >
            <IconEye />
            <span>View</span>
          </button>

          <button
            className={mode === "move" ? "mode-btn active" : "mode-btn"}
            onClick={() => changeMode("move")}
          >
            <IconMove />
            <span>Move</span>
          </button>

          <button
            className={mode === "edit" ? "mode-btn active" : "mode-btn"}
            onClick={() => changeMode("edit")}
          >
            <IconEdit />
            <span>Edit</span>
          </button>

          <button
            className={mode === "connect" ? "mode-btn active" : "mode-btn"}
            onClick={() => changeMode("connect")}
          >
            <IconLink />
            <span>Connect</span>
          </button>
        </div>

        <div className="mode-hint">
          {mode === "view" &&
            "Drag to orbit · Wheel to zoom · Double-click a node to focus"}
          {mode === "move" &&
            "Drag a node to reposition it · Scroll while dragging to move it in depth"}
          {mode === "edit" && "Select a node or edge to edit its properties"}
          {mode === "connect" &&
            (connectFrom !== null
              ? `Source selected (Node ${connectFrom}) — click a node to connect`
              : "Click a source node, then click a target node")}
        </div>
      </nav>
    </div>
  );
}

type GraphSceneProps = {
  mode: "view" | "move" | "edit" | "connect";
  nodes: NodeType[];
  edges: EdgeType[];
  selectedNode: number | null;
  selectedEdge: number | null;
  connectFrom: number | null;
  highlightedNodes: Set<number>;
  highlightedEdges: Set<number>;
  setSelectedNode: (id: number | null) => void;
  setSelectedEdge: (id: number | null) => void;
  setConnectFrom: (id: number | null) => void;
  setNodes: React.Dispatch<React.SetStateAction<NodeType[]>>;
  setEdges: React.Dispatch<React.SetStateAction<EdgeType[]>>;
  pushHistory: (nodes: NodeType[], edges: EdgeType[]) => void;
  setDragPlaneVisual: (plane: DragPlaneVisual) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

function GraphScene({
  mode,
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  connectFrom,
  highlightedNodes,
  highlightedEdges,
  setSelectedNode,
  setSelectedEdge,
  setConnectFrom,
  setNodes,
  setEdges,
  pushHistory,
  setDragPlaneVisual,
  controlsRef,
}: GraphSceneProps) {
  const { gl } = useThree();

  const dragRef = useRef<{
    nodeId: number;
    plane: THREE.Plane;
    offset: THREE.Vector3;
    moved: boolean;
    moveHandler: (event: PointerEvent) => void;
    upHandler: () => void;
    wheelHandler: (event: WheelEvent) => void;
  } | null>(null);

  const shapesMap: Record<NodeType["shape"], ReactNode> = {
    sphere: <sphereGeometry args={[1, 32, 32]} />,
    box: <boxGeometry args={[1, 1, 1]} />,
    dodecahedron: <dodecahedronGeometry args={[1]} />,
    cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
    cone: <coneGeometry args={[0.5, 1, 32]} />,
    torus: <torusGeometry args={[0.5, 0.2, 16, 100]} />,
  };

  const setOrbitEnabled = (enabled: boolean) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = enabled;
    }
  };

  const endDrag = () => {
    const activeDrag = dragRef.current;

    if (!activeDrag) return;

    window.removeEventListener(
      "pointermove",
      activeDrag.moveHandler,
    );

    window.removeEventListener(
      "pointerup",
      activeDrag.upHandler,
    );

    window.removeEventListener("wheel", activeDrag.wheelHandler);

    dragRef.current = null;

    setDragPlaneVisual(null);
    setOrbitEnabled(true);
  };

  useEffect(() => {
    return () => {
      endDrag();
    };
  }, []);

  const focusOnNode = (node: NodeType) => {
    const controls = controlsRef.current;

    if (!controls) return;

    controls.target.set(
      node.position[0],
      node.position[1],
      node.position[2],
    );

    controls.update();
  };

  const handleMoveStart = (
    event: {
      stopPropagation: () => void;
      pointer: THREE.Vector2;
      camera: THREE.Camera;
      ray: THREE.Ray;
    },
    node: NodeType,
  ) => {
    if (mode !== "move") return;

    event.stopPropagation();

    setSelectedNode(node.id);
    setSelectedEdge(null);

    /*
     * The interaction plane is created from the camera's current viewing
     * direction and passes directly through the node's current position.
     *
     * This means a drag moves the node freely across the two dimensions
     * the user is currently looking at (screen-space), while depth along
     * the camera's view axis is controlled separately via the scroll
     * wheel below — so depth is a first-class, explicit input rather than
     * something only reachable by re-orienting the camera.
     */

    const planeNormal = new THREE.Vector3();
    event.camera.getWorldDirection(planeNormal);

    const nodePosition = new THREE.Vector3(...node.position);

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      nodePosition,
    );

    const initialHit = new THREE.Vector3();

    if (!event.ray.intersectPlane(plane, initialHit)) {
      return;
    }

    const offset = initialHit.clone().sub(nodePosition);

    // The camera must not fight the node while it is being dragged.
    setOrbitEnabled(false);

    const cameraQuaternion = new THREE.Quaternion();
    event.camera.getWorldQuaternion(cameraQuaternion);

    const quaternionArray: [number, number, number, number] = [
      cameraQuaternion.x,
      cameraQuaternion.y,
      cameraQuaternion.z,
      cameraQuaternion.w,
    ];

    const visualPosition = nodePosition.clone();

    setDragPlaneVisual({
      position: [
        visualPosition.x,
        visualPosition.y,
        visualPosition.z,
      ],
      quaternion: quaternionArray,
    });

    const moveHandler = (pointerEvent: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();

      const normalizedX =
        ((pointerEvent.clientX - rect.left) / rect.width) * 2 - 1;

      const normalizedY =
        -((pointerEvent.clientY - rect.top) / rect.height) * 2 + 1;

      const pointer = new THREE.Vector2(
        normalizedX,
        normalizedY,
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, event.camera);

      const hit = new THREE.Vector3();

      if (!raycaster.ray.intersectPlane(plane, hit)) {
        return;
      }

      const nextPosition = hit.sub(offset);

      dragRef.current = {
        ...(dragRef.current as NonNullable<typeof dragRef.current>),
        moved: true,
      };

      setNodes((currentNodes) =>
        currentNodes.map((currentNode) =>
          currentNode.id === node.id
            ? {
                ...currentNode,
                position: [
                  nextPosition.x,
                  nextPosition.y,
                  nextPosition.z,
                ],
              }
            : currentNode,
        ),
      );
    };

    /*
     * Scrolling while dragging pushes/pulls the node along the camera's
     * current view axis. The drag plane is translated by the same amount
     * so the screen-space drag above stays consistent with the node's new
     * depth.
     */
    const DEPTH_SPEED = 0.0015;

    const wheelHandler = (wheelEvent: WheelEvent) => {
      wheelEvent.preventDefault();

      const shift = planeNormal
        .clone()
        .multiplyScalar(-wheelEvent.deltaY * DEPTH_SPEED);

      plane.translate(shift);

      dragRef.current = {
        ...(dragRef.current as NonNullable<typeof dragRef.current>),
        moved: true,
      };

      setNodes((currentNodes) =>
        currentNodes.map((currentNode) =>
          currentNode.id === node.id
            ? {
                ...currentNode,
                position: [
                  currentNode.position[0] + shift.x,
                  currentNode.position[1] + shift.y,
                  currentNode.position[2] + shift.z,
                ],
              }
            : currentNode,
        ),
      );

      visualPosition.add(shift);

      setDragPlaneVisual({
        position: [
          visualPosition.x,
          visualPosition.y,
          visualPosition.z,
        ],
        quaternion: quaternionArray,
      });
    };

    const upHandler = () => {
      const activeDrag = dragRef.current;

      if (!activeDrag) {
        return;
      }

      window.removeEventListener(
        "pointermove",
        activeDrag.moveHandler,
      );

      window.removeEventListener(
        "pointerup",
        activeDrag.upHandler,
      );

      window.removeEventListener("wheel", activeDrag.wheelHandler);

      dragRef.current = null;

      setDragPlaneVisual(null);
      setOrbitEnabled(true);

      /*
       * One complete pointer drag = one History entry.
       *
       * This replaces the previous behavior where every pointermove
       * could create a separate History state.
       */
      if (activeDrag.moved) {
        setNodes((currentNodes) => {
          pushHistory(currentNodes, nodesToEdges(edges));
          return currentNodes;
        });
      }
    };

    dragRef.current = {
      nodeId: node.id,
      plane,
      offset,
      moved: false,
      moveHandler,
      upHandler,
      wheelHandler,
    };

    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", upHandler);
    window.addEventListener("wheel", wheelHandler, { passive: false });
  };

  const nodesToEdges = (currentEdges: EdgeType[]) =>
    currentEdges.map((edge) => ({ ...edge }));

  return (
    <>
      {nodes.map((node) => {
        const isSelected = selectedNode === node.id;
        const isHighlighted = highlightedNodes.has(node.id);
        const isConnectSource = connectFrom === node.id;

        return (
          <mesh
            key={node.id}
            position={node.position}
            scale={[node.size, node.size, node.size]}
            onPointerDown={(event) => {
              if (mode === "move") {
                handleMoveStart(event, node);
              }
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              focusOnNode(node);
            }}
            onClick={(event) => {
              /*
               * Selection and connection are handled on click.
               * This lets View mode keep OrbitControls usable even
               * when the pointer starts over a node.
               */
              if (mode === "connect") {
                event.stopPropagation();

                if (connectFrom === null) {
                  setConnectFrom(node.id);
                  setSelectedNode(node.id);
                  setSelectedEdge(null);
                  return;
                }

                const newEdgeId = Date.now();

                const newEdges = [
                  ...edges,
                  {
                    id: newEdgeId,
                    from: connectFrom,
                    to: node.id,
                    color: "#ffffff",
                    label: "",
                    longLabel: "",
                    width: 2,
                  },
                ];

                setEdges(newEdges);
                pushHistory(nodes, newEdges);

                setConnectFrom(null);

                return;
              }

              if (mode === "edit" || mode === "view") {
                event.stopPropagation();

                setSelectedNode(node.id);
                setSelectedEdge(null);
              }
            }}
          >
            {shapesMap[node.shape]}

            <meshStandardMaterial
              color={
                isHighlighted
                  ? "#ffff00"
                  : isConnectSource
                    ? "#00ff88"
                    : node.color
              }
              emissive={
                isSelected
                  ? isHighlighted
                    ? "#ffff00"
                    : "#ffffff"
                  : "#000000"
              }
              emissiveIntensity={isSelected ? 0.3 : 0}
              roughness={0.65}
              metalness={0.05}
            />

            <Html distanceFactor={10} occlude>
              <div
                className={
                  isSelected
                    ? "node-label selected"
                    : "node-label"
                }
                style={{
                  color: node.textColor,
                  fontSize: node.textSize,
                }}
              >
                {node.label}
              </div>
            </Html>
          </mesh>
        );
      })}

      {edges.map((edge) => {
        const fromNode = nodes.find(
          (node) => node.id === edge.from,
        );

        const toNode = nodes.find(
          (node) => node.id === edge.to,
        );

        if (!fromNode || !toNode) {
          return null;
        }

        const isSelected = selectedEdge === edge.id;
        const isHighlighted = highlightedEdges.has(edge.id);

        return (
          <Line
            key={edge.id}
            points={[fromNode.position, toNode.position]}
            color={
              isHighlighted
                ? "#ffff00"
                : isSelected
                  ? "#ffffff"
                  : edge.color
            }
            lineWidth={isSelected ? edge.width + 1 : edge.width}
            onClick={(event) => {
              event.stopPropagation();

              if (mode === "edit" || mode === "view") {
                setSelectedEdge(edge.id);
                setSelectedNode(null);
              }
            }}
          />
        );
      })}
    </>
  );
}

function DragPlaneVisual({
  plane,
}: {
  plane: NonNullable<DragPlaneVisual>;
}) {
  return (
    <mesh
      position={plane.position}
      quaternion={plane.quaternion}
      renderOrder={-1}
    >
      <planeGeometry args={[14, 14]} />

      <meshBasicMaterial
        color="#5c8dff"
        transparent
        opacity={0.045}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
