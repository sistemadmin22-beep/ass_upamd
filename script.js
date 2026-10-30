
/***************************************************************
 * SISTEMA DE ASSINATURAS DIGITAIS - UPA MADUREIRA
 * Arquivo: script.js
 ***************************************************************/


// =============================================================
// 1. CONFIGURAÇÕES
// =============================================================

const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwN9ribuxf9mMdhvU5NPi1aeuQVti3F8lwXOzQaUR_sfvIWvX7aGbFNipk6_cjzm9SbSQ/exec";

const DOCUMENTOS_PERMITIDOS = [
  "Plantão Extra",
  "Solicitação de Transporte"
];

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;


// =============================================================
// 2. INICIALIZAÇÃO SEGURA
// =============================================================

function iniciarFormulario() {

  console.log("Iniciando formulário de assinatura...");

  const campoMatricula = document.getElementById("matricula");
  const campoDocumento = document.getElementById("tipoDocumento");
  const canvas = document.getElementById("assinatura");
  const aceite = document.getElementById("aceite");
  const botaoLimpar = document.getElementById("limpar");
  const botaoEnviar = document.getElementById("enviar");
  const campoMensagem = document.getElementById("mensagem");


  // ===========================================================
  // 3. VERIFICAR ELEMENTOS DO HTML
  // ===========================================================

  if (
    !campoMatricula ||
    !campoDocumento ||
    !canvas ||
    !aceite ||
    !botaoLimpar ||
    !botaoEnviar ||
    !campoMensagem
  ) {

    console.error(
      "Erro: um ou mais elementos do formulário não foram encontrados."
    );

    alert(
      "Erro ao carregar o formulário. Atualize a página."
    );

    return;
  }


  // ===========================================================
  // 4. VERIFICAR BIBLIOTECA SIGNATURE PAD
  // ===========================================================

  if (typeof SignaturePad === "undefined") {

    console.error(
      "Erro: a biblioteca SignaturePad não foi carregada."
    );

    alert(
      "Não foi possível carregar a ferramenta de assinatura. Atualize a página."
    );

    return;
  }


  // ===========================================================
  // 5. CONFIGURAR CANVAS
  // ===========================================================

  // A altura visual é controlada exclusivamente pelo CSS.
  // O JavaScript ajusta apenas a resolução interna do canvas.

  canvas.style.touchAction = "none";

  const assinaturaPad = new SignaturePad(canvas, {

    minWidth: 1,
    maxWidth: 2.5,
    penColor: "#000000"

  });


  // ===========================================================
  // 6. AJUSTAR RESOLUÇÃO DO CANVAS
  // ===========================================================

  function ajustarCanvas() {

    const largura = canvas.getBoundingClientRect().width;
    const altura = canvas.getBoundingClientRect().height;

    if (largura <= 0 || altura <= 0) {
      console.warn("Canvas ainda não possui dimensões válidas.");
      return;
    }

    const ratio = Math.max(
      window.devicePixelRatio || 1,
      1
    );

    // Preservar assinatura existente.
    const dadosAnteriores = assinaturaPad.isEmpty()
      ? null
      : assinaturaPad.toData();

    // Ajustar resolução interna.
    canvas.width = Math.round(largura * ratio);
    canvas.height = Math.round(altura * ratio);

    const contexto = canvas.getContext("2d");

    if (!contexto) {
      console.error("Não foi possível acessar o contexto do canvas.");
      return;
    }

    // Ajustar escala para telas de alta resolução.
    contexto.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );

    // Limpar e restaurar os dados anteriores.
    assinaturaPad.clear();

    if (dadosAnteriores && dadosAnteriores.length > 0) {
      assinaturaPad.fromData(dadosAnteriores);
    }

    console.log("Canvas ajustado:", {
      largura: largura,
      altura: altura,
      resolucao: ratio
    });

  }


  // Ajustar após o navegador calcular o layout.
  requestAnimationFrame(function () {
    ajustarCanvas();
  });


  // Reajustar quando a janela mudar de tamanho.
  window.addEventListener("resize", function () {

    requestAnimationFrame(function () {
      ajustarCanvas();
    });

  });


  // ===========================================================
  // 7. MENSAGENS DO FORMULÁRIO
  // ===========================================================

  function mostrarMensagem(texto, tipo) {

    campoMensagem.textContent = texto;
    campoMensagem.className = tipo;

  }


  function limparMensagem() {

    campoMensagem.textContent = "";
    campoMensagem.className = "";

  }


  // ===========================================================
  // 8. LIMPAR FORMULÁRIO
  // ===========================================================

  function limparFormulario() {

    campoMatricula.value = "";
    campoDocumento.value = "";
    aceite.checked = false;

    assinaturaPad.clear();

  }


  // ===========================================================
  // 9. BOTÃO LIMPAR
  // ===========================================================

  botaoLimpar.addEventListener("click", function (evento) {

    evento.preventDefault();

    limparFormulario();
    limparMensagem();

    campoMatricula.focus();

  });


  // ===========================================================
  // 10. BOTÃO ENVIAR
  // ===========================================================

  botaoEnviar.addEventListener("click", async function (evento) {

    evento.preventDefault();

    if (botaoEnviar.disabled) {
      return;
    }

    limparMensagem();


    // ---------------------------------------------------------
    // VALIDAR MATRÍCULA
    // ---------------------------------------------------------

    const matricula = campoMatricula.value.trim();

    if (matricula === "") {

      mostrarMensagem(
        "⚠️ Informe sua matrícula.",
        "erro"
      );

      campoMatricula.focus();
      return;
    }


    // ---------------------------------------------------------
    // VALIDAR DOCUMENTO
    // ---------------------------------------------------------

    const tipoDocumento = campoDocumento.value;

    if (tipoDocumento === "") {

      mostrarMensagem(
        "⚠️ Selecione o tipo de documento.",
        "erro"
      );

      campoDocumento.focus();
      return;
    }

    if (!DOCUMENTOS_PERMITIDOS.includes(tipoDocumento)) {

      mostrarMensagem(
        "⚠️ Tipo de documento inválido.",
        "erro"
      );

      campoDocumento.focus();
      return;
    }


    // ---------------------------------------------------------
    // VALIDAR ASSINATURA
    // ---------------------------------------------------------

    if (assinaturaPad.isEmpty()) {

      mostrarMensagem(
        "⚠️ Faça sua assinatura antes de enviar.",
        "erro"
      );

      return;
    }


    // ---------------------------------------------------------
    // VALIDAR ACEITE
    // ---------------------------------------------------------

    if (!aceite.checked) {

      mostrarMensagem(
        "⚠️ Você precisa confirmar a declaração.",
        "erro"
      );

      aceite.focus();
      return;
    }


    // ---------------------------------------------------------
    // GERAR IMAGEM DA ASSINATURA
    // ---------------------------------------------------------

    let assinatura;

    try {

      assinatura = assinaturaPad.toDataURL("image/png");

    } catch (erro) {

      console.error(
        "Erro ao gerar imagem da assinatura:",
        erro
      );

      mostrarMensagem(
        "❌ Não foi possível preparar a assinatura.",
        "erro"
      );

      return;
    }


    // ---------------------------------------------------------
    // VALIDAR IMAGEM
    // ---------------------------------------------------------

    const prefixo = "data:image/png;base64,";

    if (!assinatura.startsWith(prefixo)) {

      mostrarMensagem(
        "❌ A imagem da assinatura é inválida.",
        "erro"
      );

      return;
    }

    const base64 = assinatura.substring(prefixo.length);

    const tamanhoImagem = Math.floor(
      base64.length * 3 / 4
    );

    if (tamanhoImagem > TAMANHO_MAXIMO_BYTES) {

      mostrarMensagem(
        "❌ A imagem ultrapassou o limite de 5 MB.",
        "erro"
      );

      return;
    }


    // ---------------------------------------------------------
    // PREPARAR DADOS
    // ---------------------------------------------------------

    const dados = {

      matricula: matricula,

      tipoDocumento: tipoDocumento,

      assinatura: assinatura

    };


    // ---------------------------------------------------------
    // BLOQUEAR BOTÃO DURANTE O ENVIO
    // ---------------------------------------------------------

    const textoOriginal = botaoEnviar.textContent;

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "Enviando...";

    mostrarMensagem(
      "Enviando assinatura...",
      "normal"
    );


    // =========================================================
    // 11. ENVIAR AO GOOGLE APPS SCRIPT
    // =========================================================

    try {

      const resposta = await fetch(URL_SCRIPT, {

        method: "POST",

        body: JSON.stringify(dados)

      });


      // -------------------------------------------------------
      // VERIFICAR RESPOSTA HTTP
      // -------------------------------------------------------

      if (!resposta.ok) {

        throw new Error(
          "O servidor respondeu com HTTP " + resposta.status
        );

      }


      // -------------------------------------------------------
      // LER RESPOSTA DO SERVIDOR
      // -------------------------------------------------------

      const resultado = await resposta.json();

      console.log(
        "Resposta do Apps Script:",
        resultado
      );


      // -------------------------------------------------------
      // CONFIRMAR RESULTADO
      // -------------------------------------------------------

      if (resultado.status === "ok") {

        limparFormulario();

        mostrarMensagem(
          "☑ Assinatura enviada com sucesso!",
          "sucesso"
        );

        campoMatricula.focus();

      } else {

        console.error(
          "O Apps Script retornou um erro:",
          resultado
        );

        mostrarMensagem(
          resultado.mensagem ||
          "❌ O servidor não confirmou o recebimento da assinatura.",
          "erro"
        );

      }


    } catch (erro) {

      // -------------------------------------------------------
      // TRATAR ERROS DE ENVIO
      // -------------------------------------------------------

      console.error(
        "Erro ao enviar assinatura:",
        erro
      );

      mostrarMensagem(
        "❌ Não foi possível confirmar o envio da assinatura. " +
        "Tente novamente ou entre em contato com o RH.",
        "erro"
      );


    } finally {

      // -------------------------------------------------------
      // RESTAURAR BOTÃO
      // -------------------------------------------------------

      botaoEnviar.disabled = false;
      botaoEnviar.textContent = textoOriginal;

    }

  });


  console.log("Formulário inicializado com sucesso.");

}


// =============================================================
// 12. EXECUTAR INICIALIZAÇÃO
// =============================================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarFormulario,
    { once: true }
  );

} else {

  iniciarFormulario();

}
