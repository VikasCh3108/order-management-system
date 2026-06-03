import { useNavigate } from 'react-router-dom';
import './OrderTable.css';

const OrderTable = ({ orders, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading && orders.length === 0) {
    return null;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <p>No orders found. Create your first order to get started.</p>
      </div>
    );
  }

  const handleViewDetails = (order) => {
    navigate(`/orders/${order.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="order-table-container">
      <table className="order-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total Amount</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{order.customer_name}</td>
              <td>${parseFloat(order.total_amount).toFixed(2)}</td>
              <td>{formatDate(order.created_at)}</td>
              <td className="actions-cell">
                <button
                  onClick={() => handleViewDetails(order)}
                  className="btn-action btn-view"
                  disabled={isLoading}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
