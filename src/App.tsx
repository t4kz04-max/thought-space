import { useState } from "react";
import type { ChangeEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { HexColorPicker } from "react-colorful";

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

export default function App() {
  const [mode, setMode] = useState<"view" | "move" | "edit" | "connect">("view");
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [connectFrom, setConnectFrom] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<number>>(new Set());

  const [nodes, setNodes] = useState<NodeType[]>([
    { id: 1, position: [-2, 0, 0], color: "#ff8a00", label: "A", longLabel: "", size: 0.3, textColor: "#fff", textSize: 12, shape: "sphere" },
    { id: 2, position: [2, 0, 0], color: "#00aaff", label: "B", longLabel: "", size: 0.3, textColor: "#fff", textSize: 12, shape: "sphere" },
  ]);

  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [history, setHistory] = useState<GraphState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // ================= History =================
  const pushHistory = (newNodes: NodeType[], newEdges: EdgeType[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIndex(historyIndex - 1);
    setSelectedNode(prev.nodes.some(n => n.id === selectedNode) ? selectedNode : null);
    setSelectedEdge(prev.edges.some(e => e.id === selectedEdge) ? selectedEdge : null);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryIndex(historyIndex + 1);
    setSelectedNode(next.nodes.some(n => n.id === selectedNode) ? selectedNode : null);
    setSelectedEdge(next.edges.some(e => e.id === selectedEdge) ? selectedEdge : null);
  };

  const getNode = (id: number) => nodes.find(n => n.id === id)!;
  const getEdge = (id: number) => edges.find(e => e.id === id)!;

  const updateNode = (id: number, data: Partial<NodeType>, saveHistory = true) => {
    const newNodes = nodes.map(n => (n.id === id ? { ...n, ...data } : n));
    setNodes(newNodes);
    if (saveHistory) pushHistory(newNodes, edges);
  };

  const updateEdge = (id: number, data: Partial<EdgeType>, saveHistory = true) => {
    const newEdges = edges.map(e => (e.id === id ? { ...e, ...data } : e));
    setEdges(newEdges);
    if (saveHistory) pushHistory(nodes, newEdges);
  };

  const handleAddNode = () => {
    const id = Date.now();
    const newNode: NodeType = {
      id, position: [0, 0, 0], color: "#fff", label: "", longLabel: "", size: 0.3,
      textColor: "#fff", textSize: 12, shape: "sphere"
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    pushHistory(newNodes, edges);
  };

  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setConnectFrom(null);
    pushHistory([], []);
  };

  // ================= File Save/Load =================
  const saveToFile = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
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
      const result = JSON.parse(reader.result as string);
      setNodes(result.nodes || []);
      setEdges(result.edges || []);
      pushHistory(result.nodes || [], result.edges || []);
    };
    reader.readAsText(file);
  };

  // ================= Search =================
  const handleSearch = () => {
    if (!search) return;

    // ノード検索
    const matchedNodeIds = nodes.filter(n => n.label.includes(search)).map(n => n.id);
    // エッジ検索
    const matchedEdgeIds = edges.filter(e => e.label.includes(search)).map(e => e.id);

    setHighlightedNodes(new Set(matchedNodeIds));
    setHighlightedEdges(new Set(matchedEdgeIds));

    setTimeout(() => {
      setHighlightedNodes(new Set());
      setHighlightedEdges(new Set());
    }, 1500);
  };

  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const shapesMap: Record<NodeType["shape"], React.ReactNode> = {
    sphere: <sphereGeometry args={[1, 32, 32]} />,
    box: <boxGeometry args={[1, 1, 1]} />,
    dodecahedron: <dodecahedronGeometry args={[1]} />,
    cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
    cone: <coneGeometry args={[0.5, 1, 32]} />,
    torus: <torusGeometry args={[0.5, 0.2, 16, 100]} />,
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div style={topPanel}>
        <div>Search</div>
        <input value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={handleSearch}>Go</button>

        <hr />
        <div>Mode</div>
        <button onClick={() => setMode("view")}>View</button>
        <button onClick={() => setMode("move")}>Move</button>
        <button onClick={() => setMode("edit")}>Edit</button>
        <button onClick={() => setMode("connect")}>Connect</button>

        <hr />
        <button onClick={handleAddNode}>Add Node</button>
        <button onClick={saveToFile}>Save</button>
        <input type="file" onChange={loadFromFile} />
        <button onClick={handleReset}>Reset</button>

        <hr />
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
      </div>

      {/* ================= NODE EDIT ================= */}
      {mode === "edit" && selectedNode && (
        <div style={panelStyle}>
          <h3>Node</h3>
          <div>Label</div>
          <input value={getNode(selectedNode).label} onChange={e => updateNode(selectedNode, { label: e.target.value }, false)} />
          <div>Long Label</div>
          <textarea value={getNode(selectedNode).longLabel} onChange={e => updateNode(selectedNode, { longLabel: e.target.value }, false)} />
          <div>Color</div>
          <HexColorPicker color={getNode(selectedNode).color} onChange={c => updateNode(selectedNode, { color: c })} />
          <div>Size</div>
          <input type="range" min={0.1} max={1} step={0.05} value={getNode(selectedNode).size} onChange={e => updateNode(selectedNode, { size: Number(e.target.value) })} />
          <div>Shape</div>
          <select value={getNode(selectedNode).shape} onChange={e => updateNode(selectedNode, { shape: e.target.value as NodeType["shape"] })}>
            <option value="sphere">Sphere</option>
            <option value="box">Box</option>
            <option value="dodecahedron">Dodecahedron</option>
            <option value="cylinder">Cylinder</option>
            <option value="cone">Cone</option>
            <option value="torus">Torus</option>
          </select>
          <hr />
          <div>Text Color</div>
          <HexColorPicker color={getNode(selectedNode).textColor} onChange={c => updateNode(selectedNode, { textColor: c })} />
          <div>Text Size</div>
          <input type="range" min={8} max={40} value={getNode(selectedNode).textSize} onChange={e => updateNode(selectedNode, { textSize: Number(e.target.value) })} />
          <hr />
          <button onClick={() => {
            const newNodes = nodes.filter(n => n.id !== selectedNode);
            const newEdges = edges.filter(e => e.from !== selectedNode && e.to !== selectedNode);
            setNodes(newNodes);
            setEdges(newEdges);
            pushHistory(newNodes, newEdges);
            setSelectedNode(null);
          }}>Delete Node</button>
        </div>
      )}

      {/* ================= EDGE EDIT ================= */}
      {mode === "edit" && selectedEdge && (
        <div style={panelStyle}>
          <h3>Edge</h3>
          <div>Label</div>
          <input value={getEdge(selectedEdge).label} onChange={e => updateEdge(selectedEdge, { label: e.target.value }, false)} />
          <div>Long Label</div>
          <textarea value={getEdge(selectedEdge).longLabel} onChange={e => updateEdge(selectedEdge, { longLabel: e.target.value }, false)} />
          <div>Color</div>
          <HexColorPicker color={getEdge(selectedEdge).color} onChange={c => updateEdge(selectedEdge, { color: c })} />
          <div>Width</div>
          <input type="range" min={1} max={10} value={getEdge(selectedEdge).width} onChange={e => updateEdge(selectedEdge, { width: Number(e.target.value) })} />
          <hr />
          <button onClick={() => {
            const newEdges = edges.filter(e => e.id !== selectedEdge);
            setEdges(newEdges);
            pushHistory(nodes, newEdges);
            setSelectedEdge(null);
          }}>Delete Edge</button>
        </div>
      )}

      {/* ================= 3D ================= */}
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.6} />
        <primitive object={new THREE.AxesHelper(5)} />

        {nodes.map(node => (
          <mesh
            key={node.id}
            position={node.position}
            onPointerDown={e => {
              e.stopPropagation();

              // ドラッグ処理
              const ray = new THREE.Raycaster();
              ray.setFromCamera(e.pointer, e.camera);
              const hit = new THREE.Vector3();
              ray.ray.intersectPlane(dragPlane, hit);
              const offset = hit.sub(new THREE.Vector3(...node.position));

              const move = (ev: PointerEvent) => {
                if (mode !== "move") return;
                const rect = (ev.target as HTMLElement).getBoundingClientRect();
                const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
                const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
                ray.setFromCamera(new THREE.Vector2(x, y), e.camera);
                const p = new THREE.Vector3();
                ray.ray.intersectPlane(dragPlane, p);
                const newPos = p.sub(offset);
                updateNode(node.id, { position: [newPos.x, newPos.y, 0] });
              };

              const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };

              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);

              // クリック処理
              if (mode !== "move") {
                if (mode === "connect") {
                  if (connectFrom === null) setConnectFrom(node.id);
                  else {
                    const id = Date.now();
                    const newEdges = [...edges, { id, from: connectFrom, to: node.id, color: "#fff", label: "", longLabel: "", width: 2 }];
                    setEdges(newEdges);
                    pushHistory(nodes, newEdges);
                    setConnectFrom(null);
                  }
                } else {
                  setSelectedNode(node.id);
                  setSelectedEdge(null);
                }
              }
            }}
          >
            {shapesMap[node.shape]}
            <meshStandardMaterial color={highlightedNodes.has(node.id) ? "#ffff00" : node.color} />
            <Html distanceFactor={10}>
              <div style={{ color: node.textColor, fontSize: node.textSize }}>{node.label}</div>
            </Html>
          </mesh>
        ))}

        {edges.map(edge => {
          const a = getNode(edge.from);
          const b = getNode(edge.to);
          return (
            <Line
              key={edge.id}
              points={[a.position, b.position]}
              color={highlightedEdges.has(edge.id) ? "#ffff00" : edge.color}
              lineWidth={edge.width}
              onClick={e => {
                e.stopPropagation();
                setSelectedEdge(edge.id);
                setSelectedNode(null);
              }}
            />
          );
        })}

        {mode === "view" && <OrbitControls />}
      </Canvas>
    </div>
  );
}

const topPanel: React.CSSProperties = {
  position: "absolute", top: 10, left: 10,
  background: "#0008", padding: 10, color: "white", zIndex: 10
};

const panelStyle: React.CSSProperties = {
  position: "absolute", right: 10, top: 10,
  background: "white", padding: 10, zIndex: 10, width: 240
};
