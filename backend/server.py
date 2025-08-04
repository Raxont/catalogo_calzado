import os
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from pydantic import BaseModel, Field
import base64

# Environment variables
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'shoe_catalog')

# Database connection
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
shoes_collection = db.shoes
settings_collection = db.settings

# FastAPI app
app = FastAPI(title="Shoe Catalog API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Admin password (in production, use environment variable)
ADMIN_PASSWORD = "zapatos2024"  # User can change this

# Pydantic models
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

class AdminAuth(BaseModel):
    password: str

class ThemeSettings(BaseModel):
    theme_name: str
    primary_color: str
    secondary_color: str
    background_color: str
    text_color: str
    accent_color: str

class FilterParams(BaseModel):
    category: Optional[str] = None
    sole: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    search: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

# Authentication helper
def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    return True

# Helper functions
def shoe_to_dict(shoe: dict) -> dict:
    """Convert MongoDB document to API response format"""
    if shoe:
        shoe['id'] = str(shoe['_id'])
        del shoe['_id']
    return shoe

def apply_filters(filters: FilterParams) -> dict:
    """Build MongoDB query from filter parameters"""
    query = {}
    
    if filters.category:
        query['category'] = {"$regex": filters.category, "$options": "i"}
    
    if filters.sole:
        query['sole'] = {"$regex": filters.sole, "$options": "i"}
    
    if filters.color:
        query['color'] = {"$regex": filters.color, "$options": "i"}
    
    if filters.brand:
        query['brand'] = {"$regex": filters.brand, "$options": "i"}
    
    if filters.search:
        # Search across multiple fields
        search_regex = {"$regex": filters.search, "$options": "i"}
        query['$or'] = [
            {'name': search_regex},
            {'description': search_regex},
            {'model': search_regex},
            {'reference': search_regex},
            {'material': search_regex}
        ]
    
    if filters.min_price is not None or filters.max_price is not None:
        price_filter = {}
        if filters.min_price is not None:
            price_filter['$gte'] = filters.min_price
        if filters.max_price is not None:
            price_filter['$lte'] = filters.max_price
        query['price'] = price_filter
    
    return query

# API Routes

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "shoe-catalog-api"}

@app.post("/api/admin/auth")
def admin_authenticate(auth: AdminAuth):
    """Authenticate admin user"""
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
    skip: int = Query(0, ge=0)
):
    """Get all shoes with optional filtering"""
    filters = FilterParams(
        category=category,
        sole=sole,
        color=color,
        brand=brand,
        search=search,
        min_price=min_price,
        max_price=max_price
    )
    
    query = apply_filters(filters)
    
    shoes = list(shoes_collection.find(query).skip(skip).limit(limit).sort("created_at", -1))
    return [shoe_to_dict(shoe) for shoe in shoes]

@app.get("/api/shoes/{shoe_id}", response_model=ShoeResponse)
def get_shoe(shoe_id: str):
    """Get a specific shoe by ID"""
    try:
        shoe = shoes_collection.find_one({"_id": shoe_id})
        if not shoe:
            raise HTTPException(status_code=404, detail="Shoe not found")
        return shoe_to_dict(shoe)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/admin/shoes", response_model=ShoeResponse)
def create_shoe(shoe: ShoeCreate, admin: bool = Depends(verify_admin)):
    """Create a new shoe (admin only)"""
    shoe_data = shoe.dict()
    shoe_data['id'] = str(uuid.uuid4())
    shoe_data['_id'] = shoe_data['id']
    shoe_data['created_at'] = datetime.utcnow()
    shoe_data['updated_at'] = datetime.utcnow()
    
    try:
        shoes_collection.insert_one(shoe_data)
        return shoe_to_dict(shoe_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/admin/shoes/{shoe_id}", response_model=ShoeResponse)
def update_shoe(shoe_id: str, shoe: ShoeCreate, admin: bool = Depends(verify_admin)):
    """Update a shoe (admin only)"""
    try:
        update_data = shoe.dict()
        update_data['updated_at'] = datetime.utcnow()
        
        result = shoes_collection.update_one(
            {"_id": shoe_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Shoe not found")
        
        updated_shoe = shoes_collection.find_one({"_id": shoe_id})
        return shoe_to_dict(updated_shoe)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/admin/shoes/{shoe_id}")
def delete_shoe(shoe_id: str, admin: bool = Depends(verify_admin)):
    """Delete a shoe (admin only)"""
    try:
        result = shoes_collection.delete_one({"_id": shoe_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Shoe not found")
        return {"message": "Shoe deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/filters/options")
def get_filter_options():
    """Get available filter options"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "categories": {"$addToSet": "$category"},
                    "soles": {"$addToSet": "$sole"},
                    "colors": {"$addToSet": "$color"},
                    "brands": {"$addToSet": "$brand"},
                    "materials": {"$addToSet": "$material"},
                    "min_price": {"$min": "$price"},
                    "max_price": {"$max": "$price"}
                }
            }
        ]
        
        result = list(shoes_collection.aggregate(pipeline))
        
        if result:
            options = result[0]
            return {
                "categories": sorted([cat for cat in options.get("categories", []) if cat]),
                "soles": sorted([sole for sole in options.get("soles", []) if sole]),
                "colors": sorted([color for color in options.get("colors", []) if color]),
                "brands": sorted([brand for brand in options.get("brands", []) if brand]),
                "materials": sorted([material for material in options.get("materials", []) if material]),
                "price_range": {
                    "min": options.get("min_price", 0),
                    "max": options.get("max_price", 1000)
                }
            }
        else:
            return {
                "categories": [],
                "soles": [],
                "colors": [],
                "brands": [],
                "materials": [],
                "price_range": {"min": 0, "max": 1000}
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/themes")
def get_themes():
    """Get available themes"""
    default_themes = [
        {
            "id": "nike_classic",
            "name": "Nike Classic",
            "primary_color": "#000000",
            "secondary_color": "#ffffff",
            "background_color": "#f8f9fa",
            "text_color": "#212529",
            "accent_color": "#ff6b35"
        },
        {
            "id": "adidas_blue",
            "name": "Adidas Blue",
            "primary_color": "#1e3a8a",
            "secondary_color": "#3b82f6",
            "background_color": "#f0f9ff",
            "text_color": "#1e293b",
            "accent_color": "#facc15"
        },
        {
            "id": "retro_sunset",
            "name": "Retro Sunset",
            "primary_color": "#dc2626",
            "secondary_color": "#f97316",
            "background_color": "#fef3c7",
            "text_color": "#451a03",
            "accent_color": "#7c3aed"
        },
        {
            "id": "minimalist_green",
            "name": "Minimalist Green",
            "primary_color": "#059669",
            "secondary_color": "#10b981",
            "background_color": "#ecfdf5",
            "text_color": "#064e3b",
            "accent_color": "#8b5cf6"
        }
    ]
    
    # Get custom themes from database
    custom_themes = list(settings_collection.find({"type": "theme"}))
    
    return {
        "default_themes": default_themes,
        "custom_themes": [theme_to_dict(theme) for theme in custom_themes]
    }

@app.post("/api/admin/themes")
def create_theme(theme: ThemeSettings, admin: bool = Depends(verify_admin)):
    """Create a custom theme (admin only)"""
    try:
        theme_data = theme.dict()
        theme_data['id'] = str(uuid.uuid4())
        theme_data['_id'] = theme_data['id']
        theme_data['type'] = 'theme'
        theme_data['created_at'] = datetime.utcnow()
        
        settings_collection.insert_one(theme_data)
        return theme_to_dict(theme_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def theme_to_dict(theme: dict) -> dict:
    """Convert MongoDB theme document to API response format"""
    if theme:
        theme['id'] = str(theme['_id'])
        del theme['_id']
        if 'type' in theme:
            del theme['type']
    return theme

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)