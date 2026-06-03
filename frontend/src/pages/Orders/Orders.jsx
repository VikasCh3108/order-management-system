import { useState, useEffect } from 'react';
import client from '../../api/client';
import Loading from '../../components/Common/Loading';
import Error from '../../components/Common/Error';
import Notification from '../../components/Common/Notification';
import OrderForm from '../../components/Orders/OrderForm';
import OrderTable from '../../components/Orders/OrderTable';
import './Orders.css';

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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [customersMap, setCustomersMap] = useState({});
  const [customerError, setCustomerError] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/orders');
      setOrders(response.data.items || []);
    } catch (err) {
      const errorMessage =
        extractErrorMessage(err) ?? 'Failed to fetch orders. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await client.get('/customers');
      const map = (response.data.items || []).reduce((acc, customer) => {
        acc[customer.id] = customer.full_name;
        return acc;
      }, {});
      setCustomersMap(map);
      setCustomerError(null);
    } catch (err) {
      const errorMessage =
        extractErrorMessage(err) ?? 'Failed to load customers. Customer names may be unavailable.';
      setCustomerError(errorMessage);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleAddClick = () => {
    setIsFormVisible(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      await client.post('/orders', formData);
      showNotification('Order created successfully.');
      await fetchOrders();
      setIsFormVisible(false);
    } catch (err) {
      const errorMessage =
        extractErrorMessage(err) ?? 'Failed to create order.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setError(null);
  };

  const ordersWithCustomerNames = orders.map((order) => ({
    ...order,
    customer_name: customersMap[order.customer_id] || `Customer #${order.customer_id}`,
  }));

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Orders</h1>
        {!isFormVisible && (
          <button
            onClick={handleAddClick}
            className="btn btn-primary"
            disabled={isLoading}
          >
            Create Order
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
      {customerError && <Error message={customerError} />}

      {isFormVisible && (
        <div className="form-section">
          <h2>Create New Order</h2>
          <OrderForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoading}
          />
        </div>
      )}

      {isLoading && orders.length === 0 && !isFormVisible ? (
        <Loading />
      ) : (
        <OrderTable orders={ordersWithCustomerNames} isLoading={isLoading} />
      )}
    </div>
  );
};

export default Orders;
