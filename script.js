
/***************************************************************
 * SISTEMA DE ASSINATURAS DIGITAIS - UPA MADUREIRA
 * Arquivo: script.js
 ***************************************************************/


/***************************************************************
 * 1. ENDEREÇO DA IMPLANTAÇÃO DO APPS SCRIPT
 ***************************************************************/

const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwN9ribuxf9mMdhvU5NPi1aeuQVti3F8lwXOzQaUR_sfvIWvX7aGbFNipk6_cjzm9SbSQ/exec";


/***************************************************************
 * 2. CONFIGURAÇÕES
 ***************************************************************/

const DOCUMENTOS_PERMITIDOS = [
  "Plantão Extra",
  "Solicitação de Transporte"
];

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;


/***************************************************************
 * 3. INICIALIZAÇÃO DO FORMULÁRIO
 ***************************************************************/

document.addEventListener("DOMContentLoaded", function () {

  const campoMatricula = document.getElementById("matricula");
  const campoDocumento = document.getElementById("tipoDocumento");
  const canvas = document.getElementById("assinatura");
  const aceite = document.getElementById("aceite");
  const botaoLimpar = document.getElementById("limpar");
  const botaoEnviar = document.getElementById("enviar");
  const campoMensagem = document.getElementById("mensagem");


  /*************************************************************
   * 4. VERIFICAR ELEMENTOS DO FORMULÁRIO
   *************************************************************/

  if (
    !campoMatricula ||
    !campoDocumento ||
    !canvas ||
    !aceite ||
    !botaoLimpar ||
    !botaoEnviar
  ) {

    console.error(
      "Um ou mais elementos do formulário não foram encontrados."
    );

    alert("Erro ao carregar o formulário. Atualize a página.");

    return;
  }


  /*************************************************************
   * 5. VERIFICAR BIBLIOTECA DE ASSINATURA
   *************************************************************/

  if (typeof SignaturePad === "undefined") {

    console.error("Biblioteca SignaturePad não carregada.");

    alert(
      "Não foi possível carregar o campo de assinatura. " +
      "Atualize a página e tente novamente."
    );

    return;
  }


  /*************************************************************
   * 6. CONFIGURAR CAMPO DE ASSINATURA
   *************************************************************/

  const assinaturaPad = new SignaturePad(canvas, {
    minWidth: 1,
    maxWidth: 2.5,
    penColor: "black"
  });


  /*************************************************************
   * 7. AJUSTAR CANVAS PARA COMPUTADORES E CELULARES
   *************************************************************/

  function ajustarCanvas() {

    const proporcao = Math.max(
      window.devicePixelRatio || 1,
      1
    );

    const largura = canvas.offsetWidth;
    const altura = canvas.offsetHeight;

    if (!largura || !altura) return;

    const imagemAnterior = assinaturaPad.isEmpty()
      ? null
      : assinaturaPad.toData();

    canvas.width = largura * proporcao;
    canvas.height = altura * proporcao;

    const contexto = canvas.getContext("2d");

    contexto.setTransform(
      proporcao,
      0,
      0,
      proporcao,
      0,
      0
    );

    assinaturaPad.clear();

    if (imagemAnterior) {
      assinaturaPad.fromData(imagemAnterior);
    }
  }


  ajustarCanvas();

  window.addEventListener("resize", ajustarCanvas);


  /*************************************************************
   * 8. FUNÇÃO PARA MOSTRAR MENSAGENS
   *************************************************************/

  function mostrarMensagem(texto, tipo) {

    if (campoMensagem) {

      campoMensagem.textContent = texto;

      campoMensagem.style.color =
        tipo === "erro" ? "#b00020" : "#176b35";

    } else {

      alert(texto);

    }
  }


  /*************************************************************
   * 9. BOTÃO LIMPAR
   *************************************************************/

  botaoLimpar.addEventListener("click", function (evento) {

    evento.preventDefault();

    assinaturaPad.clear();

    if (campoMensagem) {
      campoMensagem.textContent = "";
    }
  });


  /*************************************************************
   * 10. BOTÃO ENVIAR
   *************************************************************/

  botaoEnviar.addEventListener("click", async function (evento) {

    evento.preventDefault();

    if (botaoEnviar.disabled) return;


    /***********************************************************
     * 11. VALIDAR MATRÍCULA
     ***********************************************************/

    const matricula = campoMatricula.value.trim();

    if (!matricula) {

      mostrarMensagem("Informe sua matrícula.", "erro");

      campoMatricula.focus();

      return;
    }


    /***********************************************************
     * 12. VALIDAR DOCUMENTO
     ***********************************************************/

    const tipoDocumento = campoDocumento.value.trim();

    if (!tipoDocumento) {

      mostrarMensagem("Selecione o tipo de documento.", "erro");

      campoDocumento.focus();

      return;
    }

    if (!DOCUMENTOS_PERMITIDOS.includes(tipoDocumento)) {

      mostrarMensagem("Tipo de documento inválido.", "erro");

      campoDocumento.focus();

      return;
    }


    /***********************************************************
     * 13. VALIDAR ASSINATURA
     ***********************************************************/

    if (assinaturaPad.isEmpty()) {

      mostrarMensagem(
        "Faça sua assinatura antes de enviar.",
        "erro"
      );

      return;
    }


    /***********************************************************
     * 14. VALIDAR ACEITE
     ***********************************************************/

    if (!aceite.checked) {

      mostrarMensagem(
        "É necessário confirmar o aceite.",
        "erro"
      );

      aceite.focus();

      return;
    }


    /***********************************************************
     * 15. GERAR IMAGEM PNG
     ***********************************************************/

    let imagemAssinatura;

    try {

      imagemAssinatura = assinaturaPad.toDataURL("image/png");

    } catch (erro) {

      console.error(
        "Erro ao gerar imagem da assinatura:",
        erro
      );

      mostrarMensagem(
        "Não foi possível preparar a assinatura. Tente novamente.",
        "erro"
      );

      return;
    }


    /***********************************************************
     * 16. VERIFICAR TAMANHO DA IMAGEM
     ***********************************************************/

    const prefixo = "data:image/png;base64,";

    const base64 = imagemAssinatura.substring(prefixo.length);

    const tamanhoImagem = Math.floor(
      base64.length * 3 / 4
    );

    if (
      !imagemAssinatura.startsWith(prefixo) ||
      tamanhoImagem > TAMANHO_MAXIMO_BYTES
    ) {

      mostrarMensagem(
        "A imagem da assinatura é inválida ou ultrapassou o limite de 5 MB.",
        "erro"
      );

      return;
    }


    /***********************************************************
     * 17. PREPARAR DADOS
     ***********************************************************/

    const dados = {
      matricula: matricula,
      tipoDocumento: tipoDocumento,
      assinatura: imagemAssinatura
    };


    /***********************************************************
     * 18. BLOQUEAR BOTÃO DURANTE O ENVIO
     ***********************************************************/

    const textoOriginal = botaoEnviar.textContent;

    botaoEnviar.disabled = true;

    botaoEnviar.textContent = "Enviando...";

    mostrarMensagem(
      "Encaminhando assinatura...",
      "normal"
    );


    /***********************************************************
     * 19. ENVIAR AO GOOGLE APPS SCRIPT
     ***********************************************************/

    try {

      const resposta = await fetch(URL_SCRIPT, {

        method: "POST",

        mode: "no-cors",

        redirect: "manual",

        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        },

        body: JSON.stringify(dados)

      });


      /*********************************************************
       * 20. TRATAR RESPOSTA OPACA
       *********************************************************/

      /*
       * O modo no-cors não permite ler o conteúdo da resposta.
       * Uma resposta opaca ou opaqueredirect não confirma
       * a gravação no Google Sheets ou no Drive.
       *
       * O registro deve ser confirmado na planilha.
       */

      console.log(
        "Solicitação encaminhada ao Apps Script.",
        "Tipo de resposta:",
        resposta.type
      );

      mostrarMensagem(
        "Solicitação encaminhada. Verifique o registro na planilha antes de realizar outro envio.",
        "normal"
      );


    } catch (erro) {

      /*********************************************************
       * 21. TRATAR FALHA DE COMUNICAÇÃO
       *********************************************************/

      console.error(
        "Falha no envio da assinatura:",
        erro
      );

      mostrarMensagem(
        "Não foi possível encaminhar a assinatura. " +
        "Verifique sua conexão e tente novamente.",
        "erro"
      );


    } finally {

      /*********************************************************
       * 22. RESTAURAR BOTÃO
       *********************************************************/

      botaoEnviar.disabled = false;

      botaoEnviar.textContent = textoOriginal;

    }

  });

});
