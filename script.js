// Lista de materiais disponíveis
const materiais = [
  'Areia Fina',
  'Areia Lavada',
  'Areia Grossa',
  'Areia Seixo',
  'BGS',
  'Pó de Brita',
  'Aterro',
  'Pedra Calcária',
  'Brita Cascalhinho',
  'Brita 19 ou 22'
];

// Lista de tipos de transporte
const transportes = [
  'Truck',
  'Bitruck',
  'Carreta'
];

// Função para criar botões de seleção (materiais ou transporte)
function criarOpcoes(lista, containerId, tipo) {
  const container = document.getElementById(containerId);
  lista.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.setAttribute('data-value', item);
    btn.innerHTML = `
      <span class="checkbox"><i class="fa-solid fa-check" style="display:none"></i></span>
      <span>${item}</span>
    `;
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const check = btn.querySelector('.checkbox i');
      check.style.display = btn.classList.contains('selected') ? 'inline' : 'none';

      if (tipo === 'transporte') {
        document.querySelectorAll(`#${containerId} .option-btn`).forEach((b) => {
          if (b !== btn) {
            b.classList.remove('selected');
            b.querySelector('.checkbox i').style.display = 'none';
          }
        });
      }
    });
    container.appendChild(btn);
  });
}

// Inicializa opções ao carregar
window.addEventListener('DOMContentLoaded', () => {
  criarOpcoes(materiais, 'materiais-list', 'materiais');
  criarOpcoes(transportes, 'transporte-list', 'transporte');
});

// Função para coletar dados selecionados
function coletarDados() {
  const materiaisSelecionados = Array.from(document.querySelectorAll('#materiais-list .option-btn.selected'))
    .map(btn => btn.getAttribute('data-value'));

  const transporteSelecionado = Array.from(document.querySelectorAll('#transporte-list .option-btn.selected'))
    .map(btn => btn.getAttribute('data-value'))[0] || '';

  const form = document.getElementById('info-form');
  const dados = Object.fromEntries(new FormData(form).entries());

  return {
    materiaisSelecionados,
    transporteSelecionado,
    ...dados
  };
}

// Função para montar o preview do recibo
function montarPreviewRecibo() {
  const dados = coletarDados();
  const preview = document.getElementById('recibo-preview');
  preview.innerHTML = `
    <div style=\"text-align:center; margin-top:32px; margin-bottom: 18px;\">
      <span style=\"font-size:2.1rem; color:#1976d2; font-weight:700; letter-spacing:2px;\">TRANS <span style=\"color:#1565c0\">PE</span></span>
    </div>
    <div style=\"margin-bottom: 10px;\">
      <strong>Materiais:</strong><br>
      ${dados.materiaisSelecionados.map(mat => `<span style='display:inline-block; margin:2px 8px 2px 0; padding:4px 10px; border-radius:8px; background:#e3f0fd; color:#1976d2; font-weight:500;'>${mat}</span>`).join(' ')}
    </div>
    <div style=\"margin-bottom: 10px;\">
      <strong>Transporte:</strong><br>
      <span style='display:inline-block; margin:2px 0; padding:4px 10px; border-radius:8px; background:#e3f0fd; color:#1976d2; font-weight:500;'>${dados.transporteSelecionado}</span>
    </div>
    <div style=\"margin-bottom: 10px;\"><strong>Obra:</strong> ${dados.obra || ''}</div>
    <div style=\"margin-bottom: 10px;\"><strong>Cubagem:</strong> ${dados.cubagem || ''} m³</div>
    <div style=\"margin-bottom: 10px;\"><strong>Nome do Motorista:</strong> ${dados.motorista || ''}</div>
    <div style=\"margin-bottom: 10px;\"><strong>Nome do Cliente:</strong> ${dados.cliente || ''}</div>
    <div style=\"margin-bottom: 10px;\"><strong>Endereço da Entrega:</strong> ${dados.endereco || ''}</div>
    <div style=\"margin-bottom: 10px;\"><strong>Telefone do Cliente:</strong> ${dados.telefone || ''}</div>
    <div style=\"margin-bottom: 10px;\"><strong>Placa do Veículo:</strong> ${dados.placa || ''}</div>
    <div style=\"margin-bottom: 10px;\"><strong>Data:</strong> ${dados.data || ''}</div>
    <div style=\"margin-top: 30px;\">
      <strong>Assinatura do Cliente:</strong>
      <div style=\"width: 220px; margin-top: 8px; text-align: center;\">
        <span style=\"font-size:1.1rem; color:#1976d2;\">${dados.assinatura || ''}</span>
        <div style=\"border-bottom:2px solid #b0bec5; width: 100%; height: 32px; margin-top: 2px;\"></div>
      </div>
    </div>
  `;
}

// Evento do botão Visualizar Recibo
const btnVisualizar = document.getElementById('visualizar-recibo-btn');
if (btnVisualizar) {
  btnVisualizar.addEventListener('click', () => {
    montarPreviewRecibo();
    document.getElementById('recibo-preview-container').style.display = 'block';
    window.scrollTo({ top: document.getElementById('recibo-preview-container').offsetTop - 20, behavior: 'smooth' });
  });
}

// Função para gerar PDF a partir do preview
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
    // Ajusta a imagem para caber na página
    const imgProps = { width: canvas.width, height: canvas.height };
    // Considera o scale para manter proporção correta
    let pdfWidth = pageWidth - 20;
    let pdfHeight = (imgProps.height / imgProps.width) * pdfWidth;
    if (pdfHeight > pageHeight - 20) {
      pdfHeight = pageHeight - 20;
      pdfWidth = (imgProps.width / imgProps.height) * pdfHeight;
    }
    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
    pdf.save(nomeArquivo);
  });
}

// Evento do botão Gerar PDF
const btnPDF = document.getElementById('gerar-pdf-btn');
if (btnPDF) {
  btnPDF.addEventListener('click', gerarPDF);
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Função para compartilhar o PDF (apenas em navegadores que suportam navigator.share)
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
    // Gera o blob do PDF de forma síncrona
    const pdfBlob = pdf.output('blob');
    const file = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && !isIOS()) {
      navigator.share({
        files: [file],
        title: 'Recibo TRANS PE',
        text: 'Segue o recibo em PDF.'
      }).catch(() => {
        alert('Não foi possível abrir o menu de compartilhamento. Tente enviar manualmente.');
      });
    } else {
      alert('Seu navegador não suporta compartilhamento direto de arquivos. O PDF foi salvo, envie manualmente pelo WhatsApp.');
    }
  });
}

// Evento do botão Compartilhar PDF
const btnCompartilhar = document.getElementById('compartilhar-pdf-btn');
if (btnCompartilhar) {
  btnCompartilhar.addEventListener('click', compartilharPDF);
}
