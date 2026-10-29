// ========================================
// CONFIGURAÇÃO
// ========================================

const URL_SCRIPT =
    "https://script.google.com/macros/s/AKfycbyGvPIuZ-91og6ti_LP22d59zF_czAuuacMEWN0fC-naPc0wsQcNc6n8oRbtYmPpD-7/exec";

const canvas = document.getElementById("assinatura");
const campoMatricula = document.getElementById("matricula");
const campoDocumento = document.getElementById("tipoDocumento");
const campoAceite = document.getElementById("aceite");
const mensagem = document.getElementById("mensagem");
const botaoLimpar = document.getElementById("limpar");
const botaoEnviar = document.getElementById("enviar");

// Verificar se a biblioteca foi carregada
if (typeof SignaturePad === "undefined") {
    mostrarMensagem(
        "Erro ao carregar a assinatura. Atualize a página.",
        "erro"
    );
    throw new Error("SignaturePad não foi carregado.");
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

    if (!largura || !altura) return;

    // Guardar a assinatura antes de redimensionar
    const dados = signaturePad.toData();

    canvas.width = Math.round(largura * proporcao);
    canvas.height = Math.round(altura * proporcao);

    const contexto = canvas.getContext("2d");
    contexto.setTransform(proporcao, 0, 0, proporcao, 0, 0);

    // Restaurar os traços
    signaturePad.clear();

    if (dados.length > 0) {
        signaturePad.fromData(dados);
    }
}

window.addEventListener("resize", ajustarCanvas);

// Inicializar após o navegador calcular o layout
window.addEventListener("load", ajustarCanvas);


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
// BOTÃO LIMPAR
// ========================================

botaoLimpar.addEventListener("click", () => {
    if (botaoEnviar.disabled) return;

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

    if (botaoEnviar.disabled) return;

    const matricula = campoMatricula.value.trim();
    const tipoDocumento = campoDocumento.value;
    const aceite = campoAceite.checked;

    if (!matricula) {
        mostrarMensagem("⚠️ Informe sua matrícula.", "erro");
        campoMatricula.focus();
        return;
    }

    if (!tipoDocumento) {
        mostrarMensagem(
            "⚠️ Selecione o tipo de documento.",
            "erro"
        );
        campoDocumento.focus();
        return;
    }

    if (signaturePad.isEmpty()) {
        mostrarMensagem(
            "⚠️ Faça sua assinatura antes de enviar.",
            "erro"
        );
        return;
    }

    if (!aceite) {
        mostrarMensagem(
            "⚠️ Confirme a declaração antes de enviar.",
            "erro"
        );
        campoAceite.focus();
        return;
    }

    const dados = {
        matricula: matricula,
        tipoDocumento: tipoDocumento,
        assinatura: signaturePad.toDataURL("image/png")
    };

    const textoOriginal = botaoEnviar.textContent;

    botaoEnviar.disabled = true;
    botaoLimpar.disabled = true;
    botaoEnviar.textContent = "Enviando...";

    try {
        const resposta = await fetch(URL_SCRIPT, {
            method: "POST",
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            throw new Error("Erro HTTP: " + resposta.status);
        }

        const resultado = await resposta.json();

        if (resultado.status === "ok") {
            mostrarMensagem(
                "✅ Assinatura enviada com sucesso!",
                "sucesso"
            );

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
        console.error("Erro no envio:", erro);

        mostrarMensagem(
            "❌ Erro ao enviar. Verifique a conexão e o servidor.",
            "erro"
        );

    } finally {
        botaoEnviar.disabled = false;
        botaoLimpar.disabled = false;
        botaoEnviar.textContent = textoOriginal;
    }
});
