import './Error.css';

const Error = ({ message }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-message">{message || 'An error occurred'}</p>
    </div>
  );
};

export default Error;
