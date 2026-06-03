import { useState, useEffect } from 'react';
import client from '../../api/client';
import Loading from '../../components/Common/Loading';
import Error from '../../components/Common/Error';
import Notification from '../../components/Common/Notification';
import ProductForm from '../../components/Products/ProductForm';
import ProductTable from '../../components/Products/ProductTable';
import './Products.css';

const extractErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (!detail) {
    return null;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item) {
          return null;
        }
        if (typeof item === 'string') {
          return item;
        }
        return item.msg ?? null;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join('\n');
    }
  }

  if (typeof detail === 'object' && detail.msg) {
    return detail.msg;
  }

  return null;
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/products');
      setProducts(response.data.items || []);
    } catch (err) {
      const errorMessage =
        extractErrorMessage(err) ?? 'Failed to fetch products. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setIsFormVisible(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (editingProduct) {
        // Update existing product
        await client.put(`/products/${editingProduct.id}`, formData);
        showNotification('Product updated successfully.');
      } else {
        // Create new product
        await client.post('/products', formData);
        showNotification('Product created successfully.');
      }
      await fetchProducts();
      setIsFormVisible(false);
      setEditingProduct(null);
    } catch (err) {
      const errorMessage =
        extractErrorMessage(err) ?? 'Failed to save product.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsFormVisible(true);
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setEditingProduct(null);
    setError(null);
  };

  const handleDeleteClick = (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    client
      .delete(`/products/${product.id}`)
      .then(() => {
        showNotification('Product deleted successfully.');
        fetchProducts();
      })
      .catch((err) => {
        const errorMessage =
          extractErrorMessage(err) ?? 'Failed to delete product.';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Products</h1>
        {!isFormVisible && (
          <button
            onClick={handleAddClick}
            className="btn btn-primary"
            disabled={isLoading}
          >
            Add Product
          </button>
        )}
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {error && <Error message={error} />}

      {isFormVisible && (
        <div className="form-section">
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <ProductForm
            onSubmit={handleFormSubmit}
            initialData={editingProduct}
            onCancel={handleFormCancel}
            isLoading={isLoading}
          />
        </div>
      )}

      {isLoading && products.length === 0 && !isFormVisible ? (
        <Loading />
      ) : (
        <ProductTable
          products={products}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Products;
