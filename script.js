
// ========================================
// CONFIGURAÇÃO
// ========================================

// URL DO GOOGLE APPS SCRIPT
// IMPORTANTE: utilizar a URL da implantação
// vinculada à planilha da UPA MADUREIRA.

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwN9ribuxf9mMdhvU5NPi1aeuQVti3F8lwXOzQaUR_sfvIWvX7aGbFNipk6_cjzm9SbSQ/exec";


// ========================================
// ELEMENTOS DO HTML
// ========================================

const canvas = document.getElementById("assinatura");

const campoMatricula = document.getElementById("matricula");

const campoDocumento = document.getElementById("tipoDocumento");

const campoAceite = document.getElementById("aceite");

const mensagem = document.getElementById("mensagem");

const botaoLimpar = document.getElementById("limpar");

const botaoEnviar = document.getElementById("enviar");


// ========================================
// CONFIGURAÇÃO DA ASSINATURA
// ========================================

const signaturePad = new SignaturePad(canvas, {

    minWidth: 1,

    maxWidth: 2.5,

    penColor: "#000000"

});


// ========================================
// AJUSTAR CANVAS
// ========================================

function ajustarCanvas() {

    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    const largura = canvas.offsetWidth;

    const altura = canvas.offsetHeight;

    if (!largura || !altura) {
        return;
    }

    // Evita redimensionamento desnecessário

    const novaLargura = Math.round(largura * ratio);

    const novaAltura = Math.round(altura * ratio);

    if (
        canvas.width === novaLargura &&
        canvas.height === novaAltura
    ) {
        return;
    }

    // Preservar assinatura existente

    const dadosAssinatura = signaturePad.toData();

    // Ajustar resolução do Canvas

    canvas.width = novaLargura;

    canvas.height = novaAltura;

    const contexto = canvas.getContext("2d");

    contexto.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    // Restaurar assinatura

    signaturePad.clear();

    if (dadosAssinatura.length > 0) {

        signaturePad.fromData(dadosAssinatura);

    }

}


// Ajuste inicial

ajustarCanvas();


// Ajustar quando a tela mudar de tamanho

window.addEventListener("resize", ajustarCanvas);


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
// LIMPAR FORMULÁRIO
// ========================================

function limparFormulario() {

    campoMatricula.value = "";

    campoDocumento.value = "";

    campoAceite.checked = false;

    signaturePad.clear();

}


// ========================================
// BOTÃO LIMPAR
// ========================================

botaoLimpar.addEventListener("click", () => {

    limparFormulario();

    limparMensagem();

});


// ========================================
// BOTÃO ENVIAR
// ========================================

botaoEnviar.addEventListener("click", async () => {

    // Evitar cliques repetidos

    if (botaoEnviar.disabled) {
        return;
    }

    limparMensagem();


    // ====================================
    // CAPTURAR DADOS
    // ====================================

    const matricula = campoMatricula.value.trim();

    const tipoDocumento = campoDocumento.value;

    const aceite = campoAceite.checked;


    // ====================================
    // VALIDAR MATRÍCULA
    // ====================================

    if (matricula === "") {

        mostrarMensagem(
            "⚠️ Informe sua matrícula.",
            "erro"
        );

        campoMatricula.focus();

        return;

    }


    // ====================================
    // VALIDAR DOCUMENTO
    // ====================================

    if (tipoDocumento === "") {

        mostrarMensagem(
            "⚠️ Selecione o tipo de documento.",
            "erro"
        );

        campoDocumento.focus();

        return;

    }


    // ====================================
    // VALIDAR ASSINATURA
    // ====================================

    if (signaturePad.isEmpty()) {

        mostrarMensagem(
            "⚠️ Faça sua assinatura antes de enviar.",
            "erro"
        );

        return;

    }


    // ====================================
    // VALIDAR DECLARAÇÃO
    // ====================================

    if (!aceite) {

        mostrarMensagem(
            "⚠️ Você precisa confirmar a declaração.",
            "erro"
        );

        campoAceite.focus();

        return;

    }


    // ====================================
    // CAPTURAR ASSINATURA
    // ====================================

    const assinatura = signaturePad.toDataURL("image/png");


    // ====================================
    // PREPARAR DADOS
    // ====================================

    const dados = {

        matricula: matricula,

        tipoDocumento: tipoDocumento,

        assinatura: assinatura

    };


    // ====================================
    // BLOQUEAR BOTÃO DURANTE O ENVIO
    // ====================================

    botaoEnviar.disabled = true;

    botaoEnviar.textContent = "Enviando...";


    // ====================================
    // ENVIAR PARA GOOGLE APPS SCRIPT
    // ====================================

    try {

        const resposta = await fetch(URL_SCRIPT, {

            method: "POST",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify(dados)

        });


        // Verificar resposta HTTP

        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP: " + resposta.status
            );

        }


        // ====================================
        // INTERPRETAR RESPOSTA DO SERVIDOR
        // ====================================

        const textoResposta = await resposta.text();

        let resultado;

        try {

            resultado = JSON.parse(textoResposta);

        } catch (erro) {

            throw new Error(
                "O servidor não retornou uma resposta JSON válida."
            );

        }


        // ====================================
        // CONFIRMAR SUCESSO
        // ====================================

        if (resultado.status === "ok") {

            mostrarMensagem(
                "✅ Assinatura enviada com sucesso!",
                "sucesso"
            );

            // Limpar os campos após confirmação

            limparFormulario();


        } else {

            mostrarMensagem(
                resultado.mensagem ||
                "❌ Não foi possível registrar a assinatura.",
                "erro"
            );

        }


    } catch (erro) {

        console.error(
            "Erro ao enviar assinatura:",
            erro
        );

        mostrarMensagem(
            "❌ Erro ao conectar com o servidor. Tente novamente.",
            "erro"
        );


    } finally {

        // Liberar botão novamente

        botaoEnviar.disabled = false;

        botaoEnviar.textContent = "Enviar";

    }

});

