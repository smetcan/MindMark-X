"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { BookmarkData } from "./bookmark-card";

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function MindmapCanvas({
  bookmarks,
  categories,
}: {
  bookmarks: BookmarkData[];
  categories: Category[];
}) {
  const [selectedDrawerTitle, setSelectedDrawerTitle] = useState<string | null>(null);
  const [drawerBookmarks, setDrawerBookmarks] = useState<BookmarkData[]>([]);

  // Build graph nodes & edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Group bookmarks by category
    const catMap = new Map<string, BookmarkData[]>();
    for (const b of bookmarks) {
      const catId = b.categoryId || "general";
      if (!catMap.has(catId)) catMap.set(catId, []);
      catMap.get(catId)!.push(b);
    }

    // Circular layout for categories
    const activeCategories = categories.filter((c) => (catMap.get(c.id)?.length || 0) > 0);
    const catRadius = 380;
    const catAngleStep = activeCategories.length > 0 ? (2 * Math.PI) / activeCategories.length : 0;

    // Center root hub
    nodes.push({
      id: "root-hub",
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: `X Bookmarks (${bookmarks.length})` },
      style: {
        background: "#18181b",
        color: "#ffffff",
        border: "2px solid #3b82f6",
        borderRadius: "9999px",
        padding: "16px 24px",
        fontWeight: "700",
        fontSize: "14px",
        boxShadow: "0 0 30px rgba(59, 130, 246, 0.25)",
      },
    });

    activeCategories.forEach((cat, idx) => {
      const angle = idx * catAngleStep;
      const catX = Math.cos(angle) * catRadius;
      const catY = Math.sin(angle) * catRadius;

      const catBookmarks = catMap.get(cat.id) || [];

      // Category Node
      nodes.push({
        id: `cat-${cat.id}`,
        type: "default",
        position: { x: catX, y: catY },
        data: {
          label: `${cat.name} (${catBookmarks.length})`,
          catId: cat.id,
          catName: cat.name,
        },
        style: {
          background: "#18181b",
          color: cat.color,
          border: `2px solid ${cat.color}`,
          borderRadius: "16px",
          padding: "12px 20px",
          fontWeight: "600",
          fontSize: "13px",
          cursor: "pointer",
          boxShadow: `0 4px 20px ${cat.color}25`,
        },
      });

      // Edge from Root to Category
      edges.push({
        id: `e-root-cat-${cat.id}`,
        source: "root-hub",
        target: `cat-${cat.id}`,
        style: { stroke: cat.color, strokeWidth: 2, opacity: 0.6 },
        animated: true,
      });

      // Top tags within this category
      const tagFreq = new Map<string, BookmarkData[]>();
      for (const b of catBookmarks) {
        if (b.tags) {
          try {
            const tags: string[] = JSON.parse(b.tags);
            for (const t of tags) {
              if (!tagFreq.has(t)) tagFreq.set(t, []);
              tagFreq.get(t)!.push(b);
            }
          } catch { /* ignore */ }
        }
      }

      // Take top 4 tags per category
      const topTags = Array.from(tagFreq.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 4);

      const tagRadius = 190;
      const tagAngleSpread = 0.8; // radians
      const tagAngleStart = angle - tagAngleSpread / 2;
      const tagAngleStep = topTags.length > 1 ? tagAngleSpread / (topTags.length - 1) : 0;

      topTags.forEach(([tag, tagBms], tIdx) => {
        const tAngle = topTags.length === 1 ? angle : tagAngleStart + tIdx * tagAngleStep;
        const tagX = catX + Math.cos(tAngle) * tagRadius;
        const tagY = catY + Math.sin(tAngle) * tagRadius;

        const tagNodeId = `tag-${cat.id}-${tag}`;

        nodes.push({
          id: tagNodeId,
          type: "default",
          position: { x: tagX, y: tagY },
          data: {
            label: `#${tag} (${tagBms.length})`,
            tagName: tag,
          },
          style: {
            background: "#27272a",
            color: "#e4e4e7",
            border: "1px solid #3f3f46",
            borderRadius: "9999px",
            padding: "6px 14px",
            fontSize: "11px",
            cursor: "pointer",
          },
        });

        // Edge from Category to Tag
        edges.push({
          id: `e-cat-${cat.id}-${tag}`,
          source: `cat-${cat.id}`,
          target: tagNodeId,
          style: { stroke: cat.color, strokeWidth: 1.2, strokeDasharray: "4 4", opacity: 0.5 },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [bookmarks, categories]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click to open drawer
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === "root-hub") {
        setSelectedDrawerTitle("Tüm Yer İmleri");
        setDrawerBookmarks(bookmarks);
      } else if (node.id.startsWith("cat-")) {
        const catId = node.data?.catId as string;
        const catName = node.data?.catName as string;
        const filtered = bookmarks.filter((b) => (b.categoryId || "general") === catId);
        setSelectedDrawerTitle(`${catName} (${filtered.length})`);
        setDrawerBookmarks(filtered);
      } else if (node.id.startsWith("tag-")) {
        const tagName = node.data?.tagName as string;
        const filtered = bookmarks.filter((b) => {
          if (!b.tags) return false;
          try {
            return (JSON.parse(b.tags) as string[]).includes(tagName);
          } catch {
            return false;
          }
        });
        setSelectedDrawerTitle(`#${tagName} (${filtered.length})`);
        setDrawerBookmarks(filtered);
      }
    },
    [bookmarks]
  );

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
        <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-200" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-zinc-900/90 !border-zinc-800 rounded-xl"
          maskColor="rgba(9, 9, 11, 0.7)"
        />
      </ReactFlow>

      {/* Floating Instruction badge */}
      <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-300 pointer-events-none shadow-lg">
        💡 Herhangi bir kategori veya etiket düğümüne tıklayarak ilgili tweetleri açabilirsiniz.
      </div>

      {/* Side Drawer for matching tweets */}
      {selectedDrawerTitle && (
        <div className="absolute top-0 right-0 w-96 max-w-full h-full bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 flex flex-col z-50 shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100 text-sm">{selectedDrawerTitle}</h3>
            <button
              onClick={() => setSelectedDrawerTitle(null)}
              className="p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {drawerBookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-200 truncate">{bm.authorName}</span>
                  <a
                    href={bm.tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-blue-400"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
                <p className="text-zinc-400 whitespace-pre-line line-clamp-3">{bm.text}</p>
                {bm.summary && (
                  <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[11px] text-blue-200/90 flex items-start gap-1.5">
                    <Sparkles size={12} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>{bm.summary}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}