
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

  window.addEventListener("resize", ajustarCanvas);


  /*************************************************************
   * 8. FUNÇÃO PARA MOSTRAR MENSAGENS
   *************************************************************/

  function mostrarMensagem(texto, tipo) {

    if (!campoMensagem) {
      alert(texto);
      return;
    }

    campoMensagem.textContent = texto;

    campoMensagem.style.padding = "8px";

    campoMensagem.style.borderRadius = "7px";

    campoMensagem.style.fontWeight = "bold";

    campoMensagem.style.textAlign = "center";

    if (tipo === "erro") {

      campoMensagem.style.color = "#b00020";

      campoMensagem.style.backgroundColor = "#fdeaea";

      campoMensagem.style.border = "1px solid #f5c2c2";

    } else if (tipo === "sucesso") {

      campoMensagem.style.color = "#176b35";

      campoMensagem.style.backgroundColor = "#e8f7e9";

      campoMensagem.style.border = "1px solid #b7e1b9";

    } else {

      campoMensagem.style.color = "#555555";

      campoMensagem.style.backgroundColor = "#f4f7fa";

      campoMensagem.style.border = "1px solid #d7e0e9";

    }
  }


  /*************************************************************
   * 9. FUNÇÃO PARA LIMPAR O FORMULÁRIO
   *************************************************************/

  function limparFormulario() {

    campoMatricula.value = "";

    campoDocumento.selectedIndex = 0;

    assinaturaPad.clear();

    aceite.checked = false;

  }


  /*************************************************************
   * 10. BOTÃO LIMPAR
   *************************************************************/

  botaoLimpar.addEventListener("click", function (evento) {

    evento.preventDefault();

    limparFormulario();

    if (campoMensagem) {

      campoMensagem.textContent = "";

      campoMensagem.style.backgroundColor = "transparent";

      campoMensagem.style.border = "none";

      campoMensagem.style.padding = "0";

    }

    campoMatricula.focus();

  });


  /*************************************************************
   * 11. BOTÃO ENVIAR
   *************************************************************/

  botaoEnviar.addEventListener("click", async function (evento) {

    evento.preventDefault();

    // Impedir envios simultâneos.

    if (botaoEnviar.disabled) return;


    /***********************************************************
     * 12. VALIDAR MATRÍCULA
     ***********************************************************/

    const matricula = campoMatricula.value.trim();

    if (!matricula) {

      mostrarMensagem("Informe sua matrícula.", "erro");

      campoMatricula.focus();

      return;
    }


    /***********************************************************
     * 13. VALIDAR DOCUMENTO
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
     * 14. VALIDAR ASSINATURA
     ***********************************************************/

    if (assinaturaPad.isEmpty()) {

      mostrarMensagem(
        "Faça sua assinatura antes de enviar.",
        "erro"
      );

      return;
    }


    /***********************************************************
     * 15. VALIDAR ACEITE
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
     * 16. GERAR IMAGEM PNG
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
     * 17. VERIFICAR TAMANHO DA IMAGEM
     ***********************************************************/

    const prefixo = "data:image/png;base64,";

    if (!imagemAssinatura.startsWith(prefixo)) {

      mostrarMensagem(
        "Não foi possível gerar a imagem da assinatura.",
        "erro"
      );

      return;
    }

    const base64 = imagemAssinatura.substring(prefixo.length);

    const tamanhoImagem = Math.floor(
      base64.length * 3 / 4
    );

    if (tamanhoImagem > TAMANHO_MAXIMO_BYTES) {

      mostrarMensagem(
        "A imagem da assinatura ultrapassou o limite de 5 MB.",
        "erro"
      );

      return;
    }


    /***********************************************************
     * 18. PREPARAR DADOS PARA O APPS SCRIPT
     ***********************************************************/

    const dados = {

      matricula: matricula,

      tipoDocumento: tipoDocumento,

      assinatura: imagemAssinatura

    };


    /***********************************************************
     * 19. BLOQUEAR BOTÃO DURANTE O ENVIO
     ***********************************************************/

    const textoOriginal = botaoEnviar.textContent;

    botaoEnviar.disabled = true;

    botaoEnviar.textContent = "Enviando...";

    mostrarMensagem(
      "Encaminhando assinatura...",
      "normal"
    );


    /***********************************************************
     * 20. ENVIAR PARA O GOOGLE APPS SCRIPT
     ***********************************************************/

    try {

      await fetch(URL_SCRIPT, {

        method: "POST",

        mode: "no-cors",

        headers: {

          "Content-Type": "text/plain;charset=UTF-8"

        },

        body: JSON.stringify(dados)

      });


      /*********************************************************
       * 21. LIMPAR FORMULÁRIO APÓS O ENVIO
       *********************************************************/

      limparFormulario();


      /*********************************************************
       * 22. EXIBIR MENSAGEM DE SUCESSO
       *********************************************************/

      mostrarMensagem(
        "☑ Assinatura enviada com sucesso!",
        "sucesso"
      );


      /*********************************************************
       * 23. DEVOLVER FOCO PARA A MATRÍCULA
       *********************************************************/

      campoMatricula.focus();


      console.log(
        "Solicitação de assinatura encaminhada ao Apps Script."
      );


    } catch (erro) {

      /*********************************************************
       * 24. TRATAR FALHA DE COMUNICAÇÃO
       *********************************************************/

      console.error(
        "Falha no envio da assinatura:",
        erro
      );

      mostrarMensagem(
        "Não foi possível encaminhar a assinatura. " +
        "Verifique sua conexão com a internet e tente novamente.",
        "erro"
      );


    } finally {

      /*********************************************************
       * 25. RESTAURAR BOTÃO
       *********************************************************/

      botaoEnviar.disabled = false;

      botaoEnviar.textContent = textoOriginal;

    }

  });

});
