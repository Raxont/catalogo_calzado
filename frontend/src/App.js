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

  return (
    <article className="shoe-card" onClick={onClick}>
      <div className="card-image-wrap">
        {shoe.image_base64 ? (
          <>
            {!imgLoaded && <div className="img-skeleton" />}
            <img
              src={shoe.image_base64}
              alt={shoe.name}
              className={`card-img ${imgLoaded ? "loaded" : ""}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="card-no-img">
            <ImageIcon />
          </div>
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
        <div className="card-footer">
          {/* <span className="card-price">
            {shoe.price > 0 ? `$${Number(shoe.price).toLocaleString('es-CO')}` : '—'}
          </span> */}
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

// ── Detail Modal ────────────────────────────────────────────────────────────
const DetailModal = ({ shoe, onClose, isAdmin, onEdit, onDelete }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <CloseIcon />
        </button>

        <div className="detail-layout">
          <div className="detail-img-side">
            {shoe.image_base64 ? (
              <img
                src={shoe.image_base64}
                alt={shoe.name}
                className="detail-img"
              />
            ) : (
              <div className="detail-no-img">
                <ImageIcon />
              </div>
            )}
          </div>

          <div className="detail-info-side">
            <p className="detail-brand">{shoe.brand}</p>
            <h2 className="detail-name">{shoe.name}</h2>
            {/* {shoe.price > 0 && (
              <p className="detail-price">
                ${Number(shoe.price).toLocaleString("es-CO")}
              </p>
            )} */}

            <div className="detail-chips">
              {shoe.category && <span className="chip">{shoe.category}</span>}
              {shoe.color && <span className="chip">{shoe.color}</span>}
              {shoe.sole && <span className="chip">Suela: {shoe.sole}</span>}
              {shoe.size && <span className="chip">Talla: {shoe.size}</span>}
            </div>

            <div className="detail-specs">
              {shoe.model && (
                <div className="spec-row">
                  <span>Modelo</span>
                  <strong>{shoe.model}</strong>
                </div>
              )}
              {shoe.reference && (
                <div className="spec-row">
                  <span>Referencia</span>
                  <strong>{shoe.reference}</strong>
                </div>
              )}
              {shoe.material && (
                <div className="spec-row">
                  <span>Material</span>
                  <strong>{shoe.material}</strong>
                </div>
              )}
            </div>

            {shoe.description && (
              <p className="detail-desc">{shoe.description}</p>
            )}

            {isAdmin && (
              <div className="detail-admin-btns">
                <button
                  className="btn-outline"
                  onClick={() => {
                    onEdit(shoe);
                    onClose();
                  }}
                >
                  <EditIcon /> Editar
                </button>
                <button
                  className="btn-danger"
                  onClick={() => {
                    onDelete(shoe);
                    onClose();
                  }}
                >
                  <TrashIcon /> Eliminar
                </button>
              </div>
            )}
          </div>
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
  const fileRef = useRef();
  const isEdit = !!initial?.id;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local inmediato
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Subir a Supabase Storage
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("zapatos")
      .upload(fileName, file, { upsert: false });

    if (error) {
      alert("Error subiendo imagen: " + error.message);
      return;
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("zapatos").getPublicUrl(data.path);

    set("image_base64", publicUrl); // reutilizamos el mismo campo, ahora guarda la URL
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
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const d = await res.json();
        alert(d.detail || "Error al guardar");
      }
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
    { key: "color", label: "Color" },
    { key: "sole", label: "Suela" },
    { key: "material", label: "Material" },
    { key: "size", label: "Talla" },
    { key: "price", label: "Precio", type: "number" },
    { key: "description", label: "Descripción", full: true, area: true },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-header">
          <h2>{isEdit ? "Editar producto" : "Nuevo producto"}</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Image upload */}
        <div
          className="img-upload-zone"
          onClick={() => fileRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" className="img-preview" />
          ) : (
            <div className="img-upload-placeholder">
              <ImageIcon />
              <span>Clic para subir imagen</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
            hidden
          />
        </div>

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
        <input
          type="password"
          className={`login-input ${err ? "error" : ""}`}
          placeholder="Contraseña"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          autoFocus
        />
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
                onClick={() => setSelectedShoe(shoe)}
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
