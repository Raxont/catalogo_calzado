import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [shoes, setShoes] = useState([]);
  const [filteredShoes, setFilteredShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    sole: '',
    color: '',
    brand: '',
    search: '',
    minPrice: '',
    maxPrice: ''
  });
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    soles: [],
    colors: [],
    brands: [],
    materials: [],
    priceRange: { min: 0, max: 1000 }
  });
  
  // Theme states
  const [currentTheme, setCurrentTheme] = useState('nike_classic');
  const [themes, setThemes] = useState([]);
  
  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddShoe, setShowAddShoe] = useState(false);
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  
  // New shoe form state
  const [newShoe, setNewShoe] = useState({
    name: '',
    category: '',
    sole: '',
    color: '',
    reference: '',
    model: '',
    price: '',
    size: '',
    material: '',
    description: '',
    brand: '',
    image_base64: ''
  });
  
  // Custom theme state
  const [customTheme, setCustomTheme] = useState({
    theme_name: '',
    primary_color: '#000000',
    secondary_color: '#ffffff',
    background_color: '#f8f9fa',
    text_color: '#212529',
    accent_color: '#ff6b35'
  });
  
  // Selected shoe for detail view
  const [selectedShoe, setSelectedShoe] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Load shoes and filter options
  useEffect(() => {
    loadShoes();
    loadFilterOptions();
    loadThemes();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [shoes, filters]);

  // Load shoes from API
  const loadShoes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/shoes`);
      if (!response.ok) throw new Error('Failed to load shoes');
      const data = await response.json();
      setShoes(data);
      setError('');
    } catch (err) {
      setError('Error loading shoes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/filters/options`);
      if (!response.ok) throw new Error('Failed to load filter options');
      const data = await response.json();
      setFilterOptions(data);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  // Load themes
  const loadThemes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/themes`);
      if (!response.ok) throw new Error('Failed to load themes');
      const data = await response.json();
      setThemes([...data.default_themes, ...data.custom_themes]);
    } catch (err) {
      console.error('Error loading themes:', err);
    }
  };

  // Apply filters to shoes
  const applyFilters = () => {
    let filtered = [...shoes];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(shoe => 
        shoe.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Apply sole filter
    if (filters.sole) {
      filtered = filtered.filter(shoe => 
        shoe.sole.toLowerCase().includes(filters.sole.toLowerCase())
      );
    }

    // Apply color filter
    if (filters.color) {
      filtered = filtered.filter(shoe => 
        shoe.color.toLowerCase().includes(filters.color.toLowerCase())
      );
    }

    // Apply brand filter
    if (filters.brand) {
      filtered = filtered.filter(shoe => 
        shoe.brand.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(shoe => 
        shoe.name.toLowerCase().includes(searchTerm) ||
        shoe.description.toLowerCase().includes(searchTerm) ||
        shoe.model.toLowerCase().includes(searchTerm) ||
        shoe.reference.toLowerCase().includes(searchTerm) ||
        shoe.material.toLowerCase().includes(searchTerm)
      );
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(shoe => shoe.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(shoe => shoe.price <= parseFloat(filters.maxPrice));
    }

    setFilteredShoes(filtered);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      sole: '',
      color: '',
      brand: '',
      search: '',
      minPrice: '',
      maxPrice: ''
    });
  };

  // Admin login
  const handleAdminLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword })
      });

      if (response.ok) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminPassword('');
      } else {
        alert('Contraseña incorrecta');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewShoe(prev => ({
          ...prev,
          image_base64: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new shoe
  const handleAddShoe = async (e) => {
    e.preventDefault();
    
    try {
      const shoeData = { ...newShoe };
      
      // Convert price to number if provided, otherwise set to 0
      if (shoeData.price) {
        shoeData.price = parseFloat(shoeData.price);
      } else {
        shoeData.price = 0;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/admin/shoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify(shoeData)
      });

      if (response.ok) {
        const addedShoe = await response.json();
        setShoes(prev => [addedShoe, ...prev]);
        setNewShoe({
          name: '',
          category: '',
          sole: '',
          color: '',
          reference: '',
          model: '',
          price: '',
          size: '',
          material: '',
          description: '',
          brand: '',
          image_base64: ''
        });
        setShowAddShoe(false);
        loadFilterOptions(); // Reload filter options
        alert('Zapato agregado exitosamente!');
      } else {
        alert('Error al agregar el zapato');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // Add custom theme
  const handleAddCustomTheme = async (e) => {
    e.preventDefault();
    
    if (!customTheme.theme_name.trim()) {
      alert('El nombre del tema es requerido');
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/themes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify(customTheme)
      });

      if (response.ok) {
        const newTheme = await response.json();
        setThemes(prev => [...prev, newTheme]);
        setCustomTheme({
          theme_name: '',
          primary_color: '#000000',
          secondary_color: '#ffffff',
          background_color: '#f8f9fa',
          text_color: '#212529',
          accent_color: '#ff6b35'
        });
        setShowCustomTheme(false);
        alert('Tema personalizado creado exitosamente!');
      } else {
        alert('Error al crear el tema');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // Get current theme styles
  const getCurrentTheme = () => {
    const theme = themes.find(t => t.id === currentTheme);
    return theme || themes[0] || {};
  };

  const theme = getCurrentTheme();

  // Apply theme styles
  const themeStyles = {
    '--primary-color': theme.primary_color || '#000000',
    '--secondary-color': theme.secondary_color || '#ffffff',
    '--background-color': theme.background_color || '#f8f9fa',
    '--text-color': theme.text_color || '#212529',
    '--accent-color': theme.accent_color || '#ff6b35'
  };

  return (
    <div className="app" style={themeStyles}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">ShoeCatalog</h1>
          
          <div className="header-controls">
            {/* Theme Selector */}
            <select 
              value={currentTheme} 
              onChange={(e) => setCurrentTheme(e.target.value)}
              className="theme-selector"
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
            
            {/* Admin Button */}
            {!isAdmin ? (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="admin-btn"
              >
                Admin
              </button>
            ) : (
              <div className="admin-controls">
                <button 
                  onClick={() => setShowAddShoe(true)}
                  className="add-shoe-btn"
                >
                  Agregar Zapato
                </button>
                <button 
                  onClick={() => setShowCustomTheme(true)}
                  className="add-theme-btn"
                >
                  Crear Tema
                </button>
                <button 
                  onClick={() => setIsAdmin(false)}
                  className="logout-btn"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar zapatos..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters-grid">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {filterOptions.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select
            value={filters.sole}
            onChange={(e) => handleFilterChange('sole', e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las suelas</option>
            {filterOptions.soles.map(sole => (
              <option key={sole} value={sole}>{sole}</option>
            ))}
          </select>
          
          <select
            value={filters.color}
            onChange={(e) => handleFilterChange('color', e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los colores</option>
            {filterOptions.colors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
          
          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las marcas</option>
            {filterOptions.brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          
          <input
            type="number"
            placeholder="Precio mín"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="price-input"
          />
          
          <input
            type="number"
            placeholder="Precio máx"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="price-input"
          />
          
          <button onClick={clearFilters} className="clear-filters-btn">
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div className="loading">Cargando zapatos...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="results-info">
              {filteredShoes.length} zapatos encontrados
            </div>
            
            <div className="shoes-grid">
              {filteredShoes.map(shoe => (
                <div key={shoe.id} className="shoe-card" onClick={() => setSelectedShoe(shoe)}>
                  <div className="shoe-image">
                    {shoe.image_base64 ? (
                      <img src={shoe.image_base64} alt={shoe.name} />
                    ) : (
                      <div className="no-image">Sin imagen</div>
                    )}
                  </div>
                  <div className="shoe-info">
                    <h3 className="shoe-name">{shoe.name}</h3>
                    <p className="shoe-brand">{shoe.brand}</p>
                    <p className="shoe-price">${shoe.price}</p>
                    <div className="shoe-details">
                      <span className="shoe-category">{shoe.category}</span>
                      <span className="shoe-color">{shoe.color}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Login Admin</h2>
            <input
              type="password"
              placeholder="Contraseña"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="admin-password-input"
            />
            <div className="modal-actions">
              <button onClick={handleAdminLogin} className="login-btn">
                Entrar
              </button>
              <button onClick={() => setShowAdminLogin(false)} className="cancel-btn">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shoe Modal */}
      {showAddShoe && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <h2>Agregar Nuevo Zapato</h2>
            <form onSubmit={handleAddShoe} className="add-shoe-form">
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Nombre (opcional)"
                  value={newShoe.name}
                  onChange={(e) => setNewShoe(prev => ({...prev, name: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Marca (opcional)"
                  value={newShoe.brand}
                  onChange={(e) => setNewShoe(prev => ({...prev, brand: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Categoría (opcional)"
                  value={newShoe.category}
                  onChange={(e) => setNewShoe(prev => ({...prev, category: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Suela (opcional)"
                  value={newShoe.sole}
                  onChange={(e) => setNewShoe(prev => ({...prev, sole: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Color (opcional)"
                  value={newShoe.color}
                  onChange={(e) => setNewShoe(prev => ({...prev, color: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Referencia (opcional)"
                  value={newShoe.reference}
                  onChange={(e) => setNewShoe(prev => ({...prev, reference: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Modelo (opcional)"
                  value={newShoe.model}
                  onChange={(e) => setNewShoe(prev => ({...prev, model: e.target.value}))}
                />
                <input
                  type="number"
                  placeholder="Precio (opcional)"
                  value={newShoe.price}
                  onChange={(e) => setNewShoe(prev => ({...prev, price: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Talla (opcional)"
                  value={newShoe.size}
                  onChange={(e) => setNewShoe(prev => ({...prev, size: e.target.value}))}
                />
                <input
                  type="text"
                  placeholder="Material (opcional)"
                  value={newShoe.material}
                  onChange={(e) => setNewShoe(prev => ({...prev, material: e.target.value}))}
                />
              </div>
              
              <textarea
                placeholder="Descripción (opcional)"
                value={newShoe.description}
                onChange={(e) => setNewShoe(prev => ({...prev, description: e.target.value}))}
                className="description-textarea"
              />
              
              <div className="image-upload">
                <label htmlFor="image-upload" className="image-upload-label">
                  {newShoe.image_base64 ? 'Cambiar imagen' : 'Subir imagen'}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-upload-input"
                />
                {newShoe.image_base64 && (
                  <img src={newShoe.image_base64} alt="Preview" className="image-preview" />
                )}
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="add-btn">
                  Agregar Zapato
                </button>
                <button type="button" onClick={() => setShowAddShoe(false)} className="cancel-btn">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Theme Modal */}
      {showCustomTheme && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Crear Tema Personalizado</h2>
            <form onSubmit={handleAddCustomTheme} className="custom-theme-form">
              <input
                type="text"
                placeholder="Nombre del tema"
                value={customTheme.theme_name}
                onChange={(e) => setCustomTheme(prev => ({...prev, theme_name: e.target.value}))}
                required
                className="theme-name-input"
              />
              
              <div className="color-inputs-grid">
                <div className="color-input-group">
                  <label>Color Primario:</label>
                  <input
                    type="color"
                    value={customTheme.primary_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, primary_color: e.target.value}))}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={customTheme.primary_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, primary_color: e.target.value}))}
                    className="color-text-input"
                  />
                </div>
                
                <div className="color-input-group">
                  <label>Color Secundario:</label>
                  <input
                    type="color"
                    value={customTheme.secondary_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, secondary_color: e.target.value}))}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={customTheme.secondary_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, secondary_color: e.target.value}))}
                    className="color-text-input"
                  />
                </div>
                
                <div className="color-input-group">
                  <label>Color de Fondo:</label>
                  <input
                    type="color"
                    value={customTheme.background_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, background_color: e.target.value}))}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={customTheme.background_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, background_color: e.target.value}))}
                    className="color-text-input"
                  />
                </div>
                
                <div className="color-input-group">
                  <label>Color de Texto:</label>
                  <input
                    type="color"
                    value={customTheme.text_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, text_color: e.target.value}))}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={customTheme.text_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, text_color: e.target.value}))}
                    className="color-text-input"
                  />
                </div>
                
                <div className="color-input-group">
                  <label>Color de Acento:</label>
                  <input
                    type="color"
                    value={customTheme.accent_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, accent_color: e.target.value}))}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={customTheme.accent_color}
                    onChange={(e) => setCustomTheme(prev => ({...prev, accent_color: e.target.value}))}
                    className="color-text-input"
                  />
                </div>
              </div>
              
              <div className="theme-preview" style={{
                backgroundColor: customTheme.background_color,
                color: customTheme.text_color,
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${customTheme.primary_color}`,
                marginTop: '1rem'
              }}>
                <h3 style={{ color: customTheme.primary_color }}>Vista Previa del Tema</h3>
                <p>Texto normal con color: {customTheme.text_color}</p>
                <button style={{
                  backgroundColor: customTheme.accent_color,
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}>
                  Botón de Acento
                </button>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="add-btn">
                  Crear Tema
                </button>
                <button type="button" onClick={() => setShowCustomTheme(false)} className="cancel-btn">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shoe Detail Modal */}
      {selectedShoe && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="shoe-detail">
              <div className="shoe-detail-image">
                {selectedShoe.image_base64 ? (
                  <img src={selectedShoe.image_base64} alt={selectedShoe.name} />
                ) : (
                  <div className="no-image">Sin imagen</div>
                )}
              </div>
              <div className="shoe-detail-info">
                <h2>{selectedShoe.name}</h2>
                <p className="brand">{selectedShoe.brand}</p>
                <p className="price">${selectedShoe.price}</p>
                
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Categoría:</strong> {selectedShoe.category}
                  </div>
                  <div className="detail-item">
                    <strong>Color:</strong> {selectedShoe.color}
                  </div>
                  <div className="detail-item">
                    <strong>Suela:</strong> {selectedShoe.sole}
                  </div>
                  <div className="detail-item">
                    <strong>Talla:</strong> {selectedShoe.size}
                  </div>
                  <div className="detail-item">
                    <strong>Material:</strong> {selectedShoe.material}
                  </div>
                  <div className="detail-item">
                    <strong>Modelo:</strong> {selectedShoe.model}
                  </div>
                  <div className="detail-item">
                    <strong>Referencia:</strong> {selectedShoe.reference}
                  </div>
                </div>
                
                <div className="description">
                  <strong>Descripción:</strong>
                  <p>{selectedShoe.description}</p>
                </div>
              </div>
            </div>
            
            <button onClick={() => setSelectedShoe(null)} className="close-btn">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;