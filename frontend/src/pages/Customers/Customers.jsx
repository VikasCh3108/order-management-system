import { useState, useEffect } from 'react';
import client from '../../api/client';
import Loading from '../../components/Common/Loading';
import Error from '../../components/Common/Error';
import Notification from '../../components/Common/Notification';
import CustomerForm from '../../components/Customers/CustomerForm';
import CustomerTable from '../../components/Customers/CustomerTable';
import './Customers.css';

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

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get('/customers');
      setCustomers(response.data.items || []);
    } catch (err) {
      const errorMessage =
        extractErrorMessage(err) ?? 'Failed to fetch customers. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
      await client.post('/customers', formData);
      showNotification('Customer created successfully.');
      await fetchCustomers();
      setIsFormVisible(false);
    } catch (err) {
      const errorMessage =
        extractErrorMessage(err) ?? 'Failed to save customer.';
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

  const handleDeleteClick = (customer) => {
    if (!window.confirm(`Are you sure you want to delete "${customer.full_name}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    client
      .delete(`/customers/${customer.id}`)
      .then(() => {
        showNotification('Customer deleted successfully.');
        fetchCustomers();
      })
      .catch((err) => {
        const errorMessage =
          extractErrorMessage(err) ?? 'Failed to delete customer.';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1>Customers</h1>
        {!isFormVisible && (
          <button
            onClick={handleAddClick}
            className="btn btn-primary"
            disabled={isLoading}
          >
            Add Customer
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

      {isFormVisible && (
        <div className="form-section">
          <h2>Add New Customer</h2>
          <CustomerForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoading}
          />
        </div>
      )}

      {isLoading && customers.length === 0 && !isFormVisible ? (
        <Loading />
      ) : (
        <CustomerTable
          customers={customers}
          onDelete={handleDeleteClick}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Customers;
