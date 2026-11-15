// Remove only caches created by the retired ChangeTrack worker.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => ['supabase-data-cache', 'supabase-auth-cache', 'google-fonts-cache', 'gstatic-fonts-cache'].includes(key))
      .map(key => caches.delete(key))
  )));
});
