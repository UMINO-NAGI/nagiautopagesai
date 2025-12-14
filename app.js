// ==================== SISTEMA DE BANCO DE DADOS LOCAL ====================
class Database {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar todas as tabelas
        if (!localStorage.getItem('nagi_users')) {
            localStorage.setItem('nagi_users', JSON.stringify({}));
        }
        if (!localStorage.getItem('nagi_plans')) {
            localStorage.setItem('nagi_plans', JSON.stringify({}));
        }
        if (!localStorage.getItem('nagi_pages')) {
            localStorage.setItem('nagi_pages', JSON.stringify([]));
        }
        if (!localStorage.getItem('nagi_codes')) {
            localStorage.setItem('nagi_codes', JSON.stringify([]));
        }
        if (!localStorage.getItem('nagi_payments')) {
            localStorage.setItem('nagi_payments', JSON.stringify([]));
        }
        if (!localStorage.getItem('nagi_admin_password')) {
            localStorage.setItem('nagi_admin_password', JSON.stringify('948399692Se@'));
        }
    }

    // ========== USUÁRIOS ==========
    saveUser(user) {
        const users = JSON.parse(localStorage.getItem('nagi_users'));
        users[user.id] = {
            ...user,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            status: 'active'
        };
        localStorage.setItem('nagi_users', JSON.stringify(users));
        return users[user.id];
    }

    getUser(userId) {
        const users = JSON.parse(localStorage.getItem('nagi_users'));
        return users[userId];
    }

    updateUserLogin(userId) {
        const users = JSON.parse(localStorage.getItem('nagi_users'));
        if (users[userId]) {
            users[userId].lastLogin = new Date().toISOString();
            localStorage.setItem('nagi_users', JSON.stringify(users));
        }
    }

    getAllUsers() {
        return JSON.parse(localStorage.getItem('nagi_users'));
    }

    // ========== PLANOS ==========
    savePlan(userId, planData) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30); // 30 dias

        plans[userId] = {
            ...planData,
            userId: userId,
            activatedAt: new Date().toISOString(),
            expiresAt: expiry.toISOString(),
            status: 'active'
        };
        localStorage.setItem('nagi_plans', JSON.stringify(plans));
        return plans[userId];
    }

    getPlan(userId) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        return plans[userId];
    }

    updatePlan(userId, updates) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        if (plans[userId]) {
            plans[userId] = { ...plans[userId], ...updates };
            localStorage.setItem('nagi_plans', JSON.stringify(plans));
            return plans[userId];
        }
        return null;
    }

    deletePlan(userId) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        delete plans[userId];
        localStorage.setItem('nagi_plans', JSON.stringify(plans));
    }

    isPlanActive(userId) {
        const plan = this.getPlan(userId);
        if (!plan || plan.status !== 'active') return false;

        const now = new Date();
        const expiresAt = new Date(plan.expiresAt);
        return now < expiresAt;
    }

    getDaysRemaining(userId) {
        const plan = this.getPlan(userId);
        if (!plan || !this.isPlanActive(userId)) return 0;

        const now = new Date();
        const expiresAt = new Date(plan.expiresAt);
        const diff = expiresAt - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    getAllPlans() {
        return JSON.parse(localStorage.getItem('nagi_plans'));
    }

    // ========== PÁGINAS ==========
    savePage(pageData) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        const page = {
            ...pageData,
            id: 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        pages.push(page);
        localStorage.setItem('nagi_pages', JSON.stringify(pages));
        return page;
    }

    getPage(pageId) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        return pages.find(p => p.id === pageId);
    }

    getUserPages(userId) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        return pages.filter(p => p.userId === userId);
    }

    updatePage(pageId, updates) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        const index = pages.findIndex(p => p.id === pageId);
        if (index !== -1) {
            pages[index] = { ...pages[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('nagi_pages', JSON.stringify(pages));
            return pages[index];
        }
        return null;
    }

    deletePage(pageId) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        const filtered = pages.filter(p => p.id !== pageId);
        localStorage.setItem('nagi_pages', JSON.stringify(filtered));
    }

    getAllPages() {
        return JSON.parse(localStorage.getItem('nagi_pages'));
    }

    // ========== CÓDIGOS DE ATIVAÇÃO ==========
    generateCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codes = JSON.parse(localStorage.getItem('nagi_codes'));
        
        const codeData = {
            code: code,
            generatedAt: new Date().toISOString(),
            used: false,
            usedBy: null,
            usedAt: null,
            status: 'active'
        };
        
        codes.push(codeData);
        localStorage.setItem('nagi_codes', JSON.stringify(codes));
        return codeData;
    }

    validateCode(code) {
        const codes = JSON.parse(localStorage.getItem('nagi_codes'));
        const codeIndex = codes.findIndex(c => c.code === code && !c.used && c.status === 'active');
        
        if (codeIndex !== -1) {
            codes[codeIndex].used = true;
            codes[codeIndex].usedAt = new Date().toISOString();
            localStorage.setItem('nagi_codes', JSON.stringify(codes));
            return true;
        }
        return false;
    }

    getCode(code) {
        const codes = JSON.parse(localStorage.getItem('nagi_codes'));
        return codes.find(c => c.code === code);
    }

    getAllCodes() {
        return JSON.parse(localStorage.getItem('nagi_codes'));
    }

    getActiveCodes() {
        const codes = this.getAllCodes();
        return codes.filter(c => !c.used && c.status === 'active');
    }

    getUsedCodes() {
        const codes = this.getAllCodes();
        return codes.filter(c => c.used);
    }

    clearUsedCodes() {
        const codes = this.getAllCodes();
        const activeCodes = codes.filter(c => !c.used);
        localStorage.setItem('nagi_codes', JSON.stringify(activeCodes));
    }

    generateMultipleCodes(count) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(this.generateCode());
        }
        return codes;
    }

    // ========== PAGAMENTOS ==========
    savePayment(paymentData) {
        const payments = JSON.parse(localStorage.getItem('nagi_payments'));
        const payment = {
            ...paymentData,
            id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        payments.push(payment);
        localStorage.setItem('nagi_payments', JSON.stringify(payments));
        return payment;
    }

    getUserPayments(userId) {
        const payments = JSON.parse(localStorage.getItem('nagi_payments'));
        return payments.filter(p => p.userId === userId);
    }

    getAllPayments() {
        return JSON.parse(localStorage.getItem('nagi_payments'));
    }

    // ========== ESTATÍSTICAS ==========
    getStats() {
        const users = this.getAllUsers();
        const plans = this.getAllPlans();
        const pages = this.getAllPages();
        const payments = this.getAllPayments();
        const codes = this.getAllCodes();

        const activeUsers = Object.keys(users).length;
        const activePlans = Object.values(plans).filter(p => this.isPlanActive(p.userId)).length;
        const totalPages = pages.length;
        const totalPayments = payments.length;
        const activeCodes = this.getActiveCodes().length;
        const usedCodes = this.getUsedCodes().length;

        return {
            users: activeUsers,
            activePlans,
            totalPages,
            totalPayments,
            activeCodes,
            usedCodes,
            revenue: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        };
    }

    // ========== BACKUP ==========
    exportData() {
        return {
            users: this.getAllUsers(),
            plans: this.getAllPlans(),
            pages: this.getAllPages(),
            codes: this.getAllCodes(),
            payments: this.getAllPayments(),
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    importData(data) {
        if (data.users) localStorage.setItem('nagi_users', JSON.stringify(data.users));
        if (data.plans) localStorage.setItem('nagi_plans', JSON.stringify(data.plans));
        if (data.pages) localStorage.setItem('nagi_pages', JSON.stringify(data.pages));
        if (data.codes) localStorage.setItem('nagi_codes', JSON.stringify(data.codes));
        if (data.payments) localStorage.setItem('nagi_payments', JSON.stringify(data.payments));
        return true;
    }
}

// ==================== SISTEMA PRINCIPAL ====================
class NAGIAutoPages {
    constructor() {
        this.db = new Database();
        this.currentUser = null;
        this.userPlan = null;
        
        // Elementos DOM
        this.elements = {
            screens: {
                login: document.getElementById('login-screen'),
                main: document.getElementById('main-screen')
            },
            
            // Login
            demoLoginLink: document.getElementById('demo-login-link'),
            
            // User info
            userInfo: document.getElementById('user-info'),
            userAvatar: document.getElementById('user-avatar'),
            userName: document.getElementById('user-name'),
            userEmail: document.getElementById('user-email'),
            
            // Plan status
            planIndicator: document.getElementById('plan-indicator'),
            planText: document.getElementById('plan-text'),
            planDays: document.getElementById('plan-days'),
            daysLeft: document.getElementById('days-left'),
            
            // Buttons
            newPageBtn: document.getElementById('new-page-btn'),
            paymentBtn: document.getElementById('payment-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            generateBtn: document.getElementById('generate-btn'),
            copyBtn: document.getElementById('copy-html-btn'),
            downloadBtn: document.getElementById('download-btn'),
            
            // Form inputs
            productName: document.getElementById('product-name'),
            productDesc: document.getElementById('product-description'),
            targetAudience: document.getElementById('target-audience'),
            pageStyle: document.getElementById('page-style'),
            
            // Status
            statusMessage: document.getElementById('status-message'),
            generationStatus: document.getElementById('generation-status'),
            
            // Pages list
            pagesList: document.getElementById('pages-list'),
            
            // Preview
            previewContent: document.getElementById('preview-content'),
            mobileContent: document.getElementById('mobile-content'),
            deviceButtons: document.querySelectorAll('.device-btn'),
            
            // Stats
            totalPages: document.getElementById('total-pages'),
            daysRemaining: document.getElementById('days-remaining'),
            
            // Payment modal
            paymentModal: document.getElementById('payment-modal'),
            closePaymentModal: document.querySelector('.close-payment-modal'),
            modalClose: document.querySelectorAll('.modal-close'),
            activationCodeInput: document.getElementById('activation-code-input'),
            activateCodeBtn: document.getElementById('activate-code-btn'),
            activationStatus: document.getElementById('activation-status'),
            
            // Plan info in modal
            planValidUntil: document.getElementById('plan-valid-until'),
            planDaysLeft: document.getElementById('plan-days-left'),
            planPagesCreated: document.getElementById('plan-pages-created'),
            planStatusBadge: document.getElementById('plan-status-badge'),
            
            // Admin modal
            adminModal: document.getElementById('admin-modal'),
            closeAdminModal: document.querySelector('.close-admin-modal'),
            adminContent: document.getElementById('admin-content')
        };
        
        this.init();
    }

    init() {
        console.log('🚀 NAGI AUTO PAGES AI - Inicializando...');
        
        // Verificar sessão ativa
        this.checkSession();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar atalhos de teclado
        this.setupKeyboardShortcuts();
        
        console.log('✅ Sistema inicializado com sucesso!');
    }

    // ==================== SESSÃO E AUTENTICAÇÃO ====================
    checkSession() {
        const lastUserId = localStorage.getItem('nagi_last_user');
        if (lastUserId) {
            const user = this.db.getUser(lastUserId);
            if (user) {
                this.currentUser = user;
                this.userPlan = this.db.getPlan(user.id);
                
                // Verificar se o plano expirou
                if (this.userPlan && !this.db.isPlanActive(user.id)) {
                    this.userPlan = null;
                    this.db.deletePlan(user.id);
                }
                
                this.showMainScreen();
                this.updateUI();
                return true;
            }
        }
        return false;
    }

    handleUserLogin(user) {
        console.log('Login realizado:', user);
        
        // Salvar usuário
        this.currentUser = this.db.saveUser(user);
        this.userPlan = this.db.getPlan(user.id);
        
        // Verificar se o plano expirou
        if (this.userPlan && !this.db.isPlanActive(user.id)) {
            this.userPlan = null;
            this.db.deletePlan(user.id);
        }
        
        // Salvar último usuário
        localStorage.setItem('nagi_last_user', user.id);
        
        // Atualizar UI
        this.updateUI();
        
        // Mostrar tela principal ou modal de pagamento
        if (this.userPlan && this.db.isPlanActive(user.id)) {
            this.showMainScreen();
            this.showNotification('Login realizado com sucesso!', 'success');
        } else {
            this.showMainScreen();
            setTimeout(() => {
                this.showPaymentModal();
                this.showNotification('Ative seu plano para começar a criar landing pages!', 'info');
            }, 500);
        }
    }

    handleDemoLogin() {
        const demoUser = {
            id: 'demo_' + Date.now(),
            name: 'Usuário Demonstração',
            email: 'demo@nagitech.com',
            picture: null
        };
        
        this.handleUserLogin(demoUser);
        this.showNotification('Modo demonstração ativado!', 'info');
    }

    logout() {
        this.currentUser = null;
        this.userPlan = null;
        localStorage.removeItem('nagi_last_user');
        this.showLoginScreen();
        this.showNotification('Sessão encerrada com sucesso!', 'info');
    }

    // ==================== GERENCIAMENTO DE TELAS ====================
    showLoginScreen() {
        this.elements.screens.login.classList.remove('hidden');
        this.elements.screens.main.classList.add('hidden');
    }

    showMainScreen() {
        this.elements.screens.login.classList.add('hidden');
        this.elements.screens.main.classList.remove('hidden');
        this.updateUI();
    }

    showPaymentModal() {
        this.elements.paymentModal.classList.remove('hidden');
        this.updatePaymentModal();
    }

    hidePaymentModal() {
        this.elements.paymentModal.classList.add('hidden');
        this.elements.activationCodeInput.value = '';
        this.elements.activationStatus.textContent = '';
        this.elements.activationStatus.className = 'activation-status';
    }

    showAdminModal() {
        this.elements.adminModal.classList.remove('hidden');
        this.renderAdminPanel();
    }

    hideAdminModal() {
        this.elements.adminModal.classList.add('hidden');
    }

    // ==================== ATUALIZAÇÃO DE UI ====================
    updateUI() {
        if (!this.currentUser) return;

        // Informações do usuário
        this.elements.userName.textContent = this.currentUser.name;
        this.elements.userEmail.textContent = this.currentUser.email;
        
        // Avatar
        const avatar = this.elements.userAvatar;
        if (this.currentUser.picture) {
            avatar.innerHTML = `<img src="${this.currentUser.picture}" alt="${this.currentUser.name}">`;
        } else {
            const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            avatar.innerHTML = initials.substring(0, 2);
            avatar.style.background = this.getUserColor(this.currentUser.id);
        }

        // Status do plano
        if (this.userPlan && this.db.isPlanActive(this.currentUser.id)) {
            const daysLeft = this.db.getDaysRemaining(this.currentUser.id);
            
            this.elements.planIndicator.innerHTML = '<i class="fas fa-crown"></i> <span>Plano Ativo</span>';
            this.elements.planIndicator.className = 'plan-indicator';
            this.elements.planText.textContent = 'Plano Ativo';
            this.elements.daysLeft.textContent = `${daysLeft} dias restantes`;
            this.elements.daysRemaining.textContent = daysLeft;
            
            // Habilitar funcionalidades
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> <span>Gerar Landing Page</span>';
            this.elements.statusMessage.textContent = 'Preencha os detalhes e clique em "Gerar Landing Page"';
            
        } else {
            this.elements.planIndicator.innerHTML = '<i class="fas fa-lock"></i> <span>Plano Inativo</span>';
            this.elements.planIndicator.className = 'plan-indicator inactive';
            this.elements.planText.textContent = 'Plano Inativo';
            this.elements.daysLeft.textContent = 'Plano não ativo';
            this.elements.daysRemaining.textContent = '0';
            
            // Desabilitar funcionalidades
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.innerHTML = '<i class="fas fa-lock"></i> <span>Ative o Plano para Gerar</span>';
            this.elements.statusMessage.textContent = 'Ative seu plano mensal para começar a criar landing pages';
        }

        // Contador de páginas
        const userPages = this.db.getUserPages(this.currentUser.id);
        this.elements.totalPages.textContent = userPages.length;
        this.elements.planPagesCreated.textContent = userPages.length;

        // Atualizar histórico
        this.renderPagesList();
    }

    updatePaymentModal() {
        if (!this.currentUser) return;

        const plan = this.db.getPlan(this.currentUser.id);
        const userPages = this.db.getUserPages(this.currentUser.id);

        if (plan && this.db.isPlanActive(this.currentUser.id)) {
            const daysLeft = this.db.getDaysRemaining(this.currentUser.id);
            const expires = new Date(plan.expiresAt);
            
            this.elements.planValidUntil.textContent = expires.toLocaleDateString('pt-BR');
            this.elements.planDaysLeft.textContent = daysLeft;
            this.elements.planStatusBadge.innerHTML = '<i class="fas fa-crown"></i> Plano Ativo';
            this.elements.planStatusBadge.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        } else {
            this.elements.planValidUntil.textContent = '--/--/----';
            this.elements.planDaysLeft.textContent = '0';
            this.elements.planStatusBadge.innerHTML = '<i class="fas fa-lock"></i> Plano Inativo';
            this.elements.planStatusBadge.style.background = 'linear-gradient(135deg, #ef4444, #f87171)';
        }
    }

    getUserColor(userId) {
        const colors = [
            'linear-gradient(135deg, #4f46e5, #8b5cf6)',
            'linear-gradient(135deg, #10b981, #34d399)',
            'linear-gradient(135deg, #f59e0b, #d97706)',
            'linear-gradient(135deg, #ef4444, #f87171)',
            'linear-gradient(135deg, #8b5cf6, #a78bfa)'
        ];
        
        // Gerar um índice baseado no ID do usuário
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        
        return colors[index];
    }

    // ==================== GERADOR DE LANDING PAGES ====================
    async generateLandingPage() {
        if (!this.currentUser) {
            this.showNotification('Faça login primeiro!', 'error');
            return;
        }

        if (!this.userPlan || !this.db.isPlanActive(this.currentUser.id)) {
            this.showNotification('Ative seu plano para gerar landing pages!', 'error');
            this.showPaymentModal();
            return;
        }

        // Validar dados
        const productName = this.elements.productName.value.trim();
        const productDesc = this.elements.productDesc.value.trim();
        const targetAudience = this.elements.targetAudience.value.trim();
        const pageStyle = this.elements.pageStyle.value;

        if (!productName || !productDesc) {
            this.showNotification('Preencha o nome e descrição do produto!', 'error');
            return;
        }

        // Mostrar status de geração
        this.elements.generateBtn.disabled = true;
        this.elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Gerando...</span>';
        this.elements.statusMessage.textContent = 'Gerando sua landing page profissional...';

        try {
            // Simular processamento
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Gerar HTML
            const htmlContent = this.generatePageHTML({
                name: productName,
                description: productDesc,
                audience: targetAudience,
                style: pageStyle
            });

            // Salvar página
            const page = this.db.savePage({
                userId: this.currentUser.id,
                name: productName,
                description: productDesc,
                audience: targetAudience,
                style: pageStyle,
                html: htmlContent,
                mobileHtml: this.generateMobileHTML(htmlContent)
            });

            // Atualizar preview
            this.updatePreview(htmlContent);
            
            // Habilitar botões de exportação
            this.elements.copyBtn.disabled = false;
            this.elements.downloadBtn.disabled = false;

            // Atualizar UI
            this.updateUI();

            // Feedback
            this.showNotification('✅ Landing page gerada com sucesso!', 'success');
            this.elements.statusMessage.textContent = 'Landing page gerada! Clique em "Copiar HTML" ou "Baixar" para usar.';

        } catch (error) {
            console.error('Erro ao gerar página:', error);
            this.showNotification('❌ Erro ao gerar página. Tente novamente.', 'error');
            this.elements.statusMessage.textContent = 'Erro ao gerar página. Tente novamente.';
        } finally {
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> <span>Gerar Landing Page</span>';
        }
    }

    generatePageHTML(data) {
        const styles = {
            modern: { 
                bg: '#f8fafc', 
                color: '#1f2937', 
                accent: '#4f46e5',
                gradient: 'linear-gradient(135deg, #4f46e5, #8b5cf6)'
            },
            bold: { 
                bg: '#1f2937', 
                color: '#f9fafb', 
                accent: '#f59e0b',
                gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
            },
            elegant: { 
                bg: '#fefce8', 
                color: '#451a03', 
                accent: '#d97706',
                gradient: 'linear-gradient(135deg, #d97706, #92400e)'
            },
            clean: { 
                bg: '#ffffff', 
                color: '#374151', 
                accent: '#10b981',
                gradient: 'linear-gradient(135deg, #10b981, #34d399)'
            }
        };

        const style = styles[data.style] || styles.modern;
        const pageTitle = data.name;
        const pageDescription = data.description;
        const audience = data.audience || 'seu público-alvo';

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} - Landing Page Profissional</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: ${style.bg};
            color: ${style.color};
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header */
        .header {
            background: ${style.gradient};
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        
        .header h1 {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 20px;
            line-height: 1.2;
        }
        
        .header p {
            font-size: 20px;
            opacity: 0.9;
            max-width: 800px;
            margin: 0 auto 40px;
        }
        
        .cta-button {
            display: inline-block;
            background: white;
            color: ${style.accent};
            padding: 18px 45px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 700;
            text-decoration: none;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        /* Hero Section */
        .hero {
            padding: 100px 0;
            text-align: center;
        }
        
        .hero h2 {
            font-size: 42px;
            margin-bottom: 30px;
            color: ${style.accent};
        }
        
        .hero p {
            font-size: 20px;
            max-width: 800px;
            margin: 0 auto 50px;
            color: ${style.color};
            opacity: 0.9;
        }
        
        /* Benefits */
        .benefits {
            background: rgba(0,0,0,0.03);
            padding: 100px 0;
        }
        
        .benefits h2 {
            text-align: center;
            font-size: 36px;
            margin-bottom: 60px;
            color: ${style.accent};
        }
        
        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        
        .benefit-card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .benefit-card:hover {
            transform: translateY(-10px);
        }
        
        .benefit-icon {
            width: 80px;
            height: 80px;
            background: ${style.gradient};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
            color: white;
            font-size: 32px;
        }
        
        .benefit-card h3 {
            font-size: 24px;
            margin-bottom: 15px;
            color: ${style.color};
        }
        
        .benefit-card p {
            color: #6b7280;
            font-size: 16px;
        }
        
        /* Testimonials */
        .testimonials {
            padding: 100px 0;
        }
        
        .testimonials h2 {
            text-align: center;
            font-size: 36px;
            margin-bottom: 60px;
            color: ${style.accent};
        }
        
        .testimonial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
        }
        
        .testimonial-card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.1);
        }
        
        .testimonial-text {
            font-style: italic;
            font-size: 18px;
            margin-bottom: 25px;
            color: ${style.color};
        }
        
        .testimonial-author {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .author-avatar {
            width: 50px;
            height: 50px;
            background: ${style.gradient};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .author-info h4 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .author-info p {
            color: #6b7280;
            font-size: 14px;
        }
        
        /* Final CTA */
        .final-cta {
            background: ${style.gradient};
            color: white;
            padding: 100px 0;
            text-align: center;
        }
        
        .final-cta h2 {
            font-size: 42px;
            margin-bottom: 20px;
        }
        
        .final-cta p {
            font-size: 20px;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto 40px;
        }
        
        .final-button {
            display: inline-block;
            background: white;
            color: ${style.accent};
            padding: 20px 50px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: 700;
            text-decoration: none;
            transition: transform 0.3s;
        }
        
        .final-button:hover {
            transform: scale(1.05);
        }
        
        /* Footer */
        .footer {
            background: ${style.color};
            color: ${style.bg};
            padding: 60px 0;
            text-align: center;
        }
        
        .footer-content {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .footer-logo {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 20px;
            color: ${style.accent};
        }
        
        .footer p {
            margin-bottom: 20px;
            opacity: 0.8;
        }
        
        .footer-signature {
            font-weight: 500;
            letter-spacing: 0.5px;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 36px;
            }
            
            .header p {
                font-size: 18px;
            }
            
            .hero h2 {
                font-size: 32px;
            }
            
            .benefits-grid,
            .testimonial-grid {
                grid-template-columns: 1fr;
            }
            
            .benefit-card,
            .testimonial-card {
                padding: 30px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <h1>${pageTitle}</h1>
            <p>A solução perfeita para ${audience}</p>
            <a href="#cta" class="cta-button">Quero Começar Agora</a>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h2>Transforme sua visão em realidade</h2>
            <p>${pageDescription}</p>
            <a href="#cta" class="cta-button">Experimente Agora</a>
        </div>
    </section>

    <!-- Benefits -->
    <section class="benefits">
        <div class="container">
            <h2>O que você vai receber:</h2>
            <div class="benefits-grid">
                <div class="benefit-card">
                    <div class="benefit-icon">✓</div>
                    <h3>Resultados Comprovados</h3>
                    <p>Método testado e aprovado por milhares de clientes satisfeitos.</p>
                </div>
                <div class="benefit-card">
                    <div class="benefit-icon">⚡</div>
                    <h3>Implementação Rápida</h3>
                    <p>Comece a ver resultados em menos de 24 horas após o início.</p>
                </div>
                <div class="benefit-card">
                    <div class="benefit-icon">🛡️</div>
                    <h3>Garantia Total</h3>
                    <p>7 dias de garantia incondicional ou seu dinheiro de volta.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials">
        <div class="container">
            <h2>O que nossos clientes dizem:</h2>
            <div class="testimonial-grid">
                <div class="testimonial-card">
                    <p class="testimonial-text">"Esta solução transformou completamente meu negócio. Os resultados foram além das expectativas!"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar">MS</div>
                        <div class="author-info">
                            <h4>Maria Silva</h4>
                            <p>Empreendedora Digital</p>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <p class="testimonial-text">"A melhor decisão que tomei este ano. Retorno garantido e suporte excepcional!"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar">JP</div>
                        <div class="author-info">
                            <h4>João Pedro</h4>
                            <p>Consultor de Marketing</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Final CTA -->
    <section id="cta" class="final-cta">
        <div class="container">
            <h2>Pronto para transformar seu negócio?</h2>
            <p>Junte-se a milhares de empreendedores que já estão colhendo os frutos desta solução.</p>
            <a href="#" class="final-button">QUERO COMEÇAR AGORA</a>
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                ⚡ Oferta especial por tempo limitado • 🛡️ 7 dias de garantia
            </p>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-logo">${pageTitle}</div>
            <p>© ${new Date().getFullYear()} ${pageTitle}. Todos os direitos reservados.</p>
            <p>Desenvolvido com ❤️ pela NAGI TECHNOLOGY S.A.</p>
            <div class="footer-signature">
                UMINO NAGI - I WAS HERE🍀
            </div>
        </div>
    </footer>

    <script>
        // Scroll suave para links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Contador de cliques no CTA
        const ctaButtons = document.querySelectorAll('.cta-button, .final-button');
        ctaButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                console.log('CTA clicado:', this.textContent);
            });
        });
    </script>
</body>
</html>`;
    }

    generateMobileHTML(desktopHTML) {
        // Versão simplificada para mobile
        return desktopHTML.replace(/font-size:\s*\d+px/g, match => {
            const size = parseInt(match.match(/\d+/)[0]);
            return `font-size: ${Math.max(14, size * 0.8)}px`;
        });
    }

    updatePreview(html) {
        // Extrair apenas o conteúdo do body para preview
        const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
        
        // Atualizar preview desktop
        this.elements.previewContent.innerHTML = bodyContent;
        
        // Atualizar preview mobile
        this.elements.mobileContent.innerHTML = this.generateMobileHTML(bodyContent);
        
        // Garantir que o preview desktop esteja ativo
        this.switchDeviceView('desktop');
    }

    switchDeviceView(device) {
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.device === device) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.desktop-preview, .mobile-preview').forEach(el => {
            el.classList.remove('active');
        });

        if (device === 'desktop') {
            document.getElementById('desktop-preview').classList.add('active');
        } else {
            document.getElementById('mobile-preview').classList.add('active');
        }
    }

    // ==================== EXPORTAÇÃO DE PÁGINAS ====================
    copyHTML() {
        const pages = this.db.getUserPages(this.currentUser.id);
        if (pages.length === 0) {
            this.showNotification('Gere uma página primeiro!', 'error');
            return;
        }

        const latestPage = pages[pages.length - 1];
        navigator.clipboard.writeText(latestPage.html)
            .then(() => {
                this.showNotification('✅ HTML copiado para a área de transferência!', 'success');
            })
            .catch(err => {
                console.error('Erro ao copiar:', err);
                this.showNotification('❌ Erro ao copiar HTML', 'error');
            });
    }

    downloadPage() {
        const pages = this.db.getUserPages(this.currentUser.id);
        if (pages.length === 0) {
            this.showNotification('Gere uma página primeiro!', 'error');
            return;
        }

        const latestPage = pages[pages.length - 1];
        const blob = new Blob([latestPage.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `landing-page-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('✅ Landing page baixada com sucesso!', 'success');
    }

    // ==================== SISTEMA DE PAGAMENTO ====================
    activatePlan() {
        const code = this.elements.activationCodeInput.value.trim();
        
        if (!code || code.length !== 6) {
            this.elements.activationStatus.textContent = '❌ Digite um código válido de 6 dígitos';
            this.elements.activationStatus.className = 'activation-status error';
            return;
        }

        if (this.db.validateCode(code)) {
            // Ativar plano
            this.userPlan = this.db.savePlan(this.currentUser.id, {
                activatedWithCode: code,
                price: 10,
                currency: 'USD',
                paymentMethod: 'PayPal'
            });

            // Registrar pagamento
            this.db.savePayment({
                userId: this.currentUser.id,
                code: code,
                amount: '10.00',
                currency: 'USD',
                method: 'PayPal',
                status: 'completed'
            });

            // Atualizar UI
            this.updateUI();
            this.updatePaymentModal();
            this.hidePaymentModal();

            this.showNotification('✅ Plano ativado com sucesso! Agora você pode criar landing pages ilimitadas por 30 dias.', 'success');
            
            this.elements.activationStatus.textContent = '✅ Plano ativado com sucesso!';
            this.elements.activationStatus.className = 'activation-status success';
        } else {
            this.elements.activationStatus.textContent = '❌ Código inválido ou já utilizado';
            this.elements.activationStatus.className = 'activation-status error';
        }
    }

    // ==================== PAINEL ADMINISTRATIVO ====================
    showAdminPanel() {
        const password = prompt('🔐 PAINEL ADMINISTRATIVO NAGI\n\nDigite a senha de administrador:');
        const adminPassword = JSON.parse(localStorage.getItem('nagi_admin_password'));
        
        if (password !== adminPassword) {
            alert('❌ Senha incorreta!');
            return;
        }
        
        this.showAdminModal();
    }

    renderAdminPanel() {
        const stats = this.db.getStats();
        const activeCodes = this.db.getActiveCodes();
        const usedCodes = this.db.getUsedCodes();
        const allUsers = this.db.getAllUsers();
        const allPlans = this.db.getAllPlans();

        // Gerar 10 novos códigos se necessário
        if (activeCodes.length < 10) {
            for (let i = activeCodes.length; i < 10; i++) {
                this.db.generateCode();
            }
        }

        const newCodes = this.db.getActiveCodes().slice(0, 10);

        this.elements.adminContent.innerHTML = `
            <div class="admin-stats">
                <h3><i class="fas fa-chart-bar"></i> Estatísticas do Sistema</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <div>
                            <span class="stat-number">${stats.users}</span>
                            <span class="stat-label">Usuários</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-crown"></i>
                        <div>
                            <span class="stat-number">${stats.activePlans}</span>
                            <span class="stat-label">Planos Ativos</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-file-alt"></i>
                        <div>
                            <span class="stat-number">${stats.totalPages}</span>
                            <span class="stat-label">Páginas</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-key"></i>
                        <div>
                            <span class="stat-number">${stats.activeCodes}</span>
                            <span class="stat-label">Códigos Ativos</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-section">
                <h3><i class="fas fa-key"></i> Novos Códigos Gerados (10)</h3>
                <div class="codes-display">
                    ${newCodes.map(code => `
                        <div class="code-item">
                            <span class="code-value">${code.code}</span>
                            <button onclick="navigator.clipboard.writeText('${code.code}')" class="copy-code-btn">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button id="copy-all-codes" class="admin-btn">
                    <i class="fas fa-copy"></i> Copiar Todos os Códigos
                </button>
            </div>

            <div class="admin-section">
                <h3><i class="fas fa-users"></i> Usuários com Plano Ativo</h3>
                <div class="users-list">
                    ${Object.entries(allPlans)
                        .filter(([userId, plan]) => this.db.isPlanActive(userId))
                        .map(([userId, plan]) => {
                            const user = allUsers[userId];
                            const daysLeft = this.db.getDaysRemaining(userId);
                            return `
                                <div class="user-item">
                                    <div class="user-avatar-small" style="background: ${this.getUserColor(userId)}">
                                        ${user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div class="user-info-admin">
                                        <strong>${user.name}</strong>
                                        <small>${user.email}</small>
                                        <div class="user-plan-info">
                                            <span class="plan-days">${daysLeft} dias restantes</span>
                                            <span class="plan-expires">Expira: ${new Date(plan.expiresAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') || '<p class="no-data">Nenhum usuário com plano ativo</p>'}
                </div>
            </div>

            <div class="admin-actions">
                <button id="generate-more-codes" class="admin-btn">
                    <i class="fas fa-plus-circle"></i> Gerar Mais 10 Códigos
                </button>
                <button id="export-data" class="admin-btn">
                    <i class="fas fa-download"></i> Exportar Dados
                </button>
                <button id="clear-used-codes" class="admin-btn danger">
                    <i class="fas fa-trash"></i> Limpar Códigos Usados
                </button>
            </div>
        `;

        // Adicionar event listeners aos botões do admin
        document.getElementById('copy-all-codes')?.addEventListener('click', () => {
            const codes = newCodes.map(c => c.code).join('\n');
            navigator.clipboard.writeText(codes);
            this.showNotification('✅ Todos os códigos copiados!', 'success');
        });

        document.getElementById('generate-more-codes')?.addEventListener('click', () => {
            this.db.generateMultipleCodes(10);
            this.renderAdminPanel();
            this.showNotification('✅ 10 novos códigos gerados!', 'success');
        });

        document.getElementById('export-data')?.addEventListener('click', () => {
            const data = this.db.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nagi-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('✅ Dados exportados com sucesso!', 'success');
        });

        document.getElementById('clear-used-codes')?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todos os códigos usados?')) {
                this.db.clearUsedCodes();
                this.renderAdminPanel();
                this.showNotification('✅ Códigos usados removidos!', 'success');
            }
        });
    }

    // ==================== HISTÓRICO DE PÁGINAS ====================
    renderPagesList() {
        if (!this.currentUser) return;

        const pages = this.db.getUserPages(this.currentUser.id);
        const pagesList = this.elements.pagesList;

        if (pages.length === 0) {
            pagesList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-file-alt"></i>
                    <p>Nenhuma página criada ainda</p>
                </div>
            `;
            return;
        }

        pagesList.innerHTML = pages.slice(-5).reverse().map(page => `
            <div class="page-item" data-page-id="${page.id}">
                <div class="page-icon">
                    <i class="fas fa-file-code"></i>
                </div>
                <div class="page-info">
                    <strong>${page.name.substring(0, 30)}${page.name.length > 30 ? '...' : ''}</strong>
                    <small>${new Date(page.createdAt).toLocaleDateString('pt-BR')}</small>
                </div>
                <div class="page-actions">
                    <button class="view-page-btn" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="delete-page-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Adicionar event listeners
        pagesList.querySelectorAll('.view-page-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const page = pages[pages.length - 1 - index];
                this.updatePreview(page.html);
                this.showNotification('Página carregada no preview!', 'info');
            });
        });

        pagesList.querySelectorAll('.delete-page-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const page = pages[pages.length - 1 - index];
                if (confirm(`Excluir a página "${page.name}"?`)) {
                    this.db.deletePage(page.id);
                    this.renderPagesList();
                    this.updateUI();
                    this.showNotification('Página excluída com sucesso!', 'success');
                }
            });
        });
    }

    // ==================== NOTIFICAÇÕES ====================
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Login
        this.elements.demoLoginLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleDemoLogin();
        });

        // Logout
        this.elements.logoutBtn?.addEventListener('click', () => this.logout());

        // Nova página
        this.elements.newPageBtn?.addEventListener('click', () => {
            this.elements.productName.value = '';
            this.elements.productDesc.value = '';
            this.elements.targetAudience.value = '';
            this.elements.pageStyle.value = 'modern';
            this.showNotification('Formulário limpo para nova página!', 'info');
        });

        // Gerar página
        this.elements.generateBtn?.addEventListener('click', () => this.generateLandingPage());

        // Copiar HTML
        this.elements.copyBtn?.addEventListener('click', () => this.copyHTML());

        // Baixar página
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadPage());

        // Modal de pagamento
        this.elements.paymentBtn?.addEventListener('click', () => this.showPaymentModal());
        this.elements.closePaymentModal?.addEventListener('click', () => this.hidePaymentModal());
        this.elements.modalClose?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hidePaymentModal();
                this.hideAdminModal();
            });
        });

        // Ativar código
        this.elements.activateCodeBtn?.addEventListener('click', () => this.activatePlan());
        this.elements.activationCodeInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.activatePlan();
        });

        // Admin modal
        this.elements.closeAdminModal?.addEventListener('click', () => this.hideAdminModal());

        // Device toggle
        this.elements.deviceButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchDeviceView(btn.dataset.device);
            });
        });

        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hidePaymentModal();
                this.hideAdminModal();
            }
        });

        // Fechar modais ao clicar fora
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.add('hidden');
                }
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+Shift+A para painel admin
            if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.showAdminPanel();
            }
            
            // Ctrl+Enter para gerar página
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generateLandingPage();
            }
            
            // Ctrl+S para salvar/copiar
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.copyHTML();
            }
        });
    }
}

// ==================== INICIALIZAÇÃO ====================
// Tornar a classe global para o Google Sign-In
window.app = new NAGIAutoPages();

// Função global para o Google Sign-In
window.handleGoogleSignIn = function(response) {
    if (window.app) {
        try {
            const token = response.credential;
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            const user = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            };
            
            window.app.handleUserLogin(user);
        } catch (error) {
            console.error('Erro no Google Sign-In:', error);
            alert('Erro no login. Use o acesso de demonstração.');
        }
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Garantir que o app seja inicializado
    if (!window.app) {
        window.app = new NAGIAutoPages();
    }
    
    // Configurar fallback para Google Sign-In
    setTimeout(() => {
        if (!window.google || !window.google.accounts) {
            console.log('Google Sign-In não carregado, mostrando opção de demo');
            document.getElementById('demo-login-link').style.display = 'inline';
        }
    }, 3000);
});

// Prevenir recarregamento do formulário
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => e.preventDefault());
    });
});