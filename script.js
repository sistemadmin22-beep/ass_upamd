
/***************************************************************
 * SISTEMA DE ASSINATURAS DIGITAIS - UPA MADUREIRA
 * Arquivo: script.js
 ***************************************************************/


/***************************************************************
 * 1. ENDEREÇO DA NOVA IMPLANTAÇÃO DO APPS SCRIPT
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

    alert(
      "Erro ao carregar o formulário. Atualize a página."
    );

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


    // Preservar assinatura existente.

    const imagemAnterior = assinaturaPad.isEmpty()
      ? null
      : assinaturaPad.toData();


    // Ajustar resolução do canvas.

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


    // Restaurar assinatura.

    assinaturaPad.clear();

    if (imagemAnterior) {

      assinaturaPad.fromData(imagemAnterior);

    }

  }


  ajustarCanvas();

  window.addEventListener(
    "resize",
    ajustarCanvas
  );


  /*************************************************************
   * 8. BOTÃO LIMPAR
   *************************************************************/

  botaoLimpar.addEventListener("click", function (evento) {

    evento.preventDefault();

    assinaturaPad.clear();

  });


  /*************************************************************
   * 9. BOTÃO ENVIAR
   *************************************************************/

  botaoEnviar.addEventListener("click", async function (evento) {

    evento.preventDefault();


    // Impedir dois envios simultâneos.

    if (botaoEnviar.disabled) return;


    /***********************************************************
     * 10. VALIDAR MATRÍCULA
     ***********************************************************/

    const matricula = campoMatricula.value.trim();

    if (!matricula) {

      alert("Informe sua matrícula.");

      campoMatricula.focus();

      return;

    }


    /***********************************************************
     * 11. VALIDAR DOCUMENTO
     ***********************************************************/

    const tipoDocumento = campoDocumento.value.trim();

    if (!tipoDocumento) {

      alert("Selecione o tipo de documento.");

      campoDocumento.focus();

      return;

    }

    if (!DOCUMENTOS_PERMITIDOS.includes(tipoDocumento)) {

      alert("Tipo de documento inválido.");

      campoDocumento.focus();

      return;

    }


    /***********************************************************
     * 12. VALIDAR ASSINATURA
     ***********************************************************/

    if (assinaturaPad.isEmpty()) {

      alert("Faça sua assinatura antes de enviar.");

      return;

    }


    /***********************************************************
     * 13. VALIDAR ACEITE
     ***********************************************************/

    if (!aceite.checked) {

      alert("É necessário confirmar o aceite.");

      aceite.focus();

      return;

    }


    /***********************************************************
     * 14. GERAR IMAGEM PNG
     ***********************************************************/

    let imagemAssinatura;

    try {

      imagemAssinatura = assinaturaPad.toDataURL("image/png");

    } catch (erro) {

      console.error(
        "Erro ao gerar imagem da assinatura:",
        erro
      );

      alert(
        "Não foi possível preparar a assinatura. Tente novamente."
      );

      return;

    }


    /***********************************************************
     * 15. VERIFICAR TAMANHO DA IMAGEM
     ***********************************************************/

    const prefixo = "data:image/png;base64,";

    const base64 = imagemAssinatura.substring(prefixo.length);

    const tamanhoImagem = Math.floor(
      base64.length * 3 / 4
    );

    if (tamanhoImagem > TAMANHO_MAXIMO_BYTES) {

      alert(
        "A imagem da assinatura ultrapassou o limite de 5 MB. " +
        "Tente fazer uma assinatura mais simples."
      );

      return;

    }


    /***********************************************************
     * 16. PREPARAR DADOS PARA O APPS SCRIPT
     ***********************************************************/

    const dados = {

      matricula: matricula,

      tipoDocumento: tipoDocumento,

      assinatura: imagemAssinatura

    };


    /***********************************************************
     * 17. BLOQUEAR BOTÃO DURANTE O ENVIO
     ***********************************************************/

    const textoOriginal = botaoEnviar.textContent;

    botaoEnviar.disabled = true;

    botaoEnviar.textContent = "Enviando...";


    /***********************************************************
     * 18. ENVIAR PARA O GOOGLE APPS SCRIPT
     ***********************************************************/

    try {

      /*
       * O formulário está hospedado no GitHub Pages.
       * O Apps Script está em outro domínio.
       *
       * O modo no-cors permite enviar a requisição sem
       * disponibilizar a resposta ao JavaScript do navegador.
       *
       * IMPORTANTE:
       * Uma resposta opaca não confirma que o Apps Script
       * gravou a assinatura na planilha ou no Drive.
       */

      await fetch(URL_SCRIPT, {

        method: "POST",

        mode: "no-cors",

        headers: {

          "Content-Type": "text/plain;charset=UTF-8"

        },

        body: JSON.stringify(dados)

      });


      /*********************************************************
       * 19. AVISO APÓS A SOLICITAÇÃO
       *********************************************************/

      alert(

        "Sua solicitação de assinatura foi enviada! " +
        "Aguarde a confirmação do registro antes de realizar outro envio."
);

    } catch (erro) {

      /*********************************************************
       * 20. TRATAR FALHA DE COMUNICAÇÃO
       *********************************************************/

      console.error(
        "Falha no envio da assinatura:",
        erro
      );

      alert(

        "Não foi possível encaminhar a assinatura.\n\n" +

        "Verifique sua conexão com a internet e tente novamente."

      );


    } finally {

      /*********************************************************
       * 21. RESTAURAR BOTÃO
       *********************************************************/

      botaoEnviar.disabled = false;

      botaoEnviar.textContent = textoOriginal;

    }

  });

});
