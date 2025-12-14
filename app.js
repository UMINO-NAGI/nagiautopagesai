// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
    GOOGLE_CLIENT_ID: "225104795498-n1j744vsopftf38hnf8oecona7eqkojr.apps.googleusercontent.com",
    PAYPAL_LINK: "https://www.paypal.com/ncp/payment/QNS8AAHSEPVG8",
    PLAN_PRICE: "10.00",
    CURRENCY: "USD"
};

// ==================== ESTADO DA APLICAÇÃO ====================
let currentUser = null;
let userHasPaid = false;
let activationCodes = ["123456", "654321", "789012"]; // Códigos de exemplo
let pagesCreated = JSON.parse(localStorage.getItem("nagi_pages") || "[]");

// ==================== ELEMENTOS DO DOM ====================
const els = {
    // Telas
    loginScreen: document.getElementById("login-screen"),
    mainScreen: document.getElementById("main-screen"),
    
    // Login
    googleSignInContainer: document.querySelector(".google-signin-container"),
    
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
    productType: document.getElementById("product-type"),
    productName: document.getElementById("product-name"),
    targetAudience: document.getElementById("target-audience"),
    productDescription: document.getElementById("product-description"),
    pageStyle: document.getElementById("page-style"),
    pagesCreated: document.getElementById("pages-created"),
    
    // Preview
    landingPageContent: document.getElementById("landing-page-content"),
    copyHtmlBtn: document.getElementById("copy-html-btn"),
    downloadBtn: document.getElementById("download-btn"),
    shareBtn: document.getElementById("share-btn"),
    
    // Modal de pagamento
    paymentModal: document.getElementById("payment-modal"),
    closeModal: document.querySelector(".close-modal"),
    activationCode: document.getElementById("activation-code"),
    activateCodeBtn: document.getElementById("activate-code-btn"),
    codeStatus: document.getElementById("code-status"),
    
    // Histórico
    historySection: document.getElementById("history-section"),
    pagesList: document.getElementById("pages-list"),
    
    // Views
    viewButtons: document.querySelectorAll(".btn-view")
};

// ==================== AUTENTICAÇÃO GOOGLE ====================
function handleGoogleSignIn(response) {
    try {
        const credential = response.credential;
        const payload = JSON.parse(atob(credential.split('.')[1]));
        
        currentUser = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };
        
        // Verificar se usuário tem plano ativo
        const userPlan = localStorage.getItem(`nagi_plan_${currentUser.id}`);
        userHasPaid = userPlan === "active";
        
        // Atualizar interface
        updateUserInterface();
        
        if (userHasPaid) {
            showMainScreen();
        } else {
            showPaymentModal();
        }
        
    } catch (error) {
        console.error("Erro no login Google:", error);
        showMessage("Erro no login. Tente novamente.", "error");
    }
}

function logout() {
    currentUser = null;
    userHasPaid = false;
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
    initPayPalButton();
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
    if (els.userAvatar && currentUser.picture) {
        els.userAvatar.src = currentUser.picture;
    }
    
    // Status do plano
    if (els.planBadge) {
        if (userHasPaid) {
            els.planBadge.innerHTML = '<i class="fas fa-crown"></i> Plano Ativo';
            els.planBadge.style.background = "linear-gradient(135deg, #10b981, #34d399)";
        } else {
            els.planBadge.innerHTML = '<i class="fas fa-lock"></i> Plano Inativo';
            els.planBadge.style.background = "linear-gradient(135deg, #ef4444, #f87171)";
        }
    }
    
    // Contador de páginas
    if (els.pagesCreated) {
        const userPages = pagesCreated.filter(p => p.userId === currentUser.id);
        els.pagesCreated.textContent = userPages.length;
    }
}

// ==================== PAYPAL ====================
function initPayPalButton() {
    if (!window.paypal) {
        console.error("PayPal SDK não carregado");
        return;
    }
    
    paypal.Buttons({
        style: {
            shape: 'pill',
            color: 'blue',
            layout: 'vertical',
            label: 'pay'
        },
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: CONFIG.PLAN_PRICE,
                        currency_code: CONFIG.CURRENCY
                    },
                    description: "NAGI AUTO PAGES AI - Plano Vitalício"
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                showMessage("✅ Pagamento realizado! Verifique seu email para o código de ativação.", "success");
                
                // Em produção, aqui você enviaria o código por email
                // Para demo, geramos um código localmente
                setTimeout(() => {
                    const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
                    showMessage(`Seu código de ativação: ${demoCode}`, "info");
                }, 1000);
            });
        },
        onError: function(err) {
            console.error("Erro no PayPal:", err);
            showMessage("❌ Erro no pagamento. Tente novamente.", "error");
        }
    }).render('#paypal-button-container');
}

// ==================== ATIVAÇÃO DE CÓDIGO ====================
function activateCode() {
    const code = els.activationCode.value.trim();
    
    if (!code || code.length !== 6) {
        showMessage("Digite um código válido de 6 dígitos", "error");
        return;
    }
    
    // Verificar código (em produção, isso seria feito no backend)
    if (activationCodes.includes(code)) {
        userHasPaid = true;
        localStorage.setItem(`nagi_plan_${currentUser.id}`, "active");
        
        // Remover código usado
        const index = activationCodes.indexOf(code);
        activationCodes.splice(index, 1);
        
        updateUserInterface();
        hidePaymentModal();
        showMainScreen();
        showMessage("✅ Plano ativado com sucesso! Agora você pode criar páginas ilimitadas.", "success");
    } else {
        showMessage("❌ Código inválido. Verifique e tente novamente.", "error");
    }
}

// ==================== GERADOR DE PÁGINAS ====================
function generateLandingPage() {
    if (!userHasPaid) {
        showMessage("❌ Você precisa ativar seu plano primeiro.", "error");
        showPaymentModal();
        return;
    }
    
    const productData = {
        type: els.productType.value,
        name: els.productName.value.trim(),
        audience: els.targetAudience.value.trim(),
        description: els.productDescription.value.trim(),
        style: els.pageStyle.value,
        date: new Date().toISOString()
    };
    
    if (!productData.name || !productData.description) {
        showMessage("❌ Preencha o nome e descrição do produto.", "error");
        return;
    }
    
    // Gerar HTML da landing page
    const htmlContent = generatePageHTML(productData);
    
    // Atualizar preview
    els.landingPageContent.innerHTML = htmlContent;
    
    // Salvar página
    savePage(productData, htmlContent);
    
    showMessage("✅ Landing page gerada com sucesso!", "success");
}

function generatePageHTML(data) {
    const styles = {
        modern: { bg: "#f8fafc", color: "#1e293b", accent: "#4f46e5" },
        bold: { bg: "#1e293b", color: "#f1f5f9", accent: "#f59e0b" },
        elegant: { bg: "#fefce8", color: "#451a03", accent: "#d97706" },
        minimal: { bg: "#ffffff", color: "#374151", accent: "#059669" }
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
                background: linear-gradient(135deg, ${style.accent}, ${style.color});
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
            
            <!-- Testimonials -->
            <section style="padding: 60px 40px; text-align: center;">
                <h2 style="font-size: 32px; margin-bottom: 40px;">
                    O que nossos clientes dizem:
                </h2>
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                    max-width: 1000px;
                    margin: 0 auto;
                ">
                    <div style="
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                        text-align: left;
                    ">
                        <p style="font-style: italic; margin-bottom: 20px;">
                            "Esta landing page aumentou minhas vendas em 300% em uma semana!"
                        </p>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="
                                width: 50px;
                                height: 50px;
                                background: ${style.accent};
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-weight: bold;
                            ">
                                MS
                            </div>
                            <div>
                                <strong>Maria Silva</strong>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    Empreendedora Digital
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                        text-align: left;
                    ">
                        <p style="font-style: italic; margin-bottom: 20px;">
                            "Consegui lançar meu produto em tempo recorde. O melhor investimento!"
                        </p>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="
                                width: 50px;
                                height: 50px;
                                background: ${style.accent};
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-weight: bold;
                            ">
                                JP
                            </div>
                            <div>
                                <strong>João Pedro</strong>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    Fundador de Startup
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Final CTA -->
            <section style="
                background: linear-gradient(135deg, ${style.accent}, ${style.color});
                color: white;
                padding: 60px 40px;
                text-align: center;
                border-radius: 0 0 16px 16px;
            ">
                <h2 style="font-size: 36px; margin-bottom: 20px;">
                    Pronto para transformar seu negócio?
                </h2>
                <p style="font-size: 18px; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">
                    Junte-se a milhares de empreendedores que já estão vendendo mais com nossas landing pages.
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
                    QUERO VENDER AGORA!
                </button>
                <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                    ⚡ Oferta especial por tempo limitado • 🛡️ 7 dias de garantia
                </p>
            </section>
            
            <!-- Footer -->
            <footer style="
                background: ${style.color};
                color: ${style.bg};
                padding: 30px 40px;
                text-align: center;
                font-size: 14px;
            ">
                <p style="margin: 0 0 10px 0;">
                    © 2024 ${data.name}. Todos os direitos reservados.
                </p>
                <p style="margin: 0; opacity: 0.7;">
                    Desenvolvido com ❤️ pela NAGI TECHNOLOGY S.A. • UMINO NAGI - I WAS HERE🍀
                </p>
            </footer>
        </div>
    `;
}

// ==================== SALVAR E CARREGAR DADOS ====================
function savePage(data, html) {
    const page = {
        id: Date.now(),
        userId: currentUser.id,
        ...data,
        html: html,
        createdAt: new Date().toLocaleString()
    };
    
    pagesCreated.push(page);
    localStorage.setItem("nagi_pages", JSON.stringify(pagesCreated));
    
    updatePageCounter();
    addToHistory(page);
}

function loadUserData() {
    updateUserInterface();
    updatePageCounter();
    loadHistory();
}

function updatePageCounter() {
    if (!currentUser) return;
    
    const userPages = pagesCreated.filter(p => p.userId === currentUser.id);
    if (els.pagesCreated) {
        els.pagesCreated.textContent = userPages.length;
    }
}

// ==================== HISTÓRICO ====================
function loadHistory() {
    if (!currentUser) return;
    
    const userPages = pagesCreated.filter(p => p.userId === currentUser.id);
    
    if (userPages.length > 0) {
        els.historySection.classList.remove("hidden");
        els.pagesList.innerHTML = userPages.map(page => `
            <div class="page-item">
                <h4>${page.name}</h4>
                <p>${page.description.substring(0, 100)}...</p>
                <div class="page-date">
                    <i class="fas fa-calendar"></i>
                    ${page.createdAt}
                </div>
            </div>
        `).join('');
    } else {
        els.historySection.classList.add("hidden");
    }
}

function addToHistory(page) {
    els.historySection.classList.remove("hidden");
    
    const pageElement = document.createElement("div");
    pageElement.className = "page-item";
    pageElement.innerHTML = `
        <h4>${page.name}</h4>
        <p>${page.description.substring(0, 100)}...</p>
        <div class="page-date">
            <i class="fas fa-calendar"></i>
            ${page.createdAt}
        </div>
    `;
    
    els.pagesList.prepend(pageElement);
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
        background: ${type === "error" ? "#ef4444" : type === "success" ? "#10b981" : "#3b82f6"};
        color: white;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(statusEl);
    
    setTimeout(() => {
        statusEl.style.animation = "slideOut 0.3s ease";
        setTimeout(() => statusEl.remove(), 300);
    }, 3000);
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
                    <title>${els.productName.value || "Landing Page"}</title>
                    <style>
                        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
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
    if (els.viewButtons) {
        els.viewButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                els.viewButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                const view = btn.dataset.view;
                const device = document.querySelector(".preview-device");
                
                if (view === "mobile") {
                    device.style.maxWidth = "375px";
                    device.style.margin = "0 auto";
                } else {
                    device.style.maxWidth = "100%";
                    device.style.margin = "0";
                }
            });
        });
    }
    
    // Fechar com ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !els.paymentModal.classList.contains("hidden")) {
            hidePaymentModal();
        }
    });
}

// ==================== INICIALIZAÇÃO ====================
function init() {
    console.log("🚀 Inicializando NAGI AUTO PAGES AI...");
    
    // Verificar se usuário já está logado
    const savedUser = localStorage.getItem("nagi_user");
    const savedPlan = localStorage.getItem("nagi_plan");
    
    if (savedUser && savedPlan === "active") {
        currentUser = JSON.parse(savedUser);
        userHasPaid = true;
        showMainScreen();
    } else {
        showLoginScreen();
    }
    
    // Configurar event listeners
    setupEventListeners();
    
    console.log("✅ NAGI AUTO PAGES AI inicializado com sucesso!");
}

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.handleGoogleSignIn = handleGoogleSignIn;

// ==================== INICIAR APLICAÇÃO ====================
document.addEventListener("DOMContentLoaded", init);