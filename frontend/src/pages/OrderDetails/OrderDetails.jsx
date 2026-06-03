import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Common/Loading';
import Error from '../../components/Common/Error';
import OrderItemsTable from '../../components/Orders/OrderItemsTable';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supportError, setSupportError] = useState(null);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Order not found.');
      } else {
        setError('Failed to load order details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        client.get('/products'),
        client.get('/customers'),
      ]);
      setProducts(productsRes.data.items || []);
      const customerMap = (customersRes.data.items || []).reduce((acc, customer) => {
        acc[customer.id] = customer.full_name;
        return acc;
      }, {});
      setCustomersMap(customerMap);
      setSupportError(null);
    } catch (err) {
      setSupportError('Failed to load reference data. Product and customer names may be incomplete.');
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchSupportData();
  }, [id]);

  const handleBackClick = () => {
    navigate('/orders');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="order-details-page">
        <div className="page-header">
          <h1>Order Details</h1>
          <button onClick={handleBackClick} className="btn btn-secondary">
            Back to Orders
          </button>
        </div>
        <Error message={error} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="page-header">
          <h1>Order Details</h1>
          <button onClick={handleBackClick} className="btn btn-secondary">
            Back to Orders
          </button>
        </div>
        <div className="empty-state">
          <p>Order not available.</p>
        </div>
      </div>
    );
  }

  const customerName = customersMap[order.customer_id] || `Customer #${order.customer_id}`;

  return (
    <div className="order-details-page">
      <div className="page-header">
        <h1>Order Details</h1>
        <button onClick={handleBackClick} className="btn btn-secondary">
          Back to Orders
        </button>
      </div>

      {supportError && <Error message={supportError} />}

      <div className="order-info-section">
        <h2>Order Information</h2>
        <div className="order-info-grid">
          <div className="info-item">
            <label>Order ID:</label>
            <span>#{order.id}</span>
          </div>
          <div className="info-item">
            <label>Customer:</label>
            <span>{customerName}</span>
          </div>
          <div className="info-item">
            <label>Total Amount:</label>
            <span className="amount">${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
          <div className="info-item">
            <label>Created Date:</label>
            <span>{formatDate(order.created_at)}</span>
          </div>
        </div>
      </div>

      <OrderItemsTable orderItems={order.order_items} products={products} />
    </div>
  );
};

export default OrderDetails;
