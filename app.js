// ==================== SISTEMA DE BANCO DE DADOS ====================
class Database {
    constructor() {
        this.init();
    }
    
    init() {
        if (!localStorage.getItem('nagi_users')) localStorage.setItem('nagi_users', JSON.stringify({}));
        if (!localStorage.getItem('nagi_plans')) localStorage.setItem('nagi_plans', JSON.stringify({}));
        if (!localStorage.getItem('nagi_pages')) localStorage.setItem('nagi_pages', JSON.stringify([]));
        if (!localStorage.getItem('nagi_codes')) localStorage.setItem('nagi_codes', JSON.stringify([]));
        if (!localStorage.getItem('nagi_payments')) localStorage.setItem('nagi_payments', JSON.stringify([]));
    }
    
    saveUser(user) {
        const users = JSON.parse(localStorage.getItem('nagi_users'));
        users[user.id] = {
            ...user,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem('nagi_users', JSON.stringify(users));
        return users[user.id];
    }
    
    getUser(userId) {
        const users = JSON.parse(localStorage.getItem('nagi_users'));
        return users[userId];
    }
    
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
    
    isPlanActive(userId) {
        const plan = this.getPlan(userId);
        if (!plan) return false;
        
        const now = new Date();
        const expiresAt = new Date(plan.expiresAt);
        return now < expiresAt;
    }
    
    getDaysRemaining(userId) {
        const plan = this.getPlan(userId);
        if (!plan) return 0;
        
        const now = new Date();
        const expiresAt = new Date(plan.expiresAt);
        const diff = expiresAt - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    
    savePage(page) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        pages.push(page);
        localStorage.setItem('nagi_pages', JSON.stringify(pages));
        return page;
    }
    
    getUserPages(userId) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        return pages.filter(p => p.userId === userId);
    }
    
    generateCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codes = JSON.parse(localStorage.getItem('nagi_codes'));
        codes.push({
            code: code,
            generatedAt: new Date().toISOString(),
            used: false
        });
        localStorage.setItem('nagi_codes', JSON.stringify(codes));
        return code;
    }
    
    validateCode(code) {
        const codes = JSON.parse(localStorage.getItem('nagi_codes'));
        const codeIndex = codes.findIndex(c => c.code === code && !c.used);
        
        if (codeIndex !== -1) {
            codes[codeIndex].used = true;
            codes[codeIndex].usedAt = new Date().toISOString();
            localStorage.setItem('nagi_codes', JSON.stringify(codes));
            return true;
        }
        return false;
    }
    
    getCodes() {
        return JSON.parse(localStorage.getItem('nagi_codes'));
    }
    
    clearUsedCodes() {
        const codes = JSON.parse(localStorage.getItem('nagi_codes'));
        const activeCodes = codes.filter(c => !c.used);
        localStorage.setItem('nagi_codes', JSON.stringify(activeCodes));
    }
}

// ==================== ESTADO DA APLICAÇÃO ====================
const db = new Database();
let currentUser = null;
let userPlan = null;

// ==================== ELEMENTOS DO DOM ====================
const els = {
    screens: {
        login: document.getElementById('login-screen'),
        main: document.getElementById('main-screen')
    },
    
    // Login
    googleSigninBtn: document.getElementById('google-signin-btn'),
    
    // User info
    userInfo: document.getElementById('user-info'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    planBadge: document.getElementById('plan-badge'),
    
    // Buttons
    logoutBtn: document.getElementById('logout-btn'),
    paymentBtn: document.getElementById('payment-btn'),
    generateBtn: document.getElementById('generate-page-btn'),
    copyBtn: document.getElementById('copy-html-btn'),
    downloadBtn: document.getElementById('download-btn'),
    
    // Form inputs
    productName: document.getElementById('product-name'),
    productDesc: document.getElementById('product-description'),
    targetAudience: document.getElementById('target-audience'),
    pageStyle: document.getElementById('page-style'),
    
    // Stats
    pagesCreated: document.getElementById('pages-created'),
    planValidUntil: document.getElementById('plan-valid-until'),
    
    // Preview
    previewDevice: document.getElementById('preview-device'),
    landingPageContent: document.getElementById('landing-page-content'),
    
    // Payment modal
    paymentModal: document.getElementById('payment-modal'),
    closeModal: document.querySelector('.close-modal'),
    activationCode: document.getElementById('activation-code'),
    activateCodeBtn: document.getElementById('activate-code-btn'),
    codeStatus: document.getElementById('code-status'),
    
    // View buttons
    viewButtons: document.querySelectorAll('.btn-view')
};

// ==================== LOGIN SIMULADO (para desenvolvimento) ====================
els.googleSigninBtn?.addEventListener('click', function() {
    // Para desenvolvimento local, simulamos um usuário
    const demoUser = {
        id: 'demo_' + Date.now(),
        name: 'Usuário Demo',
        email: 'demo@nagitech.com',
        picture: null
    };
    
    currentUser = db.saveUser(demoUser);
    checkUserPlan();
    updateUI();
    
    if (!userPlan) {
        showPaymentModal();
    } else {
        showMainScreen();
    }
});

// ==================== GERENCIAMENTO DE USUÁRIO ====================
function checkUserPlan() {
    if (!currentUser) return;
    
    userPlan = db.getPlan(currentUser.id);
    if (userPlan && !db.isPlanActive(currentUser.id)) {
        userPlan = null;
        updateUI();
    }
}

function updateUI() {
    if (!currentUser) return;
    
    // Atualizar informações do usuário
    els.userName.textContent = currentUser.name;
    els.userEmail.textContent = currentUser.email;
    
    // Avatar
    if (currentUser.picture) {
        els.userAvatar.style.backgroundImage = `url(${currentUser.picture})`;
        els.userAvatar.textContent = '';
    } else {
        els.userAvatar.style.backgroundImage = '';
        els.userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
    
    // Status do plano
    if (userPlan && db.isPlanActive(currentUser.id)) {
        const daysLeft = db.getDaysRemaining(currentUser.id);
        els.planBadge.innerHTML = '<i class="fas fa-crown"></i> <span>Plano Ativo</span>';
        els.planBadge.className = 'plan-badge active';
        els.planValidUntil.textContent = new Date(userPlan.expiresAt).toLocaleDateString('pt-BR');
        
        // Habilitar funcionalidades
        els.generateBtn.disabled = false;
        els.copyBtn.disabled = false;
        els.downloadBtn.disabled = false;
        els.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Gerar Landing Page';
    } else {
        els.planBadge.innerHTML = '<i class="fas fa-lock"></i> <span>Plano Inativo</span>';
        els.planBadge.className = 'plan-badge';
        els.planValidUntil.textContent = '--/--/----';
        
        // Desabilitar funcionalidades
        els.generateBtn.disabled = true;
        els.copyBtn.disabled = true;
        els.downloadBtn.disabled = true;
        els.generateBtn.innerHTML = '<i class="fas fa-lock"></i> Ative o Plano para Gerar';
    }
    
    // Contador de páginas
    const userPages = db.getUserPages(currentUser.id);
    els.pagesCreated.textContent = userPages.length;
}

// ==================== GERENCIAMENTO DE TELAS ====================
function showMainScreen() {
    els.screens.login.classList.remove('active');
    els.screens.main.classList.add('active');
    updateUI();
}

function showLoginScreen() {
    els.screens.main.classList.remove('active');
    els.screens.login.classList.add('active');
    currentUser = null;
    userPlan = null;
}

function showPaymentModal() {
    els.paymentModal.classList.remove('hidden');
}

function hidePaymentModal() {
    els.paymentModal.classList.add('hidden');
    els.activationCode.value = '';
    els.codeStatus.textContent = '';
}

// ==================== GERADOR DE LANDING PAGES ====================
els.generateBtn?.addEventListener('click', function() {
    if (!userPlan || !db.isPlanActive(currentUser.id)) {
        showPaymentModal();
        return;
    }
    
    const productData = {
        name: els.productName.value.trim(),
        description: els.productDesc.value.trim(),
        audience: els.targetAudience.value.trim(),
        style: els.pageStyle.value
    };
    
    if (!productData.name || !productData.description) {
        alert('Por favor, preencha o nome e descrição do produto.');
        return;
    }
    
    // Gerar HTML
    const html = generateLandingPageHTML(productData);
    els.landingPageContent.innerHTML = html;
    
    // Salvar página
    const page = {
        id: Date.now(),
        userId: currentUser.id,
        ...productData,
        html: html,
        createdAt: new Date().toISOString()
    };
    
    db.savePage(page);
    updateUI();
    
    // Feedback
    alert('✅ Landing page gerada com sucesso!');
});

function generateLandingPageHTML(data) {
    const styles = {
        modern: { bg: '#f8fafc', color: '#1f2937', accent: '#4f46e5' },
        bold: { bg: '#1f2937', color: '#f9fafb', accent: '#f59e0b' },
        elegant: { bg: '#fefce8', color: '#451a03', accent: '#d97706' }
    };
    
    const style = styles[data.style] || styles.modern;
    
    return `
        <div style="
            background: ${style.bg};
            color: ${style.color};
            font-family: 'Segoe UI', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        ">
            <!-- Header -->
            <header style="
                background: linear-gradient(135deg, ${style.accent}, ${style.color});
                color: white;
                padding: 60px 40px;
                text-align: center;
            ">
                <h1 style="font-size: 48px; margin: 0 0 20px 0; font-weight: 800;">
                    ${data.name}
                </h1>
                <p style="font-size: 20px; opacity: 0.9; margin: 0; max-width: 800px; margin: 0 auto;">
                    A solução perfeita para ${data.audience || 'seu público-alvo'}
                </p>
            </header>
            
            <!-- Hero -->
            <section style="padding: 80px 40px; text-align: center;">
                <div style="max-width: 800px; margin: 0 auto;">
                    <h2 style="font-size: 36px; margin-bottom: 30px;">
                        Transforme sua visão em realidade
                    </h2>
                    <p style="font-size: 18px; line-height: 1.6; margin-bottom: 40px;">
                        ${data.description}
                    </p>
                    <button style="
                        background: ${style.accent};
                        color: white;
                        border: none;
                        padding: 18px 45px;
                        font-size: 18px;
                        font-weight: 600;
                        border-radius: 50px;
                        cursor: pointer;
                        transition: transform 0.3s;
                    " onmouseover="this.style.transform='scale(1.05)'" 
                       onmouseout="this.style.transform='scale(1)'">
                        QUERO COMPRAR AGORA
                    </button>
                </div>
            </section>
            
            <!-- Benefits -->
            <section style="background: rgba(0,0,0,0.03); padding: 80px 40px;">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="text-align: center; font-size: 36px; margin-bottom: 50px;">
                        O que você vai receber:
                    </h2>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 30px;
                    ">
                        <div style="
                            background: white;
                            padding: 30px;
                            border-radius: 12px;
                            text-align: center;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                        ">
                            <div style="
                                background: ${style.accent}20;
                                color: ${style.accent};
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 24px;
                                margin: 0 auto 20px;
                            ">
                                ✓
                            </div>
                            <h3 style="margin: 0 0 10px 0;">Resultados Comprovados</h3>
                            <p style="margin: 0; color: #6b7280;">
                                Método testado e aprovado por milhares de clientes
                            </p>
                        </div>
                        
                        <div style="
                            background: white;
                            padding: 30px;
                            border-radius: 12px;
                            text-align: center;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                        ">
                            <div style="
                                background: ${style.accent}20;
                                color: ${style.accent};
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 24px;
                                margin: 0 auto 20px;
                            ">
                                ⚡
                            </div>
                            <h3 style="margin: 0 0 10px 0;">Implementação Rápida</h3>
                            <p style="margin: 0; color: #6b7280;">
                                Comece a ver resultados em menos de 24 horas
                            </p>
                        </div>
                        
                        <div style="
                            background: white;
                            padding: 30px;
                            border-radius: 12px;
                            text-align: center;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                        ">
                            <div style="
                                background: ${style.accent}20;
                                color: ${style.accent};
                                width: 60px;
                                height: 60px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 24px;
                                margin: 0 auto 20px;
                            ">
                                🛡️
                            </div>
                            <h3 style="margin: 0 0 10px 0;">Garantia Total</h3>
                            <p style="margin: 0; color: #6b7280;">
                                7 dias de garantia ou seu dinheiro de volta
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- CTA Final -->
            <section style="
                background: linear-gradient(135deg, ${style.accent}, ${style.color});
                color: white;
                padding: 100px 40px;
                text-align: center;
            ">
                <h2 style="font-size: 42px; margin-bottom: 30px;">
                    Pronto para transformar seu negócio?
                </h2>
                <p style="font-size: 20px; margin-bottom: 50px; max-width: 600px; margin-left: auto; margin-right: auto;">
                    Não perca esta oportunidade única de levar seu produto/serviço para o próximo nível.
                </p>
                <button style="
                    background: white;
                    color: ${style.accent};
                    border: none;
                    padding: 20px 50px;
                    font-size: 20px;
                    font-weight: 700;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: transform 0.3s;
                " onmouseover="this.style.transform='scale(1.05)'" 
                   onmouseout="this.style.transform='scale(1)'">
                    QUERO COMEÇAR AGORA!
                </button>
                <p style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
                    ⚡ Oferta especial por tempo limitado • 🛡️ 7 dias de garantia
                </p>
            </section>
            
            <!-- Footer -->
            <footer style="
                background: ${style.color};
                color: ${style.bg};
                padding: 40px;
                text-align: center;
                font-size: 14px;
            ">
                <div style="max-width: 800px; margin: 0 auto;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                        © 2024 ${data.name}. Todos os direitos reservados.
                    </p>
                    <p style="margin: 0 0 10px 0; opacity: 0.8;">
                        Desenvolvido com ❤️ pela NAGI TECHNOLOGY S.A.
                    </p>
                    <p style="margin: 0; font-weight: 500; letter-spacing: 0.5px;">
                        UMINO NAGI - I WAS HERE🍀
                    </p>
                </div>
            </footer>
        </div>
    `;
}

// ==================== FUNCIONALIDADES DE PREVIEW ====================
els.copyBtn?.addEventListener('click', function() {
    const html = els.landingPageContent.innerHTML;
    if (!html || html.includes('empty-preview')) {
        alert('Gere uma landing page primeiro!');
        return;
    }
    
    navigator.clipboard.writeText(html).then(() => {
        alert('✅ HTML copiado para a área de transferência!');
    });
});

els.downloadBtn?.addEventListener('click', function() {
    const html = els.landingPageContent.innerHTML;
    if (!html || html.includes('empty-preview')) {
        alert('Gere uma landing page primeiro!');
        return;
    }
    
    const fullHTML = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${els.productName.value || 'Landing Page'}</title>
    <style>
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f8fafc; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page-nagi.html';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Landing page baixada com sucesso!');
});

// ==================== VIEW CONTROLS ====================
els.viewButtons?.forEach(btn => {
    btn.addEventListener('click', function() {
        els.viewButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        if (this.dataset.view === 'mobile') {
            els.previewDevice.classList.add('mobile-view');
        } else {
            els.previewDevice.classList.remove('mobile-view');
        }
    });
});

// ==================== SISTEMA DE PAGAMENTO ====================
els.paymentBtn?.addEventListener('click', showPaymentModal);
els.closeModal?.addEventListener('click', hidePaymentModal);
els.paymentModal?.addEventListener('click', function(e) {
    if (e.target === this) hidePaymentModal();
});

els.activateCodeBtn?.addEventListener('click', function() {
    const code = els.activationCode.value.trim();
    
    if (!code || code.length !== 6) {
        els.codeStatus.textContent = '❌ Digite um código válido de 6 dígitos';
        els.codeStatus.className = 'code-status';
        return;
    }
    
    if (db.validateCode(code)) {
        // Ativar plano
        userPlan = db.savePlan(currentUser.id, {
            activatedWithCode: code,
            price: 10,
            currency: 'USD'
        });
        
        updateUI();
        hidePaymentModal();
        showMainScreen();
        alert('✅ Plano ativado com sucesso! Agora você pode criar landing pages por 30 dias.');
    } else {
        els.codeStatus.textContent = '❌ Código inválido ou já utilizado';
        els.codeStatus.className = 'code-status';
    }
});

els.activationCode?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        els.activateCodeBtn.click();
    }
});

// ==================== PAINEL ADMINISTRATIVO ====================
const ADMIN_PASSWORD = '948399692Se@';

function showAdminPanel() {
    const password = prompt('🔐 PAINEL ADMINISTRATIVO NAGI\n\nDigite a senha de administrador:');
    if (password !== ADMIN_PASSWORD) {
        alert('❌ Senha incorreta!');
        return;
    }
    
    // Gerar 10 novos códigos
    const newCodes = [];
    for (let i = 0; i < 10; i++) {
        newCodes.push(db.generateCode());
    }
    
    const allCodes = db.getCodes();
    const activeCodes = allCodes.filter(c => !c.used);
    const usedCodes = allCodes.filter(c => c.used);
    const users = JSON.parse(localStorage.getItem('nagi_users'));
    const plans = JSON.parse(localStorage.getItem('nagi_plans'));
    
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        color: white;
        padding: 30px;
        z-index: 9999;
        overflow-y: auto;
        font-family: 'Segoe UI', sans-serif;
    `;
    
    panel.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h1 style="color: #f59e0b;">
                    <i class="fas fa-shield-alt"></i> PAINEL ADMINISTRATIVO NAGI
                </h1>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                ">
                    <i class="fas fa-times"></i> Fechar
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: #1f2937; padding: 20px; border-radius: 12px;">
                    <h3 style="color: #60a5fa; margin-top: 0;">
                        <i class="fas fa-users"></i> ESTATÍSTICAS
                    </h3>
                    <div style="font-size: 14px; line-height: 2;">
                        <div>👥 Usuários: ${Object.keys(users).length}</div>
                        <div>👑 Planos ativos: ${Object.keys(plans).filter(id => db.isPlanActive(id)).length}</div>
                        <div>🔑 Códigos ativos: ${activeCodes.length}</div>
                        <div>💰 Códigos usados: ${usedCodes.length}</div>
                    </div>
                </div>
                
                <div style="background: #1f2937; padding: 20px; border-radius: 12px;">
                    <h3 style="color: #10b981; margin-top: 0;">
                        <i class="fas fa-key"></i> NOVOS CÓDIGOS (10)
                    </h3>
                    <div style="
                        font-family: monospace;
                        font-size: 20px;
                        line-height: 2;
                        background: #0f172a;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 15px 0;
                    ">
                        ${newCodes.map(code => `<div>${code}</div>`).join('')}
                    </div>
                    <button onclick="navigator.clipboard.writeText('${newCodes.join('\\n')}').then(() => alert('Códigos copiados!'))" style="
                        width: 100%;
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 10px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-copy"></i> Copiar Todos
                    </button>
                </div>
            </div>
            
            <div style="background: #1f2937; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="color: #8b5cf6; margin-top: 0;">
                    <i class="fas fa-user-check"></i> USUÁRIOS ATIVOS
                </h3>
                <div style="max-height: 300px; overflow-y: auto; margin-top: 15px;">
                    ${Object.keys(plans)
                        .filter(userId => db.isPlanActive(userId))
                        .map(userId => {
                            const user = users[userId];
                            const plan = plans[userId];
                            const daysLeft = db.getDaysRemaining(userId);
                            return `
                                <div style="
                                    background: #0f172a;
                                    padding: 15px;
                                    border-radius: 8px;
                                    margin-bottom: 10px;
                                    border-left: 4px solid ${daysLeft > 7 ? '#10b981' : '#f59e0b'};
                                ">
                                    <strong>${user.name}</strong>
                                    <div style="color: #9ca3af; font-size: 13px;">${user.email}</div>
                                    <div style="margin-top: 10px; font-size: 12px;">
                                        <span style="color: ${daysLeft > 7 ? '#10b981' : '#f59e0b'}">
                                            ${daysLeft} dias restantes
                                        </span>
                                        <span style="color: #9ca3af; margin-left: 10px;">
                                            Expira: ${new Date(plan.expiresAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            `;
                        }).join('') || '<div style="color: #9ca3af; text-align: center; padding: 20px;">Nenhum usuário ativo</div>'
                    }
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
}

// ==================== ATALHO PARA PAINEL ADMIN ====================
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        showAdminPanel();
    }
});

// ==================== INICIALIZAÇÃO ====================
function init() {
    console.log('🚀 NAGI AUTO PAGES AI inicializado');
    
    // Event listeners
    els.logoutBtn?.addEventListener('click', showLoginScreen);
    
    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !els.paymentModal.classList.contains('hidden')) {
            hidePaymentModal();
        }
    });
    
    // Verificar se há usuário na sessão anterior
    const lastUser = localStorage.getItem('nagi_last_user');
    if (lastUser) {
        const user = db.getUser(lastUser);
        if (user) {
            currentUser = user;
            checkUserPlan();
            updateUI();
            if (userPlan && db.isPlanActive(currentUser.id)) {
                showMainScreen();
            }
        }
    }
}

// ==================== INICIAR APLICAÇÃO ====================
document.addEventListener('DOMContentLoaded', init);