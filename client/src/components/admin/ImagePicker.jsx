import { useEffect, useRef, useState } from 'react';
import { useToast } from './AdminUI.jsx';

function Preview({ image }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!image.file) return;
    const url = URL.createObjectURL(image.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image.file]);
  const src = image.url || preview;
  return src ? <img src={src} alt="Selected image preview" /> : null;
}

export function ImagePicker({ images, onChange, max = 1 }) {
  const notify = useToast();
  const picker = useRef(null);
  const [dragging, setDragging] = useState(false);

  function add(files) {
    const selected = Array.from(files);
    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024)) {
      notify('Choose nonempty JPEG, PNG or WebP images up to 5 MiB each.', true);
      return;
    }
    if (images.length + selected.length > max) {
      notify(`Remove an image first or choose fewer files. Limit: ${max}.`, true);
      return;
    }
    onChange([...images, ...selected.map((file) => ({ file, key: crypto.randomUUID() }))]);
  }

  function move(from, to) {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="admin-image-picker">
      <div className={`admin-drop${dragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); add(event.dataTransfer.files); }}>
        <input hidden ref={picker} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1}
          onChange={(event) => { add(event.target.files); event.target.value = ''; }} />
        <button className="button button--secondary" type="button" onClick={() => picker.current.click()}>Choose image{max > 1 ? 's' : ''}</button>
        <span>or drop {max > 1 ? 'images' : 'an image'} here</span>
      </div>
      {images.length > 0 && (
        <ol className="admin-image-list">
          {images.map((image, index) => (
            <li key={image.key || image.publicId}>
              <Preview image={image} />
              {max > 1 && <span>{index === 0 ? 'Primary image' : `Image ${index + 1}`}</span>}
              <div className="admin-image-actions">
                {index > 1 && <button type="button" onClick={() => move(index, index - 1)}>Move earlier</button>}
                {index > 0 && <button type="button" onClick={() => move(index, 0)}>Make primary</button>}
                {index < images.length - 1 && <button type="button" onClick={() => move(index, index + 1)}>Move later</button>}
                <button type="button" onClick={() => onChange(images.filter((_, position) => index !== position))}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
