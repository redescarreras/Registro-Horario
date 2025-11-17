// ================================================
// REGISTRO HORARIO LABORAL - VERSIÓN FIREBASE
// Mantiene exactamente la misma funcionalidad
// pero con datos en la nube (Firebase)
// ================================================

// 🔥 CONFIGURACIÓN FIREBASE - LISTO PARA USAR
let firebaseConfig = {
    apiKey: "AIzaSyCz7F1WqmltPWDMEAk0LFL7YJRZUbV3GxU",
    authDomain: "registro-horario-online.firebaseapp.com", 
    projectId: "registro-horario-online",
    storageBucket: "registro-horario-online.firebasestorage.app",
    messagingSenderId: "280134845292",
    appId: "1:280134845292:web:e69a6ccc5a6efa204ea949",
    databaseURL: "https://registro-horario-online-default-rtdb.europe-west1.firebasedatabase.app"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Funciones de Firebase para Realtime Database
// Usamos directamente los métodos de la instancia db

// Configuración de trabajadores con DNIs, contraseñas y horarios específicos
let TRABAJADORES = {
    'BORJA CARRERAS MARTIN': { dni: '53615032P', password: 'BCM-K8L3X', telefono: '642057351', email: 'borjacarreras@redescarreras.es', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'DAVID MORENO GOMEZ': { dni: '46846909A', password: 'DMG-P4N7Q', telefono: '630604899', email: 'davidmorenogomez76@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'EDGAR ALONSO SANCHEZ SUAREZ': { dni: 'X8723873L', password: 'EAS-M9R2T', telefono: '631830324', email: 'alonsing001@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'JAVIER CARRERAS MARTIN': { dni: '53996573W', password: 'JCM-V6Z8B', telefono: '667283903', email: 'jcm63881@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'JOSE ANTONIO CARRERAS MARTIN': { dni: '06587470V', password: 'JAC-H3F5Y', telefono: '642276302', email: 'carrerasmartin87@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'JOSE FERNANDO SANCHEZ MARULANDA': { dni: 'Y5482295Y', password: 'JFS-L7W1D', telefono: '652151329', email: 'josesanchezmarulanda@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'JUAN CARLOS SANCHEZ MARULANDA': { dni: 'Y7721584S', password: 'JCS-N4G9E', telefono: '662048856', email: 'juankmarulandasanchez@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'JUAN PEDRO SUAREZ DELGADO': { dni: '06587577D', password: 'JPS-C8J2A', telefono: '610713439', email: 'juampetena3107@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'LUIS MIGUEL HIDALGO EGEA': { dni: '01187902K', password: 'LMH-S5K6P', telefono: '662495955', email: 'hidalgomiguel842@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'ANTONIO MANUEL LOPEZ GARCÍA': { dni: '05680005V', password: 'AML-T9X4R', telefono: '642122184', email: 'manoloespiderman@hotmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'AARON LOPEZ MUÑOZ': { dni: '05739933F', password: 'ALM-F3Q7U', telefono: '643661386', email: 'aaronlm1999@gmail.com', horario: 'PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', active: true },
    'JUAN SIMON DE LA FUENTE': { dni: '51471948H', password: 'JSF-W2Y8I', telefono: '', email: '', horario: 'OFICINA: 08:00 - 16:00', active: true },
    'JHON ALEXANDER ARROYAVE CÁRDENAS': { dni: 'X8335756G', password: 'JAA-Z6M1O', telefono: '', email: '', horario: 'OFICINA: 08:00 - 16:00', active: true }
};

// Contraseña de administrador
const ADMIN_PASSWORD = 'Admin2025!';

// Clase principal de la aplicación
class RegistroHorarioApp {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.modalCanvas = null;
        this.modalCtx = null;
        this.isDrawing = false;
        this.currentUser = null;
        this.currentScreen = 'timeRestriction';
        this.pendingSignatureDate = null;
        this.isAuthenticated = false;
        this.isAdmin = false;
        this.currentMonth = new Date();
        this.editingUser = null;
        this.settings = { activationHour: 18 };
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        this.init();
    }

    // 🔥 INICIALIZACIÓN FIREBASE
    async init() {
        this.showLoading('Cargando aplicación...');
        
        try {
            // Verificar dependencias críticas
            this.checkDependencies();
            
            // Cargar datos iniciales
            await this.loadWorkersFromFirebase();
            await this.loadSettingsFromFirebase();
            
            // Configurar eventos
            this.setupEventListeners();
            this.initSignatureCanvas();
            this.checkTimeRestriction();
            this.populateWorkerSelects();
            
            // Escuchar cambios en tiempo real
            this.setupRealtimeListeners();
            
            // Ocultar pantalla de configuración
            const configWarning = document.getElementById('configWarning');
            if (configWarning) configWarning.style.display = 'none';
            
            // Mostrar botón de Admin
            const adminBtn = document.getElementById('adminAccessBtn');
            if (adminBtn) adminBtn.style.display = 'block';
            
            // Aplicar restricción horaria (después de conectar Firebase)
            this.checkTimeRestriction();
            
            // Limpiar cualquier sesión previa
            this.cleanupSession();
            
            // Ocultar loading
            this.hideLoading();
            
        } catch (error) {
            console.error('Error inicializando aplicación:', error);
            this.hideLoading();
            this.showError('Error al cargar la aplicación. Verifica tu conexión a internet.');
        }
    }

    // Verificar dependencias críticas
    checkDependencies() {
        // Verificar jsPDF
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            console.warn('jsPDF no está disponible. La generación de PDF podría fallar.');
        }
        
        // Verificar Firebase
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está disponible');
        }
        
        // Verificar XLSX
        if (typeof XLSX === 'undefined') {
            console.warn('XLSX no está disponible. La exportación a Excel podría fallar.');
        }
    }

    // Limpiar sesión previa
    cleanupSession() {
        // Limpiar sesión temporal
        sessionStorage.removeItem('pendingSignatureDate');
        
        // Verificar autenticación previa
        const rememberAuth = localStorage.getItem('rememberAuth');
        if (rememberAuth === 'true') {
            // Restaurar sesión si está configurado
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser && TRABAJADORES[savedUser]) {
                this.isAuthenticated = true;
                this.currentUser = savedUser;
            }
        }
    }

    // === FUNCIONES DE FIREBASE ===
    async loadWorkersFromFirebase() {
        try {
            const snapshot = await db.ref('trabajadores').once('value');
            if (snapshot.exists()) {
                TRABAJADORES = snapshot.val() || TRABAJADORES;
            } else {
                // Si no existe, crear con datos por defecto
                await db.ref('trabajadores').set(TRABAJADORES);
            }
        } catch (error) {
            console.error('Error cargando trabajadores:', error);
        }
    }

    async saveWorkersToFirebase() {
        try {
            await db.ref('trabajadores').set(TRABAJADORES);
            this.populateWorkerSelects();
        } catch (error) {
            console.error('Error guardando trabajadores:', error);
            this.showError('Error al guardar datos');
        }
    }

    async loadSettingsFromFirebase() {
        try {
            const snapshot = await db.ref('settings').once('value');
            if (snapshot.exists()) {
                this.settings = snapshot.val() || this.settings;
            } else {
                await this.saveSettingsToFirebase();
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    }

    async saveSettingsToFirebase() {
        try {
            await db.ref('settings').set(this.settings);
            this.updateSettingsUI();
        } catch (error) {
            console.error('Error guardando configuración:', error);
        }
    }

    async getHolidaysFromFirebase() {
        try {
            const snapshot = await db.ref('holidays').once('value');
            return snapshot.exists() ? snapshot.val() || [] : [];
        } catch (error) {
            console.error('Error cargando festivos:', error);
            return [];
        }
    }

    async saveHolidaysToFirebase(holidays) {
        try {
            await db.ref('holidays').set(holidays);
        } catch (error) {
            console.error('Error guardando festivos:', error);
            this.showError('Error al guardar días festivos');
        }
    }

    async getSignaturesFromFirebase(workerName) {
        try {
            const snapshot = await db.ref(`signatures/${workerName}`).once('value');
            return snapshot.exists() ? snapshot.val().signatures || [] : [];
        } catch (error) {
            console.error('Error cargando firmas:', error);
            return [];
        }
    }

    async getSignedDates(workerName) {
        try {
            const signatures = await this.getSignaturesFromFirebase(workerName);
            return signatures;
        } catch (error) {
            console.error('Error cargando fechas firmadas:', error);
            return [];
        }
    }

    async saveSignatureToFirebase(workerName, signatureData) {
        try {
            const signatures = await this.getSignaturesFromFirebase(workerName);
            signatures.push(signatureData);
            
            await db.ref(`signatures/${workerName}`).set({
                signatures: signatures,
                lastUpdated: new Date()
            });
        } catch (error) {
            console.error('Error guardando firma:', error);
            throw error;
        }
    }

    // === ESCUCHAR CAMBIOS EN TIEMPO REAL ===
    setupRealtimeListeners() {
        // Escuchar cambios en trabajadores
        db.ref('trabajadores').on('value', (snapshot) => {
            if (snapshot.exists()) {
                TRABAJADORES = snapshot.val();
                this.populateWorkerSelects();
                if (this.isAdmin) {
                    this.updateStats();
                    this.renderUsersTable();
                }
            }
        });

        // Escuchar cambios en configuración
        db.ref('settings').on('value', (snapshot) => {
            if (snapshot.exists()) {
                this.settings = snapshot.val();
                this.updateSettingsUI();
                // Aplicar inmediatamente la nueva configuración de tiempo
                this.checkTimeRestriction();
            }
        });

        // Escuchar cambios en festivos
        db.ref('holidays').on('value', (snapshot) => {
            if (this.isAdmin && snapshot.exists()) {
                this.renderCalendar();
                this.updateStats();
            }
        });
    }

    // === FUNCIONES DE UI ===
    showLoading(text = 'Cargando...') {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
            const textElement = indicator.querySelector('.loading-text');
            if (textElement) textElement.textContent = text;
        }
    }

    hideLoading() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    showError(message) {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
            setTimeout(() => {
                statusMessage.innerHTML = '';
            }, 5000);
        }
    }

    showSuccess(message) {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.innerHTML = `<div class="success-message"><i class="fas fa-check-circle"></i> ${message}</div>`;
            setTimeout(() => {
                statusMessage.innerHTML = '';
            }, 3000);
        }
    }

    // === DÍAS FESTIVOS ===
    async getHolidays() {
        return await this.getHolidaysFromFirebase();
    }

    async saveHolidays(holidays) {
        await this.saveHolidaysToFirebase(holidays);
    }

    isHoliday(date) {
        // Esta función necesita ser async, pero para compatibilidad la dejamos síncrona
        // y la versión async se usará donde sea necesario
        return false;
    }

    async toggleHoliday(date) {
        this.showLoading('Guardando día festivo...');
        const holidays = await this.getHolidays();
        const dateStr = date.toISOString().split('T')[0];
        const index = holidays.indexOf(dateStr);
        
        if (index > -1) {
            holidays.splice(index, 1);
        } else {
            holidays.push(dateStr);
        }
        
        await this.saveHolidays(holidays);
        await this.renderCalendar();
        await this.updateStats();
        this.hideLoading();
    }

    // === CONFIGURACIÓN ===
    async saveSettings() {
        const hour = parseInt(document.getElementById('activationHour').value);
        
        if (isNaN(hour) || hour < 0 || hour > 23) {
            alert('Por favor, ingresa una hora válida entre 0 y 23');
            return;
        }
        
        this.settings.activationHour = hour;
        await this.saveSettingsToFirebase();
        
        this.updateSettingsUI();
        
        // Aplicar inmediatamente la nueva configuración
        this.checkTimeRestriction();
        
        const timeString = hour.toString().padStart(2, '0') + ':00';
        this.showSuccess(`✅ Configuración guardada.\n\nLa aplicación estará disponible a partir de las ${timeString} horas.`);
        
        // Cerrar modal si está abierto
        const modal = document.getElementById('configModal');
        if (modal && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }

    updateSettingsUI() {
        const hour = this.settings.activationHour;
        const hourInput = document.getElementById('activationHour');
        const currentHourDisplay = document.getElementById('currentActivationHour');
        
        if (hourInput) {
            hourInput.value = hour;
        }
        
        if (currentHourDisplay) {
            currentHourDisplay.textContent = `${hour.toString().padStart(2, '0')}:00`;
        }
    }

    // === EVENTOS ===
    setupEventListeners() {
        // Botón de acceso admin
        document.getElementById('adminAccessBtn')?.addEventListener('click', () => this.showAdminAuth());
        
        // Admin auth
        document.getElementById('adminAuthForm')?.addEventListener('submit', (e) => this.handleAdminAuth(e));
        document.getElementById('closeAdminAuth')?.addEventListener('click', () => this.closeAdminAuthModal());
        document.getElementById('cancelAdminAuth')?.addEventListener('click', () => this.closeAdminAuthModal());
        
        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchAdminTab(tab.dataset.tab));
        });
        
        // Admin actions
        document.getElementById('exitAdminBtn')?.addEventListener('click', () => this.exitAdmin());
        document.getElementById('addUserBtn')?.addEventListener('click', () => this.showUserModal());
        document.getElementById('userForm')?.addEventListener('submit', (e) => this.handleUserForm(e));
        document.getElementById('closeUserModal')?.addEventListener('click', () => this.closeUserModal());
        document.getElementById('cancelUserModal')?.addEventListener('click', () => this.closeUserModal());
        
        // Calendario
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        
        // Exportar
        document.getElementById('exportBtn')?.addEventListener('click', () => this.handleExport());
        document.getElementById('exportFormat')?.addEventListener('change', (e) => this.updateExportUI(e.target.value));
        
        // Configuración
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
        
        // Navegación principal
        document.getElementById('menuAccessBtn')?.addEventListener('click', () => this.showAuthScreen());
        document.getElementById('newSignatureBtn')?.addEventListener('click', () => this.showSignatureScreenWithAuth());
        document.getElementById('pendingSignaturesBtn')?.addEventListener('click', () => this.showPendingSignatures());
        document.getElementById('completedSignaturesBtn')?.addEventListener('click', () => this.showCompletedSignatures());
        
        document.getElementById('backToSignBtn')?.addEventListener('click', () => this.showSignatureScreen());
        document.getElementById('backToMenuBtn1')?.addEventListener('click', () => this.showMainMenu());
        document.getElementById('backToMenuBtn2')?.addEventListener('click', () => this.showMainMenu());
        
        document.getElementById('authForm')?.addEventListener('submit', (e) => this.handleAuth(e));
        
        document.getElementById('trabajador')?.addEventListener('change', (e) => {
            this.updateWorkerInfo(e.target.value);
        });
        
        document.getElementById('authTrabajador')?.addEventListener('change', (e) => {
            this.loadSavedPasswordForWorker(e.target.value);
        });
        
        document.getElementById('showPassword')?.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        document.getElementById('clearSignature')?.addEventListener('click', () => {
            this.clearSignature();
        });
        
        document.getElementById('clearModalSignature')?.addEventListener('click', () => {
            this.clearModalSignature();
        });

        document.getElementById('registroForm')?.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });
        
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancelSignature')?.addEventListener('click', () => this.closeModal());
        document.getElementById('confirmSignature')?.addEventListener('click', () => this.confirmPendingSignature());
    }

    // === FUNCIONES PRINCIPALES (ADAPTADAS PARA FIREBASE) ===
    
    populateWorkerSelects() {
        const selects = ['trabajador', 'authTrabajador', 'exportWorker'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            const currentValue = select.value;
            select.innerHTML = '<option value="">- Selecciona tu nombre -</option>';
            
            Object.keys(TRABAJADORES)
                .filter(name => TRABAJADORES[name].active)
                .sort()
                .forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    select.appendChild(option);
                });
            
            if (currentValue && TRABAJADORES[currentValue]?.active) {
                select.value = currentValue;
            }
        });
    }

    checkTimeRestriction() {
        const now = new Date();
        const hour = now.getHours();
        
        // Usar configuración de Firebase en lugar de valor fijo
        const activationHour = this.settings.activationHour || 18;
        
        if (hour >= activationHour) {
            this.showSignatureScreen();
        } else {
            this.showScreen('timeRestriction');
        }
        
        this.updateCurrentTime();
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const currentTimeElement = document.getElementById('currentTime');
        const menuCurrentTimeElement = document.getElementById('menuCurrentTime');
        
        if (currentTimeElement) {
            currentTimeElement.innerHTML = `
                <div style="font-size: 1.2rem; font-weight: 600; color: #1e293b; margin-bottom: 10px;">
                    <i class="fas fa-clock"></i> ${timeString}
                </div>
                <div style="font-size: 0.9rem; color: #64748b; text-transform: capitalize;">
                    ${dateString}
                </div>
            `;
        }
        
        if (menuCurrentTimeElement) {
            menuCurrentTimeElement.innerHTML = `
                <div><i class="fas fa-clock"></i> ${timeString}</div>
                <div style="font-size: 0.8rem; margin-top: 2px; text-transform: capitalize;">${dateString}</div>
            `;
        }
    }

    initSignatureCanvas() {
        // Canvas principal
        this.canvas = document.getElementById('signatureCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            // Eventos del mouse
            this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e, this.canvas, this.ctx));
            this.canvas.addEventListener('mousemove', (e) => this.draw(e, this.canvas, this.ctx));
            this.canvas.addEventListener('mouseup', () => this.stopDrawing());
            this.canvas.addEventListener('mouseout', () => this.stopDrawing());
            
            // Eventos táctiles
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.startDrawing({ clientX: touch.clientX, clientY: touch.clientY }, this.canvas, this.ctx);
            });
            
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.draw({ clientX: touch.clientX, clientY: touch.clientY }, this.canvas, this.ctx);
            });
            
            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopDrawing();
            });
            
            // Evento para evitar zoom en dobles tap
            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            });
        }
        
        // Canvas modal
        this.modalCanvas = document.getElementById('modalSignatureCanvas');
        if (this.modalCanvas) {
            this.modalCtx = this.modalCanvas.getContext('2d');
            this.modalCtx.strokeStyle = '#000000';
            this.modalCtx.lineWidth = 2;
            this.modalCtx.lineCap = 'round';
            this.modalCtx.lineJoin = 'round';
            
            // Eventos del mouse
            this.modalCanvas.addEventListener('mousedown', (e) => this.startModalDrawing(e));
            this.modalCanvas.addEventListener('mousemove', (e) => this.drawModal(e));
            this.modalCanvas.addEventListener('mouseup', () => this.stopModalDrawing());
            this.modalCanvas.addEventListener('mouseout', () => this.stopModalDrawing());
            
            // Eventos táctiles
            this.modalCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.startModalDrawing({ clientX: touch.clientX, clientY: touch.clientY });
            });
            
            this.modalCanvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.drawModal({ clientX: touch.clientX, clientY: touch.clientY });
            });
            
            this.modalCanvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopModalDrawing();
            });
            
            // Evento para evitar zoom en dobles tap
            this.modalCanvas.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            });
        }
    }

    // === FUNCIONES DE FIRMA ===
    startDrawing(e, canvas, ctx) {
        this.isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        
        // Calcular escala para dispositivos móviles
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    draw(e, canvas, ctx) {
        if (!this.isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Calcular escala para dispositivos móviles
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    startModalDrawing(e) {
        this.isDrawing = true;
        const rect = this.modalCanvas.getBoundingClientRect();
        
        // Calcular escala para dispositivos móviles
        const scaleX = this.modalCanvas.width / rect.width;
        const scaleY = this.modalCanvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        this.modalCtx.beginPath();
        this.modalCtx.moveTo(x, y);
    }

    drawModal(e) {
        if (!this.isDrawing) return;
        const rect = this.modalCanvas.getBoundingClientRect();
        
        // Calcular escala para dispositivos móviles
        const scaleX = this.modalCanvas.width / rect.width;
        const scaleY = this.modalCanvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        this.modalCtx.lineTo(x, y);
        this.modalCtx.stroke();
    }

    stopModalDrawing() {
        this.isDrawing = false;
    }

    clearSignature() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    clearModalSignature() {
        if (this.modalCtx) {
            this.modalCtx.clearRect(0, 0, this.modalCanvas.width, this.modalCanvas.height);
        }
    }

    // === FUNCIONES DE NAVEGACIÓN ===
    showScreen(screenId) {
        const screens = ['timeRestriction', 'mainMenu', 'authScreen', 'mainContent', 
                        'pendingSignaturesScreen', 'completedSignaturesScreen', 'adminPanel'];
        
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = id === screenId ? 'block' : 'none';
            }
        });
        
        this.currentScreen = screenId;
    }

    showMainMenu() {
        if (this.isAuthenticated) {
            this.showScreen('mainMenu');
        }
    }

    showSignatureScreen() {
        this.showScreen('mainContent');
        this.updateCurrentTime();
    }

    showSignatureScreenWithAuth() {
        // Función específica para el botón "Firmar Hoy" que requiere autenticación
        sessionStorage.setItem('pendingSignatureDate', 'today');
        this.showScreen('authScreen');
    }

    showAuthScreen() {
        this.showScreen('authScreen');
    }

    updateWorkerInfo(workerName) {
        if (workerName && TRABAJADORES[workerName]) {
            const worker = TRABAJADORES[workerName];
            document.getElementById('dni').value = worker.dni;
            document.getElementById('horario').value = worker.horario;
        } else {
            document.getElementById('dni').value = '';
            document.getElementById('horario').value = '';
        }
    }

    loadSavedPasswordForWorker(workerName) {
        if (workerName) {
            const savedPassword = localStorage.getItem(`password_${workerName}`);
            if (savedPassword) {
                document.getElementById('authPassword').value = savedPassword;
            }
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const showPasswordBtn = document.getElementById('showPassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            showPasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            passwordInput.type = 'password';
            showPasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    // === AUTENTICACIÓN ===
    handleAuth(e) {
        e.preventDefault();
        const workerName = document.getElementById('authTrabajador').value;
        const password = document.getElementById('authPassword').value;
        
        if (!TRABAJADORES[workerName]) {
            alert('Trabajador no encontrado');
            return;
        }
        
        if (TRABAJADORES[workerName].password !== password) {
            alert('Contraseña incorrecta');
            return;
        }
        
        if (!TRABAJADORES[workerName].active) {
            alert('Tu cuenta está desactivada. Contacta al administrador.');
            return;
        }
        
        this.isAuthenticated = true;
        this.currentUser = workerName;
        localStorage.setItem(`password_${workerName}`, password);
        
        // Verificar si viene del botón "Firmar Hoy" o del menú
        const pendingSignatureDate = sessionStorage.getItem('pendingSignatureDate');
        
        if (pendingSignatureDate) {
            // Si hay una fecha pendiente, ir directamente al formulario de firma
            sessionStorage.removeItem('pendingSignatureDate');
            this.showSignatureScreen();
            
            // Precargar datos del trabajador en el formulario
            document.getElementById('trabajador').value = workerName;
            this.updateWorkerInfo(workerName);
            
            // Cargar contraseña guardada
            const savedPassword = localStorage.getItem(`password_${workerName}`);
            if (savedPassword) {
                document.getElementById('password').value = savedPassword;
            }
        } else {
            // Si viene del menú, mostrar menú principal
            this.showMainMenu();
        }
    }

    // === FORMULARIO DE FIRMA ===
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const workerName = document.getElementById('trabajador').value;
        const password = document.getElementById('password').value;
        
        if (!workerName || !TRABAJADORES[workerName]) {
            alert('Selecciona un trabajador válido');
            return;
        }
        
        if (TRABAJADORES[workerName].password !== password) {
            alert('Contraseña incorrecta');
            return;
        }
        
        if (!TRABAJADORES[workerName].active) {
            alert('Tu cuenta está desactivada. Contacta al administrador.');
            return;
        }
        
        // Verificar si ya firmó hoy
        const signatures = await this.getSignaturesFromFirebase(workerName);
        const today = new Date().toISOString().split('T')[0];
        const hasSignedToday = signatures.some(sig => sig.date === today);
        
        if (hasSignedToday) {
            alert('Ya has firmado hoy. Solo se permite una firma por día.');
            return;
        }
        
        // Verificar firma en canvas
        if (this.isCanvasEmpty(this.canvas, this.ctx)) {
            alert('Por favor, firma en el canvas');
            return;
        }
        
        await this.saveSignature(workerName);
    }

    isCanvasEmpty(canvas, ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] !== 0) return false;
        }
        return true;
    }

    async saveSignature(workerName) {
        this.showLoading('Guardando firma y generando PDF...');
        
        try {
            const today = new Date();
            const signatureData = {
                date: today.toISOString().split('T')[0],
                time: today.toTimeString().split(' ')[0],
                dni: TRABAJADORES[workerName].dni,
                nombre: workerName,
                horario: TRABAJADORES[workerName].horario,
                signature: this.canvas.toDataURL(),
                timestamp: today.getTime()
            };
            
            // Guardar en Firebase
            await this.saveSignatureToFirebase(workerName, signatureData);
            
            // Generar y descargar PDF como en la versión original
            const pdfData = {
                trabajador: workerName,
                dni: TRABAJADORES[workerName].dni,
                horario: TRABAJADORES[workerName].horario,
                fecha: today.toLocaleDateString('es-ES'),
                hora: today.toTimeString().split(' ')[0],
                firma: this.canvas.toDataURL()
            };
            
            console.log('Generando PDF para:', pdfData);
            
            // Verificar que jsPDF esté disponible
            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                throw new Error('jsPDF no está disponible');
            }
            
            // Generar PDF
            await this.generatePDF(pdfData);
            
            this.clearSignature();
            
            // Mostrar mensaje de éxito
            this.showSuccess('✅ Firma registrada exitosamente. PDF descargado.');
            
            // Después de 3 segundos, volver al menú principal
            setTimeout(() => {
                if (this.isAuthenticated) {
                    this.showMainMenu();
                } else {
                    this.showSignatureScreen();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error guardando firma:', error);
            this.hideLoading(); // Ocultar loading antes de mostrar el error
            
            // Mostrar error específico
            if (error.message.includes('jsPDF')) {
                this.showError('Error: No se pudo generar el PDF. Verifica la conexión a internet.');
            } else {
                this.showError('Error al guardar la firma: ' + error.message + '. Inténtalo de nuevo.');
            }
        } finally {
            this.hideLoading();
        }
    }

    // === PANEL DE ADMINISTRADOR ===
    showAdminAuth() {
        document.getElementById('adminAuthModal').style.display = 'flex';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }

    closeAdminAuthModal() {
        document.getElementById('adminAuthModal').style.display = 'none';
    }

    handleAdminAuth(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        
        if (password === ADMIN_PASSWORD) {
            this.isAdmin = true;
            this.closeAdminAuthModal();
            this.showAdminPanel();
        } else {
            alert('Contraseña incorrecta');
            document.getElementById('adminPassword').value = '';
        }
    }

    async showAdminPanel() {
        this.showScreen('adminPanel');
        
        // Actualizar datos
        await this.updateStats();
        await this.renderUsersTable();
        await this.renderCalendar();
        await this.renderWorkerStats();
        this.populateExportWorkers();
        this.updateSettingsUI();
    }

    exitAdmin() {
        this.isAdmin = false;
        this.checkTimeRestriction();
    }

    switchAdminTab(tabName) {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
    }

    async updateStats() {
        const activeWorkers = Object.values(TRABAJADORES).filter(w => w.active).length;
        document.getElementById('totalWorkers').textContent = activeWorkers;
        
        const today = new Date().toISOString().split('T')[0];
        let signaturesToday = 0;
        
        // Obtener firmas de hoy de todos los trabajadores
        for (const workerName of Object.keys(TRABAJADORES)) {
            if (!TRABAJADORES[workerName].active) continue;
            
            const signatures = await this.getSignaturesFromFirebase(workerName);
            if (signatures.some(sig => sig.date === today)) {
                signaturesToday++;
            }
        }
        
        document.getElementById('signaturesToday').textContent = signaturesToday;
        document.getElementById('pendingToday').textContent = activeWorkers - signaturesToday;
        
        const holidays = await this.getHolidays();
        document.getElementById('totalHolidays').textContent = holidays.length;
    }

    async renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        Object.keys(TRABAJADORES)
            .sort()
            .forEach(workerName => {
                const worker = TRABAJADORES[workerName];
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${workerName}</td>
                    <td>${worker.dni}</td>
                    <td>${worker.horario}</td>
                    <td>
                        <span class="status-badge ${worker.active ? 'status-active' : 'status-inactive'}">
                            ${worker.active ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-icon" onclick="app.editUser('${workerName}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="app.toggleUserStatus('${workerName}')" title="Activar/Desactivar">
                            <i class="fas fa-toggle-${worker.active ? 'on' : 'off'}"></i>
                        </button>
                        <button class="btn-icon delete" onclick="app.deleteUser('${workerName}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
    }

    async renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('currentMonth');
        if (!grid || !monthDisplay) return;
        
        const holidays = await this.getHolidays();
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        monthDisplay.textContent = this.currentMonth.toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        grid.innerHTML = '';
        
        // Encabezados de días de la semana
        const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.style.fontWeight = '600';
            dayHeader.style.fontSize = '0.8rem';
            dayHeader.style.color = '#64748b';
            dayHeader.style.textAlign = 'center';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });
        
        // Primer día del mes y cuántos días tiene
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lunes = 0
        
        // Días vacíos al inicio
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            grid.appendChild(emptyDay);
        }
        
        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Verificar si es fin de semana
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayElement.classList.add('weekend');
                dayElement.style.cursor = 'default';
            } else {
                // Verificar si es festivo
                if (holidays.includes(dateStr)) {
                    dayElement.classList.add('holiday');
                }
                
                dayElement.addEventListener('click', () => {
                    if (!this.isHolidaySync(date)) {
                        this.toggleHoliday(date);
                    }
                });
            }
            
            grid.appendChild(dayElement);
        }
    }

    isHolidaySync(date) {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Fines de semana
    }

    async renderWorkerStats() {
        const container = document.getElementById('workerStats');
        if (!container) return;
        
        container.innerHTML = '';
        
        const stats = [];
        
        for (const workerName of Object.keys(TRABAJADORES)) {
            const signatures = await this.getSignaturesFromFirebase(workerName);
            const worker = TRABAJADORES[workerName];
            
            stats.push({
                name: workerName,
                dni: worker.dni,
                active: worker.active,
                totalSignatures: signatures.length
            });
        }
        
        // Ordenar por número de firmas
        stats.sort((a, b) => b.totalSignatures - a.totalSignatures);
        
        stats.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 8px;
            `;
            
            statDiv.innerHTML = `
                <div>
                    <div style="font-weight: 600; color: #1e293b;">${stat.name}</div>
                    <div style="font-size: 0.85rem; color: #64748b;">DNI: ${stat.dni}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: #6366f1;">
                        ${stat.totalSignatures}
                    </div>
                    <div style="font-size: 0.8rem; color: #64748b;">firmas</div>
                </div>
            `;
            
            container.appendChild(statDiv);
        });
    }

    populateExportWorkers() {
        const select = document.getElementById('exportWorker');
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Todos los trabajadores</option>';
        
        Object.keys(TRABAJADORES)
            .filter(name => TRABAJADORES[name].active)
            .sort()
            .forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        
        if (currentValue && TRABAJADORES[currentValue]?.active) {
            select.value = currentValue;
        }
    }

    // === GESTIÓN DE USUARIOS ===
    showUserModal(userName = null) {
        this.editingUser = userName;
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        
        if (modal) modal.style.display = 'flex';
        
        if (userName) {
            const worker = TRABAJADORES[userName];
            title.textContent = 'Editar Trabajador';
            
            document.getElementById('userName').value = userName;
            document.getElementById('userDNI').value = worker.dni;
            document.getElementById('userPassword').value = worker.password;
            document.getElementById('userSchedule').value = worker.horario;
            document.getElementById('userEmail').value = worker.email || '';
            document.getElementById('userPhone').value = worker.telefono || '';
        } else {
            title.textContent = 'Añadir Trabajador';
            document.getElementById('userForm').reset();
            // Generar contraseña aleatoria
            const randomPassword = this.generateRandomPassword();
            document.getElementById('userPassword').value = randomPassword;
        }
    }

    closeUserModal() {
        document.getElementById('userModal').style.display = 'none';
        this.editingUser = null;
    }

    generateRandomPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    async handleUserForm(e) {
        e.preventDefault();
        
        const userName = document.getElementById('userName').value.trim();
        const userDNI = document.getElementById('userDNI').value.trim();
        const userPassword = document.getElementById('userPassword').value;
        const userSchedule = document.getElementById('userSchedule').value;
        const userEmail = document.getElementById('userEmail').value.trim();
        const userPhone = document.getElementById('userPhone').value.trim();
        
        if (!userName || !userDNI || !userPassword) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }
        
        // Verificar que el DNI no esté duplicado
        const existingWorker = Object.keys(TRABAJADORES).find(name => 
            name !== this.editingUser && TRABAJADORES[name].dni === userDNI
        );
        
        if (existingWorker) {
            alert('Ya existe un trabajador con este DNI');
            return;
        }
        
        const workerData = {
            dni: userDNI,
            password: userPassword,
            horario: userSchedule,
            email: userEmail,
            telefono: userPhone,
            active: true
        };
        
        if (this.editingUser) {
            // Editar usuario existente
            if (this.editingUser !== userName) {
                delete TRABAJADORES[this.editingUser];
            }
            TRABAJADORES[userName] = workerData;
        } else {
            // Nuevo usuario
            if (TRABAJADORES[userName]) {
                alert('Ya existe un trabajador con este nombre');
                return;
            }
            TRABAJADORES[userName] = workerData;
        }
        
        await this.saveWorkersToFirebase();
        this.closeUserModal();
        this.showSuccess(this.editingUser ? 'Trabajador actualizado correctamente' : 'Trabajador añadido correctamente');
    }

    async toggleUserStatus(userName) {
        if (TRABAJADORES[userName]) {
            TRABAJADORES[userName].active = !TRABAJADORES[userName].active;
            await this.saveWorkersToFirebase();
            this.showSuccess(`Trabajador ${TRABAJADORES[userName].active ? 'activado' : 'desactivado'}`);
        }
    }

    async deleteUser(userName) {
        if (confirm(`¿Estás seguro de que quieres eliminar a ${userName}?\n\nEsta acción es irreversible y se perderán todas sus firmas.`)) {
            delete TRABAJADORES[userName];
            await this.saveWorkersToFirebase();
            this.showSuccess('Trabajador eliminado correctamente');
        }
    }

    editUser(userName) {
        this.showUserModal(userName);
    }

    // === CALENDARIO ===
    changeMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.renderCalendar();
    }

    // === EXPORTACIÓN ===
    async handleExport() {
        const fromDate = document.getElementById('exportFromDate').value;
        const toDate = document.getElementById('exportToDate').value;
        const worker = document.getElementById('exportWorker').value;
        const format = document.getElementById('exportFormat').value;
        
        if (!fromDate || !toDate) {
            alert('Por favor, selecciona las fechas de inicio y fin');
            return;
        }
        
        if (new Date(fromDate) > new Date(toDate)) {
            alert('La fecha de inicio no puede ser posterior a la fecha de fin');
            return;
        }
        
        this.showLoading('Generando informe...');
        
        try {
            const allSignatures = [];
            
            const workersToExport = worker ? [worker] : Object.keys(TRABAJADORES).filter(name => TRABAJADORES[name].active);
            
            for (const workerName of workersToExport) {
                const signatures = await this.getSignaturesFromFirebase(workerName);
                
                signatures.forEach(signature => {
                    if (signature.date >= fromDate && signature.date <= toDate) {
                        allSignatures.push({
                            'Nombre': workerName,
                            'DNI': TRABAJADORES[workerName].dni,
                            'Fecha': signature.date,
                            'Hora': signature.time,
                            'Horario': TRABAJADORES[workerName].horario,
                            'Estado': 'Firmado'
                        });
                    }
                });
            }
            
            if (allSignatures.length === 0) {
                this.showError('No se encontraron firmas en el rango de fechas seleccionado');
                return;
            }
            
            if (format === 'excel') {
                this.exportToExcel(allSignatures);
            } else {
                this.exportToPDF(allSignatures);
            }
            
        } catch (error) {
            console.error('Error exportando:', error);
            this.showError('Error al generar el informe');
        } finally {
            this.hideLoading();
        }
    }

    exportToExcel(data) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmas');
        
        const fileName = `registro_firmas_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        this.showSuccess('Informe Excel descargado correctamente');
    }

    async exportToPDF(data) {
        // Generar PDFs individuales para cada firma en lugar de un resumen
        this.showLoading('Generando PDFs individuales...');
        
        try {
            let pdfCount = 0;
            
            // Obtener todas las firmas con datos completos
            for (const item of data) {
                const workerName = item.Nombre;
                const signatures = await this.getSignaturesFromFirebase(workerName);
                const signature = signatures.find(sig => 
                    sig.date === item.Fecha && sig.time === item.Hora
                );
                
                if (signature) {
                    await this.downloadIndividualPDF(signature, workerName);
                    pdfCount++;
                    
                    // Pequeña pausa entre descargas para evitar sobrecarga
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            if (pdfCount > 0) {
                this.showSuccess(`${pdfCount} PDFs individuales descargados correctamente`);
            } else {
                this.showError('No se pudieron generar los PDFs individuales');
            }
            
        } catch (error) {
            console.error('Error exportando PDFs:', error);
            this.showError('Error al generar los PDFs individuales');
        } finally {
            this.hideLoading();
        }
    }

    updateExportUI(format) {
        const workerSelect = document.getElementById('exportWorker');
        if (workerSelect) {
            workerSelect.style.display = format === 'pdf' ? 'block' : 'none';
        }
    }

    // === PANTALLAS DE FIRMAS ===
    async showPendingSignatures() {
        this.showScreen('pendingSignaturesScreen');
        await this.renderPendingSignatures();
    }

    async showCompletedSignatures() {
        this.showScreen('completedSignaturesScreen');
        await this.renderCompletedSignatures();
    }

    async renderPendingSignatures() {
        const container = document.getElementById('pendingList');
        const userInfo = document.getElementById('pendingUserInfo');
        
        if (!container || !userInfo) return;
        
        const signatures = await this.getSignaturesFromFirebase(this.currentUser);
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const holidays = await this.getHolidays();
        
        userInfo.innerHTML = `
            <div class="user-info-content">
                <h3>${this.currentUser}</h3>
                <p><i class="fas fa-id-card"></i> ${TRABAJADORES[this.currentUser].dni}</p>
                <p><i class="fas fa-clock"></i> ${TRABAJADORES[this.currentUser].horario}</p>
            </div>
        `;
        
        container.innerHTML = '';
        
        const signedDates = signatures.map(sig => sig.date);
        const pendingDays = [];
        
        for (let date = new Date(thirtyDaysAgo); date <= today; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            
            // Saltar fines de semana y festivos
            if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr)) {
                continue;
            }
            
            // Saltar días futuros
            if (date > today) {
                continue;
            }
            
            // Saltar días antes del inicio del sistema (1 oct 2025)
            const systemStart = new Date('2025-10-01');
            if (date < systemStart) {
                continue;
            }
            
            if (!signedDates.includes(dateStr)) {
                pendingDays.push(new Date(date));
            }
        }
        
        if (pendingDays.length === 0) {
            container.innerHTML = `
                <div class="no-pending">
                    <i class="fas fa-check-circle"></i>
                    <h3>¡No tienes firmas pendientes!</h3>
                    <p>Has firmado todos los días laborables de los últimos 30 días.</p>
                </div>
            `;
        } else {
            pendingDays.sort((a, b) => b - a); // Más recientes primero
            
            pendingDays.forEach(date => {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'pending-day';
                dayDiv.innerHTML = `
                    <div class="day-date">${date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</div>
                    <button class="btn-primary" onclick="app.signPendingDay('${date.toISOString().split('T')[0]}')">
                        <i class="fas fa-signature"></i>
                        Firmar Este Día
                    </button>
                `;
                container.appendChild(dayDiv);
            });
        }
    }

    async renderCompletedSignatures() {
        const container = document.getElementById('completedList');
        const userInfo = document.getElementById('completedUserInfo');
        
        if (!container || !userInfo) return;
        
        const signatures = await this.getSignaturesFromFirebase(this.currentUser);
        
        userInfo.innerHTML = `
            <div class="user-info-content">
                <h3>${this.currentUser}</h3>
                <p><i class="fas fa-id-card"></i> ${TRABAJADORES[this.currentUser].dni}</p>
                <p><i class="fas fa-clock"></i> ${TRABAJADORES[this.currentUser].horario}</p>
                <p><i class="fas fa-chart-bar"></i> Total de firmas: ${signatures.length}</p>
            </div>
        `;
        
        container.innerHTML = '';
        
        if (signatures.length === 0) {
            container.innerHTML = `
                <div class="no-signatures">
                    <i class="fas fa-folder-open"></i>
                    <h3>No tienes firmas registradas</h3>
                    <p>Cuando firmes, aparecerán aquí.</p>
                </div>
            `;
        } else {
            // Ordenar por fecha más reciente
            signatures.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            signatures.forEach(signature => {
                const signatureDiv = document.createElement('div');
                signatureDiv.className = 'signature-item';
                signatureDiv.innerHTML = `
                    <div class="signature-info">
                        <div class="signature-date">${new Date(signature.date).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</div>
                        <div class="signature-time">
                            <i class="fas fa-clock"></i> ${signature.time}
                        </div>
                    </div>
                    <button class="btn-secondary" onclick="(() => { app.downloadPDF('${signature.date}'); })()">
                        <i class="fas fa-download"></i>
                        Descargar PDF Individual
                    </button>
                `;
                container.appendChild(signatureDiv);
            });
        }
    }

    async signPendingDay(dateStr) {
        this.pendingSignatureDate = dateStr;
        document.getElementById('modalDayInfo').innerHTML = `
            <p><strong>Día a firmar:</strong> ${new Date(dateStr).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        `;
        document.getElementById('signSpecificDayModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('signSpecificDayModal').style.display = 'none';
        this.pendingSignatureDate = null;
        this.clearModalSignature();
    }

    async confirmPendingSignature() {
        // Usar la función más robusta para validar el canvas
        const imageData = this.modalCtx.getImageData(0, 0, this.modalCanvas.width, this.modalCanvas.height);
        const pixels = imageData.data;
        let hasContent = false;
        
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] !== 0) {
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) {
            alert('⚠️ Por favor, realiza una firma válida en el canvas');
            return;
        }
        
        this.showLoading('Guardando firma...');
        
        try {
            const signatureData = {
                date: this.pendingSignatureDate,
                time: new Date().toTimeString().split(' ')[0],
                dni: TRABAJADORES[this.currentUser].dni,
                nombre: this.currentUser,
                horario: TRABAJADORES[this.currentUser].horario,
                signature: this.modalCanvas.toDataURL(),
                timestamp: Date.now()
            };
            
            await this.saveSignatureToFirebase(this.currentUser, signatureData);
            this.closeModal();
            this.showSuccess('Firma guardada correctamente');
            
            // Actualizar pantalla
            setTimeout(() => {
                this.showPendingSignatures();
            }, 1000);
            
        } catch (error) {
            console.error('Error guardando firma:', error);
            this.showError('Error al guardar la firma');
        } finally {
            this.hideLoading();
        }
    }

    async downloadPDF(signatureTimestamp) {
        const signatures = await this.getSignaturesFromFirebase(this.currentUser);
        const signature = signatures.find(sig => sig.timestamp.toString() === signatureTimestamp);
        
        if (!signature) {
            alert('Firma no encontrada');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Logo y encabezado
        doc.setFontSize(20);
        doc.text('REGISTRO HORARIO LABORAL', 20, 30);
        
        doc.setFontSize(12);
        doc.text('Redes Carreras SL', 20, 45);
        
        // Información del trabajador
        doc.text('DATOS DEL TRABAJADOR:', 20, 65);
        doc.text(`Nombre: ${signature.nombre}`, 20, 75);
        doc.text(`DNI: ${signature.dni}`, 20, 85);
        doc.text(`Horario: ${signature.horario}`, 20, 95);
        
        // Información de la firma
        doc.text('DATOS DE LA FIRMA:', 20, 115);
        doc.text(`Fecha: ${new Date(signature.date).toLocaleDateString('es-ES')}`, 20, 125);
        doc.text(`Hora: ${signature.time}`, 20, 135);
        
        // Firma
        if (signature.signature) {
            doc.text('FIRMA DIGITAL:', 20, 155);
            const imgWidth = 80;
            const imgHeight = 30;
            doc.addImage(signature.signature, 'PNG', 20, 160, imgWidth, imgHeight);
        }
        
        // Declaración legal
        doc.text('DECLARACIÓN LEGAL:', 20, 200);
        const legalText = 'Declaro que, en virtud de la Ley 8/1980, de 10 de marzo, del Estatuto de los Trabajadores, así como de la normativa vigente sobre registro de jornada laboral, procedo a firmar y confirmar que las horas trabajadas han sido registradas correctamente en el presente formulario.';
        
        const splitText = doc.splitTextToSize(legalText, 170);
        doc.text(splitText, 20, 210);
        
        // Fecha de generación
        doc.text(`Documento generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, 250);
        
        // Descargar
        const nombreNormalizado = (signature.nombre || 'trabajador').replace(/\s+/g, '_');
        const fileName = `firma_${nombreNormalizado}_${signature.date}.pdf`;
        doc.save(fileName);
        
        // Mostrar mensaje de éxito
        this.showSuccess('PDF individual descargado correctamente');
    }

    // Función para descargar PDF individual (reutilizable)
    async downloadIndividualPDF(signature, workerName = null) {
        try {
            // Si no se proporciona workerName, usar el actual
            if (!workerName) {
                workerName = this.currentUser;
            }
            
            // Verificar que el trabajador existe en TRABAJADORES
            if (!TRABAJADORES[workerName]) {
                this.showError('No se encontró información del trabajador');
                return;
            }
            
            // Preparar datos para el PDF oficial
            const pdfData = {
                trabajador: signature.nombre || workerName,
                dni: signature.dni || TRABAJADORES[workerName].dni,
                horario: signature.horario || TRABAJADORES[workerName].horario,
                fecha: new Date(signature.date).toLocaleDateString('es-ES'),
                hora: signature.time || new Date().toTimeString().split(' ')[0],
                firma: signature.signature || ''
            };
            
            // Verificar que jsPDF esté disponible
            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                throw new Error('jsPDF no está disponible');
            }
            
            // Generar el PDF oficial
            await this.generatePDF(pdfData);
            
        } catch (error) {
            console.error('Error descargando PDF:', error);
            this.showError('Error al descargar el documento');
        }
    }

    // === FUNCIONES ADICIONALES FALTANTES ===
    
    showMessage(message, type, target = 'default') {
        let statusMessage;
        
        // Determinar qué contenedor de mensaje usar
        if (target === 'auth') {
            statusMessage = document.getElementById('authStatusMessage');
        } else if (target === 'main') {
            statusMessage = document.getElementById('mainStatusMessage');
        } else {
            // Usar el mensaje predeterminado (fallback)
            statusMessage = document.getElementById('statusMessage');
        }
        
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type} show`;
            
            // Ocultar automáticamente después de 5 segundos
            setTimeout(() => {
                statusMessage.classList.remove('show');
            }, 5000);
        } else {
            // Fallback: usar alert si no hay contenedor de mensaje
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    isCanvasEmpty() {
        const blank = document.createElement('canvas');
        blank.width = this.canvas.width;
        blank.height = this.canvas.height;
        return this.canvas.toDataURL() === blank.toDataURL();
    }

    startDrawing(e, canvas, ctx) {
        this.isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        
        // Calcular escala para dispositivos móviles
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    draw(e, canvas, ctx) {
        if (!this.isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Calcular escala para dispositivos móviles
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    getLogoBase64() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = this.width;
                canvas.height = this.height;
                ctx.drawImage(this, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = 'logo-redes_Transparente-216x216.png';
        });
    }

    // === FUNCIONES DE PDF COMPLETAS ===
    
    async generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurar fuente
        doc.setFont('helvetica');
        
        // Agregar logo de la empresa
        let logoBase64 = '';
        try {
            logoBase64 = await this.getLogoBase64();
        } catch (error) {
            console.warn('No se pudo cargar el logo:', error);
        }
        
        // Header con logo y título
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 15, 15, 25, 25);
        }
        
        // Título principal
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('REGISTRO HORARIO LABORAL', 20, 30); // Cambiado para evitar que se salga
        
        // Subtítulo oficial
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Documento Oficial - Sistema de Registro Horario', 20, 38); // Cambiado para evitar que se salga
        doc.setTextColor(0, 0, 0);
        
        // Línea decorativa
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(1);
        doc.line(20, 45, 190, 45);
        
        // Información de horarios en recuadro
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 50, 170, 20, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('HORARIOS LABORALES:', 25, 58);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('PLANTA EXTERNA: 08:00 - 14:00 / 15:00 - 17:00', 25, 63);
        doc.text('OFICINA: 08:00 - 16:00', 25, 67);
        
        // Sección de datos del trabajador
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(20, 80, 170, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DATOS DEL TRABAJADOR', 25, 86);
        
        // Datos en tabla
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        
        // Fila 1
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 95, 85, 8, 1, 1, 'F');
        doc.roundedRect(105, 95, 85, 8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Nombre y Apellidos:', 23, 101);
        doc.text('DNI:', 108, 101);
        doc.setFont('helvetica', 'normal');
        const trabajadorText = data.trabajador || 'Trabajador no especificado';
        doc.text(trabajadorText.length > 25 ? trabajadorText.substring(0, 25) + '...' : trabajadorText, 23, 105);
        doc.text(data.dni || 'No disponible', 108, 105); // DNI completo en PDF
        
        // Fila 2
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 110, 85, 8, 1, 1, 'F');
        doc.roundedRect(105, 110, 85, 8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha de Registro:', 23, 116);
        doc.text('Hora de Registro:', 108, 116);
        doc.setFont('helvetica', 'normal');
        doc.text(data.fecha || 'No especificada', 23, 120);
        doc.text(data.hora || 'No especificada', 108, 120);
        
        // Horario laboral
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 125, 170, 8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Horario Laboral:', 23, 131);
        doc.setFont('helvetica', 'normal');
        doc.text(data.horario || 'No especificado', 23, 135);
        
        // Declaración legal
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(20, 145, 170, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DECLARACIÓN LEGAL', 25, 151);
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const declaracion = '"Declaro que, en virtud de la Ley 8/1980, de 10 de marzo, del Estatuto de los Trabajadores, así como de la normativa vigente sobre registro de jornada laboral, procedo a firmar y confirmar que las horas trabajadas han sido registradas correctamente en el presente formulario. Firmo para constancia de que las horas consignadas en este registro corresponden a las realizadas durante mi jornada laboral. Acepto que la información proporcionada sea almacenada conforme a la legislación laboral vigente."';
        
        const splitDeclaracion = doc.splitTextToSize(declaracion, 170);
        doc.text(splitDeclaracion, 20, 160);
        
        // Sección de firma
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(20, 200, 170, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('FIRMA DIGITAL DEL TRABAJADOR', 25, 206);
        
        // Marco para la firma
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, 215, 100, 35, 2, 2);
        
        // Añadir imagen de la firma
        if (data.firma && data.firma !== 'data:,') {
            doc.addImage(data.firma, 'PNG', 22, 217, 96, 31);
        }
        
        // Información adicional
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Trabajador: ${data.trabajador || 'No especificado'}`, 125, 225);
        doc.text(`DNI: ${data.dni || 'No disponible'}`, 125, 230);
        doc.text(`Fecha: ${data.fecha || 'No especificada'}`, 125, 235);
        doc.text(`Hora: ${data.hora || 'No especificada'}`, 125, 240);
        
        // Pie de página con línea decorativa
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.5);
        doc.line(20, 260, 190, 260);
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Documento generado automáticamente el ${data.fecha || 'No especificada'} a las ${data.hora || 'No especificada'}`, 105, 270);
        doc.text('Sistema de Registro Horario Laboral - Redes Carreras', 105, 275);
        
        // Generar PDF como blob para envío por email
        const pdfBlob = doc.output('blob');
        const fechaNormalizada = (data.fecha || 'fecha-no-disponible').replace(/\//g, '-');
        const fileName = `registro_${data.dni || 'sin-dni'}_${fechaNormalizada}.pdf`;
        
        // Descargar PDF
        doc.save(fileName);
        
        // Enviar por email
        await this.sendEmailWithPDF(data, pdfBlob, fileName);
        
        return pdfBlob;
    }

    async downloadPDF(dateString) {
        console.log('Intentando descargar PDF para fecha:', dateString);
        
        try {
            const signedDates = await this.getSignedDates(this.currentUser);
            console.log('Firmas encontradas:', signedDates.length);
            console.log('Fechas disponibles:', signedDates.map(s => s.date));
            
            // Buscar la firma por fecha de forma más robusta
            const signature = signedDates.find(s => {
                const signatureDate = s.date.split('T')[0]; // Asegurar formato YYYY-MM-DD
                const targetDate = dateString.split('T')[0]; // Asegurar formato YYYY-MM-DD
                return signatureDate === targetDate;
            });
            
            console.log('Firma encontrada:', signature);
            
            if (!signature) {
                this.showMessage('No se encontró la firma para esta fecha', 'error');
                return;
            }
            
            // Preparar datos en la estructura correcta para generatePDF
            console.log('Estructura completa de la firma:', signature); // Debug para ver todos los campos
            const pdfData = {
                trabajador: signature.trabajador || signature.nombre || this.currentUser,
                dni: signature.dni || TRABAJADORES[this.currentUser].dni,
                horario: signature.horario || TRABAJADORES[this.currentUser].horario,
                fecha: signature.fecha,
                hora: signature.time || signature.hora,
                firma: signature.firma || signature.signature || '' // Verificar ambos nombres de campo
            };
            
            console.log('Datos preparados para PDF:', pdfData);
            console.log('Campo firma:', signature.firma ? 'Sí (firma)' : 'No');
            console.log('Campo signature:', signature.signature ? 'Sí (signature)' : 'No');
            await this.generatePDF(pdfData);
            this.showMessage('✅ PDF descargado exitosamente', 'success');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            this.showMessage('Error al generar el PDF: ' + error.message, 'error');
        }
    }

    async sendEmailWithPDF(data, pdfBlob, fileName) {
        // Función simplificada para Firebase (sin emailjs)
        console.log('PDF generado exitosamente:', fileName);
        
        // En una implementación completa, aquí se enviaría el email
        if (navigator.onLine) {
            console.log('Email would be sent to instalaciones@redescarreras.es');
        } else {
            console.log('Sin conexión - email pendiente de envío');
        }
    }

    getFormData() {
        const now = new Date();
        const trabajador = document.getElementById('trabajador').value;
        
        return {
            trabajador: trabajador,
            dni: TRABAJADORES[trabajador].dni, // DNI completo para PDF
            horario: document.getElementById('horario').value,
            fecha: now.toLocaleDateString('es-ES'),
            hora: now.toLocaleTimeString('es-ES'),
            firma: this.canvas.toDataURL(),
            registroFecha: now.toISOString().split('T')[0]
        };
    }
}

// Inicializar aplicación cuando el DOM esté listo
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RegistroHorarioApp();
});

// Registrar Service Worker (opcional para PWA)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => console.log('SW registrado'))
        .catch(registrationError => console.log('SW falló'));
}
