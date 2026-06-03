import './OrderItemsTable.css';

const OrderItemsTable = ({ orderItems, products }) => {
  if (!orderItems || orderItems.length === 0) {
    return (
      <div className="empty-state">
        <p>No items in this order.</p>
      </div>
    );
  }

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };

  return (
    <div className="order-items-table-container">
      <h3>Ordered Products</h3>
      <table className="order-items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item) => (
            <tr key={item.id}>
              <td>{getProductName(item.product_id)}</td>
              <td>{item.quantity}</td>
              <td>${parseFloat(item.unit_price).toFixed(2)}</td>
              <td>${parseFloat(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderItemsTable;
