import json
import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

# ─── Environment variables ────────────────────────────────────────────────────
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/shoe_catalog"
)
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    raise RuntimeError("La variable de entorno ADMIN_PASSWORD no está definida en el .env")

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(title="Shoe Catalog API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ─── Database helpers ─────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

@contextmanager
def db_cursor():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist."""
    with db_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS shoes (
                id          TEXT PRIMARY KEY,
                name        TEXT DEFAULT '',
                category    TEXT DEFAULT '',
                sole        TEXT DEFAULT '',
                color       TEXT DEFAULT '',
                reference   TEXT DEFAULT '',
                model       TEXT DEFAULT '',
                price       NUMERIC(10, 2) DEFAULT 0,
                size        TEXT DEFAULT '',
                material    TEXT DEFAULT '',
                description TEXT DEFAULT '',
                brand       TEXT DEFAULT '',
                image_base64 TEXT,
                created_at  TIMESTAMPTZ DEFAULT now(),
                updated_at  TIMESTAMPTZ DEFAULT now()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS themes (
                id           TEXT PRIMARY KEY,
                theme_name   TEXT NOT NULL,
                primary_color    TEXT NOT NULL,
                secondary_color  TEXT NOT NULL,
                background_color TEXT NOT NULL,
                text_color       TEXT NOT NULL,
                accent_color     TEXT NOT NULL,
                created_at  TIMESTAMPTZ DEFAULT now()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS shoe_variants (
                id          TEXT PRIMARY KEY,
                shoe_id     TEXT NOT NULL REFERENCES shoes(id) ON DELETE CASCADE,
                color       TEXT NOT NULL DEFAULT '',
                main_image  TEXT,
                images      JSONB DEFAULT '[]',
                created_at  TIMESTAMPTZ DEFAULT now()
            );
        """)


# Initialize on startup
@app.on_event("startup")
def on_startup():
    init_db()


# ─── Pydantic models ──────────────────────────────────────────────────────────

class ShoeBase(BaseModel):
    name: Optional[str] = ""
    category: Optional[str] = ""
    sole: Optional[str] = ""
    color: Optional[str] = ""
    reference: Optional[str] = ""
    model: Optional[str] = ""
    price: Optional[float] = 0.0
    size: Optional[str] = ""
    material: Optional[str] = ""
    description: Optional[str] = ""
    brand: Optional[str] = ""
    image_base64: Optional[str] = None

class ShoeCreate(ShoeBase):
    pass

class ShoeResponse(ShoeBase):
    id: str
    created_at: datetime
    updated_at: datetime
    variants: Optional[list] = []

class AdminAuth(BaseModel):
    password: str

class ThemeSettings(BaseModel):
    theme_name: str
    primary_color: str
    secondary_color: str
    background_color: str
    text_color: str
    accent_color: str

class VariantBase(BaseModel):
    color: str = ""
    main_image: Optional[str] = None
    images: Optional[list] = []

class VariantCreate(VariantBase):
    pass

class VariantResponse(VariantBase):
    id: str
    shoe_id: str
    created_at: datetime

# ─── Auth helper ──────────────────────────────────────────────────────────────

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    return True


# ─── Helper: dict from row ────────────────────────────────────────────────────

def row_to_shoe(row: dict) -> dict:
    row = dict(row)
    row["price"] = float(row["price"]) if row.get("price") is not None else 0.0
    return row


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "shoe-catalog-api"}


@app.post("/api/admin/auth")
def admin_authenticate(auth: AdminAuth):
    if auth.password == ADMIN_PASSWORD:
        return {"success": True, "token": ADMIN_PASSWORD}
    raise HTTPException(status_code=401, detail="Invalid password")


@app.get("/api/shoes", response_model=List[ShoeResponse])
def get_shoes(
    category: Optional[str] = Query(None),
    sole: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    limit: int = Query(50, le=100),
    skip: int = Query(0, ge=0),
):
    conditions = []
    params: list = []
    if category:
        conditions.append("s.category ILIKE %s"); params.append(f"%{category}%")
    if sole:
        conditions.append("s.sole ILIKE %s"); params.append(f"%{sole}%")
    if color:
        conditions.append("EXISTS (SELECT 1 FROM shoe_variants v WHERE v.shoe_id = s.id AND v.color ILIKE %s)")
        params.append(f"%{color}%")
    if brand:
        conditions.append("s.brand ILIKE %s"); params.append(f"%{brand}%")
    if search:
        conditions.append("(s.name ILIKE %s OR s.description ILIKE %s OR s.model ILIKE %s OR s.reference ILIKE %s OR s.material ILIKE %s)")
        s = f"%{search}%"; params.extend([s, s, s, s, s])
    if min_price is not None:
        conditions.append("s.price >= %s"); params.append(min_price)
    if max_price is not None:
        conditions.append("s.price <= %s"); params.append(max_price)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    with db_cursor() as cur:
        cur.execute(f"""
            SELECT s.* FROM shoes s
            {where}
            ORDER BY s.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [limit, skip])
        shoes = [row_to_shoe(r) for r in cur.fetchall()]

        # Cargar variantes para cada zapato
        if shoes:
            shoe_ids = [s["id"] for s in shoes]
            placeholders = ",".join(["%s"] * len(shoe_ids))
            cur.execute(f"""
                SELECT * FROM shoe_variants
                WHERE shoe_id IN ({placeholders})
                ORDER BY created_at ASC
            """, shoe_ids)
            variants = cur.fetchall()
            variants_by_shoe = {}
            for v in variants:
                v = dict(v)
                v["images"] = v.get("images") or []
                sid = v["shoe_id"]
                if sid not in variants_by_shoe:
                    variants_by_shoe[sid] = []
                variants_by_shoe[sid].append(v)
            for shoe in shoes:
                shoe["variants"] = variants_by_shoe.get(shoe["id"], [])

    return shoes


@app.get("/api/shoes/{shoe_id}", response_model=ShoeResponse)
def get_shoe(shoe_id: str):
    with db_cursor() as cur:
        cur.execute("SELECT * FROM shoes WHERE id = %s", [shoe_id])
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        shoe = row_to_shoe(row)
        cur.execute("SELECT * FROM shoe_variants WHERE shoe_id = %s ORDER BY created_at ASC", [shoe_id])
        variants = [dict(v) for v in cur.fetchall()]
        for v in variants:
            v["images"] = v.get("images") or []
        shoe["variants"] = variants
    return shoe


@app.post("/api/admin/shoes/{shoe_id}/variants")
def add_variant(shoe_id: str, variant: VariantCreate, auth=Depends(verify_admin)):
    vid = str(uuid.uuid4())
    with db_cursor() as cur:
        cur.execute("""
            INSERT INTO shoe_variants (id, shoe_id, color, main_image, images)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """, [vid, shoe_id, variant.color, variant.main_image, json.dumps(variant.images)])
        row = dict(cur.fetchone())
        row["images"] = row.get("images") or []
    return row


@app.put("/api/admin/shoes/{shoe_id}/variants/{variant_id}")
def update_variant(shoe_id: str, variant_id: str, variant: VariantCreate, auth=Depends(verify_admin)):
    with db_cursor() as cur:
        cur.execute("""
            UPDATE shoe_variants SET color=%s, main_image=%s, images=%s
            WHERE id=%s AND shoe_id=%s RETURNING *
        """, [variant.color, variant.main_image, json.dumps(variant.images), variant_id, shoe_id])
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        row = dict(row)
        row["images"] = row.get("images") or []
    return row


@app.delete("/api/admin/shoes/{shoe_id}/variants/{variant_id}")
def delete_variant(shoe_id: str, variant_id: str, auth=Depends(verify_admin)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM shoe_variants WHERE id=%s AND shoe_id=%s", [variant_id, shoe_id])
    return {"deleted": True}


@app.post("/api/admin/shoes", response_model=ShoeResponse)
def create_shoe(shoe: ShoeCreate, admin: bool = Depends(verify_admin)):
    shoe_id = str(uuid.uuid4())
    now = datetime.utcnow()
    data = shoe.dict()

    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO shoes (id, name, category, sole, color, reference, model,
                               price, size, material, description, brand, image_base64,
                               created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING *
            """,
            (
                shoe_id,
                data["name"], data["category"], data["sole"], data["color"],
                data["reference"], data["model"], data["price"], data["size"],
                data["material"], data["description"], data["brand"],
                data["image_base64"], now, now,
            ),
        )
        row = cur.fetchone()
    return row_to_shoe(row)


@app.put("/api/admin/shoes/{shoe_id}", response_model=ShoeResponse)
def update_shoe(shoe_id: str, shoe: ShoeCreate, admin: bool = Depends(verify_admin)):
    data = shoe.dict()
    data["updated_at"] = datetime.utcnow()

    with db_cursor() as cur:
        cur.execute(
            """
            UPDATE shoes SET
                name=%s, category=%s, sole=%s, color=%s, reference=%s, model=%s,
                price=%s, size=%s, material=%s, description=%s, brand=%s,
                image_base64=%s, updated_at=%s
            WHERE id=%s
            RETURNING *
            """,
            (
                data["name"], data["category"], data["sole"], data["color"],
                data["reference"], data["model"], data["price"], data["size"],
                data["material"], data["description"], data["brand"],
                data["image_base64"], data["updated_at"], shoe_id,
            ),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Shoe not found")
    return row_to_shoe(row)


@app.delete("/api/admin/shoes/{shoe_id}")
def delete_shoe(shoe_id: str, admin: bool = Depends(verify_admin)):
    with db_cursor() as cur:
        cur.execute("DELETE FROM shoes WHERE id = %s RETURNING id", (shoe_id,))
        deleted = cur.fetchone()
    if not deleted:
        raise HTTPException(status_code=404, detail="Shoe not found")
    return {"message": "Shoe deleted successfully"}


@app.get("/api/filters/options")
def get_filter_options():
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT
                array_agg(DISTINCT category) FILTER (WHERE category <> '') AS categories,
                array_agg(DISTINCT sole)     FILTER (WHERE sole     <> '') AS soles,
                array_agg(DISTINCT color)    FILTER (WHERE color    <> '') AS colors,
                array_agg(DISTINCT brand)    FILTER (WHERE brand    <> '') AS brands,
                array_agg(DISTINCT material) FILTER (WHERE material <> '') AS materials,
                MIN(price) AS min_price,
                MAX(price) AS max_price
            FROM shoes
            """
        )
        row = cur.fetchone()

    if row:
        return {
            "categories": sorted(row["categories"] or []),
            "soles":      sorted(row["soles"]      or []),
            "colors":     sorted(row["colors"]     or []),
            "brands":     sorted(row["brands"]     or []),
            "materials":  sorted(row["materials"]  or []),
            "price_range": {
                "min": float(row["min_price"] or 0),
                "max": float(row["max_price"] or 1000),
            },
        }
    return {
        "categories": [], "soles": [], "colors": [],
        "brands": [], "materials": [],
        "price_range": {"min": 0, "max": 1000},
    }


# ─── Themes ───────────────────────────────────────────────────────────────────

DEFAULT_THEMES = [
    {
        "id": "nike_classic",
        "name": "Nike Classic",
        "primary_color": "#000000",
        "secondary_color": "#ffffff",
        "background_color": "#f8f9fa",
        "text_color": "#212529",
        "accent_color": "#ff6b35",
    },
    {
        "id": "adidas_blue",
        "name": "Adidas Blue",
        "primary_color": "#1e3a8a",
        "secondary_color": "#3b82f6",
        "background_color": "#f0f9ff",
        "text_color": "#1e293b",
        "accent_color": "#facc15",
    },
    {
        "id": "retro_sunset",
        "name": "Retro Sunset",
        "primary_color": "#dc2626",
        "secondary_color": "#f97316",
        "background_color": "#fef3c7",
        "text_color": "#451a03",
        "accent_color": "#7c3aed",
    },
    {
        "id": "minimalist_green",
        "name": "Minimalist Green",
        "primary_color": "#059669",
        "secondary_color": "#10b981",
        "background_color": "#ecfdf5",
        "text_color": "#064e3b",
        "accent_color": "#8b5cf6",
    },
]


@app.get("/api/themes")
def get_themes():
    with db_cursor() as cur:
        cur.execute("SELECT * FROM themes ORDER BY created_at")
        custom = [dict(r) for r in cur.fetchall()]
    return {"default_themes": DEFAULT_THEMES, "custom_themes": custom}


@app.post("/api/admin/themes")
def create_theme(theme: ThemeSettings, admin: bool = Depends(verify_admin)):
    theme_id = str(uuid.uuid4())
    now = datetime.utcnow()
    data = theme.dict()

    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO themes (id, theme_name, primary_color, secondary_color,
                                background_color, text_color, accent_color, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING *
            """,
            (
                theme_id, data["theme_name"], data["primary_color"],
                data["secondary_color"], data["background_color"],
                data["text_color"], data["accent_color"], now,
            ),
        )
        row = dict(cur.fetchone())

    return row


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)