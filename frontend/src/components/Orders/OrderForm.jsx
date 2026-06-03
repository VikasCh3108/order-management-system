import { useState, useEffect } from 'react';
import client from '../../api/client';
import Loading from '../Common/Loading';
import Error from '../Common/Error';
import './OrderForm.css';

const OrderForm = ({ onSubmit, onCancel, isLoading }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    items: [],
  });
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    quantity: '',
  });
  const [errors, setErrors] = useState({});
  const [duplicateError, setDuplicateError] = useState('');
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingData(true);
      try {
        const [customersRes, productsRes] = await Promise.all([
          client.get('/customers'),
          client.get('/products'),
        ]);
        setCustomers(customersRes.data.items || []);
        setProducts(productsRes.data.items || []);
        setDataError(null);
      } catch (err) {
        setDataError('Failed to load customer and product data. Please refresh the page.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadInitialData();
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomerChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      customer_id: e.target.value,
    }));
    if (errors.customer_id) {
      setErrors((prev) => ({
        ...prev,
        customer_id: '',
      }));
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({
      ...prev,
      [name]: value,
    }));
    setDuplicateError('');
  };

  const handleAddItem = () => {
    setDuplicateError('');

    if (!currentItem.product_id || !currentItem.quantity) {
      return;
    }

    const quantity = parseInt(currentItem.quantity);
    if (quantity <= 0) {
      return;
    }

    // Check for duplicate product
    const duplicate = formData.items.find(
      (item) => item.product_id === parseInt(currentItem.product_id)
    );

    if (duplicate) {
      setDuplicateError('This product has already been added to the order.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: parseInt(currentItem.product_id),
          quantity: quantity,
        },
      ],
    }));

    setCurrentItem({ product_id: '', quantity: '' });
  };

  const handleRemoveItem = (product_id) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.product_id !== product_id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      customer_id: parseInt(formData.customer_id),
      items: formData.items,
    };

    onSubmit(payload);
  };

  const handleCancel = () => {
    onCancel();
  };

  if (isLoadingData) {
    return <Loading />;
  }

  return (
    <form className="order-form" onSubmit={handleSubmit}>
      {dataError && <Error message={dataError} />}
      <div className="form-group">
        <label htmlFor="customer">Customer *</label>
        <select
          id="customer"
          name="customer_id"
          value={formData.customer_id}
          onChange={handleCustomerChange}
          className={`form-input ${errors.customer_id ? 'input-error' : ''}`}
          disabled={isLoading}
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name}
            </option>
          ))}
        </select>
        {errors.customer_id && <span className="error-text">{errors.customer_id}</span>}
      </div>

      <div className="order-items-section">
        <h3>Order Items</h3>

        <div className="add-item-row">
          <div className="form-group product-select">
            <label htmlFor="product">Product *</label>
            <select
              id="product"
              name="product_id"
              value={currentItem.product_id}
              onChange={handleItemChange}
              className="form-input"
              disabled={isLoading}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku}) - ${parseFloat(product.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group quantity-input">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={currentItem.quantity}
              onChange={handleItemChange}
              min="1"
              className="form-input"
              placeholder="Qty"
              disabled={isLoading}
            />
          </div>

          <div className="form-group add-button-wrapper">
            <label className="invisible-label" htmlFor="add-item-button" aria-hidden="true">
              Add
            </label>
            <button
              id="add-item-button"
              type="button"
              onClick={handleAddItem}
              className="btn btn-secondary add-item-btn"
              disabled={isLoading}
            >
              Add Item
            </button>
          </div>
        </div>

        {duplicateError && <div className="error-text">{duplicateError}</div>}

        {formData.items.length > 0 && (
          <div className="items-list">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item) => {
                  const product = products.find((p) => p.id === item.product_id);
                  return (
                    <tr key={item.product_id}>
                      <td>{product ? product.name : 'Unknown'}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="btn-action btn-remove"
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {errors.items && <span className="error-text">{errors.items}</span>}
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Order'}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;
