import './SummaryCard.css';

const SummaryCard = ({ title, value, icon }) => {
  return (
    <div className="summary-card">
      <div className="summary-card-icon">{icon}</div>
      <div className="summary-card-content">
        <h3 className="summary-card-title">{title}</h3>
        <p className="summary-card-value">{value}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
