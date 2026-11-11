// ================================================
// REGISTRO HORARIO LABORAL - VERSIÓN FIREBASE
// MEJORAS APLICADAS: Seguridad, Auto-Login y Firmas en 1-clic.
// ================================================

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

// MEJORA SEGURIDAD: Objeto de trabajadores vacío en el frontend. Los datos provienen estrictamente de la BD.
let TRABAJADORES = {}; 
const ADMIN_PASSWORD = 'Admin2025!';

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
        
        this.init();
    }

    async init() {
        this.showLoading('Conectando de forma segura...');
        
        try {
            this.checkDependencies();
            
            // Cargar datos vitales desde la nube PRIMERO
            await this.loadWorkersFromFirebase();
            await this.loadSettingsFromFirebase();
            
            // MEJORA RAPIDEZ: Comprobar sesión persistente para hacer auto-login
            this.checkAutoLogin();

            this.setupEventListeners();
            this.initSignatureCanvas();
            this.populateWorkerSelects();
            this.setupRealtimeListeners();
            
            const configWarning = document.getElementById('configWarning');
            if (configWarning) configWarning.style.display = 'none';
            
            this.checkTimeRestriction();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error inicializando aplicación:', error);
            this.hideLoading();
            this.showError('Error al conectar con el servidor.');
        }
    }

    checkDependencies() {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            console.warn('jsPDF no está disponible.');
        }
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está disponible');
        }
    }

    async loadWorkersFromFirebase() {
        try {
            const snapshot = await db.ref('trabajadores').once('value');
            if (snapshot.exists()) {
                TRABAJADORES = snapshot.val();
            } else {
                console.warn("Base de datos de trabajadores vacía.");
                TRABAJADORES = {};
            }
        } catch (error) {
            console.error('Error cargando trabajadores:', error);
        }
    }

    // MEJORA: Sistema de Auto-Login si el usuario lo permitió
    checkAutoLogin() {
        const rememberAuth = localStorage.getItem('rememberAuth');
        const savedUser = localStorage.getItem('currentUser');
        
        if (rememberAuth === 'true' && savedUser && TRABAJADORES[savedUser] && TRABAJADORES[savedUser].active) {
            this.isAuthenticated = true;
            this.currentUser = savedUser;
            document.getElementById('logoutBtn').style.display = 'flex';
            
            // Cargar información vital silenciosamente
            const selectTrabajador = document.getElementById('trabajador');
            if(selectTrabajador) {
                // Inyectamos opción temporalmente si los selects no se han poblado del todo
                const opt = document.createElement('option');
                opt.value = savedUser;
                opt.textContent = savedUser;
                selectTrabajador.appendChild(opt);
                selectTrabajador.value = savedUser;
            }
            this.updateWorkerInfo(savedUser);
            
            const savedPassword = localStorage.getItem(`password_${savedUser}`);
            if (savedPassword) {
                const passInput = document.getElementById('password');
                if(passInput) passInput.value = savedPassword;
            }
        }
    }

    // === EL RESTO DE METODOS DE FIREBASE Y UI SE MANTIENEN ============
    async saveWorkersToFirebase() {
        try {
            await db.ref('trabajadores').set(TRABAJADORES);
            this.populateWorkerSelects();
        } catch (error) {
            console.error('Error guardando trabajadores:', error);
        }
    }

    async loadSettingsFromFirebase() {
        try {
            const snapshot = await db.ref('settings').once('value');
            if (snapshot.exists()) this.settings = snapshot.val() || this.settings;
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

    async getSignaturesFromFirebase(workerName) {
        try {
            const snapshot = await db.ref(`signatures/${workerName}`).once('value');
            return snapshot.exists() ? snapshot.val().signatures || [] : [];
        } catch (error) {
            console.error('Error cargando firmas:', error);
            return [];
        }
    }

    async saveSignatureToFirebase(workerName, signatureData) {
        try {
            const signatures = await this.getSignaturesFromFirebase(workerName);
            signatures.push(signatureData);
            await db.ref(`signatures/${workerName}`).set({
                signatures: signatures,
                lastUpdated: new Date().getTime()
            });
        } catch (error) {
            console.error('Error guardando firma:', error);
            throw error;
        }
    }

    setupRealtimeListeners() {
        db.ref('trabajadores').on('value', (snapshot) => {
            if (snapshot.exists()) {
                TRABAJADORES = snapshot.val();
                this.populateWorkerSelects();
            }
        });
    }

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
        if (indicator) indicator.style.display = 'none';
    }

    showError(message) {
        const statusMessage = document.getElementById('mainStatusMessage');
        if (statusMessage) {
            statusMessage.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
            statusMessage.className = 'status-message error show';
            setTimeout(() => { statusMessage.classList.remove('show'); }, 5000);
        } else { alert(message); }
    }

    showSuccess(message) {
        const statusMessage = document.getElementById('mainStatusMessage');
        if (statusMessage) {
            statusMessage.innerHTML = `<div class="success-message"><i class="fas fa-check-circle"></i> ${message}</div>`;
            statusMessage.className = 'status-message success show';
            setTimeout(() => { statusMessage.classList.remove('show'); }, 4000);
        }
    }

    setupEventListeners() {
        document.getElementById('menuAccessBtn')?.addEventListener('click', () => {
            if (this.isAuthenticated) this.showMainMenu();
            else this.showAuthScreen();
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

        document.getElementById('authForm')?.addEventListener('submit', (e) => this.handleAuth(e));
        
        document.getElementById('trabajador')?.addEventListener('change', (e) => this.updateWorkerInfo(e.target.value));
        
        document.getElementById('clearSignature')?.addEventListener('click', () => this.clearSignature());
        document.getElementById('registroForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // MEJORA FIRMA: Eventos para alternar entre firma nueva y guardada
        document.getElementById('btnDrawNew')?.addEventListener('click', () => {
            document.getElementById('savedSignatureContainer').style.display = 'none';
            document.getElementById('drawSignatureContainer').style.display = 'block';
            document.getElementById('useSavedSignature').checked = false;
            this.clearSignature();
        });

        // Eventos básicos de Canvas
        this.initSignatureCanvas();
    }

    handleLogout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.setItem('rememberAuth', 'false');
        document.getElementById('logoutBtn').style.display = 'none';
        
        // Limpiamos los inputs
        document.getElementById('trabajador').value = '';
        document.getElementById('horario').value = '';
        document.getElementById('password').value = '';
        
        this.showSuccess("Sesión cerrada correctamente");
        setTimeout(() => this.checkTimeRestriction(), 1000);
    }

    populateWorkerSelects() {
        const selects = ['trabajador', 'authTrabajador', 'exportWorker'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            const currentValue = select.value || (this.currentUser && selectId === 'trabajador' ? this.currentUser : "");
            
            select.innerHTML = '<option value="">- Selecciona tu nombre -</option>';
            Object.keys(TRABAJADORES).filter(name => TRABAJADORES[name].active).sort().forEach(name => {
                const option = document.createElement('option');
                option.value = name; option.textContent = name;
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
        const activationHour = this.settings.activationHour || 18;
        
        // Si es la hora adecuada y el usuario tiene auto-login, va directo a firmar. Si no, login obligatorio.
        if (hour >= activationHour) {
            if (this.isAuthenticated) {
                this.showSignatureScreen();
                document.getElementById('trabajador').value = this.currentUser;
                this.updateWorkerInfo(this.currentUser);
            } else {
                this.showAuthScreen();
            }
        } else {
            this.showScreen('timeRestriction');
        }
        this.updateCurrentTime();
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        ['currentTime', 'menuCurrentTime'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.innerHTML = `<div style="font-size: 1.2rem; font-weight: 600;"><i class="fas fa-clock"></i> ${timeString}</div><div style="font-size: 0.9rem; text-transform: capitalize;">${dateString}</div>`;
        });
    }

    showScreen(screenId) {
        const screens = ['timeRestriction', 'mainMenu', 'authScreen', 'mainContent', 'pendingSignaturesScreen', 'completedSignaturesScreen', 'adminPanel'];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = id === screenId ? 'block' : 'none';
        });
        this.currentScreen = screenId;
    }

    showMainMenu() { if (this.isAuthenticated) this.showScreen('mainMenu'); }
    showSignatureScreen() { this.showScreen('mainContent'); this.updateCurrentTime(); }
    showAuthScreen() { this.showScreen('authScreen'); }

    // MEJORA FIRMA: Comprobar si el trabajador tiene firma en la BD
    updateWorkerInfo(workerName) {
        if (workerName && TRABAJADORES[workerName]) {
            const worker = TRABAJADORES[workerName];
            document.getElementById('dni').value = worker.dni;
            document.getElementById('horario').value = worker.horario;

            // Manejo Visual de Firma Guardada
            if (worker.savedSignature) {
                document.getElementById('savedSignatureContainer').style.display = 'block';
                document.getElementById('savedSignatureImg').src = worker.savedSignature;
                document.getElementById('drawSignatureContainer').style.display = 'none';
                document.getElementById('useSavedSignature').checked = true;
            } else {
                document.getElementById('savedSignatureContainer').style.display = 'none';
                document.getElementById('drawSignatureContainer').style.display = 'block';
                document.getElementById('useSavedSignature').checked = false;
            }
        }
    }

    // MEJORA: Manejo de Autenticación con persistencia local
    handleAuth(e) {
        e.preventDefault();
        const workerName = document.getElementById('authTrabajador').value;
        const password = document.getElementById('authPassword').value;
        
        if (!TRABAJADORES[workerName]) return alert('Trabajador no encontrado en la base de datos.');
        if (TRABAJADORES[workerName].password !== password) return alert('Contraseña incorrecta');
        if (!TRABAJADORES[workerName].active) return alert('Tu cuenta está desactivada.');
        
        this.isAuthenticated = true;
        this.currentUser = workerName;
        
        // Auto-login persistence
        const rememberMe = document.getElementById('rememberMe')?.checked;
        if (rememberMe) {
            localStorage.setItem('currentUser', workerName);
            localStorage.setItem('rememberAuth', 'true');
            localStorage.setItem(`password_${workerName}`, password);
        } else {
            localStorage.setItem('rememberAuth', 'false');
        }

        document.getElementById('logoutBtn').style.display = 'flex';
        
        this.showSignatureScreen();
        document.getElementById('trabajador').value = workerName;
        this.updateWorkerInfo(workerName);
        document.getElementById('password').value = password;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const workerName = document.getElementById('trabajador').value;
        const password = document.getElementById('password').value;
        
        if (!TRABAJADORES[workerName]) return alert('Selecciona un trabajador válido');
        
        // Verificar si ya firmó hoy
        this.showLoading('Verificando datos...');
        const signatures = await this.getSignaturesFromFirebase(workerName);
        const today = new Date().toISOString().split('T')[0];
        const hasSignedToday = signatures.some(sig => sig.date === today);
        
        if (hasSignedToday) {
            this.hideLoading();
            alert('Ya has firmado tu jornada de hoy.');
            return;
        }
        
        // MEJORA FIRMA: Decidir qué firma se envía a la nube
        let finalSignatureBase64 = "";
        const useSaved = document.getElementById('useSavedSignature')?.checked;
        const isSavedContainerVisible = document.getElementById('savedSignatureContainer').style.display !== 'none';

        if (useSaved && isSavedContainerVisible && TRABAJADORES[workerName].savedSignature) {
            // Usamos la firma que ya estaba en Firebase
            finalSignatureBase64 = TRABAJADORES[workerName].savedSignature;
        } else {
            // Evaluamos si dibujó algo en el canvas nuevo
            if (this.isCanvasEmpty(this.canvas, this.ctx)) {
                this.hideLoading();
                alert('Por favor, dibuja tu firma en el recuadro blanco.');
                return;
            }
            finalSignatureBase64 = this.canvas.toDataURL();
            
            // Si marcó la casilla de guardar para el futuro, lo inyectamos en Firebase
            if (document.getElementById('saveNewSignature')?.checked) {
                await db.ref(`trabajadores/${workerName}/savedSignature`).set(finalSignatureBase64);
                TRABAJADORES[workerName].savedSignature = finalSignatureBase64;
            }
        }
        
        await this.saveSignature(workerName, finalSignatureBase64);
    }

    async saveSignature(workerName, finalSignatureBase64) {
        try {
            const today = new Date();
            const signatureData = {
                date: today.toISOString().split('T')[0],
                time: today.toTimeString().split(' ')[0],
                dni: TRABAJADORES[workerName].dni,
                nombre: workerName,
                horario: TRABAJADORES[workerName].horario,
                signature: finalSignatureBase64,
                timestamp: today.getTime()
            };
            
            await this.saveSignatureToFirebase(workerName, signatureData);
            
            const pdfData = {
                trabajador: workerName,
                dni: TRABAJADORES[workerName].dni,
                horario: TRABAJADORES[workerName].horario,
                fecha: today.toLocaleDateString('es-ES'),
                hora: signatureData.time,
                firma: finalSignatureBase64
            };
            
            await this.generatePDF(pdfData);
            this.clearSignature();
            this.showSuccess('✅ Firma registrada correctamente.');
            
            setTimeout(() => {
                this.showMainMenu();
            }, 3000);
            
        } catch (error) {
            console.error('Error guardando:', error);
            this.showError('Error al guardar: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    // === FUNCIONES DE CANVAS Y PDF (Mantenidas por su funcionamiento estable) ===
    initSignatureCanvas() {
        this.canvas = document.getElementById('signatureCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.ctx.strokeStyle = '#0f172a'; this.ctx.lineWidth = 3; this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round';
            
            this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e, this.canvas, this.ctx));
            this.canvas.addEventListener('mousemove', (e) => this.draw(e, this.canvas, this.ctx));
            this.canvas.addEventListener('mouseup', () => this.stopDrawing());
            this.canvas.addEventListener('mouseout', () => this.stopDrawing());
            
            this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const touch = e.touches[0]; const rect = this.canvas.getBoundingClientRect(); this.startDrawing({ clientX: touch.clientX - rect.left, clientY: touch.clientY - rect.top }, this.canvas, this.ctx); });
            this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const touch = e.touches[0]; const rect = this.canvas.getBoundingClientRect(); this.draw({ clientX: touch.clientX - rect.left, clientY: touch.clientY - rect.top }, this.canvas, this.ctx); });
            this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.stopDrawing(); });
        }
    }

    startDrawing(e, canvas, ctx) { this.isDrawing = true; const rect = canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top); }
    draw(e, canvas, ctx) { if (!this.isDrawing) return; const rect = canvas.getBoundingClientRect(); ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke(); }
    stopDrawing() { this.isDrawing = false; }
    
    clearSignature() { if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }

    isCanvasEmpty(canvas, ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] !== 0) return false; }
        return true;
    }

    async generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(24);
        doc.text('REGISTRO HORARIO LABORAL', 20, 30);
        doc.setFontSize(11);
        doc.text(`Trabajador: ${data.trabajador}`, 20, 50);
        doc.text(`DNI: ${data.dni}`, 20, 60);
        doc.text(`Horario: ${data.horario}`, 20, 70);
        doc.text(`Fecha: ${data.fecha} - Hora: ${data.hora}`, 20, 80);
        
        if (data.firma) {
            doc.text('FIRMA DIGITAL:', 20, 100);
            doc.addImage(data.firma, 'PNG', 20, 110, 80, 30);
        }
        const fileName = `registro_${data.trabajador.replace(/\s+/g, '_')}_${data.fecha.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new RegistroHorarioApp(); });
