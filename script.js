// ==============================
// CONFIGURAÇÃO
// ==============================

// URL do Google Apps Script
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwN9ribuxf9mMdhvU5NPi1aeuQVti3F8lwXOzQaUR_sfvIWvX7aGbFNipk6_cjzm9SbSQ/exec";

// Canvas
const canvas = document.getElementById("assinatura");

// Signature Pad
const signaturePad = new SignaturePad(canvas, {
    minWidth: 1,
    maxWidth: 2.5,
    penColor: "#000000"
});

// ==============================
// AJUSTAR CANVAS
// ==============================

function ajustarCanvas() {

    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;

    canvas.getContext("2d").scale(ratio, ratio);

    signaturePad.clear();

}

window.addEventListener("resize", ajustarCanvas);

ajustarCanvas();


// ==============================
// MENSAGENS
// ==============================

function mostrarMensagem(texto, tipo) {

    const mensagem = document.getElementById("mensagem");

    mensagem.textContent = texto;
    mensagem.className = tipo;

}

function limparMensagem() {

    const mensagem = document.getElementById("mensagem");

    mensagem.textContent = "";
    mensagem.className = "";

}


// ==============================
// BOTÃO LIMPAR
// ==============================

document.getElementById("limpar").addEventListener("click", () => {

    signaturePad.clear();

    document.getElementById("matricula").value = "";

    document.getElementById("tipoDocumento").value = "";

    document.getElementById("aceite").checked = false;

    limparMensagem();

});


// ==============================
// BOTÃO ENVIAR
// ==============================

document.getElementById("enviar").addEventListener("click", async () => {

    limparMensagem();

    const matricula =
        document.getElementById("matricula").value.trim();

    const tipoDocumento =
        document.getElementById("tipoDocumento").value;

    const aceite =
        document.getElementById("aceite").checked;


    // ==============================
    // VALIDAR MATRÍCULA
    // ==============================

    if (matricula === "") {

        mostrarMensagem(
            "⚠️ Informe sua matrícula.",
            "erro"
        );

        return;
    }


    // ==============================
    // VALIDAR TIPO DE DOCUMENTO
    // ==============================

    if (tipoDocumento === "") {

        mostrarMensagem(
            "⚠️ Selecione o tipo de documento.",
            "erro"
        );

        return;
    }


    // ==============================
    // VALIDAR ASSINATURA
    // ==============================

    if (signaturePad.isEmpty()) {

        mostrarMensagem(
            "⚠️ Faça sua assinatura antes de enviar.",
            "erro"
        );

        return;
    }


    // ==============================
    // VALIDAR DECLARAÇÃO
    // ==============================

    if (!aceite) {

        mostrarMensagem(
            "⚠️ Você precisa confirmar a declaração.",
            "erro"
        );

        return;
    }


    // ==============================
    // PEGAR ASSINATURA
    // ==============================

    const assinatura =
        signaturePad.toDataURL("image/png");


    // ==============================
    // PREPARAR DADOS
    // ==============================

    const dados = {

        matricula: matricula,

        tipoDocumento: tipoDocumento,

        assinatura: assinatura

    };


    // ==============================
    // ENVIAR PARA O GOOGLE APPS SCRIPT
    // ==============================

    try {

        const resposta = await fetch(URL_SCRIPT, {

            method: "POST",

            body: JSON.stringify(dados)

        });


        const resultado =
            await resposta.json();


        // ==============================
        // SUCESSO
        // ==============================

        if (resultado.status === "ok") {

            mostrarMensagem(
                "✅ Assinatura enviada com sucesso!",
                "sucesso"
            );


            // Limpar formulário

            document.getElementById("matricula").value = "";

            document.getElementById("tipoDocumento").value = "";

            document.getElementById("aceite").checked = false;

            signaturePad.clear();


        } else {

            mostrarMensagem(
                "❌ O servidor retornou um erro.",
                "erro"
            );

        }


    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "❌ Erro ao conectar com o servidor.",
            "erro"
        );

    }

});
