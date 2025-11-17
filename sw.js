const CACHE_NAME = 'registro-horario-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './logo-redes_Transparente-216x216.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caché abierto');
                return cache.addAll(urlsToCache.map(url => {
                    // Para URLs externas, usar mode: 'no-cors' para evitar problemas de CORS
                    if (url.startsWith('http')) {
                        return new Request(url, { mode: 'no-cors' });
                    }
                    return url;
                }));
            })
            .catch((error) => {
                console.log('Error al cachear archivos:', error);
                // Continuar con la instalación aunque falle el caché de algunos archivos
            })
    );
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si encontramos el archivo en caché, lo devolvemos
                if (response) {
                    return response;
                }
                
                // Si no está en caché, intentamos obtenerlo de la red
                return fetch(event.request)
                    .then((response) => {
                        // Verificar si recibimos una respuesta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar la respuesta para poder usarla en el caché y devolverla
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Si falla la red, devolver una respuesta offline para páginas HTML
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    // Configurar notificaciones diarias
    if (event.data && event.data.type === 'SETUP_DAILY_NOTIFICATIONS') {
        setupDailyNotifications();
    }
});

// === SISTEMA DE NOTIFICACIONES DIARIAS ===

// Configurar notificaciones diarias a las 18:01 (lunes a viernes)
function setupDailyNotifications() {
    console.log('🔔 Configurando notificaciones diarias...');
    
    // Cancelar alarmas previas
    if ('alarms' in self) {
        self.alarms.clearAll();
    }
    
    // Programar alarma diaria
    scheduleNext1801Notification();
}

// Programar la próxima notificación a las 18:01
function scheduleNext1801Notification() {
    const now = new Date();
    const next1801 = new Date();
    
    // Configurar para las 18:01 de hoy
    next1801.setHours(18, 1, 0, 0);
    
    // Si ya pasaron las 18:01 de hoy, programar para mañana
    if (now >= next1801) {
        next1801.setDate(next1801.getDate() + 1);
    }
    
    // Verificar que sea día laboral (lunes a viernes)
    let daysToAdd = 0;
    while (isWeekend(new Date(next1801.getTime() + (daysToAdd * 24 * 60 * 60 * 1000)))) {
        daysToAdd++;
    }
    
    if (daysToAdd > 0) {
        next1801.setDate(next1801.getDate() + daysToAdd);
    }
    
    const timeUntilNext = next1801.getTime() - now.getTime();
    
    console.log(`⏰ Próxima notificación programada: ${next1801.toLocaleString('es-ES')}`);
    
    // Programar la notificación
    setTimeout(() => {
        sendDailyNotification();
        // Programar la siguiente (recursivo)
        scheduleNext1801Notification();
    }, timeUntilNext);
}

// Verificar si es fin de semana
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Domingo = 0, Sábado = 6
}

// Enviar notificación diaria
function sendDailyNotification() {
    const now = new Date();
    
    // Verificar que sea día laboral
    if (isWeekend(now)) {
        console.log('📅 Es fin de semana, no enviando notificación');
        return;
    }
    
    // Verificar que sea después del 01/10/2025
    const startDate = new Date('2025-10-01');
    if (now < startDate) {
        console.log('📅 Antes de la fecha de inicio (01/10/2025), no enviando notificación');
        return;
    }
    
    console.log('🔔 Enviando notificación diaria de firma');
    
    const notificationOptions = {
        title: '⏰ Hora de Firmar - Redes Carreras',
        body: 'Es hora de registrar tu jornada laboral. ¡No olvides firmar!',
        icon: './logo-redes_Transparente-216x216.png',
        badge: './logo-redes_Transparente-216x216.png',
        tag: 'daily-signature-reminder',
        renotify: true,
        requireInteraction: true,
        actions: [
            {
                action: 'open-app',
                title: 'Firmar Ahora',
                icon: './logo-redes_Transparente-216x216.png'
            },
            {
                action: 'dismiss',
                title: 'Más Tarde'
            }
        ],
        data: {
            type: 'daily-reminder',
            timestamp: now.toISOString()
        }
    };
    
    // Enviar la notificación
    self.registration.showNotification(
        notificationOptions.title,
        notificationOptions
    );
}

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open-app') {
        // Abrir la aplicación
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // Si ya hay una ventana abierta, enfocarla
                for (const client of clientList) {
                    if (client.url.includes('index.html') || client.url.endsWith('/')) {
                        return client.focus();
                    }
                }
                
                // Si no hay ventana abierta, abrir una nueva
                return clients.openWindow('./index.html');
            })
        );
    }
});

// Manejar cuando se cierra la notificación
self.addEventListener('notificationclose', (event) => {
    console.log('🔔 Notificación cerrada:', event.notification.tag);
});