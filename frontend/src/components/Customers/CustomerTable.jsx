import './CustomerTable.css';

const CustomerTable = ({ customers, onDelete, isLoading }) => {
  if (isLoading && customers.length === 0) {
    return null;
  }

  if (customers.length === 0) {
    return (
      <div className="empty-state">
        <p>No customers found. Add your first customer to get started.</p>
      </div>
    );
  }

  return (
    <div className="customer-table-container">
      <table className="customer-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.full_name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td className="actions-cell">
                <button
                  onClick={() => onDelete(customer)}
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

export default CustomerTable;
