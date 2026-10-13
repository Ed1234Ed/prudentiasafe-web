/* Prudentia Safe · Sitio web 3.0 */
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
  enlaces.forEach(function (a) { mapa[a.getAttribute("href").slice(1)] = a; });
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
  $$(".compromisos__lista, .cifras__lista, .modulos, .momentos, .sectores__lista").forEach(function (g) {
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

  /* ---------- Pestañas ---------- */
  var tabs = $$(".pestanas [role=tab]");
  function activar(t) {
    tabs.forEach(function (x) {
      var on = x === t; x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute("aria-controls")); p.hidden = !on;
      if (on) {
        $$(".barras", p).forEach(function (b) { b.classList.remove("visto"); void b.offsetWidth; b.classList.add("visto"); });
        if (p.id === "v-anual") dibujar(true);
      }
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { activar(t); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; activar(n); n.focus(); }
    });
  });

  /* ---------- Gráfico anual ---------- */
  var anual = [
    { a: 2019, total: 35775, mortales: 236, incidentes: 697 },
    { a: 2020, total: 23130, mortales: 162, incidentes: 361 },
    { a: 2021, total: 28755, mortales: 214, incidentes: 456 },
    { a: 2022, total: 33586, mortales: 407, incidentes: 568 },
    { a: 2023, total: 37105, mortales: 249, incidentes: 572 },
    { a: 2024, total: 38900, mortales: 280, incidentes: 560 },
    { a: 2025, total: 44602, mortales: 228, incidentes: 494 }
  ];
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
    var bw = iw / anual.length, ancho = Math.min(56, bw * 0.55), pts = [];
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
      pts.push([x + ancho / 2, y]);
    });
    lienzo.innerHTML = ""; lienzo.appendChild(svg);
    if (animar && !reducir) requestAnimationFrame(function () { requestAnimationFrame(function () { $$("rect", svg).forEach(function (r) { r.style.transform = "scaleY(1)"; }); }); });
    dibujado = true;
  }
  window.redibujarGrafico = function () { dibujar(false); };
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
    var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (dibujado) dibujar(false); }, 150); });
  }

  /* ---------- Barras horizontales ---------- */
  var sectores = {
    total: [
      ["Industrias manufactureras", 8459, 19.0],
      ["Actividades inmobiliarias, empresariales y de alquiler", 7232, 16.2],
      ["Comercio y reparación de vehículos", 5364, 12.0],
      ["Transporte, almacenamiento y comunicaciones", 4306, 9.7],
      ["Hoteles y restaurantes", 4185, 9.4],
      ["Construcción", 3714, 8.3]
    ],
    mortales: [
      ["Transporte, almacenamiento y comunicaciones", 35, 15.4],
      ["Administración pública", 32, 14.0],
      ["Industrias manufactureras", 31, 13.6],
      ["Construcción", 29, 12.7],
      ["Actividades inmobiliarias, empresariales y de alquiler", 28, 12.3]
    ]
  };
  var formas = [
    ["Caídas de personas", 7773], ["Esfuerzos excesivos o falsos movimientos", 4151], ["Pisadas, choques o golpes por objetos", 3483],
    ["Caídas de objetos", 3387], ["Objetos punzocortantes", 2776], ["Atrapamiento por o entre objetos", 1353],
    ["Exposición a temperaturas extremas", 923], ["Sustancias nocivas o radiaciones", 615], ["Contacto con corriente eléctrica", 133]
  ];
  function barras(ol, filas, unidad) {
    var max = filas[0][2];
    ol.innerHTML = filas.map(function (f, k) {
      return '<li><div class="barra__fila"><span class="barra__t">' + f[0] + '</span><span class="barra__v">' + fmt(f[2], 1) + ' %</span></div>' +
        '<div class="barra__pista"><span style="--p:' + (f[2] / max * 100).toFixed(1) + '%;--rd:' + (k * 0.06) + 's"></span></div>' +
        '<span class="barra__c">' + fmt(f[1]) + ' ' + unidad + '</span></li>';
    }).join("");
    ol.classList.remove("visto"); void ol.offsetWidth;
    requestAnimationFrame(function () { if (ol.offsetParent !== null) ol.classList.add("visto"); });
  }
  var olS = $("#barras-sector"), olF = $("#barras-forma");
  if (olS) barras(olS, sectores.total, "notificaciones");
  $$("[data-sector]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-sector");
      $$("[data-sector]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      barras(olS, sectores[k], k === "total" ? "notificaciones" : "accidentes mortales");
    });
  });
  if (olF) {
    var base = formas.reduce(function (s, f) { return s + f[1]; }, 0);
    barras(olF, formas.map(function (f) { return [f[0], f[1], Math.round(f[1] / base * 1000) / 10]; }), "accidentes");
  }

  /* ---------- Parte del cuerpo ---------- */
  var partes = [
    { id: "dedos", n: "Dedos de la mano", x: 25.7, y: 58.9, p: 16.7, c: 7328, causa: "Atrapamientos y cortes en máquinas, herramientas y puertas.", m: ["Guardas fijas en partes móviles", "Bloqueo y etiquetado antes de intervenir un equipo", "Guantes elegidos según el riesgo, no por costumbre"] },
    { id: "ojos", n: "Ojos", x: 53.6, y: 10.4, p: 7.5, c: 3298, causa: "Proyección de partículas, salpicaduras de sustancias y polvo.", m: ["Pantallas en esmeriles y tornos", "Lentes o caretas adecuados a la tarea", "Lavaojos accesible y señalizado"] },
    { id: "rodilla", n: "Rodilla", x: 33.7, y: 74.1, p: 6.5, c: 2827, causa: "Caídas al mismo nivel y golpes contra objetos.", m: ["Orden y limpieza en pasillos", "Pisos antideslizantes y sin desniveles", "Iluminación suficiente en zonas de tránsito"] },
    { id: "tobillo", n: "Tobillo", x: 76.5, y: 88.8, p: 6.2, c: 2693, causa: "Pisadas en superficies irregulares, escaleras y rampas.", m: ["Calzado de seguridad con buena sujeción", "Pasamanos y peldaños en buen estado", "Señalización de desniveles"] },
    { id: "mano", n: "Mano", x: 75.2, y: 54.7, p: 5.9, c: 2599, causa: "Golpes, cortes y contacto con superficies calientes.", m: ["Herramientas en buen estado y adecuadas", "Procedimiento para manipular piezas", "Guantes con protección mecánica o térmica"] },
    { id: "lumbar", n: "Región lumbosacra", x: 50.1, y: 50.9, p: 5.9, c: 2574, causa: "Esfuerzos al levantar, empujar o girar con carga.", m: ["Ayudas mecánicas para cargas pesadas", "Límites de peso y levantamiento entre dos", "Pausas y rotación en tareas repetitivas"] },
    { id: "cabeza", n: "Cabeza", x: 50.1, y: 4.2, p: 5.2, c: 2288, causa: "Caída de objetos y golpes contra estructuras.", m: ["Rodapiés y redes en trabajos en altura", "Almacenamiento seguro de materiales en altura", "Casco con barbiquejo"] }
  ];
  var fig = $("#figura"), panelC = $("#cuerpo-panel"), listaC = $("#cuerpo-lista");
  function mostrarParte(id) {
    var d = partes.filter(function (x) { return x.id === id; })[0];
    $$(".punto", fig).concat($$("button", listaC)).forEach(function (p) { var on = p.getAttribute("data-id") === id; p.classList.toggle("activo", on); p.setAttribute("aria-pressed", on ? "true" : "false"); });
    panelC.innerHTML = '<h3>' + d.n + '</h3><div class="valor tnum">' + fmt(d.p, 1) + ' %</div><div class="cuenta">' + fmt(d.c) + ' accidentes no mortales en 2025</div><p>' + d.causa + '</p><ul class="lista-marcas">' + d.m.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
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
    listaC.innerHTML = partes.map(function (d) { return '<button type="button" data-id="' + d.id + '" aria-pressed="false"><span>' + d.n + '</span><b>' + fmt(d.p, 1) + ' %</b></button>'; }).join("");
    $$("button", listaC).forEach(function (l) { l.addEventListener("click", function () { mostrarParte(l.getAttribute("data-id")); }); });
    mostrarParte("dedos");
  }

  /* ---------- Lo que exige la ley ---------- */
  var leyN = $("#ley-n"), leyV = $("#ley-n-v"), oblig = $("#obligaciones");
  function etiquetaN(v) { return v >= 500 ? "500 o más" : String(v); }
  function rango() { var v = parseInt(leyN.value, 10); leyV.textContent = etiquetaN(v); leyN.style.setProperty("--v", ((v - 1) / 499 * 100) + "%"); }
  function obligaciones() {
    var n = parseInt(leyN.value, 10), t = $("input[name=ley-t]:checked").value, r = $("input[name=ley-r]:checked").value === "si";
    rango();
    var L = [];
    L.push(["Política de seguridad y salud en el trabajo", "Escrita, fechada, firmada por la máxima autoridad y difundida a todos los trabajadores.", "Ley N.⁠° 29783, arts. 22 y 23"]);
    if (n >= 20) L.push(["Comité paritario de SST", "Representantes del empleador y de los trabajadores en igual número. Se reúne una vez al mes.", "Ley N.⁠° 29783, art. 29; Reglamento, arts. 38 y 42", 1]);
    else L.push(["Supervisor de SST", "Con menos de 20 trabajadores, los trabajadores eligen a un supervisor de seguridad y salud en el trabajo.", "Ley N.⁠° 29783, art. 30; Reglamento, art. 39", 1]);
    if (n >= 20) L.push(["Reglamento Interno de SST", "Obligatorio desde 20 trabajadores; se entrega una copia a cada trabajador.", "Reglamento, art. 74; Ley N.⁠° 29783, art. 35", 1]);
    L.push(["IPERC y mapa de riesgos", "Identificación de peligros y evaluación de riesgos por puesto, actualizada al menos una vez al año, y mapa de riesgos visible.", "Ley N.⁠° 29783, arts. 35 y 57"]);
    L.push(["Programa anual de SST", "Actividades, responsables, plazos y recursos del año.", "Reglamento, art. 32"]);
    L.push(["Cuatro capacitaciones al año como mínimo", "En seguridad y salud en el trabajo, dentro de la jornada laboral.", "Ley N.⁠° 29783, art. 35, literal b"]);
    L.push(["Exámenes médicos ocupacionales", r ? "Cada dos años a cargo del empleador; en alto riesgo, antes, durante y al término de la relación laboral." : "Cada dos años, a cargo del empleador.", "Ley N.⁠° 29783, art. 49, literal d", r ? 1 : 0]);
    if (t === "micro" || t === "pequena") L.push(["Registros en formato simplificado", "Como " + (t === "micro" ? "microempresa" : "pequeña empresa") + " inscrita en el REMYPE puede usar el sistema simplificado de registros, físico o digital.", "R. M. N.⁠° 085-2013-TR", 1]);
    else L.push(["Ocho registros obligatorios", "Accidentes e incidentes, exámenes médicos, monitoreo de agentes, inspecciones, estadísticas, equipos de emergencia, capacitaciones y simulacros, y auditorías.", "Reglamento, art. 33; R. M. N.⁠° 050-2013-TR", 1]);
    var aud = r ? ["Auditoría externa cada dos años", "Por realizar actividades de alto riesgo, a cargo de un auditor independiente registrado ante el MTPE."]
      : n <= 10 ? ["Auditoría externa solo si la dispone la Inspección", "Con hasta diez trabajadores y sin actividades de alto riesgo, se realiza cuando la autoridad lo ordena."]
      : ["Auditoría externa cada tres años", "A cargo de un auditor independiente registrado ante el MTPE."];
    L.push([aud[0], aud[1], "D. S. N.⁠° 014-2013-TR, art. 15", 1]);
    L.push(["Conservación de registros", "Enfermedades ocupacionales, 20 años; accidentes e incidentes peligrosos, 10 años; los demás, 5 años.", "Reglamento, art. 35"]);
    oblig.innerHTML = L.map(function (o, k) { return '<li class="ob' + (o[3] ? " ob--cambia" : "") + '" style="--i:' + k + '"><h3>' + o[0] + '</h3><p>' + o[1] + '</p><small>' + o[2] + '</small></li>'; }).join("");
  }
  if (leyN) {
    var tl;
    leyN.addEventListener("input", function () { rango(); clearTimeout(tl); tl = setTimeout(obligaciones, 140); });
    $$("#ley-form input[type=radio]").forEach(function (i) { i.addEventListener("change", obligaciones); });
    obligaciones();
  }

  /* ---------- Calculadora de multas ---------- */
  var UIT = 5500;
  var tabla = {
    micro: { lim: [1, 2, 3, 4, 5, 6, 7, 8, 9, Infinity], et: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10 o más"],
      leve: [0.045, 0.05, 0.07, 0.08, 0.09, 0.11, 0.14, 0.16, 0.18, 0.23], grave: [0.11, 0.14, 0.16, 0.18, 0.20, 0.25, 0.29, 0.34, 0.38, 0.45], muy_grave: [0.23, 0.25, 0.29, 0.32, 0.36, 0.41, 0.47, 0.54, 0.61, 0.68] },
    pequena: { lim: [5, 10, 20, 30, 40, 50, 60, 70, 99, Infinity], et: ["1 a 5", "6 a 10", "11 a 20", "21 a 30", "31 a 40", "41 a 50", "51 a 60", "61 a 70", "71 a 99", "100 o más"],
      leve: [0.09, 0.14, 0.18, 0.23, 0.32, 0.45, 0.61, 0.83, 1.01, 2.25], grave: [0.45, 0.59, 0.77, 0.97, 1.26, 1.62, 2.09, 2.43, 2.81, 4.50], muy_grave: [0.77, 0.99, 1.28, 1.64, 2.14, 2.75, 3.56, 4.32, 4.95, 7.65] },
    nomype: { lim: [10, 25, 50, 100, 200, 300, 400, 500, 999, Infinity], et: ["1 a 10", "11 a 25", "26 a 50", "51 a 100", "101 a 200", "201 a 300", "301 a 400", "401 a 500", "501 a 999", "1000 o más"],
      leve: [0.26, 0.89, 1.26, 2.33, 3.10, 3.73, 5.30, 7.61, 10.87, 15.52], grave: [1.57, 3.92, 5.22, 6.53, 7.83, 10.45, 13.06, 18.28, 20.89, 26.12], muy_grave: [2.63, 5.25, 7.88, 11.56, 14.18, 18.39, 23.64, 31.52, 42.03, 52.53] }
  };
  var gNom = { leve: "leve", grave: "grave", muy_grave: "muy grave" }, tNom = { micro: "una microempresa", pequena: "una pequeña empresa", nomype: "una empresa no MYPE" };
  var cN = $("#c-n"), cSol = $("#calc-soles"), solesAct = 0;
  function animarSoles(fin) {
    var ini = solesAct, s0 = null; solesAct = fin;
    if (reducir) { cSol.textContent = "S/ " + fmt(fin, 2); return; }
    (function paso(t) { if (!s0) s0 = t; var p = Math.min(1, (t - s0) / 500), e = 1 - Math.pow(1 - p, 3); cSol.textContent = "S/ " + fmt(ini + (fin - ini) * e, 2); if (p < 1) requestAnimationFrame(paso); })(performance.now());
  }
  function calcular() {
    var t = $("input[name=c-t]:checked").value, g = $("input[name=c-g]:checked").value;
    var n = Math.max(1, parseInt(cN.value, 10) || 1), T = tabla[t], i = 0;
    while (n > T.lim[i]) i++;
    var uit = T[g][i], soles = uit * UIT;
    animarSoles(soles);
    $("#calc-uit").textContent = fmt(uit, uit < 0.1 ? 3 : 2) + " UIT";
    $("#calc-barra").style.width = Math.max(2, Math.min(100, Math.sqrt(soles / (52.53 * UIT)) * 100)) + "%";
    $("#calc-tramo").textContent = "Infracción " + gNom[g] + " en " + tNom[t] + ", tramo de " + T.et[i] + " trabajadores afectados.";
  }
  if (cN) { $$("#calc-form input").forEach(function (i) { i.addEventListener("input", calcular); i.addEventListener("change", calcular); }); calcular(); }

  /* ---------- Autodiagnóstico ---------- */
  var preguntas = [
    ["¿Tiene una política de seguridad y salud en el trabajo escrita, firmada y difundida?", "Ley N.\u2060°\u00a029783, arts. 22 y 23", "Política de SST firmada y difundida"],
    ["¿Cuenta con un comité paritario o un supervisor de SST elegido por los trabajadores?", "Ley N.\u2060°\u00a029783, arts. 29 y 30", "Comité o supervisor de SST"],
    ["¿La matriz IPERC cubre todos los puestos y se actualizó en los últimos doce meses?", "Ley N.\u2060°\u00a029783, art. 57", "IPERC completa y actualizada"],
    ["¿El mapa de riesgos está publicado en lugares visibles?", "Ley N.\u2060°\u00a029783, art. 35, literal e", "Mapa de riesgos visible"],
    ["¿Realizó al menos cuatro capacitaciones en SST en los últimos doce meses?", "Ley N.\u2060°\u00a029783, art. 35, literal b", "Cuatro capacitaciones al año"],
    ["¿Sus trabajadores tienen un examen médico ocupacional con menos de dos años de antigüedad?", "Ley N.\u2060°\u00a029783, art. 49, literal d", "Exámenes médicos ocupacionales vigentes"],
    ["¿Lleva al día los registros obligatorios del sistema de gestión?", "Reglamento, art. 33", "Registros obligatorios al día"],
    ["¿Investiga los accidentes e incidentes y registra las medidas correctivas?", "Reglamento, art. 33, literal a", "Investigación de accidentes e incidentes"],
    ["¿Entrega equipos de protección adecuados al riesgo y deja constancia de la entrega?", "Ley N.\u2060°\u00a029783, art. 60", "Entrega y control de EPP"],
    ["¿Tiene un programa anual de SST aprobado y con avance medido?", "Reglamento, art. 32", "Programa anual de SST"],
    ["¿Realizó simulacros de emergencia durante el último año?", "Reglamento, art. 33, literal g", "Simulacros de emergencia"],
    ["Si tiene 20 trabajadores o más, ¿cuenta con Reglamento Interno de SST entregado al personal?", "Reglamento, art. 74", "Reglamento Interno de SST"]
  ];
  var resp = [], idx = 0, qBox = $("#auto-pregunta"), avance = $("#auto-avance"), conteo = $("#auto-conteo"), atras = $("#auto-atras");
  function pintar() {
    var q = preguntas[idx];
    qBox.innerHTML = "<p>" + q[0] + "</p><small>" + q[1] + "</small>";
    avance.style.width = (idx / preguntas.length * 100) + "%";
    conteo.textContent = (idx + 1) + " de " + preguntas.length;
    atras.disabled = idx === 0;
    $$("#auto-resp .resp").forEach(function (b) { b.classList.toggle("elegida", resp[idx] !== undefined && parseInt(b.getAttribute("data-v"), 10) === resp[idx]); });
  }
  var nivelTxt = "", brechas = [], pct = 0;
  function resultado() {
    $("#auto-marco").hidden = true; $("#auto-resultado").hidden = false;
    pct = Math.round(resp.reduce(function (s, v) { return s + v; }, 0) / (preguntas.length * 2) * 100);
    var nv = $("#auto-nivel"), txt;
    if (pct < 50) { nivelTxt = "Nivel inicial"; nv.className = "nivel nivel--1"; txt = "Hay brechas importantes frente a la normativa. Conviene empezar por un diagnóstico que ordene las prioridades según el riesgo."; }
    else if (pct < 80) { nivelTxt = "Sistema en desarrollo"; nv.className = "nivel nivel--3"; txt = "Hay una base, pero faltan piezas que una inspección o un accidente pondrían en evidencia. Estas son las brechas a cerrar primero:"; }
    else { nivelTxt = "Sistema consolidado"; nv.className = "nivel nivel--5"; txt = "Su empresa cumple lo esencial. El siguiente paso es sostenerlo con indicadores, auditoría interna y formación que cambie conductas."; }
    nv.textContent = nivelTxt; $("#auto-texto").textContent = txt;
    brechas = [];
    resp.forEach(function (v, k) { if (v < 2) brechas.push({ t: preguntas[k][2], r: preguntas[k][1], v: v }); });
    brechas.sort(function (a, b) { return a.v - b.v; });
    $("#auto-brechas").innerHTML = brechas.slice(0, 6).map(function (b) { return "<li>" + b.t + (b.v === 1 ? " (en parte)" : "") + "<small>" + b.r + "</small></li>"; }).join("");
    var c = 326.73, an = $("#anillo-v");
    requestAnimationFrame(function () { an.style.strokeDashoffset = c - c * pct / 100; });
    var num = $("#auto-puntaje");
    if (reducir) num.textContent = pct;
    else (function paso(t, s0) { s0 = s0 || t; var p = Math.min(1, (t - s0) / 1300); num.textContent = Math.round(pct * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(function (tt) { paso(tt, s0); }); })(performance.now());
  }
  if (qBox) {
    pintar();
    $$("#auto-resp .resp").forEach(function (b) {
      b.addEventListener("click", function () {
        resp[idx] = parseInt(b.getAttribute("data-v"), 10); b.classList.add("elegida");
        setTimeout(function () { if (idx < preguntas.length - 1) { idx++; pintar(); } else { avance.style.width = "100%"; resultado(); } }, 220);
      });
    });
    atras.addEventListener("click", function () { if (idx > 0) { idx--; pintar(); } });
    $("#auto-reiniciar").addEventListener("click", function () { resp = []; idx = 0; $("#auto-resultado").hidden = true; $("#auto-marco").hidden = false; $("#anillo-v").style.strokeDashoffset = 326.73; pintar(); });
    $("#auto-enviar").addEventListener("click", function () {
      var l = ["Resultado del autodiagnóstico en prudentiasafe.com: " + pct + " % (" + nivelTxt.toLowerCase() + ")."];
      if (brechas.length) { l.push("Brechas identificadas:"); brechas.forEach(function (b) { l.push("- " + b.t + (b.v === 1 ? " (en parte)" : "")); }); }
      l.push("", "Quisiera solicitar un diagnóstico inicial.");
      $("#f-mensaje").value = l.join("\n"); $("#f-servicio").value = "Diagnóstico inicial";
      abrirHoja(this);
    });
  }

  /* ---------- Jerarquía de controles ---------- */
  var jer = [
    ["Eliminación", "Quitar el peligro de la tarea.", "Prefabricar en el piso los elementos que antes se armaban en altura, para que nadie tenga que subir."],
    ["Sustitución", "Reemplazar el peligro por otro menor.", "Usar una plataforma elevadora con canastilla en lugar de una escalera de mano."],
    ["Controles de ingeniería", "Aislar a las personas del peligro con barreras físicas.", "Barandas perimétricas, redes de seguridad y líneas de vida instaladas y certificadas."],
    ["Controles administrativos", "Cambiar la forma en que se trabaja.", "Permiso de trabajo en altura, charla previa, supervisión y señalización del área inferior."],
    ["Equipo de protección personal", "Proteger a la persona cuando lo anterior no basta. Es la última barrera.", "Arnés de cuerpo entero con línea de anclaje y absorbedor de impacto, inspeccionado antes de cada uso."]
  ];
  var det = $("#jer-det"), bJ = $$("#controles-lista button");
  function verJer(k) {
    bJ.forEach(function (b, i) { b.setAttribute("aria-pressed", i === k ? "true" : "false"); });
    det.innerHTML = "<b>" + jer[k][0] + "</b><p>" + jer[k][1] + "</p><p class='ej'>En un trabajo en altura: " + jer[k][2].charAt(0).toLowerCase() + jer[k][2].slice(1) + "</p>";
  }
  bJ.forEach(function (b, i) { b.addEventListener("click", function () { verJer(i); }); });
  if (det) verJer(0);

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
