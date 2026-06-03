import './ProductTable.css';

const ProductTable = ({ products, onEdit, onDelete, isLoading }) => {
  if (isLoading && products.length === 0) {
    return null;
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products found. Add your first product to get started.</p>
      </div>
    );
  }

  return (
    <div className="product-table-container">
      <table className="product-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Quantity In Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>${parseFloat(product.price).toFixed(2)}</td>
              <td>{product.stock_quantity}</td>
              <td className="actions-cell">
                <button
                  onClick={() => onEdit(product)}
                  className="btn-action btn-edit"
                  disabled={isLoading}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="btn-action btn-delete"
                  disabled={isLoading}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
