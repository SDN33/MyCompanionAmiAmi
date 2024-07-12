// service-worker.js

// Écoute des événements de notification push provenant de l'API de notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
  };
  event.waitUntil(self.registration.showNotification('Titre de la notification', options));
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Ajoutez ici la logique pour gérer le clic sur la notification
  // Par exemple, rediriger vers une certaine URL
});
