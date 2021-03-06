/* eslint-env serviceworker */

self.addEventListener('push', (event) => {
  const icon = '/images/icon-256x256.png';
  event.waitUntil(fetch('/event').then((res) => {
    if (res.status !== 200) {
      console.log('Error fetching latest notification:', res.status);
      throw new Error();
    }

    return res.json().then((data) => {
      const title = data.title;
      const body = data.body;
      const tag = 'canaritus-notification-tag';

      return self.registration.showNotification(title, {
        body: body,
        icon: icon,
        tag: tag,
      });
    });
  }).catch((err) => {
    console.error('Unable to retrieve data', err);

    const title = 'An error occurred';
    const body = 'We were unable to get the information for this push message';
    const tag = 'notification-error';

    return self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag,
    });
  }));
});

self.addEventListener('notificationclick', (event) => {
  console.log('On notification click: ', event.notification.tag);
  // Android doesn't close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: 'window',
  }).then((clientList) => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});
