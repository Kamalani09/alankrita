import { Link } from 'react-router-dom';
import { RequestState } from '../../components/admin/AdminUI.jsx';
import { useAdminData } from '../../hooks/useAdminData.js';

const metrics = [
  ['total', 'Total products'], ['inStock', 'In stock'],
  ['lowStock', 'Low stock'], ['soldOut', 'Sold out'], ['featured', 'Featured'],
];

export function Dashboard() {
  const stats = useAdminData('/admin/stats');
  return (
    <>
      <div className="admin-heading"><h1>Dashboard</h1><Link className="button button--primary" to="products/new">Add product</Link></div>
      <RequestState {...stats} retry={stats.reload} />
      {stats.data && (
        <dl className="admin-metrics">
          {metrics.map(([key, label]) => (
            <div className="admin-panel" key={key}><dt>{label}</dt><dd>{stats.data[key]}</dd></div>
          ))}
        </dl>
      )}
      {stats.data?.topEnquiredProducts && (
        <section className="admin-panel admin-enquiry-summary">
          <div className="admin-heading"><h2>Most enquired products</h2><Link to="enquiries">View enquiry log</Link></div>
          {stats.data.topEnquiredProducts.length > 0 ? <ol>
            {stats.data.topEnquiredProducts.map(({ _id, name, productCode, clicks }) => (
              <li key={_id}>{name} ({productCode}) · {clicks} {clicks === 1 ? 'click' : 'clicks'}</li>
            ))}
          </ol> : <p>No product enquiries recorded yet.</p>}
        </section>
      )}
    </>
  );
}
