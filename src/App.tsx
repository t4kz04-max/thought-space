import { useState } from "react";
import type { ChangeEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
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
  shape:
    | "sphere"
    | "box"
    | "dodecahedron"
    | "cylinder"
    | "cone"
    | "torus";
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

const initialNodes: NodeType[] = [
  {
    id: 1,
    position: [-3.4, 1.1, 0],
    color: "#8b7cff",
    label: "Artificial Intelligence",
    longLabel: "Systems that perform tasks associated with human intelligence.",
    size: 0.48,
    textColor: "#ffffff",
    textSize: 14,
    shape: "dodecahedron",
  },
  {
    id: 2,
    position: [0, 2.2, -0.4],
    color: "#4da3ff",
    label: "Machine Learning",
    longLabel: "Methods that allow systems to learn patterns from data.",
    size: 0.42,
    textColor: "#ffffff",
    textSize: 14,
    shape: "sphere",
  },
  {
    id: 3,
    position: [3.2, 1.2, 0.3],
    color: "#34c9a3",
    label: "Deep Learning",
    longLabel: "Machine learning based on layered neural networks.",
    size: 0.44,
    textColor: "#ffffff",
    textSize: 14,
    shape: "sphere",
  },
  {
    id: 4,
    position: [-1.8, -1.4, 0.8],
    color: "#f5a65b",
    label: "Data",
    longLabel: "Information used to train and evaluate models.",
    size: 0.38,
    textColor: "#ffffff",
    textSize: 14,
    shape: "box",
  },
  {
    id: 5,
    position: [1.8, -1.3, -0.7],
    color: "#e66b9a",
    label: "Applications",
    longLabel: "Practical domains where AI technologies are applied.",
    size: 0.4,
    textColor: "#ffffff",
    textSize: 14,
    shape: "torus",
  },
];

const initialEdges: EdgeType[] = [
  {
    id: 1,
    from: 1,
    to: 2,
    color: "#8d96aa",
    label: "includes",
    longLabel: "",
    width: 2,
  },
  {
    id: 2,
    from: 2,
    to: 3,
    color: "#8d96aa",
    label: "develops into",
    longLabel: "",
    width: 2,
  },
  {
    id: 3,
    from: 2,
    to: 4,
    color: "#8d96aa",
    label: "learns from",
    longLabel: "",
    width: 2,
  },
  {
    id: 4,
    from: 3,
    to: 5,
    color: "#8d96aa",
    label: "enables",
    longLabel: "",
    width: 2,
  },
];

export default function App() {
  const [mode, setMode] = useState<"view" | "move" | "edit" | "connect">(
    "view"
  );

  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [connectFrom, setConnectFrom] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(
    new Set()
  );
  const [highlightedEdges, setHighlightedEdges] = useState<Set<number>>(
    new Set()
  );

  const [nodes, setNodes] = useState<NodeType[]>(initialNodes);
  const [edges, setEdges] = useState<EdgeType[]>(initialEdges);

  const [history, setHistory] = useState<GraphState[]>([
    {
      nodes: initialNodes,
      edges: initialEdges,
    },
  ]);

  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (
    newNodes: NodeType[],
    newEdges: EdgeType[]
  ) => {
    const nextHistory = history.slice(0, historyIndex + 1);

    nextHistory.push({
      nodes: newNodes,
      edges: newEdges,
    });

    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;

    const prev = history[historyIndex - 1];

    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIndex(historyIndex - 1);

    setSelectedNode(
      prev.nodes.some((n) => n.id === selectedNode)
        ? selectedNode
        : null
    );

    setSelectedEdge(
      prev.edges.some((e) => e.id === selectedEdge)
        ? selectedEdge
        : null
    );
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;

    const next = history[historyIndex + 1];

    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryIndex(historyIndex + 1);

    setSelectedNode(
      next.nodes.some((n) => n.id === selectedNode)
        ? selectedNode
        : null
    );

    setSelectedEdge(
      next.edges.some((e) => e.id === selectedEdge)
        ? selectedEdge
        : null
    );
  };

  const getNode = (id: number) => nodes.find((n) => n.id === id)!;
  const getEdge = (id: number) => edges.find((e) => e.id === id)!;

  const updateNode = (
    id: number,
    data: Partial<NodeType>,
    saveHistory = true
  ) => {
    const newNodes = nodes.map((n) =>
      n.id === id ? { ...n, ...data } : n
    );

    setNodes(newNodes);

    if (saveHistory) {
      pushHistory(newNodes, edges);
    }
  };

  const updateEdge = (
    id: number,
    data: Partial<EdgeType>,
    saveHistory = true
  ) => {
    const newEdges = edges.map((e) =>
      e.id === id ? { ...e, ...data } : e
    );

    setEdges(newEdges);

    if (saveHistory) {
      pushHistory(nodes, newEdges);
    }
  };

  const handleAddNode = () => {
    const id = Date.now();

    const newNode: NodeType = {
      id,
      position: [0, 0, 0],
      color: "#7c8cff",
      label: "New Concept",
      longLabel: "",
      size: 0.38,
      textColor: "#ffffff",
      textSize: 14,
      shape: "sphere",
    };

    const newNodes = [...nodes, newNode];

    setNodes(newNodes);
    pushHistory(newNodes, edges);

    setMode("edit");
    setSelectedNode(id);
    setSelectedEdge(null);
  };

  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setConnectFrom(null);
    pushHistory([], []);
  };

  const saveToFile = () => {
    const data = JSON.stringify(
      {
        nodes,
        edges,
      },
      null,
      2
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

  const loadFromFile = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = JSON.parse(
          reader.result as string
        );

        const loadedNodes = result.nodes || [];
        const loadedEdges = result.edges || [];

        setNodes(loadedNodes);
        setEdges(loadedEdges);

        pushHistory(
          loadedNodes,
          loadedEdges
        );
      } catch {
        window.alert("Could not load this graph file.");
      }
    };

    reader.readAsText(file);
  };

  const handleSearch = () => {
    const query = search.trim();

    if (!query) {
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
      return;
    }

    const matchedNodeIds = nodes
      .filter((n) =>
        n.label
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .map((n) => n.id);

    const matchedEdgeIds = edges
      .filter((e) =>
        e.label
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .map((e) => e.id);

    setHighlightedNodes(
      new Set(matchedNodeIds)
    );

    setHighlightedEdges(
      new Set(matchedEdgeIds)
    );

    window.setTimeout(() => {
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
    }, 1500);
  };

  const dragPlane = new THREE.Plane(
    new THREE.Vector3(0, 0, 1),
    0
  );

  const shapesMap: Record<
    NodeType["shape"],
    React.ReactNode
  > = {
    sphere: (
      <sphereGeometry args={[1, 32, 32]} />
    ),
    box: (
      <boxGeometry args={[1, 1, 1]} />
    ),
    dodecahedron: (
      <dodecahedronGeometry args={[1]} />
    ),
    cylinder: (
      <cylinderGeometry
        args={[0.5, 0.5, 1, 32]}
      />
    ),
    cone: (
      <coneGeometry
        args={[0.5, 1, 32]}
      />
    ),
    torus: (
      <torusGeometry
        args={[0.5, 0.2, 16, 100]}
      />
    ),
  };

  return (
    <main className="thought-space">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">TS</div>

          <div>
            <div className="brand-name">
              Thought Space
            </div>
            <div className="brand-subtitle">
              3D concept mapping
            </div>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="search-box">
            <span className="search-icon">
              ⌕
            </span>

            <input
              value={search}
              placeholder="Search concepts..."
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            <button
              className="search-button"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>

          <div className="divider" />

          <button
            className="icon-button"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo"
          >
            ↶
          </button>

          <button
            className="icon-button"
            onClick={redo}
            disabled={
              historyIndex >=
              history.length - 1
            }
            title="Redo"
          >
            ↷
          </button>

          <button
            className="primary-button"
            onClick={handleAddNode}
          >
            <span>＋</span>
            Add Node
          </button>

          <button
            className="secondary-button"
            onClick={saveToFile}
          >
            Save
          </button>

          <label className="secondary-button file-button">
            Load
            <input
              type="file"
              accept=".json,application/json"
              onChange={loadFromFile}
            />
          </label>
        </div>
      </header>

      <section className="canvas-area">
        <Canvas
          camera={{
            position: [0, 0, 11],
            fov: 45,
          }}
          dpr={[1, 2]}
        >
          <color
            attach="background"
            args={["#070a12"]}
          />

          <ambientLight intensity={0.7} />

          <directionalLight
            position={[5, 8, 5]}
            intensity={1}
          />

          {nodes.map((node) => (
            <mesh
              key={node.id}
              position={node.position}
              scale={node.size}
              onPointerDown={(e) => {
                e.stopPropagation();

                if (mode === "move") {
                  const ray =
                    new THREE.Raycaster();

                  ray.setFromCamera(
                    e.pointer,
                    e.camera
                  );

                  const hit =
                    new THREE.Vector3();

                  ray.ray.intersectPlane(
                    dragPlane,
                    hit
                  );

                  const offset =
                    hit.sub(
                      new THREE.Vector3(
                        ...node.position
                      )
                    );

                  const move = (
                    ev: PointerEvent
                  ) => {
                    if (mode !== "move")
                      return;

                    const canvas =
                      document.querySelector(
                        ".canvas-area canvas"
                      );

                    if (!canvas) return;

                    const rect =
                      canvas.getBoundingClientRect();

                    const x =
                      ((ev.clientX -
                        rect.left) /
                        rect.width) *
                        2 -
                      1;

                    const y =
                      -(
                        ((ev.clientY -
                          rect.top) /
                          rect.height) *
                          2 -
                        1
                      );

                    ray.setFromCamera(
                      new THREE.Vector2(
                        x,
                        y
                      ),
                      e.camera
                    );

                    const p =
                      new THREE.Vector3();

                    ray.ray.intersectPlane(
                      dragPlane,
                      p
                    );

                    const newPos =
                      p.sub(offset);

                    updateNode(
                      node.id,
                      {
                        position: [
                          newPos.x,
                          newPos.y,
                          0,
                        ],
                      },
                      false
                    );
                  };

                  const up = () => {
                    window.removeEventListener(
                      "pointermove",
                      move
                    );

                    window.removeEventListener(
                      "pointerup",
                      up
                    );
                  };

                  window.addEventListener(
                    "pointermove",
                    move
                  );

                  window.addEventListener(
                    "pointerup",
                    up
                  );

                  return;
                }

                if (mode === "connect") {
                  if (
                    connectFrom === null
                  ) {
                    setConnectFrom(node.id);
                    setSelectedNode(
                      node.id
                    );
                  } else if (
                    connectFrom !== node.id
                  ) {
                    const id = Date.now();

                    const newEdges = [
                      ...edges,
                      {
                        id,
                        from: connectFrom,
                        to: node.id,
                        color: "#8d96aa",
                        label: "related",
                        longLabel: "",
                        width: 2,
                      },
                    ];

                    setEdges(newEdges);

                    pushHistory(
                      nodes,
                      newEdges
                    );

                    setConnectFrom(null);
                  }

                  return;
                }

                setSelectedNode(node.id);
                setSelectedEdge(null);
              }}
            >
              {shapesMap[node.shape]}

              <meshStandardMaterial
                color={
                  highlightedNodes.has(
                    node.id
                  )
                    ? "#ffe66d"
                    : selectedNode ===
                        node.id
                      ? "#ffffff"
                      : node.color
                }
                emissive={
                  selectedNode === node.id
                    ? node.color
                    : "#000000"
                }
                emissiveIntensity={
                  selectedNode === node.id
                    ? 0.35
                    : 0
                }
                roughness={0.35}
                metalness={0.15}
              />

              <Html
                distanceFactor={10}
                center
              >
                <div
                  className={`node-label ${
                    selectedNode === node.id
                      ? "node-label-selected"
                      : ""
                  }`}
                  style={{
                    color: node.textColor,
                    fontSize: node.textSize,
                  }}
                >
                  {node.label}
                </div>
              </Html>
            </mesh>
          ))}

          {edges.map((edge) => {
            const a = getNode(edge.from);
            const b = getNode(edge.to);

            return (
              <group key={edge.id}>
                <Line
                  points={[
                    a.position,
                    b.position,
                  ]}
                  color={
                    highlightedEdges.has(
                      edge.id
                    )
                      ? "#ffe66d"
                      : selectedEdge ===
                          edge.id
                        ? "#ffffff"
                        : edge.color
                  }
                  lineWidth={
                    selectedEdge === edge.id
                      ? edge.width + 1
                      : edge.width
                  }
                  onClick={(e) => {
                    e.stopPropagation();

                    if (
                      mode === "edit"
                    ) {
                      setSelectedEdge(
                        edge.id
                      );
                      setSelectedNode(
                        null
                      );
                    }
                  }}
                />

                {edge.label && (
                  <Html
                    position={[
                      (a.position[0] +
                        b.position[0]) /
                        2,
                      (a.position[1] +
                        b.position[1]) /
                        2,
                      (a.position[2] +
                        b.position[2]) /
                        2,
                    ]}
                    center
                    distanceFactor={10}
                  >
                    <div className="edge-label">
                      {edge.label}
                    </div>
                  </Html>
                )}
              </group>
            );
          })}

          {mode === "view" && (
            <OrbitControls
              enableDamping
              dampingFactor={0.08}
            />
          )}
        </Canvas>

        <div className="canvas-hint">
          <strong>Thought Space</strong>
          <span>
            Place concepts in space.
            Connect them to build relationships.
          </span>
        </div>

        {connectFrom !== null && (
          <div className="connect-status">
            <span className="status-dot" />
            Select another concept to create
            a connection
          </div>
        )}
      </section>

      {mode === "edit" &&
        selectedNode !== null && (
          <aside className="inspector">
            <div className="inspector-header">
              <div>
                <div className="inspector-kicker">
                  SELECTED NODE
                </div>

                <h2>
                  {getNode(selectedNode).label ||
                    "Untitled"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedNode(null)
                }
              >
                ×
              </button>
            </div>

            <label>
              Label
              <input
                value={
                  getNode(selectedNode).label
                }
                onChange={(e) =>
                  updateNode(
                    selectedNode,
                    {
                      label:
                        e.target.value,
                    },
                    false
                  )
                }
              />
            </label>

            <label>
              Description
              <textarea
                value={
                  getNode(selectedNode)
                    .longLabel
                }
                onChange={(e) =>
                  updateNode(
                    selectedNode,
                    {
                      longLabel:
                        e.target.value,
                    },
                    false
                  )
                }
              />
            </label>

            <label>
              Shape
              <select
                value={
                  getNode(selectedNode)
                    .shape
                }
                onChange={(e) =>
                  updateNode(
                    selectedNode,
                    {
                      shape:
                        e.target.value as NodeType["shape"],
                    }
                  )
                }
              >
                <option value="sphere">
                  Sphere
                </option>
                <option value="box">
                  Box
                </option>
                <option value="dodecahedron">
                  Dodecahedron
                </option>
                <option value="cylinder">
                  Cylinder
                </option>
                <option value="cone">
                  Cone
                </option>
                <option value="torus">
                  Torus
                </option>
              </select>
            </label>

            <label>
              Size
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={
                  getNode(selectedNode)
                    .size
                }
                onChange={(e) =>
                  updateNode(
                    selectedNode,
                    {
                      size: Number(
                        e.target.value
                      ),
                    }
                  )
                }
              />
            </label>

            <div className="color-section">
              <div>Color</div>

              <HexColorPicker
                color={
                  getNode(selectedNode)
                    .color
                }
                onChange={(color) =>
                  updateNode(
                    selectedNode,
                    { color }
                  )
                }
              />
            </div>

            <button
              className="danger-button"
              onClick={() => {
                const newNodes =
                  nodes.filter(
                    (n) =>
                      n.id !== selectedNode
                  );

                const newEdges =
                  edges.filter(
                    (e) =>
                      e.from !==
                        selectedNode &&
                      e.to !== selectedNode
                  );

                setNodes(newNodes);
                setEdges(newEdges);

                pushHistory(
                  newNodes,
                  newEdges
                );

                setSelectedNode(null);
              }}
            >
              Delete Node
            </button>
          </aside>
        )}

      {mode === "edit" &&
        selectedEdge !== null && (
          <aside className="inspector">
            <div className="inspector-header">
              <div>
                <div className="inspector-kicker">
                  SELECTED EDGE
                </div>

                <h2>
                  {getEdge(selectedEdge)
                    .label ||
                    "Relationship"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedEdge(null)
                }
              >
                ×
              </button>
            </div>

            <label>
              Relationship
              <input
                value={
                  getEdge(selectedEdge)
                    .label
                }
                onChange={(e) =>
                  updateEdge(
                    selectedEdge,
                    {
                      label:
                        e.target.value,
                    },
                    false
                  )
                }
              />
            </label>

            <label>
              Description
              <textarea
                value={
                  getEdge(selectedEdge)
                    .longLabel
                }
                onChange={(e) =>
                  updateEdge(
                    selectedEdge,
                    {
                      longLabel:
                        e.target.value,
                    },
                    false
                  )
                }
              />
            </label>

            <label>
              Width
              <input
                type="range"
                min="1"
                max="10"
                value={
                  getEdge(selectedEdge)
                    .width
                }
                onChange={(e) =>
                  updateEdge(
                    selectedEdge,
                    {
                      width: Number(
                        e.target.value
                      ),
                    }
                  )
                }
              />
            </label>

            <button
              className="danger-button"
              onClick={() => {
                const newEdges =
                  edges.filter(
                    (e) =>
                      e.id !== selectedEdge
                  );

                setEdges(newEdges);

                pushHistory(
                  nodes,
                  newEdges
                );

                setSelectedEdge(null);
              }}
            >
              Delete Relationship
            </button>
          </aside>
        )}

      <nav className="modebar">
        <div className="mode-intro">
          <div className="mode-kicker">
            CURRENT MODE
          </div>

          <strong>
            {mode === "view" && "Explore"}
            {mode === "move" && "Move concepts"}
            {mode === "edit" && "Edit"}
            {mode === "connect" &&
              "Connect concepts"}
          </strong>
        </div>

        <div className="mode-buttons">
          <button
            className={
              mode === "view"
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() => {
              setMode("view");
              setConnectFrom(null);
            }}
          >
            <span>◉</span>
            View
          </button>

          <button
            className={
              mode === "move"
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() => {
              setMode("move");
              setConnectFrom(null);
            }}
          >
            <span>✥</span>
            Move
          </button>

          <button
            className={
              mode === "edit"
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() => {
              setMode("edit");
              setConnectFrom(null);
            }}
          >
            <span>✎</span>
            Edit
          </button>

          <button
            className={
              mode === "connect"
                ? "mode-button active"
                : "mode-button"
            }
            onClick={() => {
              setMode("connect");
              setSelectedEdge(null);
            }}
          >
            <span>⌁</span>
            Connect
          </button>
        </div>

        <button
          className="reset-button"
          onClick={handleReset}
        >
          Reset space
        </button>
      </nav>
    </main>
  );
}