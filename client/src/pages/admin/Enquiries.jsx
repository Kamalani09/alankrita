import { Link, useSearchParams } from 'react-router-dom';
import { RequestState } from '../../components/admin/AdminUI.jsx';
import { useAdminData } from '../../hooks/useAdminData.js';

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export function Enquiries() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const result = useAdminData('/admin/enquiries?' + new URLSearchParams({ page }));
  const items = result.data?.items ?? [];

  return (
    <>
      <div className="admin-heading"><h1>WhatsApp enquiries</h1><Link className="admin-action-link" to="/admin">Back to dashboard</Link></div>
      <p>Each entry records a product’s WhatsApp link being opened.</p>
      <RequestState {...result} retry={result.reload} />
      {result.data && (items.length ? (
        <div className="admin-table-wrap admin-panel">
          <table className="admin-table">
            <thead><tr><th scope="col">Product</th><th scope="col">Product code</th><th scope="col">Clicked at</th></tr></thead>
            <tbody>{items.map(({ _id, product, createdAt }) => (
              <tr key={_id}>
                <td>{product?.name || 'Deleted product'}</td>
                <td>{product?.productCode || '—'}</td>
                <td><time dateTime={createdAt}>{dateFormat.format(new Date(createdAt))}</time></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="admin-panel">No enquiries on this page.</p>)}
      {result.data && (page > 1 || result.data.totalPages > 1) && (
        <nav className="admin-actions" aria-label="Enquiry pages">
          <button className="button button--secondary" type="button" disabled={page <= 1} onClick={() => setParams({ page: page - 1 })}>Previous</button>
          <span>Page {page} of {Math.max(1, result.data.totalPages)}</span>
          <button className="button button--secondary" type="button" disabled={page >= result.data.totalPages} onClick={() => setParams({ page: page + 1 })}>Next</button>
        </nav>
      )}
    </>
  );
}
