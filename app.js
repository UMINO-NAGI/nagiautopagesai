// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
    GOOGLE_CLIENT_ID: "225104795498-n1j744vsopftf38hnf8oecona7eqkojr.apps.googleusercontent.com",
    PAYPAL_LINK: "https://www.paypal.com/ncp/payment/QNS8AAHSEPVG8",
    PLAN_PRICE: "10.00",
    CURRENCY: "USD",
    ADMIN_PASSWORD: "948399692Se@",
    PLAN_DURATION_DAYS: 30
};

// ==================== SISTEMA DE BANCO DE DADOS LOCAL ====================
class Database {
    constructor() {
        this.init();
    }
    
    init() {
        // Inicializar estruturas se não existirem
        if (!localStorage.getItem('nagi_users')) {
            localStorage.setItem('nagi_users', JSON.stringify({}));
        }
        if (!localStorage.getItem('nagi_plans')) {
            localStorage.setItem('nagi_plans', JSON.stringify({}));
        }
        if (!localStorage.getItem('nagi_pages')) {
            localStorage.setItem('nagi_pages', JSON.stringify([]));
        }
        if (!localStorage.getItem('nagi_activation_codes')) {
            localStorage.setItem('nagi_activation_codes', JSON.stringify([]));
        }
        if (!localStorage.getItem('nagi_payments')) {
            localStorage.setItem('nagi_payments', JSON.stringify([]));
        }
    }
    
    // Gerenciamento de Usuários
    saveUser(user) {
        const users = JSON.parse(localStorage.getItem('nagi_users'));
        users[user.id] = {
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
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
    
    // Gerenciamento de Planos
    savePlan(userId, planData) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        plans[userId] = {
            ...planData,
            userId: userId,
            activatedAt: new Date().toISOString(),
            expiresAt: this.calculateExpiryDate(),
            status: 'active'
        };
        localStorage.setItem('nagi_plans', JSON.stringify(plans));
        return plans[userId];
    }
    
    getPlan(userId) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        return plans[userId];
    }
    
    updatePlanExpiry(userId, newExpiry) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        if (plans[userId]) {
            plans[userId].expiresAt = newExpiry;
            localStorage.setItem('nagi_plans', JSON.stringify(plans));
        }
    }
    
    deletePlan(userId) {
        const plans = JSON.parse(localStorage.getItem('nagi_plans'));
        delete plans[userId];
        localStorage.setItem('nagi_plans', JSON.stringify(plans));
    }
    
    // Gerenciamento de Páginas
    savePage(pageData) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        pages.push(pageData);
        localStorage.setItem('nagi_pages', JSON.stringify(pages));
        return pageData;
    }
    
    getUserPages(userId) {
        const pages = JSON.parse(localStorage.getItem('nagi_pages'));
        return pages.filter(page => page.userId === userId);
    }
    
    // Gerenciamento de Códigos de Ativação
    generateActivationCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codes = JSON.parse(localStorage.getItem('nagi_activation_codes'));
        codes.push({
            code: code,
            generatedAt: new Date().toISOString(),
            used: false,
            usedBy: null,
            usedAt: null
        });
        localStorage.setItem('nagi_activation_codes', JSON.stringify(codes));
        return code;
    }
    
    validateActivationCode(code) {
        const codes = JSON.parse(localStorage.getItem('nagi_activation_codes'));
        const codeIndex = codes.findIndex(c => c.code === code && !c.used);
        
        if (codeIndex !== -1) {
            codes[codeIndex].used = true;
            codes[codeIndex].usedAt = new Date().toISOString();
            localStorage.setItem('nagi_activation_codes', JSON.stringify(codes));
            return true;
        }
        return false;
    }
    
    getActivationCodes() {
        return JSON.parse(localStorage.getItem('nagi_activation_codes'));
    }
    
    clearUsedCodes() {
        const codes = JSON.parse(localStorage.getItem('nagi_activation_codes'));
        const activeCodes = codes.filter(c => !c.used);
        localStorage.setItem('nagi_activation_codes', JSON.stringify(activeCodes));
    }
    
    // Gerenciamento de Pagamentos
    savePayment(paymentData) {
        const payments = JSON.parse(localStorage.getItem('nagi_payments'));
        payments.push(paymentData);
        localStorage.setItem('nagi_payments', JSON.stringify(payments));
        return paymentData;
    }
    
    // Utilitários
    calculateExpiryDate() {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + CONFIG.PLAN_DURATION_DAYS);
        return expiry.toISOString();
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
        const diffTime = expiresAt - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
    }
}

// ==================== ESTADO DA APLICAÇÃO ====================
const db = new Database();
let currentUser = null;
let userPlan = null;

// ==================== ELEMENTOS DO DOM ====================
const els = {
    // Telas
    loginScreen: document.getElementById("login-screen"),
    mainScreen: document.getElementById("main-screen"),
    
    // Usuário
    userInfo: document.getElementById("user-info"),
    userAvatar: document.getElementById("user-avatar"),
    userName: document.getElementById("user-name"),
    userEmail: document.getElementById("user-email"),
    logoutBtn: document.getElementById("logout-btn"),
    
    // Plano
    planBadge: document.getElementById("plan-badge"),
    
    // Criação
    generatePageBtn: document.getElementById("generate-page-btn"),
    productName: document.getElementById("product-name"),
    targetAudience: document.getElementById("target-audience"),
    productDescription: document.getElementById("product-description"),
    pageStyle: document.getElementById("page-style"),
    pagesCreated: document.getElementById("pages-created"),
    planValidUntil: document.getElementById("plan-valid-until"),
    
    // Preview
    landingPageContent: document.getElementById("landing-page-content"),
    copyHtmlBtn: document.getElementById("copy-html-btn"),
    downloadBtn: document.getElementById("download-btn"),
    
    // Modal de pagamento
    paymentModal: document.getElementById("payment-modal"),
    closeModal: document.querySelector(".close-modal"),
    activationCode: document.getElementById("activation-code"),
    activateCodeBtn: document.getElementById("activate-code-btn"),
    codeStatus: document.getElementById("code-status")
};

// ==================== AUTENTICAÇÃO GOOGLE REAL ====================
function handleGoogleSignIn(response) {
    console.log("Google Sign-In response:", response);
    
    try {
        const credential = response.credential;
        
        // Decodificar o JWT token
        const payload = JSON.parse(atob(credential.split('.')[1]));
        
        console.log("Decoded payload:", payload);
        
        currentUser = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };
        
        // Salvar/atualizar usuário no banco de dados
        db.saveUser(currentUser);
        db.updateUserLogin(currentUser.id);
        
        // Verificar plano do usuário
        checkUserPlan();
        
        // Atualizar interface
        updateUserInterface();
        
        // Se o usuário não tem plano ativo, mostrar modal de pagamento
        if (!userPlan) {
            showPaymentModal();
        } else {
            showMainScreen();
        }
        
    } catch (error) {
        console.error("Erro no login Google:", error);
        showMessage("Erro no login. Tente novamente.", "error");
    }
}

function checkUserPlan() {
    if (!currentUser) return;
    
    userPlan = db.getPlan(currentUser.id);
    
    // Verificar se o plano expirou
    if (userPlan && !db.isPlanActive(currentUser.id)) {
        userPlan = null;
        db.deletePlan(currentUser.id);
        showMessage("Seu plano expirou. Renove para continuar.", "warning");
    }
}

function logout() {
    currentUser = null;
    userPlan = null;
    showLoginScreen();
}

// ==================== GERENCIAMENTO DE TELAS ====================
function showLoginScreen() {
    els.loginScreen.classList.add("active");
    els.mainScreen.classList.remove("active");
}

function showMainScreen() {
    els.loginScreen.classList.remove("active");
    els.mainScreen.classList.add("active");
    loadUserData();
}

function showPaymentModal() {
    els.paymentModal.classList.remove("hidden");
}

function hidePaymentModal() {
    els.paymentModal.classList.add("hidden");
}

// ==================== ATUALIZAR INTERFACE ====================
function updateUserInterface() {
    if (!currentUser) return;
    
    // Informações do usuário
    if (els.userName) els.userName.textContent = currentUser.name;
    if (els.userEmail) els.userEmail.textContent = currentUser.email;
    if (els.userAvatar) {
        if (currentUser.picture) {
            els.userAvatar.src = currentUser.picture;
        } else {
            // Avatar padrão com inicial
            els.userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=4f46e5&color=fff`;
        }
    }
    
    // Status do plano
    if (els.planBadge) {
        if (userPlan && db.isPlanActive(currentUser.id)) {
            const daysLeft = db.getDaysRemaining(currentUser.id);
            els.planBadge.innerHTML = `<i class="fas fa-crown"></i> Plano Ativo (${daysLeft} dias)`;
            els.planBadge.style.background = "linear-gradient(135deg, #10b981, #34d399)";
            
            // Atualizar data de validade
            if (els.planValidUntil) {
                const date = new Date(userPlan.expiresAt);
                els.planValidUntil.textContent = date.toLocaleDateString('pt-BR');
            }
            
            // Habilitar botão de gerar página
            if (els.generatePageBtn) {
                els.generatePageBtn.disabled = false;
            }
        } else {
            els.planBadge.innerHTML = '<i class="fas fa-lock"></i> Plano Inativo';
            els.planBadge.style.background = "linear-gradient(135deg, #ef4444, #f87171)";
            if (els.planValidUntil) {
                els.planValidUntil.textContent = "--/--/----";
            }
            
            // Desabilitar botão de gerar página
            if (els.generatePageBtn) {
                els.generatePageBtn.disabled = true;
            }
        }
    }
    
    // Contador de páginas
    if (els.pagesCreated) {
        const userPages = db.getUserPages(currentUser.id);
        els.pagesCreated.textContent = userPages.length;
    }
}

// ==================== ATIVAÇÃO DE CÓDIGO ====================
function activateCode() {
    const code = els.activationCode.value.trim();
    
    if (!code || code.length !== 6) {
        showMessage("Digite um código válido de 6 dígitos", "error");
        return;
    }
    
    // Verificar código no banco de dados
    if (db.validateActivationCode(code)) {
        // Ativar plano para o usuário (30 dias)
        const planData = {
            activatedWithCode: code,
            price: CONFIG.PLAN_PRICE,
            currency: CONFIG.CURRENCY
        };
        
        userPlan = db.savePlan(currentUser.id, planData);
        
        // Registrar pagamento
        db.savePayment({
            userId: currentUser.id,
            code: code,
            amount: CONFIG.PLAN_PRICE,
            currency: CONFIG.CURRENCY,
            date: new Date().toISOString(),
            status: 'completed'
        });
        
        updateUserInterface();
        hidePaymentModal();
        showMainScreen();
        showMessage("✅ Plano ativado com sucesso! Agora você pode criar páginas por 30 dias.", "success");
    } else {
        showMessage("❌ Código inválido ou já utilizado. Verifique e tente novamente.", "error");
    }
}

// ==================== GERADOR DE PÁGINAS ====================
function generateLandingPage() {
    if (!userPlan || !db.isPlanActive(currentUser.id)) {
        showMessage("❌ Você precisa ativar seu plano primeiro.", "error");
        showPaymentModal();
        return;
    }
    
    const productData = {
        name: els.productName.value.trim(),
        audience: els.targetAudience.value.trim(),
        description: els.productDescription.value.trim(),
        style: els.pageStyle.value
    };
    
    if (!productData.name || !productData.description) {
        showMessage("❌ Preencha o nome e descrição do produto.", "error");
        return;
    }
    
    // Gerar HTML da landing page
    const htmlContent = generatePageHTML(productData);
    
    // Atualizar preview
    els.landingPageContent.innerHTML = htmlContent;
    
    // Salvar página no banco de dados
    const pageData = {
        id: Date.now(),
        userId: currentUser.id,
        ...productData,
        html: htmlContent,
        createdAt: new Date().toISOString()
    };
    
    db.savePage(pageData);
    
    // Atualizar contador
    updateUserInterface();
    
    showMessage("✅ Landing page gerada com sucesso!", "success");
}

function generatePageHTML(data) {
    const styles = {
        modern: { bg: "#f8fafc", color: "#1e293b", accent: "#4f46e5" },
        bold: { bg: "#1e293b", color: "#f1f5f9", accent: "#f59e0b" },
        elegant: { bg: "#fefce8", color: "#451a03", accent: "#d97706" }
    };
    
    const style = styles[data.style] || styles.modern;
    
    return `
        <div class="generated-page" style="
            background: ${style.bg};
            color: ${style.color};
            font-family: 'Segoe UI', system-ui, sans-serif;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        ">
            <!-- Header -->
            <header style="
                background: linear-gradient(135deg, ${style.accent}, #${Math.floor(Math.random()*16777215).toString(16)});
                color: white;
                padding: 40px;
                text-align: center;
            ">
                <h1 style="font-size: 42px; margin: 0 0 10px 0; font-weight: 800;">
                    ${data.name}
                </h1>
                <p style="font-size: 18px; opacity: 0.9; margin: 0;">
                    A solução perfeita para ${data.audience || "seu público-alvo"}
                </p>
            </header>
            
            <!-- Hero Section -->
            <section style="padding: 60px 40px; text-align: center;">
                <h2 style="font-size: 32px; margin-bottom: 20px;">
                    Transforme sua visão em realidade
                </h2>
                <p style="font-size: 18px; line-height: 1.6; max-width: 800px; margin: 0 auto 30px;">
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
            </section>
            
            <!-- Benefits -->
            <section style="background: rgba(0,0,0,0.03); padding: 60px 40px;">
                <h2 style="text-align: center; font-size: 32px; margin-bottom: 40px;">
                    O que você vai receber:
                </h2>
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 30px;
                    max-width: 1200px;
                    margin: 0 auto;
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
            </section>
            
            <!-- CTA Final -->
            <section style="
                background: linear-gradient(135deg, ${style.accent}, ${style.color});
                color: white;
                padding: 80px 40px;
                text-align: center;
            ">
                <h2 style="font-size: 36px; margin-bottom: 20px;">
                    Pronto para transformar seu negócio?
                </h2>
                <p style="font-size: 18px; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto;">
                    Não perca esta oportunidade única. Comece agora e veja os resultados em tempo real.
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

// ==================== PAINEL DE ADMINISTRAÇÃO ====================
function showAdminPanel() {
    // Pedir senha
    const password = prompt("🔐 PAINEL ADMINISTRATIVO NAGI\n\nDigite a senha de administrador:");
    if (password !== CONFIG.ADMIN_PASSWORD) {
        alert("❌ Senha incorreta!");
        return;
    }
    
    // Criar interface do painel
    const panel = document.createElement("div");
    panel.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 2000;
        color: white;
        padding: 30px;
        overflow-y: auto;
        font-family: 'Segoe UI', sans-serif;
    `;
    
    // Gerar novos códigos
    const newCodes = [];
    for (let i = 0; i < 10; i++) {
        const code = db.generateActivationCode();
        newCodes.push(code);
    }
    
    const allCodes = db.getActivationCodes();
    const activeCodes = allCodes.filter(c => !c.used);
    const usedCodes = allCodes.filter(c => c.used);
    
    const users = JSON.parse(localStorage.getItem('nagi_users'));
    const plans = JSON.parse(localStorage.getItem('nagi_plans'));
    const pages = JSON.parse(localStorage.getItem('nagi_pages'));
    const payments = JSON.parse(localStorage.getItem('nagi_payments'));
    
    panel.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h1 style="color: #f59e0b; margin: 0;">
                    <i class="fas fa-shield-alt"></i> PAINEL ADMINISTRATIVO NAGI
                </h1>
                <button id="close-admin-panel" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                ">
                    <i class="fas fa-times"></i> Fechar
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: #1f2937; padding: 25px; border-radius: 12px;">
                    <h3 style="color: #60a5fa; margin-top: 0;">
                        <i class="fas fa-users"></i> ESTATÍSTICAS
                    </h3>
                    <div style="font-size: 14px; line-height: 2;">
                        <div>👥 Usuários cadastrados: <strong>${Object.keys(users).length}</strong></div>
                        <div>👑 Planos ativos: <strong>${Object.keys(plans).filter(id => db.isPlanActive(id)).length}</strong></div>
                        <div>📄 Páginas criadas: <strong>${pages.length}</strong></div>
                        <div>💰 Pagamentos: <strong>${payments.length}</strong></div>
                        <div>🔑 Códigos ativos: <strong>${activeCodes.length}</strong></div>
                    </div>
                </div>
                
                <div style="background: #1f2937; padding: 25px; border-radius: 12px;">
                    <h3 style="color: #10b981; margin-top: 0;">
                        <i class="fas fa-key"></i> NOVOS CÓDIGOS GERADOS (10)
                    </h3>
                    <div style="
                        font-family: 'Courier New', monospace;
                        font-size: 20px;
                        line-height: 2;
                        background: #0f172a;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 15px 0;
                    ">
                        ${newCodes.map(code => `<div style="padding: 5px 0;">${code}</div>`).join('')}
                    </div>
                    <button id="copy-new-codes" style="
                        width: 100%;
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-top: 10px;
                    ">
                        <i class="fas fa-copy"></i> Copiar Todos os Códigos
                    </button>
                </div>
                
                <div style="background: #1f2937; padding: 25px; border-radius: 12px;">
                    <h3 style="color: #f59e0b; margin-top: 0;">
                        <i class="fas fa-cog"></i> AÇÕES RÁPIDAS
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                        <button id="generate-more-codes" style="
                            background: #f59e0b;
                            color: white;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            text-align: left;
                        ">
                            <i class="fas fa-plus-circle"></i> Gerar Mais 5 Códigos
                        </button>
                        <button id="clear-used-codes" style="
                            background: #ef4444;
                            color: white;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            text-align: left;
                        ">
                            <i class="fas fa-trash"></i> Limpar Códigos Usados
                        </button>
                        <button id="export-data" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            text-align: left;
                        ">
                            <i class="fas fa-download"></i> Exportar Dados
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div style="background: #1f2937; padding: 25px; border-radius: 12px;">
                    <h3 style="color: #8b5cf6; margin-top: 0;">
                        <i class="fas fa-check-circle"></i> CÓDIGOS ATIVOS (${activeCodes.length})
                    </h3>
                    <div style="
                        max-height: 300px;
                        overflow-y: auto;
                        font-family: 'Courier New', monospace;
                        font-size: 16px;
                        background: #0f172a;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 15px;
                    ">
                        ${activeCodes.length > 0 
                            ? activeCodes.map(code => `<div style="padding: 5px 0; border-bottom: 1px solid #374151;">${code.code}</div>`).join('')
                            : '<div style="color: #9ca3af; text-align: center; padding: 20px;">Nenhum código ativo</div>'
                        }
                    </div>
                </div>
                
                <div style="background: #1f2937; padding: 25px; border-radius: 12px;">
                    <h3 style="color: #ef4444; margin-top: 0;">
                        <i class="fas fa-times-circle"></i> CÓDIGOS USADOS (${usedCodes.length})
                    </h3>
                    <div style="
                        max-height: 300px;
                        overflow-y: auto;
                        font-size: 14px;
                        background: #0f172a;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 15px;
                    ">
                        ${usedCodes.length > 0 
                            ? usedCodes.map(code => `
                                <div style="padding: 8px 0; border-bottom: 1px solid #374151;">
                                    <div><strong>${code.code}</strong></div>
                                    <div style="color: #9ca3af; font-size: 12px;">
                                        Usado em: ${new Date(code.usedAt).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            `).join('')
                            : '<div style="color: #9ca3af; text-align: center; padding: 20px;">Nenhum código usado</div>'
                        }
                    </div>
                </div>
            </div>
            
            <div style="background: #1f2937; padding: 25px; border-radius: 12px;">
                <h3 style="color: #60a5fa; margin-top: 0;">
                    <i class="fas fa-user-check"></i> USUÁRIOS COM PLANO ATIVO
                </h3>
                <div style="
                    max-height: 400px;
                    overflow-y: auto;
                    margin-top: 15px;
                ">
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
                                    <div style="display: flex; justify-content: space-between; align-items: start;">
                                        <div>
                                            <strong>${user.name}</strong>
                                            <div style="color: #9ca3af; font-size: 13px;">${user.email}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="color: ${daysLeft > 7 ? '#10b981' : '#f59e0b'}; font-weight: bold;">
                                                ${daysLeft} dias restantes
                                            </div>
                                            <div style="color: #9ca3af; font-size: 12px;">
                                                Expira: ${new Date(plan.expiresAt).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
                                        Código: ${plan.activatedWithCode} • Ativado: ${new Date(plan.activatedAt).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            `;
                        }).join('') || '<div style="color: #9ca3af; text-align: center; padding: 30px;">Nenhum usuário com plano ativo</div>'
                    }
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h4 style="color: #f59e0b; margin-top: 0;">
                    <i class="fas fa-info-circle"></i> INSTRUÇÕES PARA ADMINISTRADOR
                </h4>
                <ol style="color: #d1d5db; font-size: 14px; line-height: 1.6;">
                    <li>Após receber o pagamento via PayPal, copie um código da lista "Novos Códigos"</li>
                    <li>Envie o código de 6 dígitos para o cliente que efetuou o pagamento</li>
                    <li>O cliente digita o código no site para ativar o plano mensal</li>
                    <li>O código será marcado como "usado" automaticamente</li>
                    <li>O plano expira após 30 dias, exigindo novo pagamento</li>
                    <li>Gere novos códigos conforme a necessidade</li>
                </ol>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Event listeners do painel
    document.getElementById("copy-new-codes").addEventListener("click", () => {
        navigator.clipboard.writeText(newCodes.join('\n'));
        alert("✅ Códigos copiados para a área de transferência!");
    });
    
    document.getElementById("generate-more-codes").addEventListener("click", () => {
        for (let i = 0; i < 5; i++) {
            db.generateActivationCode();
        }
        document.body.removeChild(panel);
        setTimeout(showAdminPanel, 100);
    });
    
    document.getElementById("clear-used-codes").addEventListener("click", () => {
        if (confirm("Tem certeza que deseja limpar TODOS os códigos usados?")) {
            db.clearUsedCodes();
            document.body.removeChild(panel);
            setTimeout(showAdminPanel, 100);
            alert("✅ Códigos usados removidos!");
        }
    });
    
    document.getElementById("export-data").addEventListener("click", () => {
        const data = {
            users: users,
            plans: plans,
            pages: pages,
            payments: payments,
            activationCodes: allCodes,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nagi-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert("✅ Dados exportados com sucesso!");
    });
    
    document.getElementById("close-admin-panel").addEventListener("click", () => {
        document.body.removeChild(panel);
    });
}

// ==================== CARREGAR DADOS DO USUÁRIO ====================
function loadUserData() {
    updateUserInterface();
}

// ==================== UTILIDADES ====================
function showMessage(text, type = "info") {
    const statusEl = document.createElement("div");
    statusEl.textContent = text;
    statusEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === "error" ? "#ef4444" : type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : "#3b82f6"};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(statusEl);
    
    setTimeout(() => {
        statusEl.style.animation = "slideOut 0.3s ease";
        setTimeout(() => statusEl.remove(), 300);
    }, 4000);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Logout
    if (els.logoutBtn) {
        els.logoutBtn.addEventListener("click", logout);
    }
    
    // Gerar página
    if (els.generatePageBtn) {
        els.generatePageBtn.addEventListener("click", generateLandingPage);
    }
    
    // Modal de pagamento
    if (els.closeModal) {
        els.closeModal.addEventListener("click", hidePaymentModal);
    }
    
    if (els.paymentModal) {
        els.paymentModal.addEventListener("click", (e) => {
            if (e.target === els.paymentModal) {
                hidePaymentModal();
            }
        });
    }
    
    // Ativação de código
    if (els.activateCodeBtn) {
        els.activateCodeBtn.addEventListener("click", activateCode);
    }
    
    if (els.activationCode) {
        els.activationCode.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                activateCode();
            }
        });
    }
    
    // Copiar HTML
    if (els.copyHtmlBtn) {
        els.copyHtmlBtn.addEventListener("click", () => {
            const html = els.landingPageContent.innerHTML;
            navigator.clipboard.writeText(html).then(() => {
                showMessage("✅ HTML copiado para a área de transferência!", "success");
            });
        });
    }
    
    // Download
    if (els.downloadBtn) {
        els.downloadBtn.addEventListener("click", () => {
            const html = els.landingPageContent.innerHTML;
            const blob = new Blob([`
                <!DOCTYPE html>
                <html lang="pt">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${els.productName.value || "Landing Page NAGI"}</title>
                    <style>
                        body { 
                            margin: 0; 
                            font-family: 'Segoe UI', system-ui, sans-serif; 
                            background: #f8fafc;
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `], { type: "text/html" });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "landing-page-nagi.html";
            a.click();
            URL.revokeObjectURL(url);
            
            showMessage("✅ Página baixada com sucesso!", "success");
        });
    }
    
    // Views
    const viewButtons = document.querySelectorAll(".btn-view");
    if (viewButtons) {
        viewButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                viewButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                const view = btn.dataset.view;
                const device = document.querySelector(".preview-device");
                
                if (view === "mobile") {
                    device.style.maxWidth = "375px";
                    device.style.margin = "0 auto";
                    device.style.borderRadius = "30px";
                    device.style.border = "10px solid #1f2937";
                } else {
                    device.style.maxWidth = "100%";
                    device.style.margin = "0";
                    device.style.borderRadius = "12px";
                    device.style.border = "none";
                }
            });
        });
    }
    
    // Fechar com ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !els.paymentModal.classList.contains("hidden")) {
            hidePaymentModal();
        }
        
        // Atalho para painel admin: Ctrl+Alt+Shift+A
        if (e.ctrlKey && e.altKey && e.shiftKey && e.key === "A") {
            e.preventDefault();
            showAdminPanel();
        }
    });
    
    // Quando clicar no link PayPal, mostrar instruções
    document.querySelector('.paypal-link-btn')?.addEventListener('click', function(e) {
        showMessage("🔔 Após o pagamento, entre em contato com o administrador para receber seu código de ativação.", "info");
    });
}

// ==================== INICIALIZAÇÃO ====================
function init() {
    console.log("🚀 Inicializando NAGI AUTO PAGES AI...");
    
    // Configurar event listeners
    setupEventListeners();
    
    // Verificar se há usuário salvo na sessão anterior
    const lastUserId = localStorage.getItem('nagi_last_user');
    if (lastUserId) {
        const user = db.getUser(lastUserId);
        if (user) {
            currentUser = user;
            checkUserPlan();
            updateUserInterface();
            
            if (userPlan && db.isPlanActive(currentUser.id)) {
                showMainScreen();
            } else {
                showPaymentModal();
            }
        }
    }
    
    console.log("✅ NAGI AUTO PAGES AI inicializado com sucesso!");
    
    // Adicionar animações CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .paypal-link-btn {
            display: block;
            background: #003087;
            color: white;
            text-decoration: none;
            padding: 18px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .paypal-link-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 48, 135, 0.3);
        }
        
        .paypal-link-btn i {
            font-size: 24px;
        }
    `;
    document.head.appendChild(style);
}

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.handleGoogleSignIn = handleGoogleSignIn;

// ==================== INICIAR APLICAÇÃO ====================
document.addEventListener("DOMContentLoaded", init);