
const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwN9ribuxf9mMdhvU5NPi1aeuQVti3F8lwXOzQaUR_sfvIWvX7aGbFNipk6_cjzm9SbSQ/exec";

document.addEventListener("DOMContentLoaded", function () {
  const campoMatricula = document.getElementById("matricula");
  const campoDocumento = document.getElementById("tipoDocumento");
  const canvas = document.getElementById("assinatura");
  const aceite = document.getElementById("aceite");
  const botaoLimpar = document.getElementById("limpar");
  const botaoEnviar = document.getElementById("enviar");

  if (
    !campoMatricula ||
    !campoDocumento ||
    !canvas ||
    !aceite ||
    !botaoLimpar ||
    !botaoEnviar
  ) {
    console.error("Um ou mais elementos do formulário não foram encontrados.");
    alert("Erro ao carregar o formulário. Atualize a página.");
    return;
  }

  if (typeof SignaturePad === "undefined") {
    alert("Não foi possível carregar o campo de assinatura.");
    return;
  }

  const assinaturaPad = new SignaturePad(canvas, {
    minWidth: 1,
    maxWidth: 2.5,
    penColor: "black"
  });

  function ajustarCanvas() {
    const proporcao = Math.max(window.devicePixelRatio || 1, 1);
    const largura = canvas.offsetWidth;
    const altura = canvas.offsetHeight;

    if (!largura || !altura) return;

    const imagemAnterior = assinaturaPad.isEmpty()
      ? null
      : assinaturaPad.toData();

    canvas.width = largura * proporcao;
    canvas.height = altura * proporcao;

    const contexto = canvas.getContext("2d");
    contexto.setTransform(proporcao, 0, 0, proporcao, 0, 0);

    assinaturaPad.clear();

    if (imagemAnterior) {
      assinaturaPad.fromData(imagemAnterior);
    }
  }

  ajustarCanvas();
  window.addEventListener("resize", ajustarCanvas);

  botaoLimpar.addEventListener("click", function () {
    assinaturaPad.clear();
  });

  botaoEnviar.addEventListener("click", async function () {
    const matricula = campoMatricula.value.trim();
    const tipoDocumento = campoDocumento.value;

    if (!matricula) {
      alert("Informe sua matrícula.");
      campoMatricula.focus();
      return;
    }

    if (!tipoDocumento) {
      alert("Selecione o tipo de documento.");
      campoDocumento.focus();
      return;
    }

    if (assinaturaPad.isEmpty()) {
      alert("Faça sua assinatura antes de enviar.");
      return;
    }

    if (!aceite.checked) {
      alert("É necessário confirmar o aceite.");
      aceite.focus();
      return;
    }

    const dados = {
      matricula: matricula,
      tipoDocumento: tipoDocumento,
      assinatura: assinaturaPad.toDataURL("image/png")
    };

    botaoEnviar.disabled = true;
    const textoOriginal = botaoEnviar.textContent;
    botaoEnviar.textContent = "Enviando...";

    try {
      /*
       * O formulário está no GitHub e o Apps Script está em outro domínio.
       * no-cors evita o bloqueio de leitura da resposta pelo navegador.
       * O Content-Type text/plain evita uma requisição preflight.
       */
      await fetch(URL_SCRIPT, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        },
        body: JSON.stringify(dados)
      });

      alert(
        "Solicitação de envio realizada. " +
        "Como o navegador não permite ler a resposta do Google neste modo, " +
        "confirme o registro na planilha antes de fechar a página."
      );

    } catch (erro) {
      console.error("Falha no envio:", erro);

      alert(
        "Não foi possível realizar o envio. " +
        "Verifique sua conexão e tente novamente."
      );

    } finally {
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = textoOriginal;
    }
  });
});
