import { useState, useEffect } from 'react';
import client from '../../api/client';
import Loading from '../../components/Common/Loading';
import Error from '../../components/Common/Error';
import SummaryCard from '../../components/Dashboard/SummaryCard';
import LowStockProductsTable from '../../components/Dashboard/LowStockProductsTable';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ?? 'Failed to load dashboard data.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <Error message={error} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <div className="empty-state">
          <p>No dashboard data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="summary-cards-grid">
        <SummaryCard
          title="Total Products"
          value={dashboardData.total_products}
          icon="📦"
        />
        <SummaryCard
          title="Total Customers"
          value={dashboardData.total_customers}
          icon="👥"
        />
        <SummaryCard
          title="Total Orders"
          value={dashboardData.total_orders}
          icon="🛒"
        />
      </div>

      <div className="low-stock-section">
        <h2>Low Stock Products</h2>
        <LowStockProductsTable products={dashboardData.low_stock_products} />
      </div>
    </div>
  );
};

export default Dashboard;
