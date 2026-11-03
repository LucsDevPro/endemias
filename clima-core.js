// ============================================================
// Núcleo da previsão do tempo — UVZ Connect
//
// Uma única busca, compartilhada pelo painel de previsão
// (weather.js) e pelo fundo animado (weather-bg.js).
//
// Por que é mais preciso que o modelo único de antes:
//  • Usa as coordenadas do CENTRO de Ponta Porã (antes o painel
//    apontava ~14 km fora e o fundo animado outro ponto).
//  • Combina VÁRIOS modelos meteorológicos (ECMWF, ECMWF-IA, GFS,
//    ICON, GEM) e usa a média aparada (descarta o mais alto e o
//    mais baixo) em vez de confiar num só.
//  • "Chance de chuva" = quantos modelos concordam que chove
//    (misturada com a probabilidade de conjunto, quando existe) +
//    milímetros esperados.
//  • Mostra o que cada modelo previu ("ver detalhes"), para você
//    comparar com outras fontes e, se um modelo errar sempre,
//    tirá-lo da lista MODELOS abaixo.
//
// Fonte dos dados: Open-Meteo (sem chave, gratuito).
// Se a busca com vários modelos falhar por qualquer motivo, volta
// sozinho ao modo simples (um modelo), como era antes.
// ============================================================

(function (global) {
  "use strict";

  var LAT = -22.536;           // Centro de Ponta Porã
  var LON = -55.726;
  var FUSO = "America/Campo_Grande";
  var DIAS_PREVISAO = 5;
  var CACHE_KEY = "uvzClimaV2";
  var CACHE_MS = 15 * 60 * 1000;

  // Modelos que entram na média e na "concordância" de chuva.
  // (nome na API → nome exibido). Para tirar um modelo, apague a linha.
  var MODELOS = {
    ecmwf_ifs025:          "ECMWF",
    ecmwf_aifs025_single:  "ECMWF-IA",
    gfs_seamless:          "GFS",
    icon_seamless:         "ICON",
    gem_seamless:          "GEM"
  };
  // Modelo "automático" do Open-Meteo: só usado para o ícone/código do
  // tempo (que não dá para tirar média) — não entra nas médias.
  var MODELO_CODIGO = "best_match";
  var PADRAO = "padrao";       // chave usada quando a resposta não tem sufixo de modelo

  var LIMIAR_CHUVA_DIA_MM = 1.0;   // modelo "prevê chuva" no dia se >= 1 mm
  var LIMIAR_CHUVA_HORA_MM = 0.2;  // ... na hora se >= 0.2 mm

  var emVoo = null;

  // ------------------------------------------------------------
  // Estatística simples
  // ------------------------------------------------------------
  function numeros(lista) {
    return lista.filter(function (v) { return typeof v === "number" && isFinite(v); });
  }

  // média aparada: com 4+ modelos descarta o maior e o menor valor
  function agregar(lista) {
    var v = numeros(lista).sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    if (v.length >= 4) v = v.slice(1, -1);
    var s = 0;
    for (var i = 0; i < v.length; i++) s += v[i];
    return s / v.length;
  }

  function arred(v, casas) {
    if (v === null || v === undefined) return null;
    var f = Math.pow(10, casas || 0);
    return Math.round(v * f) / f;
  }

  // ------------------------------------------------------------
  // Leitura tolerante da resposta (com ou sem sufixo _modelo)
  // ------------------------------------------------------------
  function coletar(bloco, base, nomes) {
    var out = {};
    if (!bloco) return out;
    nomes.forEach(function (m) {
      var k = base + "_" + m;
      if (bloco[k] !== undefined && bloco[k] !== null) out[m] = bloco[k];
    });
    if (!Object.keys(out).length && bloco[base] !== undefined && bloco[base] !== null) {
      out[PADRAO] = bloco[base];
    }
    return out;
  }

  function nosModelosDe(coletado) { return Object.keys(coletado); }

  function nesimo(coletado, i) {
    return Object.keys(coletado).map(function (m) {
      var arr = coletado[m];
      return Array.isArray(arr) ? arr[i] : arr;
    });
  }

  function primeiroCodigo(coletado, preferido, i) {
    var m = coletado[preferido] ? preferido : Object.keys(coletado)[0];
    if (!m) return null;
    var arr = coletado[m];
    var v = Array.isArray(arr) ? arr[i] : arr;
    return typeof v === "number" ? v : null;
  }

  // ------------------------------------------------------------
  // Ajusta o código do tempo do dia pela concordância dos modelos
  // ------------------------------------------------------------
  function ajustarCodigo(codigo, prob, mm) {
    var c = codigo === null ? 3 : codigo;
    var choveu = c >= 51 && c <= 99;
    if (!choveu && prob >= 60 && mm >= 3) return mm >= 10 ? 95 : 81;   // modelos concordam em chuva
    if (!choveu && prob >= 45 && mm >= 1) return 80;
    if (choveu && prob < 20 && mm < 0.5) return 3;                       // só um modelo "viu" chuva
    return c;
  }

  // ------------------------------------------------------------
  // Transforma a resposta bruta no objeto usado pela tela
  // ------------------------------------------------------------
  function processar(dados, nomesPedidos) {
    var nomes = nomesPedidos.concat([MODELO_CODIGO]);
    var d = dados.daily || {};
    var h = dados.hourly || {};
    var c = dados.current || {};

    var tMax = coletar(d, "temperature_2m_max", Object.keys(MODELOS));
    var tMin = coletar(d, "temperature_2m_min", Object.keys(MODELOS));
    var mmDia = coletar(d, "precipitation_sum", Object.keys(MODELOS));
    var pMax = coletar(d, "precipitation_probability_max", nomes);
    var cod = coletar(d, "weather_code", nomes);

    // modelos que realmente trouxeram dados
    var usados = nosModelosDe(tMax).filter(function (m) {
      return numeros(Array.isArray(tMax[m]) ? tMax[m] : [tMax[m]]).length > 0;
    });
    if (!usados.length) throw new Error("resposta sem dados de temperatura");

    var datas = d.time || [];
    var dias = [];
    for (var i = 0; i < datas.length && i < DIAS_PREVISAO; i++) {
      var mmPorModelo = nesimo(mmDia, i);
      var mmValidos = numeros(mmPorModelo);
      var mm = agregar(mmValidos);
      var concordam = mmValidos.filter(function (v) { return v >= LIMIAR_CHUVA_DIA_MM; }).length;
      var prob1 = mmValidos.length ? (concordam / mmValidos.length) * 100 : null;
      var probEns = agregar(nesimo(pMax, i));
      var prob = prob1 === null ? (probEns === null ? 0 : probEns)
               : (probEns === null ? prob1 : (prob1 + probEns) / 2);
      prob = Math.round(prob);
      mm = mm === null ? 0 : mm;

      dias.push({
        iso: datas[i],
        max: arred(agregar(nesimo(tMax, i)), 0),
        min: arred(agregar(nesimo(tMin, i)), 0),
        mm: arred(mm, mm < 10 ? 1 : 0),
        prob: prob,
        modelosChuva: concordam,
        modelosTotal: mmValidos.length,
        codigo: ajustarCodigo(primeiroCodigo(cod, MODELO_CODIGO, i), prob, mm),
        porModelo: usados.map(function (m) {
          return {
            modelo: MODELOS[m] || m,
            max: arred(Array.isArray(tMax[m]) ? tMax[m][i] : null, 0),
            min: arred(Array.isArray(tMin[m]) ? tMin[m][i] : null, 0),
            mm: arred(mmDia[m] && Array.isArray(mmDia[m]) ? mmDia[m][i] : null, 1)
          };
        })
      });
    }

    // ----- por hora (média dos modelos; chuva por concordância) -----
    var hTemp = coletar(h, "temperature_2m", Object.keys(MODELOS));
    var hMm = coletar(h, "precipitation", Object.keys(MODELOS));
    var hProb = coletar(h, "precipitation_probability", nomes);
    var hCod = coletar(h, "weather_code", nomes);
    var horasPorDia = {};
    var linhaHoras = [];
    var tempos = h.time || [];
    for (var k = 0; k < tempos.length; k++) {
      var iso = tempos[k].slice(0, 10);
      var hh = parseInt(tempos[k].slice(11, 13), 10);
      var mmH = numeros(nesimo(hMm, k));
      var conc = mmH.filter(function (v) { return v >= LIMIAR_CHUVA_HORA_MM; }).length;
      var pc = mmH.length ? (conc / mmH.length) * 100 : null;
      var pe = agregar(nesimo(hProb, k));
      var chuva = pc === null ? (pe === null ? 0 : pe) : (pe === null ? pc : (pc + pe) / 2);
      var item = {
        iso: iso,
        hora: hh,
        temp: agregar(nesimo(hTemp, k)),
        codigo: primeiroCodigo(hCod, MODELO_CODIGO, k),
        chuva: Math.round(chuva),
        mm: agregar(mmH) || 0,
        t: tempos[k]
      };
      if (item.temp === null) continue;
      if (!horasPorDia[iso]) horasPorDia[iso] = [];
      horasPorDia[iso].push(item);
      linhaHoras.push(item);
    }

    // ----- agora -----
    var agora = null;
    if (dados.current) {
      var cTemp = agregar(nesimo(coletar(c, "temperature_2m", Object.keys(MODELOS)), 0));
      var cMm = agregar(nesimo(coletar(c, "precipitation", Object.keys(MODELOS)), 0));
      var codAgora = primeiroCodigo(coletar(c, "weather_code", nomes), MODELO_CODIGO, 0);
      if (cMm !== null && cMm >= 0.3 && (codAgora === null || codAgora < 51)) codAgora = 61;
      var diaFlag = nesimo(coletar(c, "is_day", nomes), 0).filter(function (v) { return v === 0 || v === 1; })[0];
      agora = {
        temp: arred(cTemp, 0),
        sensacao: arred(agregar(nesimo(coletar(c, "apparent_temperature", Object.keys(MODELOS)), 0)), 0),
        umidade: arred(agregar(nesimo(coletar(c, "relative_humidity_2m", Object.keys(MODELOS)), 0)), 0),
        vento: arred(agregar(nesimo(coletar(c, "wind_speed_10m", Object.keys(MODELOS)), 0)), 0),
        rajada: arred(agregar(nesimo(coletar(c, "wind_gusts_10m", Object.keys(MODELOS)), 0)), 0),
        chuvaMm: arred(cMm, 1),
        codigo: codAgora === null ? 0 : codAgora,
        dia: diaFlag === undefined ? 1 : diaFlag,
        hora: c.time || null
      };
      if (agora.temp === null && dias.length) agora.temp = dias[0].max;
    }

    return {
      atualizadoEm: Date.now(),
      modelos: usados.map(function (m) { return MODELOS[m] || m; }),
      agora: agora,
      dias: dias,
      horas: horasPorDia,
      alerta: calcularAlerta(linhaHoras, agora)
    };
  }

  // Primeira hora (a partir de agora) em que a maioria dos modelos prevê chuva.
  function calcularAlerta(linhaHoras, agora) {
    if (!linhaHoras.length) return null;
    var ref = agora && agora.hora ? agora.hora.slice(0, 13) : null;   // "2026-11-01T16"
    var inicio = 0;
    if (ref) {
      for (var i = 0; i < linhaHoras.length; i++) {
        if (linhaHoras[i].t.slice(0, 13) >= ref) { inicio = i; break; }
      }
    }
    if (agora && agora.chuvaMm !== null && agora.chuvaMm >= 0.3) {
      return { tipo: "agora", hora: linhaHoras[inicio].hora, iso: linhaHoras[inicio].iso };
    }
    for (var j = inicio; j < linhaHoras.length && j < inicio + 12; j++) {
      if (linhaHoras[j].chuva >= 50 && linhaHoras[j].mm >= LIMIAR_CHUVA_HORA_MM) {
        return { tipo: "proxima", hora: linhaHoras[j].hora, iso: linhaHoras[j].iso, prob: linhaHoras[j].chuva };
      }
    }
    return null;
  }

  // ------------------------------------------------------------
  // Busca (com tentativa de reparo se um nome de modelo for recusado)
  // ------------------------------------------------------------
  function montarUrl(nomes) {
    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT + "&longitude=" + LON +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day" +
      "&hourly=temperature_2m,precipitation,precipitation_probability,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max" +
      "&timezone=" + encodeURIComponent(FUSO) +
      "&forecast_days=" + (DIAS_PREVISAO + 1);
    if (nomes && nomes.length) url += "&models=" + nomes.join(",");
    return url;
  }

  function pegar(url) {
    return fetch(url, { cache: "no-store" }).then(function (resp) {
      return resp.json().catch(function () { return {}; }).then(function (corpo) {
        if (!resp.ok || corpo.error) {
          var e = new Error((corpo && corpo.reason) || ("resposta " + resp.status));
          e.reason = corpo && corpo.reason;
          throw e;
        }
        return corpo;
      });
    });
  }

  function buscarModelos(nomes, tentativas) {
    var lista = nomes.concat([MODELO_CODIGO]);
    return pegar(montarUrl(lista)).then(function (dados) {
      return processar(dados, nomes);
    }, function (err) {
      // Se a API recusou um nome de modelo, tira esse nome e tenta de novo.
      var motivo = String(err && err.reason || "");
      var culpado = nomes.filter(function (m) { return motivo.indexOf(m) !== -1; })[0];
      if (culpado && tentativas > 0 && nomes.length > 1) {
        console.warn("Modelo recusado pela API, removendo:", culpado);
        return buscarModelos(nomes.filter(function (m) { return m !== culpado; }), tentativas - 1);
      }
      throw err;
    });
  }

  function buscarSimples() {
    // modo de segurança: um modelo só (como era antes), sem parâmetro "models"
    return pegar(montarUrl(null)).then(function (dados) {
      var r = processar(dados, []);
      return r;
    });
  }

  function buscar() {
    return buscarModelos(Object.keys(MODELOS), 2).catch(function (err) {
      console.warn("Previsão com vários modelos indisponível, usando modo simples:", err && err.message);
      return buscarSimples();
    });
  }

  function lerCache() {
    try {
      var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (c && c.atualizadoEm && Date.now() - c.atualizadoEm < CACHE_MS) return c;
    } catch (e) { /* sem cache */ }
    return null;
  }

  function gravarCache(obj) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch (e) { /* ignora */ }
  }

  function obter(forcar) {
    if (!forcar) {
      var c = lerCache();
      if (c) return Promise.resolve(c);
    }
    if (emVoo) return emVoo;
    emVoo = buscar().then(function (obj) {
      gravarCache(obj);
      emVoo = null;
      return obj;
    }, function (err) {
      emVoo = null;
      throw err;
    });
    return emVoo;
  }

  global.uvzClima = {
    LAT: LAT,
    LON: LON,
    obter: obter,
    // expostos para teste
    _processar: processar,
    _agregar: agregar,
    _ajustarCodigo: ajustarCodigo
  };
})(typeof window !== "undefined" ? window : globalThis);
