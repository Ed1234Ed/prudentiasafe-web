/* Prudentia Safe · Sitio web 4.0 */
(function () {
  "use strict";
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function fmt(n, dec) {
    var s = Number(n).toFixed(dec || 0).split(".");
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return s.join(",");
  }
  var NS = "http://www.w3.org/2000/svg";
  function svgEl(n, at) { var e = document.createElementNS(NS, n); for (var k in at) e.setAttribute(k, at[k]); return e; }

  /* ---------- Tema ---------- */
  var raiz = document.documentElement;
  function marcarTema() {
    var t = raiz.getAttribute("data-theme") || "auto";
    $$(".tema button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-tema") === t ? "true" : "false"); });
  }
  $$(".tema button").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-tema");
      if (t === "auto") raiz.removeAttribute("data-theme"); else raiz.setAttribute("data-theme", t);
      try { if (t === "auto") localStorage.removeItem("tema"); else localStorage.setItem("tema", t); } catch (e) {}
      marcarTema(); if (window.redibujarGrafico) window.redibujarGrafico();
    });
  });
  marcarTema();

  /* ---------- Cabecera ---------- */
  var cab = $("#cab");
  function cabecera() { cab.classList.toggle("solida", window.scrollY > 24); }
  window.addEventListener("scroll", cabecera, { passive: true }); cabecera();

  var enlaces = $$(".cab__nav a"), mapa = {};
  enlaces.forEach(function (a) { var h = a.getAttribute("href"); if (h.charAt(0) === "#") mapa[h.slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var on = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && mapa[e.target.id]) { enlaces.forEach(function (x) { x.removeAttribute("aria-current"); }); mapa[e.target.id].setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(mapa).forEach(function (id) { var s = document.getElementById(id); if (s) on.observe(s); });
  }

  /* ---------- Diálogos: menú y hoja lateral ---------- */
  var ultimoFoco = null;
  function atrapar(contenedor, e) {
    if (e.key !== "Tab") return;
    var f = $$("a[href], button:not([disabled]), input, select, textarea", contenedor).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var p = f[0], u = f[f.length - 1];
    if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
    else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
  }
  var menu = $("#menu"), abrirMenu = $("#abrir-menu");
  function cerrarMenu() { menu.classList.remove("abierto"); abrirMenu.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; setTimeout(function () { menu.hidden = true; }, 200); if (ultimoFoco) ultimoFoco.focus(); }
  abrirMenu.addEventListener("click", function () {
    ultimoFoco = abrirMenu; menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add("abierto"); });
    abrirMenu.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden";
    $("#cerrar-menu").focus();
  });
  $("#cerrar-menu").addEventListener("click", cerrarMenu);
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) cerrarMenu(); });
  menu.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarMenu(); atrapar(menu, e); });

  var hoja = $("#hoja");
  function abrirHoja(origen) {
    ultimoFoco = origen || document.activeElement;
    if (menu.classList.contains("abierto")) { menu.classList.remove("abierto"); menu.hidden = true; }
    hoja.classList.add("abierta"); hoja.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    setTimeout(function () { $("#f-nombre").focus(); }, 250);
  }
  function cerrarHoja() { hoja.classList.remove("abierta"); hoja.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (ultimoFoco) ultimoFoco.focus(); }
  $$("[data-abrir-hoja]").forEach(function (b) { b.addEventListener("click", function () { abrirHoja(b); }); });
  $$("[data-cerrar-hoja]").forEach(function (b) { b.addEventListener("click", cerrarHoja); });
  hoja.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarHoja(); atrapar(hoja, e); });

  /* ---------- Carrusel de la portada ---------- */
  var diapos = $$(".diapo"), avances = $$("#avances button"), rotulo = $("#rotulo"), actual = 0, pausado = reducir, t0 = 0, DUR = 7000, raf;
  var btnPausa = $("#pausa");
  function mostrar(i) {
    actual = (i + diapos.length) % diapos.length;
    diapos.forEach(function (d, k) {
      var on = k === actual; d.classList.toggle("activa", on); d.setAttribute("aria-hidden", on ? "false" : "true");
      var v = $("video", d); if (v) { if (on && !pausado) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else if (!on) v.pause(); }
    });
    avances.forEach(function (b, k) { b.classList.toggle("hecho", k < actual); $("span", b).style.width = k < actual ? "100%" : "0"; if (k === actual) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    rotulo.textContent = diapos[actual].getAttribute("data-rotulo");
    t0 = performance.now();
  }
  function ciclo(t) {
    if (!pausado) {
      var p = Math.min(1, (t - t0) / DUR);
      $("span", avances[actual]).style.width = (p * 100) + "%";
      if (p >= 1) mostrar(actual + 1);
    } else t0 = t - (parseFloat($("span", avances[actual]).style.width) || 0) / 100 * DUR;
    raf = requestAnimationFrame(ciclo);
  }
  function pausar(v) {
    pausado = v; btnPausa.setAttribute("aria-pressed", v ? "true" : "false");
    btnPausa.setAttribute("aria-label", v ? "Reanudar el carrusel" : "Pausar el carrusel");
    btnPausa.innerHTML = v ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    var v0 = $("video", diapos[actual]); if (v0) { if (v) v0.pause(); else { var p = v0.play(); if (p && p.catch) p.catch(function () {}); } }
  }
  if (diapos.length) {
    mostrar(0);
    if (reducir) pausar(true);
    raf = requestAnimationFrame(ciclo);
    $("#siguiente").addEventListener("click", function () { mostrar(actual + 1); });
    $("#anterior").addEventListener("click", function () { mostrar(actual - 1); });
    btnPausa.addEventListener("click", function () { pausar(!pausado); });
    avances.forEach(function (b, k) { b.addEventListener("click", function () { mostrar(k); }); });
    var portada = $(".portada");
    portada.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") mostrar(actual + 1); else if (e.key === "ArrowLeft") mostrar(actual - 1);
    });
    var x0 = null;
    portada.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    portada.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1)); x0 = null; }, { passive: true });
    document.addEventListener("visibilitychange", function () { if (document.hidden) t0 = performance.now(); });
  }

  /* ---------- Revelados y contadores ---------- */
  function contar(el) {
    var fin = parseFloat(el.getAttribute("data-contar")), suf = el.getAttribute("data-sufijo") || "";
    if (reducir) { el.textContent = fmt(fin) + suf; return; }
    var ini = null;
    function paso(t) { if (!ini) ini = t; var p = Math.min(1, (t - ini) / 1400), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(fin * e)) + suf; if (p < 1) requestAnimationFrame(paso); }
    requestAnimationFrame(paso);
  }
  $$(".compromisos__lista, .kpis, .claves, .modulos, .fichas-mini, .pasos, .auto__beneficios").forEach(function (g) {
    $$(".revela", g).forEach(function (r, k) { r.style.setProperty("--rd", (k * 0.07) + "s"); });
  });
  var objetivos = $$(".revela, [data-contar], .barras");
  if (!("IntersectionObserver" in window) || reducir) objetivos.forEach(function (o) { o.classList.add("visto"); });
  else {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("visto");
        if (e.target.hasAttribute("data-contar")) contar(e.target);
        obs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .1 });
    objetivos.forEach(function (o) { obs.observe(o); });
  }

  /* ---------- Paralaje leve y proceso ---------- */
  var fondos = $$(".foto-fondo > picture img"), pasos = $("#pasos");
  function cuadro() {
    var vh = window.innerHeight;
    if (!reducir) fondos.forEach(function (img) {
      var r = img.parentNode.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      img.style.transform = "translateY(" + ((r.top + r.height / 2 - vh / 2) * -0.06).toFixed(1) + "px)";
    });
    if (pasos) {
      var rp = pasos.getBoundingClientRect();
      var av = Math.max(0, Math.min(1, (vh * 0.75 - rp.top) / (rp.height + vh * 0.2)));
      if (reducir) av = 1;
      pasos.style.setProperty("--av", av.toFixed(3));
      $$(".paso", pasos).forEach(function (li, k, t) { li.classList.toggle("hecho", av >= k / t.length + 0.02); });
    }
  }
  var pend = false;
  window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(function () { cuadro(); pend = false; }); } }, { passive: true });
  window.addEventListener("resize", cuadro); cuadro();

  /* Video del cierre: carga diferida */
  $$("video[data-diferido]").forEach(function (v) {
    if (reducir || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      $$("source[data-src]", v).forEach(function (s) { s.src = s.getAttribute("data-src"); });
      v.load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); o.disconnect();
    }, { rootMargin: "300px" });
    o.observe(v);
  });

  
  var PS = window.PS || {};
  function nb(s) { return String(s).replace(/N\.\s?°\s/g, "N.⁠° ").replace(/D\.S\. /g, "D. S. ").replace(/R\.M\. /g, "R. M. ").replace(/D\.U\. /g, "D. U. "); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function ico(p) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>"; }
  var IC = {
    org: ico('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 14.5c3 0 6 2 6 5.5"/>'),
    prev: ico('<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'),
    pers: ico('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>'),
    reg: ico('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    ctrl: ico('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/><path d="m8.5 11 2 2 3.5-3.5"/>'),
    check: ico('<path d="m5 12 4.5 4.5L19 7"/>'),
    x: ico('<path d="M6 6l12 12M18 6 6 18"/>'),
    ayuda: ico('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17h.01"/>'),
    flecha: ico('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    atras: ico('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>'),
    imprimir: ico('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'),
    reloj: ico('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    candado: ico('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    rayo: ico('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>')
  };

  /* ---------- Pestañas (cada grupo por separado) ---------- */
  function grupoTabs(lista, alActivar) {
    var tabs = $$("[role=tab]", lista);
    function activar(t) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute("aria-controls")); p.hidden = !on;
        if (on) { $$(".barras", p).forEach(function (b) { b.classList.remove("visto"); void b.offsetWidth; b.classList.add("visto"); }); if (alActivar) alActivar(p); }
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activar(t); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; activar(n); n.focus(); }
      });
    });
  }
  $$("[role=tablist]").forEach(function (l) {
    grupoTabs(l, function (p) { if (p.id === "v-anual") dibujar(true); if (p.id === "v-mes") dibujarMes(true); });
  });

  /* ---------- Gráfico anual ---------- */
  var anual = PS.anual || [];
  var titulos = { total: "Notificaciones totales por año", mortales: "Accidentes de trabajo mortales por año", incidentes: "Incidentes peligrosos por año" };
  var lienzo = $("#grafico"), serie = "total", dibujado = false;
  function dibujar(animar) {
    if (!lienzo || lienzo.offsetParent === null) return;
    var W = lienzo.clientWidth, H = lienzo.clientHeight, m = { t: 30, r: 8, b: 34, l: W < 500 ? 44 : 56 };
    var max = Math.max.apply(null, anual.map(function (d) { return d[serie]; }));
    var paso = serie === "total" ? 10000 : 100, techo = Math.ceil(max / paso) * paso;
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": titulos[serie] + ", de 2019 a 2025" });
    for (var v = 0; v <= techo; v += paso) {
      var y = m.t + ih - v / techo * ih;
      svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, class: "g-eje" }));
      var et = svgEl("text", { x: m.l - 10, y: y + 4, "text-anchor": "end", class: "g-et" }); et.textContent = fmt(v); svg.appendChild(et);
    }
    var bw = iw / anual.length, ancho = Math.min(56, bw * 0.55);
    anual.forEach(function (d, k) {
      var x = m.l + bw * k + (bw - ancho) / 2, h = d[serie] / techo * ih, y = m.t + ih - h;
      var r = svgEl("rect", { x: x, y: y, width: ancho, height: h, rx: 6, class: "g-barra" + (k === anual.length - 1 ? " ultima" : "") });
      var tt = svgEl("title", {}); tt.textContent = d.a + ": " + fmt(d[serie]); r.appendChild(tt);
      if (animar && !reducir) {
        r.style.transformOrigin = (x + ancho / 2) + "px " + (m.t + ih) + "px";
        r.style.transform = "scaleY(0)"; r.style.transition = "transform .9s cubic-bezier(.2,.8,.2,1) " + (k * 0.07) + "s";
      }
      svg.appendChild(r);
      var tv = svgEl("text", { x: x + ancho / 2, y: y - 10, class: "g-valor" }); tv.textContent = fmt(d[serie]); svg.appendChild(tv);
      var ta = svgEl("text", { x: x + ancho / 2, y: H - 10, "text-anchor": "middle", class: "g-anio" }); ta.textContent = d.a; svg.appendChild(ta);
    });
    lienzo.innerHTML = ""; lienzo.appendChild(svg);
    if (animar && !reducir) requestAnimationFrame(function () { requestAnimationFrame(function () { $$("rect", svg).forEach(function (r) { r.style.transform = "scaleY(1)"; }); }); });
    dibujado = true;
  }

  /* ---------- Gráfico mensual 2025 y 2026 ---------- */
  var lienzoM = $("#grafico-mes"), mserie = "total", m25 = PS.mensual2025 || [], m26 = PS.mensual2026 || [];
  var titulosM = { total: "Notificaciones por mes", mortales: "Accidentes mortales por mes" };
  function dibujarMes(animar) {
    if (!lienzoM || lienzoM.offsetParent === null) return;
    var W = lienzoM.clientWidth, H = lienzoM.clientHeight, m = { t: 26, r: 14, b: 34, l: W < 500 ? 40 : 52 };
    var vals = m25.concat(m26).map(function (d) { return d[mserie]; });
    var paso = mserie === "total" ? 1000 : 10, techo = Math.ceil(Math.max.apply(null, vals) / paso) * paso;
    var iw = W - m.l - m.r, ih = H - m.t - m.b, sx = iw / 11;
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": titulosM[mserie] + " en 2025 y de enero a julio de 2026" });
    for (var v = 0; v <= techo; v += paso * (mserie === "total" ? 1 : 1)) {
      var y = m.t + ih - v / techo * ih;
      svg.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, class: "g-eje" }));
      var et = svgEl("text", { x: m.l - 10, y: y + 4, "text-anchor": "end", class: "g-et" }); et.textContent = fmt(v); svg.appendChild(et);
    }
    m25.forEach(function (d, k) { if (W < 500 && k % 2) return; var t = svgEl("text", { x: m.l + sx * k, y: H - 10, "text-anchor": "middle", class: "g-anio" }); t.textContent = d.m; svg.appendChild(t); });
    function linea(datos, cls, etiqueta) {
      var pts = datos.map(function (d, k) { return [m.l + sx * k, m.t + ih - d[mserie] / techo * ih]; });
      var dstr = pts.map(function (p, k) { return (k ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
      var area = svgEl("path", { d: dstr + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (m.t + ih) + " L" + pts[0][0].toFixed(1) + " " + (m.t + ih) + " Z", class: "g-area " + cls });
      svg.appendChild(area);
      var l = svgEl("path", { d: dstr, class: "g-linea " + cls });
      svg.appendChild(l);
      if (animar && !reducir) { var L = l.getTotalLength ? 2000 : 0; l.style.strokeDasharray = L; l.style.strokeDashoffset = L; l.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)"; }
      pts.forEach(function (p, k) {
        var c = svgEl("circle", { cx: p[0], cy: p[1], r: 4.5, class: "g-punto " + cls });
        var tt = svgEl("title", {}); tt.textContent = datos[k].m + " " + etiqueta + ": " + fmt(datos[k][mserie]); c.appendChild(tt);
        svg.appendChild(c);
      });
      return l;
    }
    var l1 = linea(m25, "s25", "2025"), l2 = linea(m26, "s26", "2026");
    var u = m26.length - 1, pu = [m.l + sx * u, m.t + ih - m26[u][mserie] / techo * ih];
    var tu = svgEl("text", { x: pu[0], y: pu[1] - 12, class: "g-valor s26t" }); tu.textContent = fmt(m26[u][mserie]); svg.appendChild(tu);
    lienzoM.innerHTML = ""; lienzoM.appendChild(svg);
    if (animar && !reducir) requestAnimationFrame(function () { requestAnimationFrame(function () { [l1, l2].forEach(function (l) { l.style.strokeDashoffset = 0; }); }); });
  }
  window.redibujarGrafico = function () { dibujar(false); dibujarMes(false); };
  if (lienzo) {
    var og = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { dibujar(true); og.disconnect(); } }, { threshold: .3 });
    og.observe(lienzo);
    $$("[data-serie]").forEach(function (b) {
      b.addEventListener("click", function () {
        serie = b.getAttribute("data-serie");
        $$("[data-serie]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $("#grafico-titulo").textContent = titulos[serie]; dibujar(true);
      });
    });
    $$("[data-mserie]").forEach(function (b) {
      b.addEventListener("click", function () {
        mserie = b.getAttribute("data-mserie");
        $$("[data-mserie]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $("#mes-titulo").textContent = titulosM[mserie]; dibujarMes(true);
      });
    });
    var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (dibujado) dibujar(false); dibujarMes(false); }, 150); });
  }

  /* ---------- Barras horizontales ---------- */
  function barras(ol, filas, unidad) {
    var max = filas[0][2];
    ol.innerHTML = filas.map(function (f, k) {
      return '<li><div class="barra__fila"><span class="barra__t">' + f[0] + '</span><span class="barra__v">' + fmt(f[2], 1) + '\u00a0%</span></div>' +
        '<div class="barra__pista"><span style="--p:' + (f[2] / max * 100).toFixed(1) + '%;--rd:' + (k * 0.06) + 's"></span></div>' +
        '<span class="barra__c">' + fmt(f[1]) + ' ' + unidad + '</span></li>';
    }).join("");
    ol.classList.remove("visto"); void ol.offsetWidth;
    requestAnimationFrame(function () { if (ol.offsetParent !== null) ol.classList.add("visto"); });
  }
  var formas = [
    ["Caídas de personas", 7773], ["Esfuerzos excesivos o falsos movimientos", 4151], ["Pisadas, choques o golpes por objetos", 3483],
    ["Caídas de objetos", 3387], ["Objetos punzocortantes", 2776], ["Atrapamiento por o entre objetos", 1353],
    ["Exposición a temperaturas extremas", 923], ["Sustancias nocivas o radiaciones", 615], ["Contacto con corriente eléctrica", 133]
  ];
  var olF = $("#barras-forma"), olM = $("#barras-muertes");
  if (olF) {
    var base = formas.reduce(function (s, f) { return s + f[1]; }, 0);
    barras(olF, formas.map(function (f) { return [f[0], f[1], Math.round(f[1] / base * 1000) / 10]; }), "accidentes");
  }
  if (olM && PS.formasMortales) {
    var fm = PS.formasMortales.filter(function (f) { return !/^No clasificadas/.test(f.forma) && f.n >= 2; });
    var bm = PS.formasMortales.filter(function (f) { return !/^No clasificadas/.test(f.forma); }).reduce(function (s, f) { return s + f.n; }, 0);
    barras(olM, fm.map(function (f) { return [f.forma, f.n, Math.round(f.n / bm * 1000) / 10]; }), "accidentes mortales");
  }

  /* ---------- Parte del cuerpo ---------- */
  var partes = [
    { id: "dedos", n: "Dedos de la mano", x: 25.7, y: 58.9, p: 16.7, c: 7328, causa: "Atrapamientos y cortes en máquinas, herramientas y puertas.", m: ["Guardas fijas en partes móviles", "Bloqueo y etiquetado antes de intervenir un equipo", "Guantes elegidos según el riesgo, no por costumbre"] },
    { id: "ojos", n: "Ojos", x: 53.6, y: 10.4, p: 7.5, c: 3298, causa: "Proyección de partículas, salpicaduras de sustancias y polvo.", m: ["Pantallas en esmeriles y tornos", "Lentes o caretas adecuados a la tarea", "Lavaojos accesible y señalizado"] },
    { id: "rodilla", n: "Rodilla", x: 33.7, y: 74.1, p: 6.5, c: 2827, causa: "Caídas al mismo nivel y golpes contra objetos.", m: ["Orden y limpieza en pasillos", "Pisos antideslizantes y sin desniveles", "Iluminación suficiente en zonas de tránsito"] },
    { id: "tobillo", n: "Tobillo", x: 76.5, y: 88.8, p: 6.2, c: 2693, causa: "Pisadas en superficies irregulares, escaleras y rampas.", m: ["Calzado de seguridad con buena sujeción", "Pasamanos y peldaños en buen estado", "Señalización de desniveles"] },
    { id: "mano", n: "Mano", x: 75.2, y: 54.7, p: 5.9, c: 2599, causa: "Golpes, cortes y contacto con superficies calientes.", m: ["Herramientas en buen estado y adecuadas", "Procedimiento para manipular piezas", "Guantes con protección mecánica o térmica"] },
    { id: "lumbar", n: "Región lumbosacra", x: 50.1, y: 50.9, p: 5.9, c: 2574, causa: "Esfuerzos al levantar, empujar o girar con carga.", m: ["Ayudas mecánicas para cargas pesadas", "Límites de peso y levantamiento entre dos", "Pausas y rotación en tareas repetitivas"] },
    { id: "cabeza", n: "Cabeza (ubicaciones múltiples)", x: 50.1, y: 4.2, p: 5.2, c: 2288, causa: "Caída de objetos y golpes contra estructuras.", m: ["Rodapiés y redes en trabajos en altura", "Almacenamiento seguro de materiales en altura", "Casco con barbiquejo"] }
  ];
  var fig = $("#figura"), panelC = $("#cuerpo-panel"), listaC = $("#cuerpo-lista");
  function mostrarParte(id) {
    var d = partes.filter(function (x) { return x.id === id; })[0];
    $$(".punto", fig).concat($$("button", listaC)).forEach(function (p) { var on = p.getAttribute("data-id") === id; p.classList.toggle("activo", on); p.setAttribute("aria-pressed", on ? "true" : "false"); });
    panelC.innerHTML = '<h3>' + d.n + '</h3><div class="valor tnum">' + fmt(d.p, 1) + '\u00a0%</div><div class="cuenta">' + fmt(d.c) + ' accidentes no mortales en 2025</div><p>' + d.causa + '</p><ul class="lista-marcas">' + d.m.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
  }
  if (fig) {
    partes.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "punto"; b.setAttribute("data-id", d.id);
      b.setAttribute("aria-label", d.n + ", " + fmt(d.p, 1) + " por ciento");
      b.style.left = d.x + "%"; b.style.top = d.y + "%";
      b.style.setProperty("--t", (1.05 + d.p * 0.045).toFixed(2) + "rem");
      b.addEventListener("click", function () { mostrarParte(d.id); });
      fig.appendChild(b);
    });
    listaC.innerHTML = partes.map(function (d) { return '<button type="button" data-id="' + d.id + '" aria-pressed="false"><span>' + d.n + '</span><b>' + fmt(d.p, 1) + '\u00a0%</b></button>'; }).join("");
    $$("button", listaC).forEach(function (l) { l.addEventListener("click", function () { mostrarParte(l.getAttribute("data-id")); }); });
    mostrarParte("dedos");
  }

  /* ---------- Lo que exige la ley ---------- */
  var leyN = $("#ley-n"), leyV = $("#ley-n-v"), oblig = $("#obligaciones"), resumenLey = $("#resumen-ley");
  var NN = "N.⁠° ";
  function etiquetaN(v) { return v >= 500 ? "500 o más" : String(v); }
  function rango() { var v = parseInt(leyN.value, 10); leyV.textContent = etiquetaN(v); leyN.style.setProperty("--v", ((v - 1) / 499 * 100) + "%"); }
  var gruposLey = [
    { k: "org", t: "Organización y participación", i: IC.org },
    { k: "prev", t: "Prevención de riesgos", i: IC.prev },
    { k: "pers", t: "Personas: formación y salud", i: IC.pers },
    { k: "reg", t: "Registros y notificación", i: IC.reg },
    { k: "ctrl", t: "Investigación y auditoría", i: IC.ctrl }
  ];
  function obligaciones() {
    var n = parseInt(leyN.value, 10), t = $("input[name=ley-t]:checked").value, r = $("input[name=ley-r]:checked").value === "si";
    var mype = t === "micro" || t === "pequena";
    rango();
    var L = [];
    L.push(["org", "Política de seguridad y salud en el trabajo", "Escrita, fechada, firmada por la máxima autoridad de la empresa y difundida a todos los trabajadores.", "Ley " + NN + "29783, arts. 22 y 23"]);
    if (n >= 20) L.push(["org", "Comité paritario de SST", "De 4 a 12 miembros, la mitad elegidos por los trabajadores. Se reúne una vez al mes y aprueba el programa anual.", "Ley " + NN + "29783, art. 29; Reglamento, arts. 38, 43 y 68", 1]);
    else L.push(["org", "Supervisor de SST", "Con menos de 20 trabajadores, los propios trabajadores eligen a un supervisor de seguridad y salud en el trabajo.", "Ley " + NN + "29783, art. 30; Reglamento, art. 39", 1]);
    if (n >= 20) L.push(["org", "Reglamento Interno de SST", "Obligatorio desde 20 trabajadores. Se entrega una copia a cada trabajador, incluidos los de contratistas.", "Ley " + NN + "29783, arts. 34 y 35; Reglamento, arts. 74 y 75", 1]);
    L.push(["prev", "IPERC y mapa de riesgos", "Identificación de peligros y evaluación de riesgos por puesto, actualizada al menos una vez al año, con un mapa de riesgos visible.", "Ley " + NN + "29783, arts. 35 y 57; Reglamento, art. 77"]);
    L.push(["prev", "Programa anual de SST", "Actividades, responsables, plazos y recursos del año, con metas que se puedan medir.", "Reglamento, art. 32, literal f"]);
    L.push(["prev", "Equipos de protección personal", "Adecuados al riesgo, conformes con las normas técnicas peruanas y pagados en su totalidad por el empleador.", "Ley " + NN + "29783, art. 60, modificado por la Ley " + NN + "31246"]);
    L.push(["pers", "Cuatro capacitaciones al año como mínimo", "En seguridad y salud en el trabajo, dentro de la jornada laboral y a cargo del empleador.", "Ley " + NN + "29783, arts. 27 y 35; Reglamento, art. 28"]);
    L.push(["pers", "Exámenes médicos ocupacionales", r ? "Por ser actividad de alto riesgo: antes, durante y al término de la relación laboral, a cargo del empleador." : "Cada dos años, a cargo del empleador. El de salida solo si el trabajador lo pide por escrito.", "Ley " + NN + "29783, art. 49, literal d, modificado por las Leyes " + NN + "30222 y " + NN + "31246; Reglamento, art. 101", r ? 1 : 0]);
    if (mype) L.push(["reg", "Registros en formato simplificado", "Como " + (t === "micro" ? "microempresa" : "pequeña empresa") + " inscrita en el REMYPE puede usar el sistema simplificado de registros, en papel o digital.", "R. M. " + NN + "085-2013-TR", 1]);
    else L.push(["reg", "Ocho registros obligatorios", "Accidentes e incidentes, exámenes médicos, monitoreo de agentes, inspecciones, estadísticas, equipos de emergencia, capacitaciones y simulacros, y auditorías.", "Reglamento, art. 33; R. M. " + NN + "050-2013-TR", 1]);
    L.push(["reg", "Conservación de registros", "Enfermedades ocupacionales, 20 años; accidentes e incidentes peligrosos, 10 años; los demás, 5 años.", "Reglamento, art. 35"]);
    L.push(["reg", "Notificación al Ministerio de Trabajo", "Accidentes mortales e incidentes peligrosos: el empleador, dentro de las 24 horas. Accidentes no mortales: el centro médico, hasta el último día hábil del mes siguiente.", "Reglamento, art. 110"]);
    L.push(["ctrl", "Investigación de accidentes e incidentes", "Determinar las causas y adoptar medidas correctivas, con participación del comité o del supervisor.", "Ley " + NN + "29783, art. 58; Reglamento, art. 33, literal a"]);
    var aud = r ? ["Auditoría externa cada dos años", "Por realizar actividades de alto riesgo, a cargo de un auditor independiente registrado ante el MTPE."]
      : n <= 10 ? ["Auditoría externa solo si la dispone la Inspección", "Con hasta diez trabajadores y sin actividades de alto riesgo, se realiza cuando la autoridad lo ordena."]
      : ["Auditoría externa cada tres años", "A cargo de un auditor independiente registrado ante el MTPE."];
    L.push(["ctrl", aud[0], aud[1], "D. S. " + NN + "014-2013-TR, art. 15", 1]);
    var k = 0;
    oblig.innerHTML = gruposLey.map(function (g) {
      var items = L.filter(function (o) { return o[0] === g.k; });
      return '<section class="grupo-ley"><header><span class="icono">' + g.i + '</span><h3>' + g.t + '</h3><span class="grupo-ley__n">' + items.length + '</span></header><ul>' +
        items.map(function (o) { k++; return '<li class="ob' + (o[4] ? " ob--cambia" : "") + '" style="--i:' + k + '"><span class="ob__chk">' + IC.check + '</span><div><h4>' + o[1] + (o[4] ? ' <span class="marca-cambia" title="Cambia con sus datos">Cambia</span>' : "") + '</h4><p>' + o[2] + '</p><small>' + o[3] + '</small></div></li>'; }).join("") + "</ul></section>";
    }).join("");
    var cambia = L.filter(function (o) { return o[4]; }).length;
    resumenLey.innerHTML = '<div class="resumen-ley__n"><strong class="tnum">' + L.length + '</strong><span>obligaciones para su empresa</span></div>' +
      '<ul><li><b>' + (n >= 20 ? "Comité paritario" : "Supervisor de SST") + '</b><span>' + (n >= 20 ? "desde 20 trabajadores" : "menos de 20 trabajadores") + '</span></li>' +
      '<li><b>' + (mype ? "Registros simplificados" : "Ocho registros") + '</b><span>' + (mype ? "por ser MYPE en el REMYPE" : "formatos completos") + '</span></li>' +
      '<li><b>' + aud[0].replace("Auditoría externa ", "Auditoría ") + '</b><span>' + (r ? "por alto riesgo" : n <= 10 ? "hasta 10 trabajadores" : "sin alto riesgo") + '</span></li></ul>' +
      '<p>' + cambia + ' de ellas dependen de los datos que eligió.</p>';
  }
  if (leyN) {
    var tl;
    leyN.addEventListener("input", function () { rango(); clearTimeout(tl); tl = setTimeout(obligaciones, 140); });
    $$("#ley-form input[type=radio]").forEach(function (i) { i.addEventListener("change", obligaciones); });
    obligaciones();
  }

  /* ---------- Calculadora de multas ---------- */
  var MU = PS.multas || {}, UIT = (MU.uit && MU.uit.valor_soles) || 5500, TB = MU.tabla || {};
  var TT = { micro: TB.micro, pequena: TB.pequena, nomype: TB.no_mype };
  var LIM = { micro: [1, 2, 3, 4, 5, 6, 7, 8, 9, Infinity], pequena: [5, 10, 20, 30, 40, 50, 60, 70, 99, Infinity], nomype: [10, 25, 50, 100, 200, 300, 400, 500, 999, Infinity] };
  var INF = (MU.infracciones || []).map(function (i) { return { num: i.numeral, g: i.gravedad === "muy grave" ? "muy_grave" : i.gravedad, texto: nb(i.texto), nota: i.nota ? nb(i.nota) : "" }; });
  var gNom = { leve: "leve", grave: "grave", muy_grave: "muy grave" }, TOPE = { leve: 50, grave: 100, muy_grave: 200 }, REI = { leve: 1.25, grave: 1.5, muy_grave: 2 };
  var cInf = $("#c-inf"), cN = $("#c-n"), cRei = $("#c-rei"), cSol = $("#calc-soles"), solesAct = 0, listaMultas = [], actualMulta = null;
  function corto(t) { t = t.replace(/\s+/g, " "); return t.length > 92 ? t.slice(0, 92).replace(/[\s,;.]+\S*$/, "") + "…" : t; }
  function animarSoles(fin) {
    var ini = solesAct, s0 = null; solesAct = fin;
    if (reducir) { cSol.textContent = "S/ " + fmt(fin, 2); return; }
    (function paso(t) { if (!s0) s0 = t; var p = Math.min(1, (t - s0) / 500), e = 1 - Math.pow(1 - p, 3); cSol.textContent = "S/ " + fmt(ini + (fin - ini) * e, 2); if (p < 1) requestAnimationFrame(paso); })(performance.now());
  }
  function multa() {
    var t = $("input[name=c-t]:checked").value, inf = INF[parseInt(cInf.value, 10)];
    var muerte = $("#c-muerte") && $("#c-muerte").checked;
    var reglaC = inf.num === "28.11" || (inf.num === "28.10" && muerte);
    var n = Math.max(1, parseInt(cN.value, 10) || 1);
    var tabla = reglaC ? "nomype" : t, T = TT[tabla], i = 0;
    while (n > LIM[tabla][i]) i++;
    var uit = T[inf.g][i];
    if (reglaC && t !== "nomype") uit = uit * 0.75;
    var rei = cRei.checked;
    if (rei) uit = uit * REI[inf.g];
    var topado = uit > TOPE[inf.g];
    uit = Math.min(uit, TOPE[inf.g]);
    return { inf: inf, t: t, n: n, tramo: T.tramos[i], uit: uit, reglaC: reglaC, rei: rei, topado: topado, subsanable: !reglaC };
  }
  function calcular() {
    if (!cInf.value) return;
    var r = multa(); actualMulta = r;
    var soles = r.uit * UIT;
    animarSoles(soles);
    $("#calc-uit").textContent = fmt(r.uit, r.uit < 0.1 ? 3 : 2) + " UIT";
    $("#calc-barra").style.width = Math.max(2, Math.min(100, Math.sqrt(r.uit / 52.53) * 100)) + "%";
    $("#c-inf-texto").innerHTML = "<b>" + r.inf.num + ", infracción " + gNom[r.inf.g] + ".</b> " + r.inf.texto + (r.inf.nota ? " <i>" + r.inf.nota + "</i>" : "");
    $("#c-n-et").textContent = r.reglaC ? "Total de trabajadores de la empresa" : "Trabajadores afectados";
    $("#c-muerte-caja").hidden = r.inf.num !== "28.10";
    var tipo = { micro: "una microempresa", pequena: "una pequeña empresa", nomype: "una empresa no MYPE" }[r.t];
    $("#calc-tramo").textContent = "Infracción " + gNom[r.inf.g] + " en " + tipo + ", tramo de " + r.tramo + " trabajadores" + (r.reglaC ? " de la empresa" : " afectados") + (r.rei ? ", con reiteración" : "") + ".";
    var av = [];
    if (r.reglaC) av.push("Se cuentan todos los trabajadores de la empresa (art. 48.1-C)" + (r.t !== "nomype" ? " y, por ser MYPE, se aplica el 75\u00a0% de la tabla general" : "") + ".");
    if (r.inf.num === "28.11" || (r.inf.num === "28.10" && r.reglaC)) av.push("Además de la multa, puede ordenarse el cierre temporal del área o de la unidad económica.");
    if (r.t !== "nomype" && !r.rei) av.push("Como MYPE inscrita en el REMYPE, el total del procedimiento no puede superar el 1\u00a0% de sus ingresos netos del año anterior.");
    if (r.topado) av.push("Se aplicó el tope legal de " + TOPE[r.inf.g] + " UIT por infracción " + gNom[r.inf.g] + ".");
    var aviso = $("#c-aviso"); aviso.hidden = !av.length; aviso.innerHTML = av.join(" ");
    var esc2 = r.subsanable ? [
      ["Subsana antes de que venza el plazo para apelar", 0.3],
      ["Subsana dentro de 10 días hábiles después de resuelta la apelación", 0.5],
      ["Reconoce la infracción y se compromete a subsanar", 0.8]
    ] : [];
    $("#escenarios").innerHTML = (r.subsanable ? '<li class="esc--cero"><span>Corrige dentro del plazo que da el inspector</span><b>Sin multa</b></li>' : '<li class="esc--nota"><span>Esta infracción no admite subsanación: la consecuencia ya ocurrió.</span></li>') +
      esc2.map(function (e) { return '<li><span>' + e[0] + '</span><b class="tnum">S/ ' + fmt(soles * e[1], 2) + '<small>' + Math.round(e[1] * 100) + '\u00a0%</small></b></li>'; }).join("");
  }
  function pintarLista() {
    var ol = $("#c-lista"), tot = listaMultas.reduce(function (s, m) { return s + m.uit; }, 0), top = Math.min(tot, 300);
    ol.innerHTML = listaMultas.map(function (m, k) { return '<li><span><b>' + m.inf.num + '</b> ' + corto(m.inf.texto).slice(0, 60).replace(/\s\S*$/, "") + '…</span><span class="tnum">' + fmt(m.uit, 2) + ' UIT</span><button type="button" data-quitar="' + k + '" aria-label="Quitar la infracción ' + m.inf.num + '">' + IC.x + '</button></li>'; }).join("");
    $("#c-lista-n").textContent = listaMultas.length ? listaMultas.length + (listaMultas.length === 1 ? " infracción sumada" : " infracciones sumadas") : "";
    var bt = $("#calc-total");
    bt.hidden = !listaMultas.length;
    bt.innerHTML = '<span>Total de ' + listaMultas.length + (listaMultas.length === 1 ? " infracción" : " infracciones") + '</span><strong class="tnum">S/ ' + fmt(top * UIT, 2) + '</strong><small class="tnum">' + fmt(top, 2) + ' UIT' + (tot > 300 ? ", con el tope de 300 UIT" : "") + '</small>';
    $$("[data-quitar]", ol).forEach(function (b) { b.addEventListener("click", function () { listaMultas.splice(parseInt(b.getAttribute("data-quitar"), 10), 1); pintarLista(); }); });
  }
  if (cInf && INF.length) {
    var gruposInf = { leve: "Leves", grave: "Graves", muy_grave: "Muy graves" };
    cInf.innerHTML = Object.keys(gruposInf).map(function (g) {
      return '<optgroup label="' + gruposInf[g] + '">' + INF.map(function (f, k) { return f.g === g ? '<option value="' + k + '">' + f.num + ". " + esc(corto(f.texto)) + "</option>" : ""; }).join("") + "</optgroup>";
    }).join("");
    var pre = INF.map(function (f) { return f.num; }).indexOf("27.6"); if (pre >= 0) cInf.value = String(pre);
    var caja = document.createElement("label"); caja.className = "interruptor"; caja.id = "c-muerte-caja"; caja.hidden = true;
    caja.innerHTML = '<input type="checkbox" id="c-muerte"><span></span>El incumplimiento causó la muerte o una incapacidad permanente';
    $(".calc__fila").appendChild(caja);
    $$("#calc-form input, #calc-form select").forEach(function (i) { i.addEventListener("input", calcular); i.addEventListener("change", calcular); });
    $("#c-agregar").addEventListener("click", function () { calcular(); listaMultas.push(actualMulta); pintarLista(); });
    calcular();
  }

  /* ---------- Autodiagnóstico ---------- */
  var AU = PS.auto, autoBox = $("#auto");
  if (AU && autoBox) (function () {
    var perfil = {}, resp = {}, lista = [], idx = 0, ayudaAbierta = false;
    var ESC = AU.escala, DIM = AU.dimensiones;
    var cortosPerfil = { P1: "Sector", P2: "Trabajadores en planilla", P3: "¿Actividad de alto riesgo (SCTR)?", P4: "¿Inscrita en el REMYPE?", P5: "¿Trabajan contratistas en sus instalaciones?" };
    function aplica(q) {
      if (!q.aplica_regla) return true;
      if (/^P2 in/.test(q.aplica_regla)) return ["20 a 49", "50 a 99", "100 a 499", "500 o más"].indexOf(perfil.P2) >= 0;
      if (/^P5 ==/.test(q.aplica_regla)) return perfil.P5 === "Sí";
      return true;
    }
    function inicio() {
      autoBox.innerHTML = '<div class="auto__intro">' +
        '<div class="auto__dims">' + DIM.map(function (d, k) { return '<div class="auto__dim"><span>' + (k + 1) + '</span><b>' + d.nombre + '</b><small>' + d.descripcion + '</small></div>'; }).join("") + '</div>' +
        '<div class="auto__arranque"><ul class="auto__datos"><li>' + IC.reloj + 'Unos ocho minutos</li><li>' + IC.candado + 'Sus respuestas no salen de su navegador</li><li>' + IC.rayo + 'Resultado inmediato, sin registro</li></ul>' +
        '<button type="button" class="btn btn--primario" id="auto-empezar">Empezar el autodiagnóstico ' + IC.flecha + '</button></div></div>';
      $("#auto-empezar").addEventListener("click", pantallaPerfil);
    }
    function pantallaPerfil() {
      autoBox.innerHTML = '<div class="auto__paso"><p class="auto__etapa">Paso 1 de 2 · Perfil de su empresa</p><h3>Cuéntenos sobre su empresa</h3><p class="auto__sub">Con estos datos ajustamos las preguntas: algunas obligaciones dependen del número de trabajadores o de la presencia de contratistas.</p>' +
        AU.perfil.map(function (p) {
          return '<fieldset class="perfil"><legend>' + cortosPerfil[p.id] + '</legend><div class="perfil__op">' + p.opciones.map(function (o) {
            return '<label><input type="radio" name="' + p.id + '" value="' + esc(o) + '"' + (perfil[p.id] === o ? " checked" : "") + '><span>' + o + '</span></label>';
          }).join("") + "</div></fieldset>";
        }).join("") +
        '<div class="auto__nav"><button type="button" class="btn btn--secundario" id="auto-volver">' + IC.atras + ' Volver</button><button type="button" class="btn btn--primario" id="auto-seguir" disabled>Continuar a las preguntas ' + IC.flecha + '</button></div></div>';
      function revisar() { $("#auto-seguir").disabled = AU.perfil.some(function (p) { return !perfil[p.id]; }); }
      $$("input[type=radio]", autoBox).forEach(function (i) { i.addEventListener("change", function () { perfil[i.name] = i.value; revisar(); }); });
      revisar();
      $("#auto-volver").addEventListener("click", inicio);
      $("#auto-seguir").addEventListener("click", function () { lista = AU.preguntas.filter(aplica); idx = 0; pregunta(); arriba(); });
    }
    function arriba() { var y = autoBox.getBoundingClientRect().top + window.scrollY - 96; if (Math.abs(window.scrollY - y) > 200) window.scrollTo({ top: y, behavior: reducir ? "auto" : "smooth" }); }
    function pregunta() {
      var q = lista[idx], dimI = DIM.map(function (d) { return d.id; }).indexOf(q.dimension);
      var hechas = lista.filter(function (x) { return resp[x.id]; }).length;
      autoBox.innerHTML = '<div class="auto__q">' +
        '<div class="auto__progreso"><div class="auto__barra"><span style="width:' + (idx / lista.length * 100) + '%"></span></div><span class="tnum">' + (idx + 1) + " de " + lista.length + '</span></div>' +
        '<ol class="auto__mapa">' + DIM.map(function (d, k) { return '<li class="' + (k < dimI ? "hecha" : k === dimI ? "actual" : "") + '"><span>' + (k + 1) + '</span><b>' + d.nombre + "</b></li>"; }).join("") + "</ol>" +
        '<div class="auto__cuerpo" key="' + q.id + '"><p class="auto__etapa">' + DIM[dimI].nombre + '</p><h3>' + nb(q.pregunta) + '</h3>' +
        '<button type="button" class="auto__ayuda-btn" aria-expanded="' + ayudaAbierta + '" aria-controls="auto-ayuda">' + IC.ayuda + 'Qué cuenta como cumplido</button>' +
        '<div class="auto__ayuda" id="auto-ayuda"' + (ayudaAbierta ? "" : " hidden") + '><p>' + nb(q.ayuda) + '</p><small>Base: ' + nb(q.base) + "</small></div>" +
        '<div class="respuestas" role="group" aria-label="Respuesta">' + ESC.map(function (e, k) {
          return '<button type="button" class="resp resp--' + e.valor + (resp[q.id] === e.valor ? " elegida" : "") + '" data-v="' + e.valor + '" aria-pressed="' + (resp[q.id] === e.valor) + '"><kbd>' + (k + 1) + '</kbd><b>' + e.etiqueta + '</b><small>' + e.descripcion + "</small></button>";
        }).join("") + "</div>" +
        '<p class="auto__nose" id="auto-nose"' + (resp[q.id] === "no_se" ? "" : " hidden") + '>' + ESC[3].mensaje + "</p></div>" +
        '<div class="auto__nav"><button type="button" class="btn btn--secundario" id="auto-atras">' + IC.atras + ' Anterior</button><span class="nota">' + hechas + " respondidas</span>" +
        (resp[q.id] ? '<button type="button" class="btn btn--primario" id="auto-sig">' + (idx === lista.length - 1 ? "Ver resultados" : "Siguiente") + " " + IC.flecha + "</button>" : '<span></span>') + "</div></div>";
      $("#auto-atras").addEventListener("click", function () { if (idx > 0) { idx--; pregunta(); } else pantallaPerfil(); });
      var sig = $("#auto-sig"); if (sig) sig.addEventListener("click", avanzar);
      $(".auto__ayuda-btn").addEventListener("click", function () { ayudaAbierta = !ayudaAbierta; this.setAttribute("aria-expanded", ayudaAbierta); $("#auto-ayuda").hidden = !ayudaAbierta; });
      $$(".resp", autoBox).forEach(function (b) {
        b.addEventListener("click", function () {
          resp[q.id] = b.getAttribute("data-v");
          $$(".resp", autoBox).forEach(function (x) { x.classList.toggle("elegida", x === b); x.setAttribute("aria-pressed", x === b); });
          if (resp[q.id] === "no_se") { $("#auto-nose").hidden = false; pregunta(); $('.resp[data-v="no_se"]', autoBox).focus(); return; }
          setTimeout(avanzar, 260);
        });
      });
    }
    function avanzar() { if (idx < lista.length - 1) { idx++; pregunta(); var p = $(".resp", autoBox); if (p && document.activeElement && autoBox.contains(document.activeElement)) p.focus(); } else resultado(); }
    autoBox.addEventListener("keydown", function (e) {
      if (!$(".auto__q", autoBox) || e.target.closest("input, textarea, select")) return;
      var k = parseInt(e.key, 10); if (k >= 1 && k <= 4) { var b = $$(".resp", autoBox)[k - 1]; if (b) b.click(); }
    });
    function factor(v) { for (var i = 0; i < ESC.length; i++) if (ESC[i].valor === v) return ESC[i].factor; return 0; }
    var ultimo = null;
    function resultado() {
      var sp = 0, st = 0, porDim = {}, criticas = [], nose = 0, nos = [];
      DIM.forEach(function (d) { porDim[d.id] = { p: 0, t: 0 }; });
      lista.forEach(function (q) {
        var f = factor(resp[q.id]); sp += f * q.peso; st += q.peso; porDim[q.dimension].p += f * q.peso; porDim[q.dimension].t += q.peso;
        if (resp[q.id] === "no_se") nose++;
        if (q.peso === 3 && (resp[q.id] === "no" || resp[q.id] === "no_se")) criticas.push(q);
        else if (resp[q.id] !== "si") nos.push(q);
      });
      var pct = Math.round(sp / st * 100);
      var nivel = AU.niveles.filter(function (n) { return pct >= n.min && pct <= n.max; })[0] || AU.niveles[0];
      var cls = { inicial: "nivel--1", en_desarrollo: "nivel--3", avanzado: "nivel--4", consolidado: "nivel--5" }[nivel.id];
      var dims = DIM.map(function (d) { var x = porDim[d.id]; return { d: d, v: x.t ? Math.round(x.p / x.t * 100) : 0 }; });
      var recos = dims.filter(function (x) { return x.v < AU.recomendaciones_dimension[x.d.id].umbral; }).map(function (x) { return AU.recomendaciones_dimension[x.d.id]; });
      ultimo = { pct: pct, nivel: nivel, dims: dims, criticas: criticas, nose: nose, otras: nos };
      var C = 2 * Math.PI * 52;
      autoBox.innerHTML = '<div class="auto__res">' +
        '<div class="auto__res-cab"><svg class="anillo" viewBox="0 0 120 120" aria-hidden="true"><circle class="pista" cx="60" cy="60" r="52"/><circle class="valor" id="anillo-v" cx="60" cy="60" r="52" transform="rotate(-90 60 60)" style="stroke-dasharray:' + C.toFixed(2) + ';stroke-dashoffset:' + C.toFixed(2) + '"/><text x="60" y="66" text-anchor="middle" id="auto-puntaje">0</text><text x="60" y="86" text-anchor="middle" class="pc">de 100</text></svg>' +
        '<div><p class="auto__etapa">Resultado de su autodiagnóstico</p><span class="nivel ' + cls + '">Nivel ' + nivel.nombre.toLowerCase() + '</span><p>' + nb(nivel.texto) + '</p></div></div>' +
        '<div class="auto__res-grid"><div><h4>Puntaje por dimensión</h4><ul class="dims">' + dims.map(function (x) {
          var c = x.v < 40 ? "d1" : x.v < 70 ? "d3" : x.v < 90 ? "d4" : "d5";
          return '<li><div class="barra__fila"><span class="barra__t">' + x.d.nombre + '</span><span class="barra__v tnum">' + x.v + '</span></div><div class="barra__pista"><span class="' + c + '" style="--p:' + Math.max(2, x.v) + '%"></span></div></li>';
        }).join("") + '</ul></div>' +
        '<div><h4>Brechas críticas <span class="cuenta-b">' + criticas.length + '</span></h4>' + (criticas.length ? '<ul class="brechas">' + criticas.map(function (q) {
          return '<li><details><summary>' + nb(q.pregunta).replace(/^¿/, "").replace(/\?$/, "") + '</summary><p><b>Qué hacer.</b> ' + nb(q.recomendacion_si_no) + '</p><p class="riesgo"><b>Riesgo.</b> ' + nb(q.riesgo_si_no) + '</p><small>' + nb(q.base) + '</small></details></li>';
        }).join("") + "</ul>" : '<p class="nota">No hay brechas críticas: ninguna obligación de peso alto quedó sin cumplir.</p>') + "</div></div>" +
        (nose >= 3 ? '<p class="auto__aviso">Respondió “No sé” en ' + nose + ' preguntas. Lo que no puede demostrarse se considera no cumplido en una inspección; un diagnóstico acompañado permite verificarlo con evidencia.</p>' : "") +
        (recos.length ? '<div class="recos"><h4>Por dónde empezar</h4><div class="recos__grid">' + recos.map(function (r) { return '<div class="reco"><b>' + r.titulo + '</b><p>' + nb(r.texto) + "</p></div>"; }).join("") + "</div></div>" : "") +
        '<div class="auto__cta"><div><b>Convierta este resultado en un plan</b><p>Le enviamos una propuesta de diagnóstico acompañado en planta, con verificación de evidencias y prioridades por riesgo.</p></div><div class="acciones"><button type="button" class="btn btn--primario" id="auto-enviar">' + "Solicitar diagnóstico acompañado" + '</button><button type="button" class="btn btn--secundario" id="auto-imprimir">' + IC.imprimir + ' Imprimir informe</button><button type="button" class="btn--fantasma" id="auto-reiniciar">Repetir</button></div></div>' +
        '<p class="nota">Resultado referencial basado en sus respuestas. No reemplaza una auditoría ni una inspección.</p></div>';
      requestAnimationFrame(function () { requestAnimationFrame(function () { $("#anillo-v").style.strokeDashoffset = (C - C * pct / 100).toFixed(2); $$(".dims", autoBox).forEach(function (u) { u.classList.add("visto"); }); }); });
      var num = $("#auto-puntaje");
      if (reducir) num.textContent = pct;
      else (function paso(t, s0) { s0 = s0 || t; var p = Math.min(1, (t - s0) / 1300); num.textContent = Math.round(pct * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(function (tt) { paso(tt, s0); }); })(performance.now());
      $("#auto-reiniciar").addEventListener("click", function () { resp = {}; idx = 0; inicio(); arriba(); });
      $("#auto-imprimir").addEventListener("click", function () { $$("details", autoBox).forEach(function (d) { d.open = true; }); document.body.classList.add("imprime-auto"); window.print(); setTimeout(function () { document.body.classList.remove("imprime-auto"); }, 500); });
      $("#auto-enviar").addEventListener("click", function () {
        var l = ["Resultado del autodiagnóstico en prudentiasafe.com: " + pct + " de 100, nivel " + nivel.nombre.toLowerCase() + ".", "Sector: " + perfil.P1 + ". Trabajadores: " + perfil.P2 + ".", "", "Puntaje por dimensión:"];
        dims.forEach(function (x) { l.push("- " + x.d.nombre + ": " + x.v); });
        if (criticas.length) { l.push("", "Brechas críticas:"); criticas.forEach(function (q) { l.push("- " + q.id + " " + q.pregunta.replace(/^¿/, "").replace(/\?$/, "").slice(0, 110)); }); }
        l.push("", "Quisiera solicitar un diagnóstico acompañado.");
        $("#f-mensaje").value = l.join("\n"); $("#f-servicio").value = "Diagnóstico inicial";
        var tam = perfil.P2 === "1 a 10" || perfil.P2 === "11 a 19" || perfil.P4 === "Sí" ? "Micro o pequeña empresa" : (perfil.P2 === "500 o más" ? "Gran industria o minería" : "Mediana empresa");
        $("#f-tamano").value = tam;
        abrirHoja(this);
      });
      arriba();
    }
    inicio();
  })();

  /* ---------- Jerarquía de controles ---------- */
  var niveles = [
    ["Eliminación", "Quitar el peligro de la tarea.", "Máxima"],
    ["Sustitución", "Reemplazar el peligro por otro menor.", "Muy alta"],
    ["Controles de ingeniería", "Aislar a las personas del peligro con barreras físicas.", "Alta"],
    ["Controles administrativos", "Cambiar la forma en que se trabaja: procedimientos, permisos, señales y formación.", "Media"],
    ["Equipo de protección personal", "Proteger a la persona cuando lo anterior no basta. Es la última barrera.", "Baja"]
  ];
  var casos = {
    altura: ["Prefabricar en el piso los elementos que antes se armaban en altura, para que nadie tenga que subir.",
      "Usar una plataforma elevadora con canastilla en lugar de una escalera de mano.",
      "Barandas perimétricas, redes de seguridad y líneas de vida instaladas y certificadas.",
      "Permiso de trabajo en altura, charla previa, supervisión y señalización del área inferior.",
      "Arnés de cuerpo entero con línea de anclaje y absorbedor de impacto, inspeccionado antes de cada uso."],
    maquinas: ["Rediseñar el proceso para que la alimentación de piezas sea automática y nadie ponga las manos en la zona de operación.",
      "Reemplazar una máquina antigua sin protecciones por un modelo que las trae de fábrica.",
      "Guardas fijas, cortinas de luz y mandos a dos manos que detienen la máquina si alguien entra en la zona de peligro.",
      "Bloqueo y etiquetado de energías antes de limpiar o reparar, con procedimiento escrito y personal capacitado.",
      "Lentes de seguridad y ropa ajustada; nunca guantes sueltos cerca de piezas que giran."],
    cargas: ["Rediseñar el flujo para que los materiales lleguen al punto de uso sin manipulación manual.",
      "Comprar insumos en envases de menor peso, por ejemplo sacos de 25 kg en lugar de 50 kg.",
      "Transpaletas, mesas elevadoras y tecles que hacen el esfuerzo en lugar de la persona.",
      "Límites de peso, levantamiento entre dos, rotación de tareas y pausas, según la norma básica de ergonomía (R. M. " + NN + "375-2008-TR).",
      "Guantes con buen agarre y calzado de seguridad. Las fajas lumbares no han demostrado prevenir lesiones de espalda."]
  };
  var nomCaso = { altura: "En un trabajo en altura", maquinas: "En una máquina", cargas: "Al manipular cargas" };
  var pir = $("#piramide"), det = $("#jer-det"), casoAct = "altura", nivAct = 0;
  function verJer() {
    $$(".pir__nivel", pir).forEach(function (g, i) { var on = i === nivAct; g.classList.toggle("activo", on); g.setAttribute("aria-pressed", on ? "true" : "false"); });
    det.innerHTML = '<div class="detalle__cab"><span class="detalle__n">' + (nivAct + 1) + '</span><div><b>' + niveles[nivAct][0] + '</b><span class="eficacia">Eficacia ' + niveles[nivAct][2].toLowerCase() + '</span></div></div><p>' + niveles[nivAct][1] + "</p><p class='ej'><span>" + nomCaso[casoAct] + "</span>" + casos[casoAct][nivAct] + "</p>";
  }
  if (pir) {
    var W = 560, H = 400, g = 8, h = (H - g * 4) / 5, svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "pir" });
    niveles.forEach(function (nv, i) {
      var y0 = i * (h + g), y1 = y0 + h, an0 = W - i * 72, an1 = W - (i + 1) * 72;
      var x0 = (W - an0) / 2, x1 = (W - an1) / 2;
      var grp = svgEl("g", { class: "pir__nivel n" + (i + 1), tabindex: "0", role: "button", "aria-label": nv[0] + ", eficacia " + nv[2].toLowerCase(), "aria-pressed": "false" });
      grp.appendChild(svgEl("path", { d: "M" + (x0 + 10) + " " + y0 + " H" + (W - x0 - 10) + " Q" + (W - x0) + " " + y0 + " " + (W - x0 - 3) + " " + (y0 + 9) + " L" + (W - x1 + 2) + " " + (y1 - 7) + " Q" + (W - x1) + " " + y1 + " " + (W - x1 - 9) + " " + y1 + " H" + (x1 + 9) + " Q" + x1 + " " + y1 + " " + (x1 - 2) + " " + (y1 - 7) + " L" + (x0 + 3) + " " + (y0 + 9) + " Q" + x0 + " " + y0 + " " + (x0 + 10) + " " + y0 + " Z" }));
      var t = svgEl("text", { x: W / 2, y: y0 + h / 2 + 6, "text-anchor": "middle" }); t.textContent = i === 4 ? "Protección personal" : nv[0]; grp.appendChild(t);
      grp.addEventListener("click", function () { nivAct = i; verJer(); });
      grp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nivAct = i; verJer(); } });
      svg.appendChild(grp);
    });
    pir.innerHTML = '<div class="pir__eje" aria-hidden="true"><span>Más eficaz</span><i></i><span>Menos eficaz</span></div>';
    pir.insertBefore(svg, pir.firstChild);
    $$("[data-caso]").forEach(function (b) {
      b.addEventListener("click", function () {
        casoAct = b.getAttribute("data-caso");
        $$("[data-caso]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        verJer();
      });
    });
    verJer();
  }

  /* ---------- Sectores ---------- */
  var gridS = $("#sectores-grid"), SEC = PS.sectores || [];
  function picJS(n, alt) {
    return '<picture><source type="image/avif" srcset="assets/img/' + n + '-1000.avif 1000w, assets/img/' + n + '-1800.avif 1800w" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"><source type="image/webp" srcset="assets/img/' + n + '-1000.webp 1000w, assets/img/' + n + '-1800.webp 1800w" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"><img src="assets/img/' + n + '-1000.jpg" alt="' + esc(alt) + '" loading="lazy" decoding="async"></picture>';
  }
  var nombresCortos = { manufactura: "Manufactura", construccion: "Construcción", mineria: "Minería", transporte: "Transporte y almacenamiento", comercio: "Comercio", hoteles: "Hoteles y restaurantes", agro: "Agricultura y agroindustria", electricidad: "Electricidad, gas y agua" };
  function pintarSectores(orden) {
    var L = SEC.slice().sort(function (a, b) { return b[orden] - a[orden]; });
    gridS.innerHTML = L.map(function (s, k) {
      var fm = s.formaMortal ? s.formaMortal.forma + " (" + s.formaMortal.n + ")" : "Sin forma registrada";
      return '<li class="sector2" style="--i:' + k + '"><button type="button" class="sector2__in" aria-expanded="false">' +
        '<div class="sector2__foto">' + picJS(s.img, s.alt) + '<span class="sector2__var' + (s.var >= 10 ? " alza" : "") + '">' + (s.var >= 0 ? "+" : "") + fmt(s.var, 1) + '\u00a0% frente a 2024</span></div>' +
        '<div class="sector2__txt"><h3>' + (nombresCortos[s.id] || s.nombre) + '</h3><div class="sector2__cif"><div><strong class="tnum">' + fmt(s.total) + '</strong><span>notificaciones</span></div><div><strong class="tnum acento">' + s.mortales + '</strong><span>mortales</span></div></div>' +
        '<p class="sector2__forma">Forma más frecuente: <b>' + s.forma.forma.toLowerCase() + '</b></p>' +
        '<div class="sector2__mas"><p>Entre los accidentes mortales: <b>' + fm.charAt(0).toLowerCase() + fm.slice(1) + '</b>.</p><p>El ' + fmt(s.sinForma, 1).replace(",0", "") + ' % de las notificaciones del sector no tiene forma clasificada.</p><ul>' + s.riesgos.map(function (r) { return "<li>" + r + "</li>"; }).join("") + '</ul></div>' +
        '<span class="sector2__ver">Ver detalle</span></div></button></li>';
    }).join("");
    $$(".sector2__in", gridS).forEach(function (b) {
      b.addEventListener("click", function () { var on = b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", on); $(".sector2__ver", b).textContent = on ? "Ocultar detalle" : "Ver detalle"; });
    });
  }
  if (gridS && SEC.length) {
    pintarSectores("total");
    $$("[data-orden]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-orden]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        pintarSectores(b.getAttribute("data-orden"));
      });
    });
  }

  /* ---------- Preguntas frecuentes ---------- */
  var faqB = $("#faq-buscar"), catAct = "Todas";
  function quitarTildes(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function filtrarFaq() {
    var q = faqB ? quitarTildes(faqB.value.trim()) : "", vis = 0;
    $$("#faq details").forEach(function (d) {
      var ok = (catAct === "Todas" || d.getAttribute("data-cat") === catAct) && (!q || quitarTildes(d.textContent).indexOf(q) >= 0);
      d.hidden = !ok; if (ok) vis++;
    });
    $("#faq-vacio").hidden = vis > 0;
  }
  if (faqB) {
    faqB.addEventListener("input", filtrarFaq);
    $$("[data-faq]").forEach(function (b) {
      b.addEventListener("click", function () { catAct = b.getAttribute("data-faq"); $$("[data-faq]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); filtrarFaq(); });
    });
  }

  /* ---------- Formulario ---------- */
  var form = $("#formulario");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return ($("#" + id).value || "").trim(); };
    var ok = v("f-nombre") && v("f-empresa") && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v("f-correo")) && v("f-mensaje");
    $("#form-error").hidden = !!ok;
    if (!ok) return;
    var c = ["Nombre: " + v("f-nombre"), "Empresa: " + v("f-empresa"), "Correo: " + v("f-correo")];
    if (v("f-telefono")) c.push("Teléfono: " + v("f-telefono"));
    if (v("f-tamano")) c.push("Tamaño: " + v("f-tamano"));
    if (v("f-servicio")) c.push("Servicio de interés: " + v("f-servicio"));
    c.push("", v("f-mensaje"));
    var asunto = "Solicitud de " + (v("f-servicio") || "información").toLowerCase() + ", " + v("f-empresa");
    window.location.href = "mailto:contacto@prudentiasafe.com?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(c.join("\n"));
  });
})();
