import { useState } from 'react';
import { errorText, Field, RequestState, SaveActions, useToast } from '../../components/admin/AdminUI.jsx';
import { ImagePicker } from '../../components/admin/ImagePicker.jsx';
import { useAdmin } from '../../context/AdminSession.jsx';
import { useAdminData } from '../../hooks/useAdminData.js';
import { saveWithImages } from '../../utils/adminImages.js';

export function Settings() {
  const result = useAdminData('/admin/settings');
  return (
    <>
      <div className="admin-heading"><h1>Site settings</h1></div>
      <RequestState {...result} retry={result.reload} />
      {result.data && <SettingsForm settings={result.data} />}
    </>
  );
}

function SettingsForm({ settings }) {
  const { request } = useAdmin();
  const notify = useToast();
  const [previousImage, setPreviousImage] = useState(settings.heroImage);
  const [images, setImages] = useState(settings.heroImage ? [settings.heroImage] : []);
  const [faq, setFaq] = useState(settings.faqItems || []);
  const [busy, setBusy] = useState(false);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form);
    data.announcementEnabled = form.has('announcementEnabled');
    data.trustStripItems = data.trustStripItems.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    data.faqItems = faq.map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }));
    if (data.trustStripItems.length > 12 || data.trustStripItems.some((item) => item.length > 120)) {
      notify('Use up to 12 trust items, with up to 120 characters per item.', true);
      return;
    }
    setBusy(true);
    try {
      const { saved, cleanupFailed } = await saveWithImages(request, images, previousImage ? [previousImage] : [],
        (resolved) => request('PUT', '/admin/settings', { data: { ...data, heroImage: resolved[0] || null } }));
      setPreviousImage(saved.heroImage);
      setImages(saved.heroImage ? [saved.heroImage] : []);
      notify(cleanupFailed ? 'Settings saved. Image cleanup could not be confirmed.' : 'Settings saved.', cleanupFailed);
    } catch (error) {
      notify(errorText(error), true);
    } finally {
      setBusy(false);
    }
  }

  function changeFaq(index, field, value) {
    setFaq(faq.map((entry, at) => at === index ? { ...entry, [field]: value } : entry));
  }

  return (
    <form className="admin-panel admin-form" onSubmit={save}>
      <fieldset className="admin-form" disabled={busy}>
        <h2>Announcement and homepage</h2>
        <label className="admin-checks"><input type="checkbox" name="announcementEnabled" defaultChecked={settings.announcementEnabled} /> Show announcement</label>
        <Field label="Announcement text"><input name="announcementText" defaultValue={settings.announcementText} maxLength={250} /></Field>
        <div className="admin-form-grid">
          <Field label="Hero heading"><input name="heroHeading" defaultValue={settings.heroHeading} maxLength={160} required /></Field>
          <Field label="Hero sub-line"><input name="heroSubtext" defaultValue={settings.heroSubtext} maxLength={300} required /></Field>
        </div>
        <section className="admin-form"><h2>Hero image</h2><ImagePicker images={images} onChange={setImages} /></section>
        <Field label="Trust items (one per line)"><textarea name="trustStripItems" rows={4} defaultValue={settings.trustStripItems.join('\n')} /></Field>
        <h2>Contact details</h2>
        <div className="admin-form-grid">
          <Field label="WhatsApp number (country code included)"><input name="whatsappNumber" type="tel" pattern="[1-9][0-9]{7,14}" defaultValue={settings.whatsappNumber} required /></Field>
          <Field label="Instagram handle"><input name="instagramHandle" maxLength={31} defaultValue={settings.instagramHandle} required /></Field>
          <Field label="Email"><input name="email" type="email" maxLength={254} defaultValue={settings.email} required /></Field>
          <Field label="Working hours"><input name="workingHours" maxLength={120} defaultValue={settings.workingHours} required /></Field>
        </div>
        <Field label="Address"><input name="address" maxLength={350} defaultValue={settings.address} required /></Field>
        <h2>About and FAQs</h2>
        <Field label="About text"><textarea name="aboutText" rows={5} maxLength={5000} defaultValue={settings.aboutText} /></Field>
        {faq.map((item, index) => (
          <div className="admin-faq admin-form" key={index}>
            <Field label={`Question ${index + 1}`}><input value={item.question} required maxLength={200} onChange={(event) => changeFaq(index, 'question', event.target.value)} /></Field>
            <Field label={`Answer ${index + 1}`}><textarea rows={3} value={item.answer} required maxLength={2000} onChange={(event) => changeFaq(index, 'answer', event.target.value)} /></Field>
            <button type="button" onClick={() => setFaq(faq.filter((_, at) => at !== index))}>Remove question</button>
          </div>
        ))}
        <button type="button" className="button button--secondary" disabled={faq.length >= 30} onClick={() => setFaq([...faq, { question: '', answer: '' }])}>Add question</button>
      </fieldset>
      <SaveActions busy={busy} label="Save settings" />
    </form>
  );
}
