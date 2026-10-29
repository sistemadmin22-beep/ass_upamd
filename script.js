javascript
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
const botaoLimpar = document.getElementById("limpar");
const botaoEnviar = document.getElementById("enviar");
const mensagem = document.getElementById("mensagem");

// Verificar se a biblioteca de assinatura foi carregada
if (typeof SignaturePad === "undefined") {
    mostrarMensagem(
        "Não foi possível carregar a área de assinatura. Atualize a página.",
        "erro"
    );

    throw new Error("Biblioteca SignaturePad não encontrada.");
}


// ========================================
// CONFIGURAÇÃO DA ASSINATURA
// ========================================

const assinaturaPad = new SignaturePad(canvas, {
    minWidth: 1,
    maxWidth: 2.5,
    penColor: "#000000",
    backgroundColor: "#ffffff"
});


// ========================================
// AJUSTAR CANVAS
// Preserva a assinatura ao redimensionar
// ========================================

function ajustarCanvas() {
    // Guardar os traços existentes antes do redimensionamento
    const dadosAnteriores = assinaturaPad.toData();

    const proporcao = Math.max(
        window.devicePixelRatio || 1,
        1
    );

    const largura = canvas.offsetWidth;
    const altura = canvas.offsetHeight;

    if (!largura || !altura) {
        return;
    }

    // Evitar redimensionamentos desnecessários
    if (
        canvas.width === Math.round(largura * proporcao) &&
        canvas.height === Math.round(altura * proporcao)
    ) {
        return;
    }

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

    // Restaurar os traços se já existir uma assinatura
    assinaturaPad.clear();

    if (dadosAnteriores.length > 0) {
        assinaturaPad.fromData(dadosAnteriores);
    }
}

window.addEventListener("resize", ajustarCanvas);

// Ajustar depois que a página for carregada
requestAnimationFrame(ajustarCanvas);


// ========================================
// MENSAGENS DO SISTEMA
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
// LIMPAR FORMULÁRIO
// ========================================

function limparFormulario() {
    campoMatricula.value = "";
    campoDocumento.value = "";
    campoAceite.checked = false;

    assinaturaPad.clear();

    limparMensagem();
}

botaoLimpar.addEventListener("click", () => {
    // Não limpar enquanto houver um envio em andamento
    if (botaoEnviar.disabled) {
        return;
    }

    limparFormulario();
});


// ========================================
// VALIDAR FORMULÁRIO
// ========================================

function validarFormulario() {
    const matricula = campoMatricula.value.trim();
    const tipoDocumento = campoDocumento.value;
    const aceite = campoAceite.checked;

    if (!matricula) {
        mostrarMensagem(
            "⚠️ Informe sua matrícula.",
            "erro"
        );

        campoMatricula.focus();
        return false;
    }

    if (!tipoDocumento) {
        mostrarMensagem(
            "⚠️ Selecione o tipo de documento.",
            "erro"
        );

        campoDocumento.focus();
        return false;
    }

    if (assinaturaPad.isEmpty()) {
        mostrarMensagem(
            "⚠️ Faça sua assinatura antes de enviar.",
            "erro"
        );

        return false;
    }

    if (!aceite) {
        mostrarMensagem(
            "⚠️ Confirme a declaração antes de enviar.",
            "erro"
        );

        campoAceite.focus();
        return false;
    }

    return true;
}


// ========================================
// ENVIAR ASSINATURA
// ========================================

botaoEnviar.addEventListener("click", async () => {
    limparMensagem();

    // Impedir envio duplicado
    if (botaoEnviar.disabled) {
        return;
    }

    // Validar os campos
    if (!validarFormulario()) {
        return;
    }

    // Preparar os dados
    const dados = {
        matricula: campoMatricula.value.trim(),
        tipoDocumento: campoDocumento.value,
        assinatura: assinaturaPad.toDataURL("image/png")
    };

    // Bloquear os botões durante o envio
    botaoEnviar.disabled = true;
    botaoLimpar.disabled = true;

    const textoOriginal = botaoEnviar.textContent;
    botaoEnviar.textContent = "Enviando...";

    try {
        const resposta = await fetch(URL_SCRIPT, {
            method: "POST",

            // Mantém o envio JSON sem solicitar
            // cabeçalhos adicionais que provoquem preflight.
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) {
            throw new Error(
                `O servidor respondeu com HTTP ${resposta.status}.`
            );
        }

        const textoResposta = await resposta.text();

        let resultado;

        try {
            resultado = JSON.parse(textoResposta);
        } catch {
            throw new Error(
                "O servidor não retornou uma resposta JSON válida."
            );
        }

        if (resultado.status === "ok") {
            mostrarMensagem(
                "✅ Assinatura enviada com sucesso!",
                "sucesso"
            );

            // Limpar somente após confirmação do servidor
            campoMatricula.value = "";
            campoDocumento.value = "";
            campoAceite.checked = false;
            assinaturaPad.clear();

        } else {
            const detalhe =
                typeof resultado.message === "string"
                    ? resultado.message
                    : "";

            mostrarMensagem(
                detalhe
                    ? `❌ Não foi possível salvar: ${detalhe}`
                    : "❌ O servidor não confirmou o salvamento da assinatura.",
                "erro"
            );
        }

    } catch (erro) {
        console.error(
            "Erro ao enviar assinatura:",
            erro
        );

        mostrarMensagem(
            "❌ Não foi possível confirmar o envio. Verifique sua conexão antes de tentar novamente.",
            "erro"
        );

    } finally {
        // Liberar os botões
        botaoEnviar.disabled = false;
        botaoLimpar.disabled = false;

        botaoEnviar.textContent = textoOriginal;
    }
});
