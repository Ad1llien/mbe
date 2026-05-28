import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pen, Eraser, StickyNote, Trash2, Undo2, Download, X, Check, Move, Type, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "pen" | "eraser" | "sticky" | "note" | "move" | "sticker";

type Card = {
  id: string;
  kind: "sticky" | "note" | "sticker";
  x: number; y: number;
  text: string;
  color: string;
  editing: boolean;
  size?: number;
};

const PEN_COLORS = ["#ffffff","#f87171","#fb923c","#fbbf24","#a3e635","#34d399","#38bdf8","#818cf8","#e879f9","#000000"];
const STICKY_COLORS = ["#fef08a","#bbf7d0","#bfdbfe","#fecdd3","#e9d5ff","#fed7aa","#99f6e4"];
const SIZES = [2, 4, 8, 16];

const STICKER_PACKS: Record<string, string[]> = {
  "🔥 Reactions": ["🔥","💯","❤️","😍","🤩","😂","😭","🥺","💀","🙏","👏","🤙"],
  "💼 Business":  ["💰","📈","📉","🎯","⚡","🚀","🏆","💡","📌","✅","❌","⚠️"],
  "🌈 Vibes":     ["✨","🌟","💫","🎉","🎊","🎈","🌈","☀️","🌙","⭐","💥","🌊"],
  "😎 Faces":     ["😎","🤔","😤","🥳","🤯","😴","🤑","😏","🙄","🤗","😬","🫡"],
  "👋 Gestures":  ["👍","👎","✌️","🤞","👌","🤌","💪","🫶","🤝","👀","🫠","💅"],
};

interface WhiteboardProps { open: boolean; onClose: () => void; }

export const Whiteboard = ({ open, onClose }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef  = useRef<HTMLDivElement>(null);

  const [tool, setTool]           = useState<Tool>("pen");
  const [color, setColor]         = useState("#ffffff");
  const [size, setSize]           = useState(3);
  const [cards, setCards]         = useState<Card[]>([]);
  const [cardColor, setCardColor] = useState(STICKY_COLORS[0]);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [stickerTab, setStickerTab]   = useState(Object.keys(STICKER_PACKS)[0]);

  const isDrawing = useRef(false);
  const points    = useRef<{ x: number; y: number }[]>([]);
  const history   = useRef<ImageData[]>([]);

  // Drag: stores start coords + live delta. No setCards during drag.
  const drag = useRef<{
    id: string;
    startMX: number; startMY: number; // mouse position at drag start (board-local)
    baseX: number; baseY: number;     // card position at drag start
    dx: number; dy: number;           // current delta
  } | null>(null);

  // Direct refs to card DOM elements for transform-based drag
  const cardEls = useRef<Map<string, HTMLDivElement>>(new Map());

  /* ── canvas init ── */
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const c = canvasRef.current; if (!c) return;
      c.width  = c.offsetWidth;
      c.height = c.offsetHeight;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, c.width, c.height);
      history.current = [];
      snap();
    }, 60);
  }, [open]);

  const snap = () => {
    const c = canvasRef.current; if (!c) return;
    history.current.push(c.getContext("2d")!.getImageData(0, 0, c.width, c.height));
    if (history.current.length > 40) history.current.shift();
  };

  const undo = () => {
    if (history.current.length < 2) return;
    history.current.pop();
    canvasRef.current!.getContext("2d")!.putImageData(history.current[history.current.length - 1], 0, 0);
  };

  /* ── board-local coords ── */
  const toLocal = (clientX: number, clientY: number) => {
    const r = boardRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return { x: clientX - r.left, y: clientY - r.top };
  };

  /* ── canvas drawing ── */
  const onCanvasDown = (e: React.MouseEvent) => {
    if (tool === "sticky" || tool === "note") {
      const p = toLocal(e.clientX, e.clientY);
      setCards(prev => [...prev, {
        id: Date.now().toString(), kind: tool,
        x: p.x - 90, y: p.y - 55,
        text: "", color: tool === "sticky" ? cardColor : "#1c1c2e",
        editing: true,
      }]);
      setTool("move"); return;
    }
    if (tool !== "pen" && tool !== "eraser") return;
    isDrawing.current = true;
    points.current = [toLocal(e.clientX, e.clientY)];
  };

  const doDraw = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const p = toLocal(e.clientX, e.clientY);
    points.current.push(p);
    const pts = points.current;
    if (pts.length < 3) return;
    const i = pts.length - 1;
    const mid  = { x: (pts[i-1].x + pts[i].x) / 2,   y: (pts[i-1].y + pts[i].y) / 2 };
    const prev = { x: (pts[i-2].x + pts[i-1].x) / 2, y: (pts[i-2].y + pts[i-1].y) / 2 };
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mid.x, mid.y);
    ctx.strokeStyle = tool === "eraser" ? "#0a0a0a" : color;
    ctx.lineWidth   = tool === "eraser" ? size * 5 : size;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.stroke();
  };

  /* ── card drag start ── */
  const onCardDown = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    e.stopPropagation();
    const card = cards.find(c => c.id === id)!;
    const m = toLocal(e.clientX, e.clientY);
    drag.current = { id, startMX: m.x, startMY: m.y, baseX: card.x, baseY: card.y, dx: 0, dy: 0 };
    // Give the dragged card a higher z-index
    const el = cardEls.current.get(id);
    if (el) el.style.zIndex = "20";
  };

  /* ── board mousemove: handles BOTH drawing and dragging ── */
  const onBoardMove = (e: React.MouseEvent) => {
    // drawing
    doDraw(e);

    // dragging — pure transform, no React state
    if (!drag.current) return;
    const { id, startMX, startMY } = drag.current;
    const m = toLocal(e.clientX, e.clientY);
    const dx = m.x - startMX;
    const dy = m.y - startMY;
    drag.current.dx = dx;
    drag.current.dy = dy;
    const el = cardEls.current.get(id);
    if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  /* ── release: commit final position once ── */
  const onBoardUp = () => {
    if (isDrawing.current) { isDrawing.current = false; points.current = []; snap(); }

    if (drag.current) {
      const { id, baseX, baseY, dx, dy } = drag.current;
      // Clear transform, commit new position to state
      const el = cardEls.current.get(id);
      if (el) { el.style.transform = ""; el.style.zIndex = "10"; }
      setCards(prev => prev.map(c => c.id === id ? { ...c, x: baseX + dx, y: baseY + dy } : c));
      drag.current = null;
    }
  };

  /* ── stickers ── */
  const placeSticker = (em: string) => {
    setCards(prev => [...prev, {
      id: Date.now().toString(), kind: "sticker",
      x: 120 + Math.random() * 500, y: 80 + Math.random() * 280,
      text: em, color: "transparent", editing: false, size: 52,
    }]);
    setStickerOpen(false);
    setTool("move");
  };

  const clearAll = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, c.width, c.height);
    setCards([]); snap();
  };

  const download = () => {
    const a = document.createElement("a");
    a.download = "whiteboard.png";
    a.href = canvasRef.current!.toDataURL();
    a.click();
  };

  const TOOLS = [
    { id: "pen"    as Tool, icon: Pen,        tip: "Pen"         },
    { id: "eraser" as Tool, icon: Eraser,     tip: "Eraser"      },
    { id: "sticky" as Tool, icon: StickyNote, tip: "Sticky note" },
    { id: "note"   as Tool, icon: Type,       tip: "Note card"   },
    { id: "move"   as Tool, icon: Move,       tip: "Move cards"  },
  ];

  const boardCursor =
    tool === "pen" ? "crosshair" :
    tool === "eraser" ? "cell" :
    tool === "sticky" || tool === "note" ? "copy" : "default";

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent hideClose className="max-w-[98vw] w-[98vw] h-[96vh] p-0 gap-0 overflow-hidden"
        onInteractOutside={e => e.preventDefault()}>
        <div className="flex h-full flex-col">

          {/* ── Toolbar ── */}
          <div className="relative flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0 flex-wrap">
            <div className="flex items-center gap-0.5 p-1 rounded-lg bg-secondary hairline">
              {TOOLS.map(({ id, icon: Icon, tip }) => (
                <button key={id} title={tip} onClick={() => { setTool(id); setStickerOpen(false); }}
                  className={cn("h-8 w-8 rounded-md grid place-items-center transition-all",
                    tool === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80")}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              <button title="Stickers" onClick={() => { setStickerOpen(v => !v); setTool("sticker"); }}
                className={cn("h-8 w-8 rounded-md grid place-items-center transition-all",
                  tool === "sticker" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80")}>
                <Smile className="h-4 w-4" />
              </button>
            </div>

            {tool === "pen" && (
              <div className="flex items-center gap-1">
                {PEN_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
                    style={{ background: c, borderColor: color === c ? "hsl(var(--foreground))" : "transparent" }} />
                ))}
              </div>
            )}

            {tool === "sticky" && (
              <div className="flex items-center gap-1">
                {STICKY_COLORS.map(c => (
                  <button key={c} onClick={() => setCardColor(c)}
                    className="h-6 w-6 rounded border-2 transition-transform hover:scale-110"
                    style={{ background: c, borderColor: cardColor === c ? "#333" : "transparent" }} />
                ))}
                <span className="text-[11px] text-muted-foreground ml-1">Click board to place</span>
              </div>
            )}

            {tool === "note" && (
              <span className="text-[11px] text-muted-foreground">Click board to place a note card</span>
            )}

            {(tool === "pen" || tool === "eraser") && (
              <div className="flex items-center gap-1">
                {SIZES.map(s => (
                  <button key={s} onClick={() => setSize(s)}
                    className={cn("h-8 w-8 rounded-md grid place-items-center transition-all",
                      size === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground")}>
                    <span className="rounded-full bg-current inline-block" style={{ width: s + 2, height: s + 2 }} />
                  </button>
                ))}
              </div>
            )}

            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={undo}><Undo2 className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={download}><Download className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
            </div>

            {stickerOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 rounded-2xl border border-border bg-popover shadow-xl w-80 overflow-hidden">
                <div className="flex overflow-x-auto scrollbar-none border-b border-border bg-secondary/30">
                  {Object.keys(STICKER_PACKS).map(tab => (
                    <button key={tab} onClick={() => setStickerTab(tab)}
                      className={cn("px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0",
                        stickerTab === tab ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-6 gap-1 p-3">
                  {STICKER_PACKS[stickerTab].map(em => (
                    <button key={em} onClick={() => placeSticker(em)}
                      className="text-3xl h-11 w-11 rounded-xl hover:bg-secondary grid place-items-center transition-all hover:scale-125">
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Board — ALL mouse events here so cards don't break mousemove ── */}
          <div
            ref={boardRef}
            className="relative flex-1 overflow-hidden"
            style={{ cursor: boardCursor }}
            onMouseMove={onBoardMove}
            onMouseUp={onBoardUp}
            onMouseLeave={onBoardUp}
          >
            {/* Canvas only needs mousedown for drawing */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              onMouseDown={onCanvasDown}
            />

            {/* Cards */}
            {cards.map(card => (
              <div
                key={card.id}
                ref={el => { if (el) cardEls.current.set(card.id, el); else cardEls.current.delete(card.id); }}
                className="absolute"
                style={{
                  left: card.x,
                  top: card.y,
                  zIndex: 10,
                  cursor: tool === "move" ? "grab" : "default",
                  userSelect: "none",
                  willChange: "transform",
                }}
                onMouseDown={e => tool === "move" && onCardDown(e, card.id)}
              >
                {/* Sticker */}
                {card.kind === "sticker" && (
                  <div className="relative group">
                    <span style={{ fontSize: card.size ?? 48, lineHeight: 1 }}>{card.text}</span>
                    <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-0.5">
                      <button onClick={() => setCards(p => p.map(c => c.id === card.id ? { ...c, size: Math.min(96, (c.size ?? 48) + 12) } : c))}
                        className="h-5 w-5 rounded-full bg-secondary text-[10px] font-bold grid place-items-center border border-border">+</button>
                      <button onClick={() => setCards(p => p.map(c => c.id === card.id ? { ...c, size: Math.max(20, (c.size ?? 48) - 12) } : c))}
                        className="h-5 w-5 rounded-full bg-secondary text-[10px] font-bold grid place-items-center border border-border">−</button>
                      <button onClick={() => setCards(p => p.filter(c => c.id !== card.id))}
                        className="h-5 w-5 rounded-full bg-destructive text-white text-[10px] grid place-items-center">✕</button>
                    </div>
                  </div>
                )}

                {/* Sticky / Note */}
                {(card.kind === "sticky" || card.kind === "note") && (
                  <div className="rounded-xl shadow-xl overflow-hidden"
                    style={{ background: card.color, minWidth: 180, maxWidth: 240 }}>
                    <div className="flex items-center justify-between px-2 py-1.5 gap-1"
                      style={{ background: "rgba(0,0,0,0.13)" }}>
                      {card.kind === "sticky" ? (
                        <div className="flex gap-1 flex-wrap">
                          {STICKY_COLORS.map(c => (
                            <button key={c} className="h-3 w-3 rounded-full hover:scale-125 transition-transform"
                              style={{ background: c }}
                              onClick={() => setCards(p => p.map(s => s.id === card.id ? { ...s, color: c } : s))} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Note</span>
                      )}
                      <div className="flex gap-0.5 ml-auto">
                        <button onClick={() => setCards(p => p.map(c => c.id === card.id ? { ...c, editing: !c.editing } : c))}
                          className="h-5 w-5 rounded grid place-items-center hover:bg-black/10">
                          {card.editing ? <Check className="h-3 w-3" /> : <span className="text-[11px]">✏️</span>}
                        </button>
                        <button onClick={() => setCards(p => p.filter(c => c.id !== card.id))}
                          className="h-5 w-5 rounded grid place-items-center hover:bg-black/10">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {card.editing ? (
                      <textarea autoFocus rows={4}
                        className="w-full p-2.5 text-sm bg-transparent outline-none resize-none"
                        style={{ color: card.kind === "note" ? "#e2e8f0" : "#1a1a1a", minHeight: 80 }}
                        value={card.text}
                        placeholder="Write here…"
                        onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, text: e.target.value } : c))}
                        onBlur={() => setCards(p => p.map(c => c.id === card.id ? { ...c, editing: false } : c))}
                      />
                    ) : (
                      <div className="p-2.5 text-sm whitespace-pre-wrap min-h-[80px]"
                        style={{ color: card.kind === "note" ? "#e2e8f0" : "#1a1a1a" }}
                        onDoubleClick={() => setCards(p => p.map(c => c.id === card.id ? { ...c, editing: true } : c))}>
                        {card.text || <span className="opacity-30 text-xs">Double-click to edit</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
