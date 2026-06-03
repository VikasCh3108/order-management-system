import './LowStockProductsTable.css';

const LowStockProductsTable = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <div className="low-stock-empty-state">
        <p>No low-stock products.</p>
      </div>
    );
  }

  return (
    <div className="low-stock-table-container">
      <table className="low-stock-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Stock Quantity</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td className="stock-quantity">{product.stock_quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LowStockProductsTable;
