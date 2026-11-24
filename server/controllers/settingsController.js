import { siteDefaults } from '../config/siteDefaults.js';
import { SiteSettings, settingsId } from '../models/SiteSettings.js';
import { ApiError, sendSuccess } from '../utils/http.js';

export function getSettings(admin = false, trackEnquiries = false) {
  return async (_request, response) => {
    const saved = await SiteSettings.findById(settingsId).select('-_id -__v').lean();
    const settings = { ...siteDefaults, ...saved };
    if (!admin && settings.heroImage) settings.heroImage = { url: settings.heroImage.url };
    if (!admin) settings.enquiryTrackingEnabled = trackEnquiries;
    return sendSuccess(response, settings);
  };
}

export async function updateSettings(request, response) {
  const fields = request.input;
  if (!Object.keys(fields).length) throw new ApiError(400, 'Provide at least one settings field.');

  const settings = await SiteSettings.findByIdAndUpdate(settingsId, { $set: fields }, {
    upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true,
  }).select('-_id -__v').lean();
  return sendSuccess(response, settings, 'Settings updated.');
}
