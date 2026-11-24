async function removeImages(request, images) {
  const results = await Promise.allSettled(images.map((image) =>
    request('DELETE', '/admin/upload/' + encodeURIComponent(image.publicId))));
  // An image can be shared across multiple records.
  return results.some((result) => result.status === 'rejected' && result.reason.response?.status !== 409);
}

export async function saveWithImages(request, images, previous, save) {
  const uploaded = [];
  let saved;
  try {
    const resolved = [];
    for (const image of images) {
      if (!image.file) {
        resolved.push({ url: image.url, publicId: image.publicId });
        continue;
      }
      const form = new FormData();
      form.append('image', image.file);
      const metadata = await request('POST', '/admin/upload', { data: form, timeout: 35000 });
      uploaded.push(metadata);
      resolved.push(metadata);
    }
    saved = await save(resolved);
  } catch (error) {
    // A lost save response may hide a committed write. The API also blocks deletion of referenced images.
    await removeImages(request, uploaded);
    throw error;
  }
  const retained = new Set(images.map((image) => image.publicId));
  const cleanupFailed = await removeImages(request, previous.filter((image) => !retained.has(image.publicId)));
  return { saved, cleanupFailed };
}

export async function cleanImages(request, images) {
  return removeImages(request, images);
}
