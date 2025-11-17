# 📋 Registro Horario Laboral - Versión Online

## 🎯 Aplicación Corregida y Mejorada

Esta es la versión corregida de tu aplicación de registro horario laboral que soluciona los problemas reportados:

### ✅ Problemas Solucionados:

1. **🔧 Navegación del botón "Firmar Hoy"**: Corregido el flujo de autenticación
2. **📄 Generación de PDF**: Mejorada la función de generación de PDFs
3. **🔐 Flujo de autenticación**: Optimizado para una mejor experiencia de usuario
4. **🐛 Gestión de errores**: Implementado manejo robusto de errores

---

## 🚀 Instrucciones para Subir a GitHub

### Paso 1: Crear Repositorio en GitHub
1. Ve a [GitHub.com](https://github.com) e inicia sesión
2. Haz clic en "New repository" (botón verde)
3. Nombra tu repositorio: `registro-horario-laboral`
4. Configúralo como **público** o **privado** según prefieras
5. ❌ **NO** marques "Add a README file" (ya tenemos uno)
6. Haz clic en "Create repository"

### Paso 2: Subir los Archivos
1. **Opción A - Drag & Drop:**
   - En la página de tu repositorio vacío, arrastra todos los archivos
   - Espera a que se suban
   - Escribe un mensaje de commit: "Initial commit - Aplicación de registro horario"
   - Haz clic en "Commit changes"

2. **Opción B - GitHub Desktop:**
   - Descarga [GitHub Desktop](https://desktop.github.com/)
   - Clona tu repositorio
   - Copia todos los archivos a la carpeta del repositorio
   - Commit y push desde GitHub Desktop

### Paso 3: Configurar Páginas Web (Opcional)
Para usar como aplicación web:

1. Ve a **Settings** de tu repositorio
2. Busca **"Pages"** en el menú lateral
3. En **Source**, selecciona "Deploy from a branch"
4. Selecciona **main** branch y **/ (root)**
5. Guarda la configuración

Tu aplicación estará disponible en: `https://tuusuario.github.io/registro-horario-laboral/`

---

## 🔧 Configuración Requerida

### Firebase (Ya Configurado)
- ✅ La aplicación ya tiene configuración de Firebase incluida
- ✅ Conexión a base de datos en tiempo real
- ✅ Almacenamiento de firmas y usuarios

### Dependencias Externas
La aplicación utiliza estas librerías (ya incluidas via CDN):
- **Firebase SDK 9.17.1** - Base de datos en tiempo real
- **jsPDF 2.5.1** - Generación de PDFs
- **XLSX 0.18.5** - Exportación a Excel
- **Font Awesome 6.0.0** - Iconos
- **Google Fonts** - Tipografía

---

## 📱 Funcionalidades

### 👥 Para Trabajadores
- ✅ **Firma Digital**: Canvas táctil y mouse
- ✅ **Autenticación segura**: Usuario y contraseña
- ✅ **Horarios automáticos**: Según puesto de trabajo
- ✅ **PDF automático**: Generación después de cada firma
- ✅ **Historial de firmas**: Visualizar registros anteriores
- ✅ **Firmas pendientes**: Días sin firmar

### 🔧 Para Administradores
- ✅ **Panel de control**: Gestión completa del sistema
- ✅ **Gestión de usuarios**: Añadir/editar/eliminar trabajadores
- ✅ **Calendario de festivos**: Marcar días no laborables
- ✅ **Estadísticas en tiempo real**: Firmas del día, pendientes
- ✅ **Exportación**: Excel y PDF con filtros por fecha
- ✅ **Configuración horaria**: Hora de activación personalizable

### 🌐 Características Técnicas
- ✅ **Tiempo real**: Sincronización automática con Firebase
- ✅ **Responsive**: Funciona en móviles, tablets y desktop
- ✅ **PWA Ready**: Preparado para instalación como app
- ✅ **Offline**: Service Worker incluido
- ✅ **Seguro**: Autenticación y validación de datos

---

## 🎨 Estructura de Archivos

```
registro-horario-laboral/
├── index.html              # Página principal
├── app-online.js           # Lógica de la aplicación (CORREGIDO)
├── styles.css              # Estilos CSS
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker
├── favicon.ico             # Icono del sitio
├── logo-redes_Transparente-216x216.png  # Logo de la empresa
└── README.md               # Este archivo
```

---

## 🔥 Configuración de Firebase (Ya Implementada)

La aplicación incluye configuración Firebase completa:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCz7F1WqmltPWDMEAk0LFL7YJRZUbV3GxU",
    authDomain: "registro-horario-online.firebaseapp.com", 
    projectId: "registro-horario-online",
    storageBucket: "registro-horario-online.firebasestorage.app",
    messagingSenderId: "280134845292",
    appId: "1:280134845292:web:e69a6ccc5a6efa204ea949",
    databaseURL: "https://registro-horario-online-default-rtdb.europe-west1.firebasedatabase.app"
};
```

### Estructura de Datos en Firebase:
- **`/trabajadores`** - Información de usuarios
- **`/signatures/{usuario}`** - Firmas por usuario
- **`/holidays`** - Días festivos
- **`/settings`** - Configuración del sistema

---

## 👥 Usuarios Predefinidos

La aplicación incluye usuarios de prueba con horarios asignados:

### PLANTA EXTERNA (08:00-14:00 / 15:00-17:00):
- BORJA CARRERAS MARTIN (53615032P)
- DAVID MORENO GOMEZ (46846909A)
- EDGAR ALONSO SANCHEZ SUAREZ (X8723873L)
- JAVIER CARRERAS MARTIN (53996573W)
- JOSÉ ANTONIO CARRERAS MARTIN (06587470V)
- Y 7 trabajadores más...

### OFICINA (08:00-16:00):
- JUAN SIMON DE LA FUENTE (51471948H)
- JHON ALEXANDER ARROYAVE CÁRDENAS (X8335756G)

**🔑 Contraseñas**: Cada usuario tiene una contraseña única. Para acceso de administrador usar: `Admin2025!`

---

## 🛠️ Solución de Problemas

### ❌ "No se genera PDF"
- ✅ **SOLUCIONADO**: Mejorada la función `generatePDF()`
- Verificar conexión a internet al firmar
- La función ahora incluye manejo robusto de errores

### ❌ "El botón 'Firmar Hoy' no funciona"
- ✅ **SOLUCIONADO**: Corregido el flujo de navegación
- Ahora redirige correctamente a autenticación → formulario → PDF

### ❌ "Error de conexión Firebase"
- Verificar conexión a internet
- La aplicación tiene modo degradado para funcionar offline
- Los datos se sincronizan cuando vuelve la conexión

### ❌ "No se ven las firmas pendientes"
- Las firmas pendientes se muestran en los últimos 30 días
- Los fines de semana y festivos no aparecen como pendientes

---

## 📞 Soporte y Mantenimiento

### 🔧 Para Desarrolladores:
- **Base de datos**: Firebase Realtime Database
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3
- **Librerías**: Firebase, jsPDF, XLSX
- **Compatibilidad**: Navegadores modernos (Chrome, Firefox, Safari, Edge)

### 📋 Logs y Debugging:
- Abre DevTools (F12) para ver errores en consola
- Los logs de Firebase aparecen en la pestaña "Network"
- Mensajes de estado aparecen en la interfaz

---

## 🎉 ¡Listo para Usar!

Tu aplicación está completamente funcional y lista para:
1. ✅ Subir a GitHub
2. ✅ Usar como sitio web
3. ✅ Compartir con tu equipo
4. ✅ Hacer seguimiento del registro horario

**🌐 URL de ejemplo**: `https://tuusuario.github.io/registro-horario-laboral/`

---

**📝 Creado por**: Alexander Arroyave  
**🏢 Para**: Redes Carreras SL  
**📅 Versión**: 2.0.0 - Corregida y mejorada  
**🔗 Conectado a**: Firebase Realtime Database
