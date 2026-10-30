
/***************************************************************
 * SISTEMA DE ASSINATURAS DIGITAIS - UPA MADUREIRA
 * Arquivo: script.js
 ***************************************************************/


// =============================================================
// 1. CONFIGURAÇÃO
// =============================================================

const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwN9ribuxf9mMdhvU5NPi1aeuQVti3F8lwXOzQaUR_sfvIWvX7aGbFNipk6_cjzm9SbSQ/exec";

const DOCUMENTOS_PERMITIDOS = [
  "Plantão Extra",
  "Solicitação de Transporte"
];

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;


// =============================================================
// 2. INICIALIZAÇÃO
// =============================================================

document.addEventListener("DOMContentLoaded", function () {

  const campoMatricula = document.getElementById("matricula");
  const campoDocumento = document.getElementById("tipoDocumento");
  const canvas = document.getElementById("assinatura");
  const aceite = document.getElementById("aceite");
  const botaoLimpar = document.getElementById("limpar");
  const botaoEnviar = document.getElementById("enviar");
  const campoMensagem = document.getElementById("mensagem");


  // ===========================================================
  // 3. VERIFICAR ELEMENTOS
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
    console.error("Elementos do formulário não encontrados.");
    alert("Erro ao carregar o formulário. Atualize a página.");
    return;
  }


  // ===========================================================
  // 4. VERIFICAR SIGNATURE PAD
  // ===========================================================

  if (typeof SignaturePad === "undefined") {
    console.error("Biblioteca SignaturePad não carregada.");
    alert("Não foi possível carregar o campo de assinatura.");
    return;
  }


  // ===========================================================
  // 5. CONFIGURAR ASSINATURA
  // ===========================================================

  const assinaturaPad = new SignaturePad(canvas, {
    minWidth: 1,
    maxWidth: 2.5,
    penColor: "#000000"
  });


  // ===========================================================
  // 6. AJUSTAR CANVAS
  // ===========================================================

  function ajustarCanvas() {

    const ratio = Math.max(
      window.devicePixelRatio || 1,
      1
    );

    const largura = canvas.offsetWidth;
    const altura = canvas.offsetHeight;

    if (!largura || !altura) return;

    // Preservar o desenho durante o redimensionamento.

    const dadosAnteriores = assinaturaPad.isEmpty()
      ? null
      : assinaturaPad.toData();

    canvas.width = largura * ratio;
    canvas.height = altura * ratio;

    const contexto = canvas.getContext("2d");

    contexto.setTransform(ratio, 0, 0, ratio, 0, 0);

    assinaturaPad.clear();

    if (dadosAnteriores) {
      assinaturaPad.fromData(dadosAnteriores);
    }
  }

  ajustarCanvas();

  window.addEventListener("resize", ajustarCanvas);


  // ===========================================================
  // 7. MENSAGENS
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

    if (botaoEnviar.disabled) return;

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

      console.error("Erro ao gerar assinatura:", erro);

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
    // BLOQUEAR BOTÃO
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

        // Mantemos o mesmo padrão utilizado no Del Castilho.
        // Não definir no-cors nem redirect: manual.
        body: JSON.stringify(dados)

      });


      // -------------------------------------------------------
      // LER RESPOSTA DO SERVIDOR
      // -------------------------------------------------------

      if (!resposta.ok) {

        throw new Error(
          "O servidor respondeu com HTTP " + resposta.status
        );

      }

      const resultado = await resposta.json();

      console.log("Resposta do Apps Script:", resultado);


      // -------------------------------------------------------
      // CONFIRMAR SUCESSO
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
      // TRATAR ERROS
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

});
