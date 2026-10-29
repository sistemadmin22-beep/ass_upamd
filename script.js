// ========================================
// CONFIGURAÇÃO
// ========================================

// URL do Google Apps Script
const URL_SCRIPT =
    "https://script.google.com/macros/s/AKfycbyGvPIuZ-91og6ti_LP22d59zF_czAuuacMEWN0fC-naPc0wsQcNc6n8oRbtYmPpD-7/exec";

// Elementos do formulário
const canvas = document.getElementById("assinatura");
const campoMatricula = document.getElementById("matricula");
const campoDocumento = document.getElementById("tipoDocumento");
const campoAceite = document.getElementById("aceite");

const mensagem = document.getElementById("mensagem");
const botaoLimpar = document.getElementById("limpar");
const botaoEnviar = document.getElementById("enviar");


// ========================================
// MENSAGENS
// ========================================

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = tipo;
}

function limparMensagem() {
    mensagem.textContent = "";
    mensagem.className = "";
}


// ========================================
// INICIALIZAÇÃO DA ASSINATURA
// ========================================

if (typeof SignaturePad === "undefined") {
    mostrarMensagem(
        "Não foi possível carregar a assinatura. Atualize a página.",
        "erro"
    );

    throw new Error("Biblioteca SignaturePad não encontrada.");
}

const signaturePad = new SignaturePad(canvas, {
    minWidth: 1,
    maxWidth: 2.5,
    penColor: "#000000"
});


// ========================================
// AJUSTAR CANVAS
// ========================================

function ajustarCanvas() {
    const proporcao = Math.max(
        window.devicePixelRatio || 1,
        1
    );

    const largura = canvas.offsetWidth;
    const altura = canvas.offsetHeight;

    if (!largura || !altura) {
        return;
    }

    // Guardar a assinatura antes de redimensionar
    const dados = signaturePad.toData();

    canvas.width = Math.round(largura * proporcao);
    canvas.height = Math.round(altura * proporcao);

    const contexto = canvas.getContext("2d");

    contexto.setTransform(
        proporcao,
        0,
        0,
        proporcao,
        0,
        0
    );

    // Restaurar os traços existentes
    signaturePad.clear();

    if (dados.length > 0) {
        signaturePad.fromData(dados);
    }
}

// Ajustar quando a janela mudar de tamanho
window.addEventListener("resize", ajustarCanvas);

// Inicializar após o navegador calcular o layout
window.addEventListener("load", ajustarCanvas);

// Ajuste inicial
requestAnimationFrame(ajustarCanvas);


// ========================================
// BOTÃO LIMPAR
// ========================================

botaoLimpar.addEventListener("click", () => {
    if (botaoEnviar.disabled) {
        return;
    }

    signaturePad.clear();

    campoMatricula.value = "";
    campoDocumento.value = "";
    campoAceite.checked = false;

    limparMensagem();
});


// ========================================
// BOTÃO ENVIAR
// ========================================

botaoEnviar.addEventListener("click", async () => {
    limparMensagem();

    // Evitar envios repetidos
    if (botaoEnviar.disabled) {
        return;
    }

    const matricula = campoMatricula.value.trim();
    const tipoDocumento = campoDocumento.value;
    const aceite = campoAceite.checked;

    // Validar matrícula
    if (matricula === "") {
        mostrarMensagem(
            "⚠️ Informe sua matrícula.",
            "erro"
        );

        campoMatricula.focus();
        return;
    }

    // Validar documento
    if (tipoDocumento === "") {
        mostrarMensagem(
            "⚠️ Selecione o tipo de documento.",
            "erro"
        );

        campoDocumento.focus();
        return;
    }

    // Validar assinatura
    if (signaturePad.isEmpty()) {
        mostrarMensagem(
            "⚠️ Faça sua assinatura antes de enviar.",
            "erro"
        );

        return;
    }

    // Validar declaração
    if (!aceite) {
        mostrarMensagem(
            "⚠️ Confirme a declaração antes de enviar.",
            "erro"
        );

        campoAceite.focus();
        return;
    }

    // Preparar os dados
    const dados = {
        matricula: matricula,
        tipoDocumento: tipoDocumento,
        assinatura: signaturePad.toDataURL("image/png")
    };

    const textoOriginal = botaoEnviar.textContent;

    // Bloquear botões durante o envio
    botaoEnviar.disabled = true;
    botaoLimpar.disabled = true;

    botaoEnviar.textContent = "Enviando...";

    try {
        const resposta = await fetch(URL_SCRIPT, {
            method: "POST",
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            throw new Error(
                "Erro HTTP: " + resposta.status
            );
        }

        const resultado = await resposta.json();

        if (resultado.status === "ok") {
            mostrarMensagem(
                "✅ Assinatura enviada com sucesso!",
                "sucesso"
            );

            // Limpar após confirmação de sucesso
            campoMatricula.value = "";
            campoDocumento.value = "";
            campoAceite.checked = false;

            signaturePad.clear();

        } else {
            mostrarMensagem(
                "❌ O servidor não confirmou o salvamento.",
                "erro"
            );
        }

    } catch (erro) {
        console.error(
            "Erro ao enviar assinatura:",
            erro
        );

        mostrarMensagem(
            "❌ Erro ao enviar. Verifique a conexão e o servidor.",
            "erro"
        );

    } finally {
        // Liberar os botões
        botaoEnviar.disabled = false;
        botaoLimpar.disabled = false;

        botaoEnviar.textContent = textoOriginal;
    }
});
