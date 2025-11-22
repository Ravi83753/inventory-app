import React, { useEffect, useState, useRef, useCallback } from 'react';
// Icons
import { FiSearch, FiPlus, FiUpload, FiDownload, FiEdit2, FiTrash2, FiSave, FiX, FiClock } from 'react-icons/fi';
// API
import { fetchProducts, importCSV, updateProduct, exportCSV, deleteProduct, fetchHistory, addProduct } from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(''); 
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // History Sidebar State
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', unit: 'Units', category: 'Electronics', brand: '', stock: 0, status: 'In Stock'
  });

  const fileInputRef = useRef(null); 

  const loadProducts = useCallback(async () => {
    const data = await fetchProducts(search, category);
    setProducts(data);
  }, [search, category]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = ['All Categories', ...new Set(products.map(p => p.category))];

  // --- HANDLERS ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('csvFile', file);
    try {
      await importCSV(formData);
      alert('Import Successful!');
      loadProducts();
      event.target.value = null; 
    } catch (error) {
      alert('Import Failed');
    }
  };

  const handleExport = async () => {
    try { await exportCSV(); } catch (error) { alert("Export failed"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try { await deleteProduct(id); loadProducts(); } 
      catch (error) { alert("Failed to delete product"); }
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditFormData(product);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleSaveClick = async () => {
    try {
      const optimizedProducts = products.map((p) => p.id === editingId ? editFormData : p);
      setProducts(optimizedProducts);
      setEditingId(null);
      await updateProduct(editingId, editFormData);
    } catch (error) {
      alert("Failed to save changes");
      loadProducts();
    }
  };

  const handleHistoryClick = async (product) => {
    setSelectedProduct(product);
    setShowHistory(true);
    const logs = await fetchHistory(product.id);
    setHistoryLogs(logs);
  };

  // --- ADD PRODUCT LOGIC ---
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // Auto-set status based on stock if not manually set
      const productToSend = { 
        ...newProduct, 
        status: newProduct.stock > 0 ? 'In Stock' : 'Out of Stock' 
      };
      
      await addProduct(productToSend);
      setIsAddModalOpen(false);
      setNewProduct({ name: '', unit: 'Units', category: 'Electronics', brand: '', stock: 0, status: 'In Stock' }); // Reset form
      loadProducts(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.error || "Failed to add product");
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>Product Inventory</h1>
        <p>Manage your products and track inventory changes</p>
      </header>

      <div className="controls-toolbar">
        <div className="search-container">
          <FiSearch className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
        </div>

        <div className="actions-group">
          <select 
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
          >
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>

          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <FiPlus size={18} /> Add New Product
          </button>

          <input type="file" accept=".csv" hidden ref={fileInputRef} onChange={handleFileUpload} />
          
          <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
            <FiUpload size={18} /> Import
          </button>

          <button className="btn btn-secondary" onClick={handleExport}>
            <FiDownload size={18} /> Export
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <img src={product.image_url} alt={product.name} className="thumb" onError={(e)=>e.target.style.display='none'}/>
                </td>

                {editingId === product.id ? (
                  <>
                    <td><input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="edit-input"/></td>
                    <td><input type="text" name="unit" value={editFormData.unit} onChange={handleEditChange} className="edit-input" style={{width: '60px'}}/></td>
                    <td><input type="text" name="category" value={editFormData.category} onChange={handleEditChange} className="edit-input"/></td>
                    <td><input type="text" name="brand" value={editFormData.brand} onChange={handleEditChange} className="edit-input"/></td>
                    <td><input type="number" name="stock" value={editFormData.stock} onChange={handleEditChange} className="edit-input" style={{width: '80px'}}/></td>
                    <td> - </td>
                    <td>
                      <button className="action-btn" onClick={handleSaveClick} style={{color: '#166534', borderColor: '#dcfce7', background: '#f0fdf4'}}><FiSave size={18}/></button>
                      <button className="action-btn delete-btn" onClick={() => setEditingId(null)}><FiX size={18}/></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="product-name">{product.name}</td>
                    <td>{product.unit || 'Units'}</td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td className="stock-count">{product.stock}</td>
                    <td>
                      <span className={`badge ${product.stock > 0 ? 'badge-green' : 'badge-red'}`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => handleEditClick(product)} title="Edit"><FiEdit2 size={18} /></button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(product.id)} title="Delete"><FiTrash2 size={18} /></button>
                      <button className="action-btn" onClick={() => handleHistoryClick(product)} title="History"><FiClock size={18} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      {isAddModalOpen && (
        <div className="sidebar-overlay">
           <div className="modal-content">
             <div className="modal-header">
               <h2>Add New Product</h2>
               <button onClick={() => setIsAddModalOpen(false)} className="close-btn"><FiX size={24}/></button>
             </div>
             <form onSubmit={handleAddSubmit} className="add-form">
               <div className="form-group">
                 <label>Name</label>
                 <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
               </div>
               <div className="form-row">
                 <div className="form-group">
                   <label>Category</label>
                   <input type="text" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                 </div>
                 <div className="form-group">
                   <label>Brand</label>
                   <input type="text" value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} />
                 </div>
               </div>
               <div className="form-row">
                 <div className="form-group">
                   <label>Stock</label>
                   <input type="number" required min="0" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
                 </div>
                 <div className="form-group">
                   <label>Unit</label>
                   <input type="text" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} />
                 </div>
               </div>
               <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '10px'}}>Create Product</button>
             </form>
           </div>
        </div>
      )}

      {/* --- HISTORY SIDEBAR --- */}
      {showHistory && (
        <div className="sidebar-overlay" onClick={() => setShowHistory(false)}>
          <div className="sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h2>History: {selectedProduct?.name}</h2>
              <button onClick={() => setShowHistory(false)} className="close-btn"><FiX size={24}/></button>
            </div>
            <div className="sidebar-content">
              {historyLogs.length === 0 ? <p>No history available.</p> : (
                <ul className="history-list">
                  {historyLogs.map((log) => (
                    <li key={log.id} className="history-item">
                      <div className="history-header">
                        <span className="action-type">{log.action_type}</span>
                        <span className="date">{new Date(log.change_date).toLocaleString()}</span>
                      </div>
                      <div className="history-details">
                        <span>Stock: <strong>{log.old_stock}</strong> ➝ <strong>{log.new_stock}</strong></span>
                        <span className="user">By: {log.changed_by}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;