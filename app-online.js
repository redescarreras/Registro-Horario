// ================================================
// REGISTRO HORARIO LABORAL - VERSIÓN FIREBASE
// MEJORAS: Seguridad, Auto-Login, Firmas en 1-clic
// y Panel de Administrador Completo Restaurado.
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// MEJORA SEGURIDAD: Los trabajadores se cargan de Firebase, no del código.
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
            
            // Comprobar sesión persistente para auto-login
            this.checkAutoLogin();

            this.setupEventListeners();
            this.initSignatureCanvas();
            this.populateWorkerSelects();
            this.setupRealtimeListeners();
            
            const configWarning = document.getElementById('configWarning');
            if (configWarning) configWarning.style.display = 'none';
            
            // Mostrar botón Admin
            const adminBtn = document.getElementById('adminAccessBtn');
            if (adminBtn) adminBtn.style.display = 'block';
            
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

    // === FIREBASE DATA LOADERS ===
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
            
            // Actualizar vista admin
            const hourInput = document.getElementById('activationHour');
            if (hourInput) hourInput.value = this.settings.activationHour;
            
            this.checkTimeRestriction();
        } catch (error) {
            console.error('Error guardando configuración:', error);
        }
    }

    async getHolidaysFromFirebase() {
        try {
            const snapshot = await db.ref('holidays').once('value');
            return snapshot.exists() ? snapshot.val() || [] : [];
        } catch (error) {
            return [];
        }
    }

    async saveHolidaysToFirebase(holidays) {
        try {
            await db.ref('holidays').set(holidays);
        } catch (error) {
            console.error('Error guardando festivos:', error);
        }
    }

    async getSignaturesFromFirebase(workerName) {
        try {
            const snapshot = await db.ref(`signatures/${workerName}`).once('value');
            return snapshot.exists() ? snapshot.val().signatures || [] : [];
        } catch (error) {
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
            throw error;
        }
    }

    setupRealtimeListeners() {
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
        
        db.ref('settings').on('value', (snapshot) => {
            if (snapshot.exists()) {
                this.settings = snapshot.val();
                this.checkTimeRestriction();
            }
        });

        db.ref('holidays').on('value', (snapshot) => {
            if (this.isAdmin && snapshot.exists()) {
                this.renderCalendar();
                this.updateStats();
            }
        });
    }

    // === UI UTILS ===
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

    // === EVENT LISTENERS ===
    setupEventListeners() {
        // Navegación Básica
        document.getElementById('menuAccessBtn')?.addEventListener('click', () => {
            if (this.isAuthenticated) this.showMainMenu();
            else this.showAuthScreen();
        });
        document.getElementById('newSignatureBtn')?.addEventListener('click', () => this.showSignatureScreen());
        document.getElementById('pendingSignaturesBtn')?.addEventListener('click', () => this.showPendingSignatures());
        document.getElementById('completedSignaturesBtn')?.addEventListener('click', () => this.showCompletedSignatures());
        document.getElementById('backToMenuBtn1')?.addEventListener('click', () => this.showMainMenu());
        document.getElementById('backToMenuBtn2')?.addEventListener('click', () => this.showMainMenu());
        
        // Autenticación
        document.getElementById('authForm')?.addEventListener('submit', (e) => this.handleAuth(e));
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        document.getElementById('trabajador')?.addEventListener('change', (e) => this.updateWorkerInfo(e.target.value));
        
        // Firma Diaria
        document.getElementById('registroForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('clearSignature')?.addEventListener('click', () => this.clearSignature());
        document.getElementById('btnDrawNew')?.addEventListener('click', () => {
            document.getElementById('savedSignatureContainer').style.display = 'none';
            document.getElementById('drawSignatureContainer').style.display = 'block';
            document.getElementById('useSavedSignature').checked = false;
            this.clearSignature();
        });

        // Modal de Firma Individual
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancelSignature')?.addEventListener('click', () => this.closeModal());
        document.getElementById('confirmSignature')?.addEventListener('click', () => this.confirmPendingSignature());
        document.getElementById('clearModalSignature')?.addEventListener('click', () => this.clearModalSignature());

        // ADMIN PANEL EVENTS (RESTAURADOS)
        document.getElementById('adminAccessBtn')?.addEventListener('click', () => this.showAdminAuth());
        document.getElementById('adminAuthForm')?.addEventListener('submit', (e) => this.handleAdminAuth(e));
        document.getElementById('closeAdminAuth')?.addEventListener('click', () => this.closeAdminAuthModal());
        document.getElementById('cancelAdminAuth')?.addEventListener('click', () => this.closeAdminAuthModal());
        
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchAdminTab(tab.dataset.tab));
        });
        
        document.getElementById('exitAdminBtn')?.addEventListener('click', () => this.exitAdmin());
        document.getElementById('addUserBtn')?.addEventListener('click', () => this.showUserModal());
        document.getElementById('userForm')?.addEventListener('submit', (e) => this.handleUserForm(e));
        document.getElementById('closeUserModal')?.addEventListener('click', () => this.closeUserModal());
        document.getElementById('cancelUserModal')?.addEventListener('click', () => this.closeUserModal());
        
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.handleExport());
        
        // Calendario Admin
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
    }

    // === AUTH & AUTO-LOGIN ===
    checkAutoLogin() {
        const rememberAuth = localStorage.getItem('rememberAuth');
        const savedUser = localStorage.getItem('currentUser');
        
        if (rememberAuth === 'true' && savedUser && TRABAJADORES[savedUser] && TRABAJADORES[savedUser].active) {
            this.isAuthenticated = true;
            this.currentUser = savedUser;
            document.getElementById('logoutBtn').style.display = 'flex';
            
            const selectTrabajador = document.getElementById('trabajador');
            if(selectTrabajador) {
                const opt = document.createElement('option');
                opt.value = savedUser; opt.textContent = savedUser;
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

    handleAuth(e) {
        e.preventDefault();
        const workerName = document.getElementById('authTrabajador').value;
        const password = document.getElementById('authPassword').value;
        
        if (!TRABAJADORES[workerName]) return alert('Trabajador no encontrado en la base de datos.');
        if (TRABAJADORES[workerName].password !== password) return alert('Contraseña incorrecta');
        if (!TRABAJADORES[workerName].active) return alert('Tu cuenta está desactivada.');
        
        this.isAuthenticated = true;
        this.currentUser = workerName;
        
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

    handleLogout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.setItem('rememberAuth', 'false');
        document.getElementById('logoutBtn').style.display = 'none';
        
        document.getElementById('trabajador').value = '';
        document.getElementById('horario').value = '';
        document.getElementById('password').value = '';
        
        this.showSuccess("Sesión cerrada correctamente");
        setTimeout(() => this.checkTimeRestriction(), 1000);
    }

    // === NAVIGATION ===
    populateWorkerSelects() {
        const selects = ['trabajador', 'authTrabajador', 'exportWorker'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            const currentValue = select.value || (this.currentUser && selectId === 'trabajador' ? this.currentUser : "");
            
            select.innerHTML = '<option value="">- Selecciona tu nombre -</option>';
            if(selectId === 'exportWorker') {
                 select.innerHTML = '<option value="">Todos los trabajadores</option>';
            }

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

    updateWorkerInfo(workerName) {
        if (workerName && TRABAJADORES[workerName]) {
            const worker = TRABAJADORES[workerName];
            document.getElementById('dni').value = worker.dni;
            document.getElementById('horario').value = worker.horario;

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

    // === FORM SUBMIT & PDF ===
    async handleFormSubmit(e) {
        e.preventDefault();
        const workerName = document.getElementById('trabajador').value;
        if (!TRABAJADORES[workerName]) return alert('Selecciona un trabajador válido');
        
        this.showLoading('Verificando datos...');
        const signatures = await this.getSignaturesFromFirebase(workerName);
        const today = new Date().toISOString().split('T')[0];
        if (signatures.some(sig => sig.date === today)) {
            this.hideLoading();
            alert('Ya has firmado tu jornada de hoy.');
            return;
        }
        
        let finalSignatureBase64 = "";
        const useSaved = document.getElementById('useSavedSignature')?.checked;
        const isSavedContainerVisible = document.getElementById('savedSignatureContainer').style.display !== 'none';

        if (useSaved && isSavedContainerVisible && TRABAJADORES[workerName].savedSignature) {
            finalSignatureBase64 = TRABAJADORES[workerName].savedSignature;
        } else {
            if (this.isCanvasEmpty(this.canvas, this.ctx)) {
                this.hideLoading();
                alert('Por favor, dibuja tu firma en el recuadro blanco.');
                return;
            }
            finalSignatureBase64 = this.canvas.toDataURL();
            
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
            
            setTimeout(() => { this.showMainMenu(); }, 3000);
            
        } catch (error) {
            console.error('Error guardando:', error);
            this.showError('Error al guardar: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont('helvetica');
        doc.setFontSize(24);
        doc.setTextColor(37, 99, 235);
        doc.text('REGISTRO HORARIO LABORAL', 20, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Documento Oficial - Sistema de Registro', 20, 38);
        doc.setDrawColor(37, 99, 235);
        doc.line(20, 45, 190, 45);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Nombre: ${data.trabajador}`, 20, 60);
        doc.text(`DNI: ${data.dni}`, 20, 70);
        doc.text(`Horario: ${data.horario}`, 20, 80);
        doc.text(`Fecha Registro: ${data.fecha}`, 20, 90);
        doc.text(`Hora: ${data.hora}`, 20, 100);
        
        if (data.firma && data.firma !== 'data:,') {
            doc.text('FIRMA DIGITAL:', 20, 120);
            doc.setDrawColor(200, 200, 200);
            doc.rect(20, 125, 100, 40);
            doc.addImage(data.firma, 'PNG', 22, 127, 96, 36);
        }
        
        const fileName = `registro_${data.trabajador.replace(/\s+/g, '_')}_${data.fecha.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
    }

    // === CANVAS ===
    initSignatureCanvas() {
        this.canvas = document.getElementById('signatureCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.ctx.strokeStyle = '#0f172a'; this.ctx.lineWidth = 3; this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round';
            this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e, this.canvas, this.ctx));
            this.canvas.addEventListener('mousemove', (e) => this.draw(e, this.canvas, this.ctx));
            this.canvas.addEventListener('mouseup', () => this.stopDrawing());
            this.canvas.addEventListener('mouseout', () => this.stopDrawing());
            
            // Touch
            this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const touch = e.touches[0]; const rect = this.canvas.getBoundingClientRect(); this.startDrawing({ clientX: touch.clientX - rect.left, clientY: touch.clientY - rect.top }, this.canvas, this.ctx); });
            this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const touch = e.touches[0]; const rect = this.canvas.getBoundingClientRect(); this.draw({ clientX: touch.clientX - rect.left, clientY: touch.clientY - rect.top }, this.canvas, this.ctx); });
            this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.stopDrawing(); });
        }

        this.modalCanvas = document.getElementById('modalSignatureCanvas');
        if (this.modalCanvas) {
            this.modalCtx = this.modalCanvas.getContext('2d');
            this.modalCtx.strokeStyle = '#0f172a'; this.modalCtx.lineWidth = 3; this.modalCtx.lineCap = 'round'; this.modalCtx.lineJoin = 'round';
            this.modalCanvas.addEventListener('mousedown', (e) => this.startDrawing(e, this.modalCanvas, this.modalCtx));
            this.modalCanvas.addEventListener('mousemove', (e) => this.draw(e, this.modalCanvas, this.modalCtx));
            this.modalCanvas.addEventListener('mouseup', () => this.stopDrawing());
            this.modalCanvas.addEventListener('mouseout', () => this.stopDrawing());
            
            // Touch
            this.modalCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); const touch = e.touches[0]; const rect = this.modalCanvas.getBoundingClientRect(); this.startDrawing({ clientX: touch.clientX - rect.left, clientY: touch.clientY - rect.top }, this.modalCanvas, this.modalCtx); });
            this.modalCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); const touch = e.touches[0]; const rect = this.modalCanvas.getBoundingClientRect(); this.draw({ clientX: touch.clientX - rect.left, clientY: touch.clientY - rect.top }, this.modalCanvas, this.modalCtx); });
            this.modalCanvas.addEventListener('touchend', (e) => { e.preventDefault(); this.stopDrawing(); });
        }
    }

    startDrawing(e, canvas, ctx) { this.isDrawing = true; const rect = canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX, e.clientY); }
    draw(e, canvas, ctx) { if (!this.isDrawing) return; ctx.lineTo(e.clientX, e.clientY); ctx.stroke(); }
    stopDrawing() { this.isDrawing = false; }
    
    clearSignature() { if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    clearModalSignature() { if (this.modalCtx) this.modalCtx.clearRect(0, 0, this.modalCanvas.width, this.modalCanvas.height); }

    isCanvasEmpty(canvas, ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] !== 0) return false; }
        return true;
    }

    // === PENDING & COMPLETED SIGNATURES ===
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
        const holidays = await this.getHolidaysFromFirebase();
        
        userInfo.innerHTML = `<h3>${this.currentUser}</h3><p><i class="fas fa-clock"></i> ${TRABAJADORES[this.currentUser].horario}</p>`;
        container.innerHTML = '';
        
        const signedDates = signatures.map(sig => sig.date);
        const pendingDays = [];
        
        for (let date = new Date(thirtyDaysAgo); date <= today; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr)) continue; // Fines de semana o festivos
            if (date > today || date < new Date('2025-10-01')) continue;
            
            if (!signedDates.includes(dateStr)) {
                pendingDays.push(new Date(date));
            }
        }
        
        if (pendingDays.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 20px;"><i class="fas fa-check-circle" style="font-size:3rem; color:green; margin-bottom:10px;"></i><p>¡Todo al día! No hay firmas pendientes.</p></div>`;
        } else {
            pendingDays.sort((a, b) => b - a);
            pendingDays.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                const div = document.createElement('div');
                div.style.cssText = 'background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid orange;';
                div.innerHTML = `
                    <div><strong>${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                    <button class="btn-primary" style="padding: 8px 15px; font-size: 0.9rem;" onclick="window.app.signPendingDay('${dateStr}')">Firmar</button>
                `;
                container.appendChild(div);
            });
        }
    }

    async renderCompletedSignatures() {
        const container = document.getElementById('completedList');
        const userInfo = document.getElementById('completedUserInfo');
        if (!container || !userInfo) return;
        
        const signatures = await this.getSignaturesFromFirebase(this.currentUser);
        userInfo.innerHTML = `<h3>${this.currentUser}</h3><p>Total de firmas: ${signatures.length}</p>`;
        container.innerHTML = '';
        
        if (signatures.length === 0) {
            container.innerHTML = `<p style="text-align:center;">No tienes firmas registradas.</p>`;
        } else {
            signatures.sort((a, b) => new Date(b.date) - new Date(a.date));
            signatures.forEach(sig => {
                const div = document.createElement('div');
                div.style.cssText = 'background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid green;';
                div.innerHTML = `
                    <div>
                        <strong>${new Date(sig.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                        <div style="font-size:0.85rem; color:gray;">Hora: ${sig.time}</div>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    }

    signPendingDay(dateStr) {
        this.pendingSignatureDate = dateStr;
        document.getElementById('modalDayInfo').innerHTML = `<p><strong>Día a firmar:</strong> ${new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>`;
        document.getElementById('signSpecificDayModal').style.display = 'flex';
        
        // Timeout para que el canvas se muestre antes de dibujar
        setTimeout(() => this.initSignatureCanvas(), 100); 
    }

    closeModal() {
        document.getElementById('signSpecificDayModal').style.display = 'none';
        this.pendingSignatureDate = null;
        this.clearModalSignature();
    }

    async confirmPendingSignature() {
        let finalSignatureBase64 = "";

        // Revisar si el usuario tiene firma guardada
        if (TRABAJADORES[this.currentUser] && TRABAJADORES[this.currentUser].savedSignature) {
            // Confirmación rápida
            if(!confirm("Tienes una firma guardada en tu cuenta. ¿Deseas usarla para este registro? (Si cancelas, se usará la que has dibujado en el recuadro).")) {
                 if (this.isCanvasEmpty(this.modalCanvas, this.modalCtx)) {
                    alert('Por favor, dibuja tu firma en el recuadro.'); return;
                }
                finalSignatureBase64 = this.modalCanvas.toDataURL();
            } else {
                finalSignatureBase64 = TRABAJADORES[this.currentUser].savedSignature;
            }
        } else {
            if (this.isCanvasEmpty(this.modalCanvas, this.modalCtx)) {
                alert('Por favor, dibuja tu firma en el recuadro.'); return;
            }
            finalSignatureBase64 = this.modalCanvas.toDataURL();
        }

        this.showLoading('Guardando firma...');
        
        try {
            const signatureData = {
                date: this.pendingSignatureDate,
                time: new Date().toTimeString().split(' ')[0],
                dni: TRABAJADORES[this.currentUser].dni,
                nombre: this.currentUser,
                horario: TRABAJADORES[this.currentUser].horario,
                signature: finalSignatureBase64,
                timestamp: Date.now()
            };
            
            await this.saveSignatureToFirebase(this.currentUser, signatureData);
            this.closeModal();
            this.showSuccess('Firma guardada correctamente');
            
            setTimeout(() => { this.showPendingSignatures(); }, 1000);
        } catch (error) {
            console.error('Error guardando firma pendiente:', error);
            this.showError('Error al guardar la firma');
        } finally {
            this.hideLoading();
        }
    }


    // ==========================================
    // MÉTODOS DE ADMINISTRADOR
    // ==========================================
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
        await this.updateStats();
        await this.renderUsersTable();
        await this.renderWorkerStats();
        await this.renderCalendar();
        this.populateWorkerSelects();
        
        const hourInput = document.getElementById('activationHour');
        if (hourInput) hourInput.value = this.settings.activationHour || 18;
    }

    exitAdmin() {
        this.isAdmin = false;
        this.checkTimeRestriction();
    }

    switchAdminTab(tabName) {
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
    }

    async updateStats() {
        const activeWorkers = Object.values(TRABAJADORES).filter(w => w.active).length;
        document.getElementById('totalWorkers').textContent = activeWorkers;
        
        const today = new Date().toISOString().split('T')[0];
        let signaturesToday = 0;
        
        for (const workerName of Object.keys(TRABAJADORES)) {
            if (!TRABAJADORES[workerName].active) continue;
            const signatures = await this.getSignaturesFromFirebase(workerName);
            if (signatures.some(sig => sig.date === today)) signaturesToday++;
        }
        
        document.getElementById('signaturesToday').textContent = signaturesToday;
        document.getElementById('pendingToday').textContent = activeWorkers - signaturesToday;

        const holidays = await this.getHolidaysFromFirebase();
        document.getElementById('totalHolidays').textContent = holidays.length;
    }

    async renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        Object.keys(TRABAJADORES).sort().forEach(workerName => {
            const worker = TRABAJADORES[workerName];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${workerName}</td>
                <td>${worker.dni}</td>
                <td>${worker.horario}</td>
                <td><span class="status-badge ${worker.active ? 'status-active' : 'status-inactive'}">${worker.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="btn-icon" onclick="window.app.editUser('${workerName}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="window.app.toggleUserStatus('${workerName}')"><i class="fas fa-toggle-${worker.active ? 'on' : 'off'}"></i></button>
                    <button class="btn-icon delete" onclick="window.app.deleteUser('${workerName}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

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
            document.getElementById('userPassword').value = Math.random().toString(36).slice(-8).toUpperCase();
        }
    }

    closeUserModal() {
        document.getElementById('userModal').style.display = 'none';
        this.editingUser = null;
    }

    async handleUserForm(e) {
        e.preventDefault();
        const userName = document.getElementById('userName').value.trim();
        const userDNI = document.getElementById('userDNI').value.trim();
        const workerData = {
            dni: userDNI,
            password: document.getElementById('userPassword').value,
            horario: document.getElementById('userSchedule').value,
            email: document.getElementById('userEmail').value.trim(),
            telefono: document.getElementById('userPhone').value.trim(),
            active: true
        };
        
        // Conservar firma guardada si la hay
        if (this.editingUser && TRABAJADORES[this.editingUser].savedSignature) {
            workerData.savedSignature = TRABAJADORES[this.editingUser].savedSignature;
        }

        if (this.editingUser && this.editingUser !== userName) {
            delete TRABAJADORES[this.editingUser];
        }
        TRABAJADORES[userName] = workerData;
        await this.saveWorkersToFirebase();
        this.closeUserModal();
        this.updateStats();
        this.renderUsersTable();
    }

    async toggleUserStatus(userName) {
        if (TRABAJADORES[userName]) {
            TRABAJADORES[userName].active = !TRABAJADORES[userName].active;
            await this.saveWorkersToFirebase();
            this.renderUsersTable();
            this.updateStats();
        }
    }

    async deleteUser(userName) {
        if (confirm(`¿Estás seguro de eliminar a ${userName}? Se perderán sus firmas.`)) {
            delete TRABAJADORES[userName];
            await this.saveWorkersToFirebase();
            this.renderUsersTable();
            this.updateStats();
        }
    }

    editUser(userName) { this.showUserModal(userName); }
    
    async renderWorkerStats() {
        const container = document.getElementById('workerStats');
        if (!container) return;
        container.innerHTML = '';
        for (const workerName of Object.keys(TRABAJADORES)) {
            const signatures = await this.getSignaturesFromFirebase(workerName);
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; justify-content:space-between; padding:12px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px; background: white;';
            div.innerHTML = `<div><strong>${workerName}</strong></div><div style="color:var(--primary-color);"><strong>${signatures.length}</strong> firmas</div>`;
            container.appendChild(div);
        }
    }

    async saveSettings() {
        const hour = parseInt(document.getElementById('activationHour').value);
        if (!isNaN(hour) && hour >= 0 && hour <= 23) {
            this.settings.activationHour = hour;
            await this.saveSettingsToFirebase();
            alert('Configuración horaria guardada correctamente');
        }
    }

    // === CALENDAR & EXPORTS ===
    async renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('currentMonth');
        if (!grid || !monthDisplay) return;
        
        const holidays = await this.getHolidaysFromFirebase();
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        monthDisplay.textContent = this.currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        grid.innerHTML = '';
        
        const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        daysOfWeek.forEach(day => {
            const div = document.createElement('div');
            div.style.cssText = 'text-align:center; font-size:0.8rem; font-weight:600; color:#64748b; margin-bottom:10px;';
            div.textContent = day;
            grid.appendChild(div);
        });
        
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; 
        
        for (let i = 0; i < startingDayOfWeek; i++) {
            grid.appendChild(document.createElement('div'));
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = day;
            
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                div.classList.add('weekend');
            } else {
                if (holidays.includes(dateStr)) div.classList.add('holiday');
                div.addEventListener('click', () => this.toggleHoliday(dateStr, holidays));
            }
            grid.appendChild(div);
        }
    }

    changeMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.renderCalendar();
    }

    async toggleHoliday(dateStr, holidays) {
        this.showLoading('Actualizando festivo...');
        const index = holidays.indexOf(dateStr);
        if (index > -1) holidays.splice(index, 1);
        else holidays.push(dateStr);
        await this.saveHolidaysToFirebase(holidays);
        await this.renderCalendar();
        this.updateStats();
        this.hideLoading();
    }

    async handleExport() {
        const fromDate = document.getElementById('exportFromDate').value;
        const toDate = document.getElementById('exportToDate').value;
        const worker = document.getElementById('exportWorker').value;
        const format = document.getElementById('exportFormat').value;
        
        if (!fromDate || !toDate) return alert('Por favor, selecciona las fechas de inicio y fin');
        if (new Date(fromDate) > new Date(toDate)) return alert('La fecha de inicio no puede ser posterior a la de fin');
        
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
                            'Firma': signature.signature
                        });
                    }
                });
            }
            
            if (allSignatures.length === 0) {
                this.showError('No se encontraron firmas en este rango.');
                return;
            }
            
            if (format === 'excel') {
                // Para excel quitamos la firma en base64 para que no explote
                const excelData = allSignatures.map(({Firma, ...rest}) => rest);
                const worksheet = XLSX.utils.json_to_sheet(excelData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmas');
                XLSX.writeFile(workbook, `Registro_${fromDate}_al_${toDate}.xlsx`);
                this.showSuccess('Excel descargado correctamente');
            } else {
                this.exportMultiplePDFs(allSignatures);
            }
        } catch (error) {
            console.error(error);
            this.showError('Error al generar el informe');
        } finally {
            this.hideLoading();
        }
    }

    async exportMultiplePDFs(signaturesList) {
        this.showLoading(`Generando ${signaturesList.length} PDFs individuales...`);
        for (const sig of signaturesList) {
            const pdfData = {
                trabajador: sig.Nombre,
                dni: sig.DNI,
                horario: sig.Horario,
                fecha: new Date(sig.Fecha).toLocaleDateString('es-ES'),
                hora: sig.Hora,
                firma: sig.Firma
            };
            await this.generatePDF(pdfData);
            await new Promise(resolve => setTimeout(resolve, 500)); // Pausa breve entre PDFs
        }
        this.showSuccess(`${signaturesList.length} PDFs descargados.`);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => { window.app = new RegistroHorarioApp(); });
