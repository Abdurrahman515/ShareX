
self.addEventListener('push', event => {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/dark2.png',
        data: data.data,
    });
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    const targetUrl = event.notification.data?.url;

    // the not defined errors are just warning because the vscode can't know that this is a sw.js file 
  event.waitUntil(
    //eslint-disable-next-line
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // if user allready opened a tab with the site
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // open new tab with the site
      //eslint-disable-next-line
      if (clients.openWindow) {
        //eslint-disable-next-line
        return clients.openWindow(targetUrl);
      }
    })
  );
})