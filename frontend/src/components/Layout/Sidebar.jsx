import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Inventory System</h2>
      </div>
      <nav className="sidebar-nav">
        <Link
          to="/"
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <Link
          to="/products"
          className={`nav-link ${isActive('/products') ? 'active' : ''}`}
        >
          Products
        </Link>
        <Link
          to="/customers"
          className={`nav-link ${isActive('/customers') ? 'active' : ''}`}
        >
          Customers
        </Link>
        <Link
          to="/orders"
          className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
        >
          Orders
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
