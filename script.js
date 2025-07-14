const materiais = [
  'Areia Fina', 'Areia Lavada', 'Areia Grossa', 'Areia Seixo',
  'BGS', 'Pó de Brita', 'Aterro', 'Pedra Calcária',
  'Brita Cascalhinho', 'Brita 19 ou 22'
];
const transportes = ['Truck', 'Bitruck', 'Carreta'];

function criarOpcoes(lista, containerId, tipo) {
  const container = document.getElementById(containerId);
  lista.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.setAttribute('data-value', item);
    btn.innerHTML = `<span class="checkbox"><i class="fa-solid fa-check" style="display:none"></i></span><span>${item}</span>`;
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      btn.querySelector('.checkbox i').style.display = btn.classList.contains('selected') ? 'inline' : 'none';
      if (tipo === 'transporte') {
        container.querySelectorAll('.option-btn').forEach(b => {
          if (b !== btn) {
            b.classList.remove('selected');
            b.querySelector('.checkbox i').style.display = 'none';
          }
        });
      }
      montarPreviewRecibo();
    });
    container.appendChild(btn);
  });
}

function ativarAtualizacaoAutomaticaPreview() {
  const form = document.getElementById('info-form');
  if (form) form.addEventListener('input', montarPreviewRecibo);
}

window.addEventListener('DOMContentLoaded', () => {
  criarOpcoes(materiais, 'materiais-list', 'materiais');
  criarOpcoes(transportes, 'transporte-list', 'transporte');
  carregarMotoristaEPlaca();
  const form = document.getElementById('info-form');
  if (form) {
    form.elements['motorista'].addEventListener('input', salvarMotoristaEPlaca);
    form.elements['placa'].addEventListener('input', salvarMotoristaEPlaca);
  }
  ativarAtualizacaoAutomaticaPreview();
  montarPreviewRecibo();
});

function coletarDados() {
  var materiaisSelecionados = [], transporteSelecionado = '';
  var mats = document.querySelectorAll('#materiais-list .option-btn.selected');
  for (var i = 0; i < mats.length; i++) materiaisSelecionados.push(mats[i].getAttribute('data-value'));
  var trans = document.querySelector('#transporte-list .option-btn.selected');
  if (trans) transporteSelecionado = trans.getAttribute('data-value');
  var form = document.getElementById('info-form');
  var dados = {};
  if (form) {
    var els = form.elements;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.name) dados[el.name] = el.value;
    }
  }
  return { materiaisSelecionados, transporteSelecionado, ...dados };
}

function formatarDataBR(dataStr) {
  if (!dataStr) return '';
  var p = dataStr.split('-');
  if (p.length !== 3) return dataStr;
  return p[2] + '/' + p[1] + '/' + p[0];
}

function montarPreviewRecibo() {
  const dados = coletarDados();
  const preview = document.getElementById('recibo-preview');
  if (!preview) return;
  preview.innerHTML = `
    <div class="recibo-header">
      <span class="recibo-header-title">TRANS <span>PE</span></span>
    </div>
    <div class="recibo-label"><strong>Materiais:</strong><br>
      ${dados.materiaisSelecionados.map(mat => `<span class='recibo-chip'>${mat}</span>`).join(' ')}
    </div>
    <div class="recibo-label"><strong>Transporte:</strong><br>
      <span class='recibo-chip-transporte'>${dados.transporteSelecionado}</span>
    </div>
    <div class="recibo-label"><strong>Obra:</strong> ${dados.obra || ''}</div>
    <div class="recibo-label"><strong>Cubagem:</strong> ${dados.cubagem || ''} m³</div>
    <div class="recibo-label"><strong>Nome do Motorista:</strong> ${dados.motorista || ''}</div>
    <div class="recibo-label"><strong>Nome do Cliente:</strong> ${dados.cliente || ''}</div>
    <div class="recibo-label"><strong>Endereço da Entrega:</strong> ${dados.endereco || ''}</div>
    <div class="recibo-label"><strong>Telefone do Cliente:</strong> ${dados.telefone || ''}</div>
    <div class="recibo-label"><strong>Placa do Veículo:</strong> ${dados.placa || ''}</div>
    <div class="recibo-label"><strong>Data:</strong> ${formatarDataBR(dados.data) || ''}</div>
    <div style="margin-top: 30px;"><strong>Assinatura do Cliente:</strong>
      <div class="recibo-assinatura">
        <span class="recibo-assinatura-nome">${dados.assinatura || ''}</span>
        <div class="recibo-assinatura-linha"></div>
      </div>
    </div>
  `;
}

function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

function gerarPDF() {
  const dados = coletarDados();
  const nomeCliente = (dados.cliente || 'cliente').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const dataHoje = dados.data || new Date().toISOString().slice(0,10);
  const nomeArquivo = `transpe_${nomeCliente}_${dataHoje}.pdf`;
  const preview = document.getElementById('recibo-preview');
  html2canvas(preview, { scale: 3 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = { width: canvas.width, height: canvas.height };
    let pdfWidth = pageWidth - 20;
    let pdfHeight = (imgProps.height / imgProps.width) * pdfWidth;
    if (pdfHeight > pageHeight - 20) {
      pdfHeight = pageHeight - 20;
      pdfWidth = (imgProps.width / imgProps.height) * pdfHeight;
    }
    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
    if (isMobile()) {
      pdf.output('dataurlnewwindow');
    } else {
      pdf.save(nomeArquivo);
    }
  });
}

function limparFormulario() {
  const form = document.getElementById('info-form');
  if (form) {
    const motorista = form.elements['motorista'].value;
    const placa = form.elements['placa'].value;
    form.reset();
    form.elements['motorista'].value = motorista;
    form.elements['placa'].value = placa;
    form.elements['data'].value = dataHoje();
  }
  document.querySelectorAll('#materiais-list .option-btn.selected, #transporte-list .option-btn.selected').forEach(btn => {
    btn.classList.remove('selected');
    const check = btn.querySelector('.checkbox i');
    if (check) check.style.display = 'none';
  });
}

function esconderPreview() {
  document.getElementById('recibo-preview-container').style.display = 'none';
}

function mostrarMensagemConfirmacao(msg) {
  const div = document.getElementById('mensagem-confirmacao');
  if (!div) return;
  div.textContent = msg || 'Recibo gerado com sucesso!';
  div.style.display = 'block';
  setTimeout(() => { div.style.display = 'none'; }, 2500);
}

function mostrarMensagemErro(msg) {
  const div = document.getElementById('mensagem-erro');
  const span = document.getElementById('mensagem-erro-texto');
  if (!div || !span) return;
  span.textContent = msg || 'Preencha os campos obrigatórios!';
  div.style.display = 'block';
  setTimeout(() => { div.style.display = 'none'; }, 3000);
}

function validarCamposObrigatorios() {
  const dados = coletarDados();
  if (!dados.materiaisSelecionados.length && !dados.transporteSelecionado && !dados.motorista && !dados.placa && !dados.obra && !dados.cubagem) {
    mostrarMensagemErro('Preencha todos os campos obrigatórios: material, transporte, nome do motorista, placa, obra e cubagem!');
    return false;
  }
  if (!dados.materiaisSelecionados.length) {
    mostrarMensagemErro('Selecione pelo menos um material!');
    return false;
  }
  if (!dados.transporteSelecionado) {
    mostrarMensagemErro('Selecione o tipo de transporte!');
    return false;
  }
  if (!dados.motorista) {
    mostrarMensagemErro('Preencha o nome do motorista!');
    return false;
  }
  if (!dados.placa) {
    mostrarMensagemErro('Preencha a placa do caminhão!');
    return false;
  }
  if (!dados.obra) {
    mostrarMensagemErro('Preencha o nome da obra!');
    return false;
  }
  if (!dados.cubagem) {
    mostrarMensagemErro('Preencha a cubagem!');
    return false;
  }
  return true;
}

const btnPDF = document.getElementById('gerar-pdf-btn');
if (btnPDF) {
  btnPDF.addEventListener('click', () => {
    if (!validarCamposObrigatorios()) return;
    gerarPDF();
    esconderPreview();
    mostrarMensagemConfirmacao();
    setTimeout(() => {
      document.getElementById('recibo-preview-container').style.display = 'block';
      limparFormulario();
    }, 2000);
  });
}

function compartilharPDF() {
  const dados = coletarDados();
  const nomeCliente = (dados.cliente || 'cliente').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const dataHoje = dados.data || new Date().toISOString().slice(0,10);
  const nomeArquivo = `transpe_${nomeCliente}_${dataHoje}.pdf`;
  const preview = document.getElementById('recibo-preview');
  html2canvas(preview, { scale: 3 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = { width: canvas.width, height: canvas.height };
    let pdfWidth = pageWidth - 20;
    let pdfHeight = (imgProps.height / imgProps.width) * pdfWidth;
    if (pdfHeight > pageHeight - 20) {
      pdfHeight = pageHeight - 20;
      pdfWidth = (imgProps.width / imgProps.height) * pdfHeight;
    }
    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output('blob');
    const file = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && !isIOS()) {
      navigator.share({ files: [file], title: 'Recibo TRANS PE', text: 'Segue o recibo em PDF.' })
        .catch(() => { alert('Não foi possível abrir o menu de compartilhamento. Tente enviar manualmente.'); });
    } else {
      alert('Seu navegador não suporta compartilhamento direto de arquivos. O PDF foi salvo, envie manualmente pelo WhatsApp.');
    }
  });
}

const btnCompartilhar = document.getElementById('compartilhar-pdf-btn');
if (btnCompartilhar) {
  btnCompartilhar.addEventListener('click', () => {
    if (!validarCamposObrigatorios()) return;
    compartilharPDF();
    esconderPreview();
    mostrarMensagemConfirmacao('Recibo compartilhado com sucesso!');
    setTimeout(() => {
      document.getElementById('recibo-preview-container').style.display = 'block';
      limparFormulario();
    }, 2000);
  });
}

function salvarMotoristaEPlaca() {
  const form = document.getElementById('info-form');
  if (!form) return;
  localStorage.setItem('motorista_nome', form.elements['motorista'].value);
  localStorage.setItem('motorista_placa', form.elements['placa'].value);
}

function carregarMotoristaEPlaca() {
  const form = document.getElementById('info-form');
  if (!form) return;
  form.elements['motorista'].value = localStorage.getItem('motorista_nome') || '';
  form.elements['placa'].value = localStorage.getItem('motorista_placa') || '';
  if (!form.elements['data'].value) form.elements['data'].value = dataHoje();
}

function dataHoje() {
  var hoje = new Date();
  return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
