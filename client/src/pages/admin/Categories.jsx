import { useState } from 'react';
import { errorText, Field, RequestState, SaveActions, useToast } from '../../components/admin/AdminUI.jsx';
import { ImagePicker } from '../../components/admin/ImagePicker.jsx';
import { useAdmin } from '../../context/AdminSession.jsx';
import { useAdminData } from '../../hooks/useAdminData.js';
import { cleanImages, saveWithImages } from '../../utils/adminImages.js';

export function Categories() {
  const { request } = useAdmin();
  const notify = useToast();
  const result = useAdminData('/admin/categories');
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function remove(category) {
    if (!window.confirm(`Delete “${category.name}”? Products must be moved to another category first.`)) return;
    setDeleting(true);
    try {
      await request('DELETE', '/admin/categories/' + category._id);
      const failed = await cleanImages(request, category.image ? [category.image] : []);
      notify(failed ? 'Category deleted. Image cleanup could not be confirmed.' : 'Category deleted.', failed);
      result.reload();
    } catch (error) {
      notify(errorText(error), true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="admin-heading"><h1>Categories</h1>{!editor && <button className="button button--primary" type="button" disabled={deleting} onClick={() => setEditor({})}>Add category</button>}</div>
      <RequestState {...result} retry={result.reload} />
      {editor && <CategoryForm key={editor._id || 'new'} category={editor} close={() => setEditor(null)} onSaved={() => { setEditor(null); result.reload(); }} />}
      {!editor && result.data?.length === 0 && <p className="admin-panel">No categories yet. Add a category before creating products.</p>}
      {!editor && Boolean(result.data?.length) && (
        <ul className="admin-category-list">
          {result.data.map((category) => (
            <li key={category._id} className="admin-panel">
              {category.image?.url && <img src={category.image.url} alt={category.name} />}
              <div><h2>{category.name}</h2><p>Display order {category.order}</p></div>
              <div className="admin-row-actions">
                <button type="button" disabled={deleting} onClick={() => setEditor(category)}>Edit</button>
                <button type="button" disabled={deleting} onClick={() => remove(category)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CategoryForm({ category, close, onSaved }) {
  const { request } = useAdmin();
  const notify = useToast();
  const [images, setImages] = useState(category.image ? [category.image] : []);
  const [busy, setBusy] = useState(false);

  async function save(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.order = Number(data.order);
    if (!data.slug.trim()) delete data.slug;
    setBusy(true);
    try {
      const path = category._id ? '/admin/categories/' + category._id : '/admin/categories';
      const { cleanupFailed } = await saveWithImages(request, images, category.image ? [category.image] : [],
        (resolved) => request(category._id ? 'PUT' : 'POST', path, { data: { ...data, image: resolved[0] || null } }));
      notify(cleanupFailed ? 'Category saved. Image cleanup could not be confirmed.' : 'Category saved.', cleanupFailed);
      onSaved();
    } catch (error) {
      notify(errorText(error), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-panel admin-form" onSubmit={save}>
      <h2>{category._id ? 'Edit category' : 'Add category'}</h2>
      <fieldset className="admin-form" disabled={busy}>
        <div className="admin-form-grid">
          <Field label="Category name"><input name="name" defaultValue={category.name} required maxLength={120} /></Field>
          <Field label="Slug"><input name="slug" defaultValue={category.slug} placeholder="Generated from the name" maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></Field>
          <Field label="Display order (lower numbers appear first)"><input name="order" type="number" min="0" max="1000000" step="1" defaultValue={category.order ?? 0} required /></Field>
        </div>
        <Field label="Description"><textarea name="description" rows={4} maxLength={2000} defaultValue={category.description} /></Field>
        <section className="admin-form"><h2>Category image</h2><ImagePicker images={images} onChange={setImages} /></section>
      </fieldset>
      <SaveActions busy={busy} onCancel={close} label="Save category" />
    </form>
  );
}
