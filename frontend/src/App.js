import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
);

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

// ── Icons (inline SVG) ──────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const FilterIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const ImageIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity="0.4"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = ({ isFiltered }) => (
  <div className="empty-state">
    <div className="empty-icon">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </div>
    <p className="empty-title">
      {isFiltered ? "Sin resultados" : "Catálogo vacío"}
    </p>
    <p className="empty-sub">
      {isFiltered
        ? "Intenta con otros filtros"
        : "Aún no hay productos en el catálogo"}
    </p>
  </div>
);

// ── Shoe Card ───────────────────────────────────────────────────────────────
const ShoeCard = ({ shoe, onClick, isAdmin, onEdit, onDelete }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const imgWrapRef = useRef();
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const lastTap = useRef(0);
  const lastTouchDist = useRef(null);
  const moved = useRef(false);
  const [activeVariant, setActiveVariant] = useState(0);
  const variants = shoe.variants || [];
  const activeImg = variants[activeVariant]?.main_image || shoe.image_base64;

  const clamp = (x, y, z) => {
    const el = imgWrapRef.current;
    if (!el) return { x, y };
    const maxX = (el.offsetWidth * (z - 1)) / 2;
    const maxY = (el.offsetHeight * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const applyZoom = (next) => {
    const clamped = clamp(posRef.current.x, posRef.current.y, next);
    zoomRef.current = next;
    posRef.current = clamped;
    setZoom(next);
    setPos(clamped);
  };

  const reset = () => {
    zoomRef.current = 1;
    posRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPos({ x: 0, y: 0 });
  };

  // ── Wheel (desktop) ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      applyZoom(Math.min(3, Math.max(1, zoomRef.current + delta)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Mouse drag en window (desktop) ────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      moved.current = true;
      const c = clamp(
        e.clientX - dragStart.current.x,
        e.clientY - dragStart.current.y,
        zoomRef.current,
      );
      posRef.current = c;
      setPos({ ...c });
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onMouseDown = (e) => {
    if (zoomRef.current <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    moved.current = false;
    dragging.current = true;
    dragStart.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  };

  // ── Touch (móvil) ─────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Doble tap → zoom
      const now = Date.now();
      if (now - lastTap.current < 300) {
        e.preventDefault();
        if (zoomRef.current > 1) reset();
        else applyZoom(2);
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;

      // Drag si hay zoom
      if (zoomRef.current > 1) {
        e.preventDefault();
        dragging.current = true;
        moved.current = false;
        dragStart.current = {
          x: e.touches[0].clientX - posRef.current.x,
          y: e.touches[0].clientY - posRef.current.y,
        };
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist.current) {
        const delta = (dist - lastTouchDist.current) * 0.015;
        applyZoom(Math.min(3, Math.max(1, zoomRef.current + delta)));
      }
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && dragging.current) {
      e.preventDefault();
      moved.current = true;
      const c = clamp(
        e.touches[0].clientX - dragStart.current.x,
        e.touches[0].clientY - dragStart.current.y,
        zoomRef.current,
      );
      posRef.current = c;
      setPos({ ...c });
    }
  };

  const onTouchEnd = (e) => {
    lastTouchDist.current = null;
    dragging.current = false;
  };

  const handleCardClick = (e) => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    if (zoomRef.current > 1) {
      reset();
      return;
    }
    onClick(activeVariant);
  };

  return (
    <article className="shoe-card" onClick={handleCardClick}>
      <div
        ref={imgWrapRef}
        className="card-image-wrap"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ overflow: "hidden", cursor: zoom > 1 ? "grab" : "pointer" }}
      >
        {activeImg ? (
          <>
            {!imgLoaded && <div className="img-skeleton" />}
            <img
              src={activeImg}
              alt={shoe.name}
              className={`card-img ${imgLoaded ? "loaded" : ""}`}
              onLoad={() => setImgLoaded(true)}
              draggable={false}
              style={{
                transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)`,
                transition: dragging.current ? "none" : "transform 0.15s ease",
                userSelect: "none",
                pointerEvents: "none",
                willChange: "transform",
              }}
            />
          </>
        ) : (
          <div className="card-no-img">
            <ImageIcon />
          </div>
        )}

        {zoom > 1 && (
          <button
            className="card-zoom-reset"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            title="Restablecer"
          >
            ⤢
          </button>
        )}

        {shoe.category && <span className="card-badge">{shoe.category}</span>}
        {isAdmin && (
          <div
            className="card-admin-actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="card-action-btn edit"
              onClick={() => onEdit(shoe)}
              title="Editar"
            >
              <EditIcon />
            </button>
            <button
              className="card-action-btn delete"
              onClick={() => onDelete(shoe)}
              title="Eliminar"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      <div className="card-body">
        <p className="card-brand">{shoe.brand || "Sin marca"}</p>
        <h3 className="card-name">{shoe.name || "Sin nombre"}</h3>
        {variants.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 5,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {variants.map((v, i) => (
              <button
                key={v.id || i}
                title={v.color}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVariant(i);
                  setImgLoaded(false);
                }}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                  background: colorToHex(v.color),
                  outline:
                    activeVariant === i
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  outlineOffset: 2,
                  transition: "outline 0.15s",
                }}
              />
            ))}
          </div>
        )}
        <div className="card-footer">
          {/* {shoe.price > 0 && (
            <span className="card-price">
              ${Number(shoe.price).toLocaleString("es-CO")}
            </span>
          )} */}
          {shoe.color && <ColorDot color={shoe.color} />}
        </div>
      </div>
    </article>
  );
};

const COLOR_MAP = {
  negro: "#1a1a1a",
  blanco: "#f5f5f5",
  rojo: "#e53935",
  azul: "#1e88e5",
  verde: "#43a047",
  amarillo: "#fdd835",
  cafe: "#795548",
  gris: "#9e9e9e",
  naranja: "#fb8c00",
  morado: "#8e24aa",
  rosado: "#e91e8c",
  beige: "#d7c4a3",
  dorado: "#c9a96e",
  plateado: "#bdbdbd",
  celeste: "#4fc3f7",
  vinotinto: "#880e4f",
};

function colorToHex(color) {
  const k = color?.toLowerCase().trim();
  return COLOR_MAP[k] || "#888";
}

// Supports single colors and combinations like "negro/cafe" or "blanco/negro"
function ColorDot({ color }) {
  const parts = color
    .split(/[\/\-\s*y\s*]+/i)
    .map((c) => c.trim())
    .filter(Boolean);
  const colors = parts.map(colorToHex);

  if (colors.length === 1) {
    return (
      <span
        className="card-color-dot"
        title={color}
        style={{ background: colors[0] }}
      />
    );
  }

  // Two-tone: split diagonally
  const c1 = colors[0];
  const c2 = colors[1];
  return (
    <span
      className="card-color-dot"
      title={color}
      style={{ background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` }}
    />
  );
}

// ── Full Image Viewer ────────────────────────────────────────────────────────
const FullImageViewer = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const wrapRef = useRef();
  const lastTouchDist = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      const next = Math.min(5, Math.max(1, scaleRef.current + delta));
      scaleRef.current = next;
      setScale(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const nx = e.clientX - dragStart.current.x;
      const ny = e.clientY - dragStart.current.y;
      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    } else {
      dragging.current = true;
      dragStart.current = { x: e.touches[0].clientX - posRef.current.x, y: e.touches[0].clientY - posRef.current.y };
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist.current) {
        const delta = (dist - lastTouchDist.current) * 0.015;
        const next = Math.min(5, Math.max(1, scaleRef.current + delta));
        scaleRef.current = next;
        setScale(next);
      }
      lastTouchDist.current = dist;
    } else if (dragging.current) {
      const nx = e.touches[0].clientX - dragStart.current.x;
      const ny = e.touches[0].clientY - dragStart.current.y;
      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
    }
  };

  const onTouchEnd = () => { dragging.current = false; lastTouchDist.current = null; };

  const reset = () => {
    scaleRef.current = 1; posRef.current = { x: 0, y: 0 };
    setScale(1); setPos({ x: 0, y: 0 });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.95)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        ref={wrapRef}
        style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            maxWidth: "90vw", maxHeight: "90vh",
            objectFit: "contain",
            transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            transition: dragging.current ? "none" : "transform 0.15s ease",
            cursor: scale > 1 ? "grab" : "zoom-in",
            userSelect: "none",
            willChange: "transform",
          }}
        />
      </div>

      {/* Controles */}
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff", borderRadius: "50%", width: 40, height: 40,
        fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}>✕</button>

      {scale > 1 && (
        <button onClick={reset} style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff", borderRadius: 100, padding: "8px 20px", fontSize: 13, cursor: "pointer",
        }}>⤢ Restablecer</button>
      )}
    </div>
  );
};

// ── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ shoe, onClose, isAdmin, onEdit, onDelete }) => {
  const variants = shoe.variants || [];
  const [activeVariant, setActiveVariant] = useState(shoe.initialVariant ?? 0);
  const [activeImg, setActiveImg] = useState(null);
  const [fullImg, setFullImg] = useState(null);

  const currentVariant = variants[activeVariant];
  const allImages = currentVariant
    ? [currentVariant.main_image, ...(currentVariant.images || [])].filter(Boolean)
    : [shoe.image_base64].filter(Boolean);

  useEffect(() => {
    setActiveImg(allImages[0] || null);
  }, [activeVariant]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>

          <div className="detail-layout">
            {/* ── Lado imagen ── */}
            <div className="detail-img-side" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

              {/* Imagen principal grande */}
              <div
                style={{ flex: 1, minHeight: 260, background: "var(--surface2)", cursor: "zoom-in", overflow: "hidden", borderRadius: "20px 0 0 0" }}
                onClick={() => activeImg && setFullImg(activeImg)}
              >
                {activeImg
                  ? <img src={activeImg} alt={shoe.name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", transition: "opacity 0.2s" }} />
                  : <div className="detail-no-img"><ImageIcon /></div>
                }
              </div>

              {/* Miniaturas de ángulos */}
              {allImages.length > 1 && (
                <div style={{
                  display: "flex", gap: 6, padding: "10px 12px",
                  background: "var(--surface2)", overflowX: "auto",
                  borderTop: "1px solid var(--border)",
                }}>
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImg(img)}
                      style={{
                        width: 56, height: 56, flexShrink: 0, borderRadius: 8,
                        overflow: "hidden", cursor: "pointer",
                        border: activeImg === img ? "2px solid var(--accent)" : "2px solid transparent",
                        transition: "border 0.15s",
                      }}
                    >
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Puntos de color (variantes) */}
              {variants.length > 1 && (
                <div style={{
                  display: "flex", gap: 8, padding: "10px 14px", alignItems: "center",
                  background: "var(--surface2)", borderTop: "1px solid var(--border)",
                  borderRadius: "0 0 0 20px",
                }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Color:</span>
                  {variants.map((v, i) => (
                    <button
                      key={v.id || i}
                      title={v.color}
                      onClick={() => setActiveVariant(i)}
                      style={{
                        width: 20, height: 20, borderRadius: "50%", border: "none",
                        padding: 0, cursor: "pointer", flexShrink: 0,
                        background: colorToHex(v.color),
                        outline: activeVariant === i ? "2px solid var(--accent)" : "2px solid transparent",
                        outlineOffset: 2, transition: "outline 0.15s",
                      }}
                    />
                  ))}
                  {currentVariant && (
                    <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>{currentVariant.color}</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Lado info ── */}
            <div className="detail-info-side">
              <p className="detail-brand">{shoe.brand}</p>
              <h2 className="detail-name">{shoe.name}</h2>

              <div className="detail-chips">
                {shoe.category && <span className="chip">{shoe.category}</span>}
                {currentVariant?.color && <span className="chip">{currentVariant.color}</span>}
                {shoe.sole && <span className="chip">Suela: {shoe.sole}</span>}
                {shoe.size && <span className="chip">Talla: {shoe.size}</span>}
              </div>

              <div className="detail-specs">
                {shoe.model && <div className="spec-row"><span>Modelo</span><strong>{shoe.model}</strong></div>}
                {shoe.reference && <div className="spec-row"><span>Referencia</span><strong>{shoe.reference}</strong></div>}
                {shoe.material && <div className="spec-row"><span>Material</span><strong>{shoe.material}</strong></div>}
              </div>

              {shoe.description && <p className="detail-desc">{shoe.description}</p>}

              {isAdmin && (
                <div className="detail-admin-btns">
                  <button className="btn-outline" onClick={() => { onEdit(shoe); onClose(); }}>
                    <EditIcon /> Editar
                  </button>
                  <button className="btn-danger" onClick={() => { onDelete(shoe); onClose(); }}>
                    <TrashIcon /> Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visor pantalla completa */}
      {fullImg && <FullImageViewer src={fullImg} onClose={() => setFullImg(null)} />}
    </>
  );
};

// ── Image Cropper Modal ──────────────────────────────────────────────────────
const ImageCropper = ({ src, onConfirm, onCancel }) => {
  const canvasRef = useRef();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgReady, setImgReady] = useState(false);
  const [mode, setMode] = useState("move");
  const [brushSize, setBrushSize] = useState(24);
  const [brushColor, setBrushColor] = useState("transparent");
  const imgRef = useRef(new Image());
  const maskRef = useRef(null);
  const paintLayerRef = useRef(null);
  const isPainting = useRef(false);
  const SIZE = 340;
  const MIN_CROP = 40;
  const HANDLE = 10; // radio zona sensible para agarrar borde/esquina

  // Área de recorte: { x, y, w, h } en coordenadas canvas
  const [crop, setCrop] = useState({
    x: 20,
    y: 20,
    w: SIZE - 40,
    h: SIZE - 40,
  });
  const cropRef = useRef({ x: 20, y: 20, w: SIZE - 40, h: SIZE - 40 });
  const resizing = useRef(null); // qué handle se está arrastrando
  const resizeStart = useRef(null);

  // Sincronizar ref con state para usarlo en handlers
  const syncCrop = (c) => {
    cropRef.current = c;
    setCrop(c);
  };

  // ── Carga imagen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = imgRef.current;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fit = Math.min(SIZE / img.width, SIZE / img.height) * 0.75;
      setScale(fit);
      setOffset({ x: 0, y: 0 });

      const mask = document.createElement("canvas");
      mask.width = img.width;
      mask.height = img.height;
      const mctx = mask.getContext("2d");
      mctx.fillStyle = "white";
      mctx.fillRect(0, 0, img.width, img.height);
      maskRef.current = mask;

      const paint = document.createElement("canvas");
      paint.width = SIZE;
      paint.height = SIZE;
      paintLayerRef.current = paint;

      setImgReady(true);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (imgReady) draw();
  }, [scale, offset, imgReady, crop]);

  // ── Dibujo ──────────────────────────────────────────────────────────────────
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current.complete || !maskRef.current) return;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    const c = cropRef.current;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (SIZE - w) / 2 + offset.x;
    const y = (SIZE - h) / 2 + offset.y;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Tablero de ajedrez
    const tile = 10;
    for (let row = 0; row * tile < SIZE; row++) {
      for (let col = 0; col * tile < SIZE; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? "#2a2a2a" : "#222";
        ctx.fillRect(col * tile, row * tile, tile, tile);
      }
    }

    // Imagen con máscara
    const tmp = document.createElement("canvas");
    tmp.width = SIZE;
    tmp.height = SIZE;
    const tctx = tmp.getContext("2d");
    tctx.drawImage(img, x, y, w, h);
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(maskRef.current, x, y, w, h);
    ctx.drawImage(tmp, 0, 0);

    // Capa de pintura
    if (paintLayerRef.current) ctx.drawImage(paintLayerRef.current, 0, 0);

    // Overlay oscuro fuera del recorte
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, SIZE, c.y); // arriba
    ctx.fillRect(0, c.y + c.h, SIZE, SIZE - c.y - c.h); // abajo
    ctx.fillRect(0, c.y, c.x, c.h); // izquierda
    ctx.fillRect(c.x + c.w, c.y, SIZE - c.x - c.w, c.h); // derecha

    // Borde dorado
    ctx.strokeStyle = "rgba(201,169,110,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);

    // Líneas de tercios
    ctx.strokeStyle = "rgba(201,169,110,0.25)";
    ctx.lineWidth = 1;
    const t3w = c.w / 3;
    const t3h = c.h / 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(c.x + t3w * i, c.y);
      ctx.lineTo(c.x + t3w * i, c.y + c.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + t3h * i);
      ctx.lineTo(c.x + c.w, c.y + t3h * i);
      ctx.stroke();
    }

    // Handles en esquinas y puntos medios de bordes
    const handles = getHandlePositions(c);
    handles.forEach(({ hx, hy }) => {
      ctx.fillStyle = "rgba(201,169,110,1)";
      ctx.strokeStyle = "#0d0d0d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  // ── Posiciones de los 8 handles ────────────────────────────────────────────
  const getHandlePositions = (c) => [
    { id: "tl", hx: c.x, hy: c.y },
    { id: "tc", hx: c.x + c.w / 2, hy: c.y },
    { id: "tr", hx: c.x + c.w, hy: c.y },
    { id: "ml", hx: c.x, hy: c.y + c.h / 2 },
    { id: "mr", hx: c.x + c.w, hy: c.y + c.h / 2 },
    { id: "bl", hx: c.x, hy: c.y + c.h },
    { id: "bc", hx: c.x + c.w / 2, hy: c.y + c.h },
    { id: "br", hx: c.x + c.w, hy: c.y + c.h },
  ];

  // ── Detectar qué handle está bajo el cursor ─────────────────────────────────
  const getHitHandle = (px, py) => {
    const c = cropRef.current;
    const handles = getHandlePositions(c);
    for (const { id, hx, hy } of handles) {
      if (Math.hypot(px - hx, py - hy) <= HANDLE + 4) return id;
    }
    return null;
  };

  // ── Cursor según posición ───────────────────────────────────────────────────
  const getCursor = (px, py) => {
    if (mode !== "move") return mode === "erase" ? "cell" : "crosshair";
    const hit = getHitHandle(px, py);
    const cursors = {
      tl: "nw-resize",
      tr: "ne-resize",
      bl: "sw-resize",
      br: "se-resize",
      tc: "n-resize",
      bc: "s-resize",
      ml: "w-resize",
      mr: "e-resize",
    };
    return cursors[hit] || "grab";
  };

  // ── Aplicar resize según handle ─────────────────────────────────────────────
  const applyResize = (handle, dx, dy, startCrop) => {
    let { x, y, w, h } = startCrop;
    if (handle.includes("r")) {
      w = Math.max(MIN_CROP, w + dx);
    }
    if (handle.includes("l")) {
      const nw = Math.max(MIN_CROP, w - dx);
      x = x + w - nw;
      w = nw;
    }
    if (handle.includes("b")) {
      h = Math.max(MIN_CROP, h + dy);
    }
    if (handle.includes("t")) {
      const nh = Math.max(MIN_CROP, h - dy);
      y = y + h - nh;
      h = nh;
    }
    // Clamp dentro del canvas
    x = Math.max(0, Math.min(x, SIZE - MIN_CROP));
    y = Math.max(0, Math.min(y, SIZE - MIN_CROP));
    w = Math.min(w, SIZE - x);
    h = Math.min(h, SIZE - y);
    return { x, y, w, h };
  };

  // ── getPos helper ──────────────────────────────────────────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (SIZE / rect.width),
      y: (e.clientY - rect.top) * (SIZE / rect.height),
    };
  };

  // ── Pintar máscara ─────────────────────────────────────────────────────────
  const paintMask = (cx, cy) => {
    const img = imgRef.current;
    const w = img.width * scale;
    const h = img.height * scale;
    const ix = (SIZE - w) / 2 + offset.x;
    const iy = (SIZE - h) / 2 + offset.y;
    const r = brushSize / scale;

    if (mode === "restore") {
      const mctx = maskRef.current.getContext("2d");
      mctx.globalCompositeOperation = "source-over";
      mctx.fillStyle = "white";
      mctx.beginPath();
      mctx.arc((cx - ix) / scale, (cy - iy) / scale, r, 0, Math.PI * 2);
      mctx.fill();
    } else if (mode === "erase") {
      if (brushColor === "transparent") {
        const mctx = maskRef.current.getContext("2d");
        mctx.globalCompositeOperation = "destination-out";
        mctx.fillStyle = "rgba(0,0,0,1)";
        mctx.beginPath();
        mctx.arc((cx - ix) / scale, (cy - iy) / scale, r, 0, Math.PI * 2);
        mctx.fill();
      } else {
        const pctx = paintLayerRef.current.getContext("2d");
        pctx.globalCompositeOperation = "source-over";
        pctx.fillStyle = brushColor;
        pctx.beginPath();
        pctx.arc(cx, cy, brushSize, 0, Math.PI * 2);
        pctx.fill();
      }
    }
    draw();
  };

  // ── Eventos ────────────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    const pos = getPos(e);
    if (mode !== "move") {
      isPainting.current = true;
      paintMask(pos.x, pos.y);
      return;
    }
    const hit = getHitHandle(pos.x, pos.y);
    if (hit) {
      resizing.current = hit;
      resizeStart.current = { pos, crop: { ...cropRef.current } };
    } else {
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const onMouseMove = (e) => {
    const pos = getPos(e);
    if (canvasRef.current)
      canvasRef.current.style.cursor = getCursor(pos.x, pos.y);

    if (mode !== "move") {
      if (isPainting.current) paintMask(pos.x, pos.y);
      return;
    }
    if (resizing.current && resizeStart.current) {
      const dx = pos.x - resizeStart.current.pos.x;
      const dy = pos.y - resizeStart.current.pos.y;
      const newCrop = applyResize(
        resizing.current,
        dx,
        dy,
        resizeStart.current.crop,
      );
      syncCrop(newCrop);
    } else if (dragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const onMouseUp = () => {
    setDragging(false);
    isPainting.current = false;
    resizing.current = null;
    resizeStart.current = null;
  };

  const onTouchStart = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const pos = getPos(t);
    if (mode !== "move") {
      isPainting.current = true;
      paintMask(pos.x, pos.y);
      return;
    }
    const hit = getHitHandle(pos.x, pos.y);
    if (hit) {
      resizing.current = hit;
      resizeStart.current = { pos, crop: { ...cropRef.current } };
    } else {
      setDragging(true);
      setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const pos = getPos(t);
    if (mode !== "move") {
      if (isPainting.current) paintMask(pos.x, pos.y);
      return;
    }
    if (resizing.current && resizeStart.current) {
      const dx = pos.x - resizeStart.current.pos.x;
      const dy = pos.y - resizeStart.current.pos.y;
      const newCrop = applyResize(
        resizing.current,
        dx,
        dy,
        resizeStart.current.crop,
      );
      syncCrop(newCrop);
    } else if (dragging) {
      setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
    }
  };

  // ── Reset máscara ──────────────────────────────────────────────────────────
  const resetMask = () => {
    const mctx = maskRef.current.getContext("2d");
    mctx.globalCompositeOperation = "source-over";
    mctx.fillStyle = "white";
    mctx.fillRect(0, 0, maskRef.current.width, maskRef.current.height);
    const pctx = paintLayerRef.current.getContext("2d");
    pctx.clearRect(0, 0, SIZE, SIZE);
    draw();
  };

  // ── Exportar ───────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const img = imgRef.current;
    const c = cropRef.current;
    const EXPORT_SCALE = Math.round(img.width / (c.w / scale)); // escala real de la imagen original

    const full = document.createElement("canvas");
    full.width = SIZE * EXPORT_SCALE;
    full.height = SIZE * EXPORT_SCALE;
    const fctx = full.getContext("2d");

    const iw = img.width * scale * EXPORT_SCALE;
    const ih = img.height * scale * EXPORT_SCALE;
    const ix = ((SIZE - img.width * scale) / 2 + offset.x) * EXPORT_SCALE;
    const iy = ((SIZE - img.height * scale) / 2 + offset.y) * EXPORT_SCALE;

    fctx.drawImage(img, ix, iy, iw, ih);

    if (maskRef.current) {
      fctx.globalCompositeOperation = "destination-in";
      fctx.drawImage(maskRef.current, ix, iy, iw, ih);
      fctx.globalCompositeOperation = "source-over";
    }

    if (paintLayerRef.current) {
      fctx.drawImage(
        paintLayerRef.current,
        0,
        0,
        SIZE,
        SIZE,
        0,
        0,
        SIZE * EXPORT_SCALE,
        SIZE * EXPORT_SCALE,
      );
    }

    const out = document.createElement("canvas");
    out.width = Math.round(c.w * EXPORT_SCALE);
    out.height = Math.round(c.h * EXPORT_SCALE);
    const octx = out.getContext("2d");
    const pixels = fctx.getImageData(
      Math.round(c.x * EXPORT_SCALE),
      Math.round(c.y * EXPORT_SCALE),
      Math.round(c.w * EXPORT_SCALE),
      Math.round(c.h * EXPORT_SCALE),
    );
    octx.putImageData(pixels, 0, 0);

    onConfirm(out.toDataURL("image/png", 1.0));
  };

  const modeBtn = (m, label, title) => (
    <button
      title={title}
      onClick={() => setMode(m)}
      style={{
        padding: "7px 14px",
        borderRadius: "100px",
        fontSize: "13px",
        fontWeight: 600,
        border:
          mode === m
            ? "1.5px solid var(--accent)"
            : "1.5px solid var(--border2)",
        background: mode === m ? "rgba(201,169,110,0.15)" : "transparent",
        color: mode === m ? "var(--accent)" : "var(--muted)",
        cursor: "pointer",
        transition: "all 0.18s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h3>Ajustar imagen</h3>
          <p>
            {mode === "move" &&
              "Arrastra imagen · Arrastra esquinas/bordes del recuadro"}
            {mode === "erase" && "Pinta sobre el fondo para borrarlo"}
            {mode === "restore" && "Pinta para restaurar partes borradas"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {modeBtn("move", "✋ Mover", "Mover y redimensionar")}
          {modeBtn("erase", "🧹 Borrar", "Borrar fondo")}
          {modeBtn("restore", "🖌️ Restaurar", "Restaurar partes borradas")}
          <button
            onClick={resetMask}
            style={{
              padding: "7px 12px",
              borderRadius: "100px",
              fontSize: "13px",
              border: "1.5px solid var(--border2)",
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            ↺ Reset
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="cropper-canvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        />

        <div className="cropper-zoom">
          <span>🔍</span>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.001}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="cropper-slider"
          />
          <span>🔎</span>
        </div>

        {mode !== "move" && (
          <div className="cropper-zoom">
            <span style={{ fontSize: "11px" }}>pincel</span>
            <input
              type="range"
              min={4}
              max={60}
              step={1}
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="cropper-slider"
            />
            <span
              style={{
                width: Math.max(8, brushSize * 0.6),
                height: Math.max(8, brushSize * 0.6),
                borderRadius: "50%",
                flexShrink: 0,
                display: "inline-block",
                background:
                  mode === "erase" ? "var(--danger)" : "var(--accent)",
              }}
            />
          </div>
        )}

        {mode === "erase" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Color del pincel:
            </span>
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {[
                { color: "transparent", label: "Borrar" },
                { color: "#ffffff", label: "Blanco" },
                { color: "#000000", label: "Negro" },
                { color: "#f5f0e8", label: "Crema" },
                { color: "#d0d0d0", label: "Gris" },
                { color: "#c8b49a", label: "Beige" },
              ].map(({ color, label }) => (
                <button
                  key={color}
                  title={label}
                  onClick={() => setBrushColor(color)}
                  style={{
                    width: color === "transparent" ? "auto" : "24px",
                    height: "24px",
                    padding: color === "transparent" ? "0 8px" : 0,
                    borderRadius: color === "transparent" ? "100px" : "50%",
                    background: color === "transparent" ? "transparent" : color,
                    border:
                      brushColor === color
                        ? "2.5px solid var(--accent)"
                        : "2px solid var(--border2)",
                    cursor: "pointer",
                    fontSize: "11px",
                    color: "var(--muted)",
                    flexShrink: 0,
                    backgroundImage:
                      color === "transparent"
                        ? "linear-gradient(45deg,#444 25%,transparent 25%,transparent 75%,#444 75%),linear-gradient(45deg,#444 25%,transparent 25%,transparent 75%,#444 75%)"
                        : "none",
                    backgroundSize: "8px 8px",
                    backgroundPosition: "0 0, 4px 4px",
                  }}
                >
                  {color === "transparent" ? "✕ Borrar" : ""}
                </button>
              ))}
              <input
                type="color"
                title="Color personalizado"
                onChange={(e) => setBrushColor(e.target.value)}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "2px solid var(--border2)",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            </div>
          </div>
        )}

        <div className="cropper-actions">
          <button className="btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            ✓ Usar esta imagen
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Shoe Form Modal ──────────────────────────────────────────────────────────
const ShoeFormModal = ({ initial, token, onClose, onSaved }) => {
  const [form, setForm] = useState(
    initial || {
      name: "",
      category: "",
      sole: "",
      color: "",
      reference: "",
      model: "",
      price: "",
      size: "",
      material: "",
      description: "",
      brand: "",
      image_base64: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(initial?.image_base64 || "");
  const [cropSrc, setCropSrc] = useState(null); // 👈 nuevo
  const fileRef = useRef();
  const isEdit = !!initial?.id;
  // Variantes
  const [variants, setVariants] = useState(
    initial?.variants?.map((v) => ({ ...v, tempId: v.id })) || [],
  );
  const [cropState, setCropState] = useState(null); // { variantIndex, target: "main"|"angle", src }

  const updateVariant = (i, key, val) =>
    setVariants((vs) =>
      vs.map((v, idx) => (idx === i ? { ...v, [key]: val } : v)),
    );

  const removeAngle = (vi, ii) =>
    setVariants((vs) =>
      vs.map((v, idx) =>
        idx === vi ? { ...v, images: v.images.filter((_, i) => i !== ii) } : v,
      ),
    );

  const openCrop = (variantIndex, target) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setCropState({ variantIndex, target, src: URL.createObjectURL(file) });
    };
    input.click();
  };

  const handleVariantCrop = async (dataUrl) => {
    const { variantIndex, target } = cropState;
    setCropState(null);

    // Subir a Supabase
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const { data, error } = await supabase.storage
      .from("zapatos")
      .upload(fileName, blob, { upsert: false, contentType: "image/png" });
    if (error) {
      alert("Error subiendo imagen: " + error.message);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("zapatos").getPublicUrl(data.path);

    setVariants((vs) =>
      vs.map((v, idx) => {
        if (idx !== variantIndex) return v;
        if (target === "main") return { ...v, main_image: publicUrl };
        return { ...v, images: [...(v.images || []), publicUrl] };
      }),
    );
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setCropSrc(localUrl); // abrir recortador
    e.target.value = ""; // reset input
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert("El nombre es obligatorio");
    setSaving(true);
    try {
      const url = isEdit
        ? `${BACKEND_URL}/api/admin/shoes/${initial.id}`
        : `${BACKEND_URL}/api/admin/shoes`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) || 0 }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.detail || "Error al guardar");
        setSaving(false);
        return;
      }
      const saved = await res.json();
      const shoeId = saved.id;

      // Guardar variantes
      for (const variant of variants) {
        const vData = {
          color: variant.color,
          main_image: variant.main_image,
          images: variant.images || [],
        };
        if (variant.id) {
          await fetch(
            `${BACKEND_URL}/api/admin/shoes/${shoeId}/variants/${variant.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(vData),
            },
          );
        } else {
          await fetch(`${BACKEND_URL}/api/admin/shoes/${shoeId}/variants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(vData),
          });
        }
      }

      onSaved();
      onClose();
    } catch {
      alert("Error de conexión");
    }
    setSaving(false);
  };

  const fields = [
    { key: "name", label: "Nombre *", full: true },
    { key: "brand", label: "Marca" },
    { key: "category", label: "Categoría" },
    { key: "model", label: "Modelo" },
    { key: "reference", label: "Referencia" },
    // { key: "color", label: "Color" },
    { key: "sole", label: "Suela" },
    { key: "material", label: "Material" },
    { key: "size", label: "Talla" },
    // { key: "price", label: "Precio", type: "number" },
    { key: "description", label: "Descripción", full: true, area: true },
  ];

  return (
    <div className="modal-overlay">
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <h2>{isEdit ? "Editar producto" : "Nuevo producto"}</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* ── Variantes de color ── */}
        <div style={{ padding: "0 28px 16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Colores y fotos
            </p>
            <button
              className="btn-outline"
              style={{ padding: "5px 14px", fontSize: 12 }}
              onClick={() =>
                setVariants((v) => [
                  ...v,
                  {
                    tempId: Date.now(),
                    color: "",
                    main_image: "",
                    images: [],
                    showCrop: false,
                    cropSrc: null,
                    cropTarget: null,
                  },
                ])
              }
            >
              + Añadir color
            </button>
          </div>

          {variants.length === 0 && (
            <p
              style={{
                fontSize: 12,
                color: "var(--muted)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              Sin variantes — añade al menos un color con foto
            </p>
          )}

          {variants.map((variant, vi) => (
            <div
              key={variant.tempId || variant.id}
              style={{
                background: "var(--surface2)",
                borderRadius: 12,
                border: "1px solid var(--border2)",
                padding: 14,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <input
                  type="text"
                  placeholder="Color (ej: Negro, Blanco…)"
                  value={variant.color}
                  onChange={(e) => updateVariant(vi, "color", e.target.value)}
                  style={{
                    flex: 1,
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 8,
                    color: "var(--text)",
                    padding: "8px 12px",
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={() =>
                    setVariants((v) => v.filter((_, i) => i !== vi))
                  }
                  style={{
                    color: "var(--danger)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                  title="Eliminar variante"
                >
                  ✕
                </button>
              </div>

              {/* Foto principal */}
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Foto principal
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <div
                  onClick={() => openCrop(vi, "main")}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    border: "2px dashed var(--border2)",
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--surface)",
                    flexShrink: 0,
                  }}
                >
                  {variant.main_image ? (
                    <img
                      src={variant.main_image}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span style={{ color: "var(--muted)", fontSize: 22 }}>
                      +
                    </span>
                  )}
                </div>

                {/* Fotos de ángulos */}
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    width: "100%",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Otros ángulos
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(variant.images || []).map((img, ii) => (
                    <div
                      key={ii}
                      style={{
                        position: "relative",
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid var(--border2)",
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                      <button
                        onClick={() => removeAngle(vi, ii)}
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.7)",
                          border: "none",
                          color: "#fff",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div
                    onClick={() => openCrop(vi, "angle")}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      border: "2px dashed var(--border2)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--surface)",
                    }}
                  >
                    <span style={{ color: "var(--muted)", fontSize: 20 }}>
                      +
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cropper para variantes */}
        {cropState && (
          <ImageCropper
            src={cropState.src}
            onCancel={() => setCropState(null)}
            onConfirm={(dataUrl) => handleVariantCrop(dataUrl)}
          />
        )}

        <div className="form-grid">
          {fields.map((f) => (
            <div key={f.key} className={`form-field ${f.full ? "full" : ""}`}>
              <label>{f.label}</label>
              {f.area ? (
                <textarea
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  rows={3}
                />
              ) : (
                <input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Agregar producto"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Admin Login Modal ────────────────────────────────────────────────────────
const LoginModal = ({ onClose, onLogin }) => {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data.token);
        onClose();
      } else {
        setErr("Contraseña incorrecta");
      }
    } catch {
      setErr("Error de conexión");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="login-icon">
          <LockIcon />
        </div>
        <h2 className="login-title">Acceso Admin</h2>
        <p className="login-sub">
          Ingresa la contraseña para gestionar el catálogo
        </p>
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <input
            type={showPw ? "text" : "password"}
            className={`login-input ${err ? "error" : ""}`}
            placeholder="Contraseña"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoFocus
            style={{ marginBottom: 0, paddingRight: "44px" }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
            }}
            tabIndex={-1}
            title={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPw ? (
              /* Ojo tachado — ocultar */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              /* Ojo abierto — mostrar */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {err && <p className="login-error">{err}</p>}
        <button
          className="btn-primary full-width"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Verificando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ shoe, token, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/shoes/${shoe.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onDeleted();
        onClose();
      } else alert("Error al eliminar");
    } catch {
      alert("Error de conexión");
    }
    setLoading(false);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>¿Eliminar producto?</h3>
        <p>
          Esta acción no se puede deshacer. Se eliminará{" "}
          <strong>{shoe.name}</strong> del catálogo.
        </p>
        <div className="form-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    soles: [],
    colors: [],
    brands: [],
  });
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    sole: "",
    color: "",
    brand: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editShoe, setEditShoe] = useState(null);
  const [deleteShoe, setDeleteShoe] = useState(null);
  const [selectedShoe, setSelectedShoe] = useState(null);

  const loadShoes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.sole) params.set("sole", filters.sole);
      if (filters.color) params.set("color", filters.color);
      if (filters.brand) params.set("brand", filters.brand);
      const res = await fetch(`${BACKEND_URL}/api/shoes?${params}`);
      if (res.ok) setShoes(await res.json());
    } catch {}
    setLoading(false);
  };

  const loadFilterOptions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/filters/options`);
      if (res.ok) setFilterOptions(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);
  useEffect(() => {
    loadShoes();
  }, [filters]);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clearFilters = () =>
    setFilters({ search: "", category: "", sole: "", color: "", brand: "" });
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const handleLogin = (token) => {
    setAdminToken(token);
    setIsAdmin(true);
  };
  const handleLogout = () => {
    setIsAdmin(false);
    setAdminToken("");
  };

  const openEdit = (shoe) => {
    setEditShoe(shoe);
    setShowForm(true);
  };
  const openDelete = (shoe) => setDeleteShoe(shoe);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <a className="logo" href="/">
            <span className="logo-text">Inicio</span>
          </a>

          <div className="header-right">
            {isAdmin && (
              <button
                className="btn-add"
                onClick={() => {
                  setEditShoe(null);
                  setShowForm(true);
                }}
              >
                <PlusIcon /> Agregar
              </button>
            )}
            {isAdmin ? (
              <button className="btn-icon-text" onClick={handleLogout}>
                <LogoutIcon /> Salir
              </button>
            ) : (
              <button
                className="btn-icon-text muted"
                onClick={() => setShowLogin(true)}
              >
                <LockIcon /> Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero / Search ── */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Catálogo de <em>Calzado</em>
          </h1>
          <div className="search-wrap">
            <SearchIcon />
            <input
              className="search-input"
              type="text"
              placeholder="Buscar por nombre, modelo, referencia…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
            />
            {filters.search && (
              <button
                className="search-clear"
                onClick={() => setFilter("search", "")}
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
        <span className="logo-mark">
          <img src="/Monaco.webp" alt="Logo Monaco" />
        </span>
      </section>

      {/* ── Filters bar ── */}
      <div className="filters-bar">
        <div className="filters-bar-inner">
          <button
            className={`filter-toggle ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <FilterIcon />
            Filtros
            {hasActiveFilters && <span className="filter-dot" />}
          </button>

          {showFilters && (
            <div className="filters-row">
              <select
                value={filters.category}
                onChange={(e) => setFilter("category", e.target.value)}
                className="filter-select"
              >
                <option value="">Categoría</option>
                {filterOptions.categories?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filters.brand}
                onChange={(e) => setFilter("brand", e.target.value)}
                className="filter-select"
              >
                <option value="">Marca</option>
                {filterOptions.brands?.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={filters.color}
                onChange={(e) => setFilter("color", e.target.value)}
                className="filter-select"
              >
                <option value="">Color</option>
                {filterOptions.colors?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filters.sole}
                onChange={(e) => setFilter("sole", e.target.value)}
                className="filter-select"
              >
                <option value="">Suela</option>
                {filterOptions.soles?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <button className="clear-btn" onClick={clearFilters}>
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* <span className="results-count">
            {shoes.length} producto{shoes.length !== 1 ? "s" : ""}
          </span> */}
        </div>
      </div>

      {/* ── Grid ── */}
      <main className="catalog-main">
        {loading ? (
          <div className="grid">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="skeleton-card"
                style={{ animationDelay: `${i * 0.07}s` }}
              />
            ))}
          </div>
        ) : shoes.length === 0 ? (
          <EmptyState isFiltered={hasActiveFilters} />
        ) : (
          <div className="grid">
            {shoes.map((shoe) => (
              <ShoeCard
                key={shoe.id}
                shoe={shoe}
                onClick={(variantIdx) => setSelectedShoe({ ...shoe, initialVariant: variantIdx ?? 0 })}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {selectedShoe && (
        <DetailModal
          shoe={selectedShoe}
          onClose={() => setSelectedShoe(null)}
          isAdmin={isAdmin}
          onEdit={(s) => {
            openEdit(s);
            setSelectedShoe(null);
          }}
          onDelete={(s) => {
            openDelete(s);
            setSelectedShoe(null);
          }}
        />
      )}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      )}
      {showForm && (
        <ShoeFormModal
          initial={editShoe}
          token={adminToken}
          onClose={() => {
            setShowForm(false);
            setEditShoe(null);
          }}
          onSaved={loadShoes}
        />
      )}
      {deleteShoe && (
        <DeleteModal
          shoe={deleteShoe}
          token={adminToken}
          onClose={() => setDeleteShoe(null)}
          onDeleted={loadShoes}
        />
      )}
    </div>
  );
}
