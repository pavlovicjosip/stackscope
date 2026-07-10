"use client";

import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { Lesson, PlaybackStep } from "@/content/types";

type MapProps = {
  lesson: Lesson;
  step: PlaybackStep;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  reduceMotion: boolean;
  visibleNodeIds?: ReadonlySet<string>;
  visibleEdgeIds?: ReadonlySet<string>;
};

export function SystemMap({ lesson, step, selectedId, onSelect, reduceMotion, visibleNodeIds, visibleEdgeIds }: MapProps) {
  const nodes: Node[] = lesson.nodes.filter((item) => !visibleNodeIds || visibleNodeIds.has(item.id)).map((item) => {
    const active = step.activeNodeIds.includes(item.id);
    return {
      id: item.id,
      position: item.position,
      data: { label: <><span className="flow-node__kind">{item.kind}</span><strong>{item.label}</strong></> },
      draggable: false,
      selectable: true,
      className: `flow-node flow-node--${item.kind}${active ? " is-active" : ""}${selectedId === item.id ? " is-selected" : ""}`,
      ariaLabel: `${item.label}, ${item.kind}${active ? ", active in current step" : ""}`,
    };
  });
  const edges: Edge[] = lesson.edges.filter((item) => !visibleEdgeIds || visibleEdgeIds.has(item.id)).map((item) => {
    const active = step.activeEdgeIds.includes(item.id);
    return {
      ...item,
      type: "smoothstep",
      animated: active && !reduceMotion,
      selectable: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      className: `flow-edge flow-edge--${item.kind}${active ? " is-active" : ""}${selectedId === item.id ? " is-selected" : ""}`,
      labelStyle: { fill: "#a5adbc", fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: "#111721", fillOpacity: 0.9 },
    };
  });

  return (
    <div
      className="system-map"
      data-testid="system-map"
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const target = event.target as HTMLElement;
        const element = target.closest<HTMLElement>(".react-flow__node, .react-flow__edge");
        const id = element?.dataset.id;
        if (!id) return;
        event.preventDefault();
        onSelect(id);
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesConnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.45}
        maxZoom={1.6}
        onNodeClick={(_, item) => onSelect(item.id)}
        onEdgeClick={(_, item) => onSelect(item.id)}
        onPaneClick={() => onSelect(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#26303d" gap={24} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor="#647386"
          nodeStrokeColor="#a8b4c2"
          maskColor="rgba(7, 10, 15, .74)"
          style={{ background: "#0c1219" }}
        />
      </ReactFlow>
    </div>
  );
}
