(function () {
  if (window.__oviPainelAtivo) { alert('O painel já está aberto.'); return; }
  window.__oviPainelAtivo = true;

  let dadosCarregados = [];

  function carregarSheetJS() {
    return new Promise((resolve, reject) => {
      if (window.XLSX) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Sem conexão para carregar leitor de planilha.'));
      document.head.appendChild(script);
    });
  }

  function linhaParaDado(linha) {
    const id = parseInt(linha[0], 10);
    const obsLida = parseInt(linha[1], 10);
    // obs = número que o usuário digita/vê na planilha (0 a 9, igual ao texto da opção).
    // Não usar "|| 0" aqui trocado por isNaN: com "||", obs=0 ("0 - Sem Observações")
    // virava falsy e caía no valor padrão errado.
    const obs = isNaN(obsLida) ? 0 : obsLida;
    const ovos = parseInt(linha[2], 10) || 0;
    const texto = (linha[3] || '').toString();
    return { id, obs, ovos, texto };
  }

  // O <option> do HTML usa value = (número exibido ao usuário) + 1 — ex.: a opção
  // "8 - Ovitrampa com pouca água" tem value="9", e "9 - Outra Observação" tem
  // value="10". Esta função é o ÚNICO lugar que faz essa conversão; o resto do
  // código sempre trabalha com o número que o usuário vê (d.obs).
  function obsParaValueHtml(obsExibido) {
    return obsExibido + 1;
  }

  async function processarArquivo(file) {
    await carregarSheetJS();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const primeiraAba = workbook.SheetNames[0];
    const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba], { header: 1, raw: true });
    return linhas.map(linhaParaDado).filter(d => !isNaN(d.id));
  }

  function preencherCampos(dados) {
    let preenchidos = 0;
    let naoEncontrados = [];
    dados.forEach(d => {
      const botao = document.querySelector('.input_send_ovitrampa_data[data-id="' + d.id + '"]');
      if (botao) {
        const linha = botao.closest('tr');
        linha.querySelector('.counting_eggs').value = d.ovos;
        const selectObs = linha.querySelector('.counting_observation_id');
        selectObs.value = obsParaValueHtml(d.obs);
        selectObs.dispatchEvent(new Event('change', { bubbles: true }));
        if (d.obs === 9 && d.texto) {
          setTimeout(() => {
            const textarea = linha.querySelector('.counting_observation');
            if (textarea) textarea.value = d.texto;
          }, 100);
        }
        preenchidos++;
      } else {
        naoEncontrados.push(d.id);
      }
    });
    return { preenchidos, naoEncontrados };
  }

  function conferirCampos(dados) {
    return dados.map(d => {
      const botao = document.querySelector('.input_send_ovitrampa_data[data-id="' + d.id + '"]');
      if (!botao) return { id: d.id, status: 'NAO ENCONTRADA' };
      const linha = botao.closest('tr');
      const select = linha.querySelector('.counting_observation_id');
      return { id: d.id, ovos: linha.querySelector('.counting_eggs').value, obs: select.options[select.selectedIndex].text };
    });
  }

  async function enviarTodas(dados, intervalo, onProgress) {
    let enviados = 0;
    for (const d of dados) {
      const botao = document.querySelector('.input_send_ovitrampa_data[data-id="' + d.id + '"]');
      if (botao) {
        botao.click();
        enviados++;
        if (onProgress) onProgress(enviados, dados.length);
        await new Promise(r => setTimeout(r, intervalo));
      }
    }
    return enviados;
  }

  const painel = document.createElement('div');
  painel.style.cssText = 'position:fixed;top:20px;right:20px;width:340px;background:#fff;border:2px solid #2196F3;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.25);z-index:999999;font-family:Arial,sans-serif;font-size:14px;padding:14px;max-height:85vh;overflow-y:auto;';
  painel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<div style="font-weight:bold;font-size:16px;color:#2196F3;">🦟 Lançar Ovitrampas</div>' +
      '<div id="ovi-fechar" style="cursor:pointer;color:#999;font-size:19px;padding:0 4px;">✖</div>' +
    '</div>' +
    '<div style="margin-bottom:8px;color:#333;">1. Escolha o arquivo da planilha (.xlsx):</div>' +
    '<input type="file" id="ovi-arquivo" accept=".xlsx,.xls,.csv,.tsv" style="width:100%;margin-bottom:10px;" />' +
    '<div id="ovi-status" style="color:#555;margin-bottom:8px;"></div>' +
    '<button id="ovi-btn-preencher" style="width:100%;padding:10px;margin-bottom:8px;background:#2196F3;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:15px;" disabled>2. Preencher campos na tela</button>' +
    '<div id="ovi-tabela" style="max-height:220px;overflow-y:auto;margin-bottom:8px;font-size:13px;"></div>' +
    '<button id="ovi-btn-enviar" style="width:100%;padding:10px;background:#4CAF50;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:15px;" disabled>3. Confirmar e enviar</button>' +
    '<div id="ovi-log" style="color:#555;margin-top:8px;white-space:pre-line;"></div>';
  document.body.appendChild(painel);

  painel.querySelector('#ovi-fechar').addEventListener('click', () => {
    painel.remove();
    window.__oviPainelAtivo = false;
  });

  const elArquivo = painel.querySelector('#ovi-arquivo');
  const elStatus = painel.querySelector('#ovi-status');
  const elBtnPreencher = painel.querySelector('#ovi-btn-preencher');
  const elTabela = painel.querySelector('#ovi-tabela');
  const elBtnEnviar = painel.querySelector('#ovi-btn-enviar');
  const elLog = painel.querySelector('#ovi-log');

  elArquivo.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    elStatus.textContent = 'Lendo planilha...';
    try {
      dadosCarregados = await processarArquivo(file);
      elStatus.textContent = '✅ ' + dadosCarregados.length + ' ovitrampas lidas da planilha.';
      elBtnPreencher.disabled = false;
    } catch (err) {
      elStatus.textContent = '❌ Erro ao ler o arquivo: ' + err.message;
    }
  });

  elBtnPreencher.addEventListener('click', () => {
    if (dadosCarregados.length === 0) return;
    const r = preencherCampos(dadosCarregados);
    const conferencia = conferirCampos(dadosCarregados);
    let html = '<table style="width:100%;border-collapse:collapse;"><tr style="background:#eee;"><th style="text-align:left;padding:2px;">ID</th><th style="text-align:left;padding:2px;">Ovos</th><th style="text-align:left;padding:2px;">Obs.</th></tr>';
    conferencia.forEach(d => {
      const cor = d.status === 'NAO ENCONTRADA' ? 'color:red;' : '';
      html += '<tr style="' + cor + '"><td style="padding:2px;">' + d.id + '</td><td style="padding:2px;">' + (d.ovos !== undefined ? d.ovos : '-') + '</td><td style="padding:2px;">' + (d.obs || d.status) + '</td></tr>';
    });
    html += '</table>';
    elTabela.innerHTML = html;
    elLog.textContent = '📝 ' + r.preenchidos + ' campos preenchidos.' +
      (r.naoEncontrados.length ? '\n⚠️ IDs nao encontrados na pagina: ' + r.naoEncontrados.join(', ') : '') +
      '\n\n👉 Confira a tabela acima. Se estiver certo, clique em Confirmar e enviar.';
    elBtnEnviar.disabled = false;
  });

  elBtnEnviar.addEventListener('click', async () => {
    const ok = confirm('Confirma o envio de ' + dadosCarregados.length + ' ovitrampas? Essa acao nao pode ser desfeita.');
    if (!ok) return;
    elBtnEnviar.disabled = true;
    elLog.textContent = 'Enviando...';
    const enviados = await enviarTodas(dadosCarregados, 500, (feito, total) => {
      elLog.textContent = 'Enviando... ' + feito + '/' + total;
    });
    elLog.textContent = '🎉 Concluido! ' + enviados + ' ovitrampas enviadas.';
  });
})();
