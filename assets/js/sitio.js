(function () {
  "use strict";

  var cabecera = document.getElementById("cabecera");
  var interior = cabecera && !cabecera.classList.contains("cabecera--interior");

  // Cabecera sólida al desplazarse
  function revisarCabecera() {
    if (!interior) return;
    cabecera.classList.toggle("solida", window.scrollY > 40);
    if (window.scrollY < window.innerHeight * 0.5) {
      document.querySelectorAll('.nav__lista a[aria-current]').forEach(function (x) { x.removeAttribute("aria-current"); });
    }
  }
  revisarCabecera();
  window.addEventListener("scroll", revisarCabecera, { passive: true });

  // Menú en pantallas pequeñas
  var boton = document.getElementById("menu-boton");
  var nav = document.getElementById("navegacion");
  function cerrarMenu() {
    cabecera.classList.remove("menu-abierto");
    document.body.style.overflow = "";
    if (boton) {
      boton.setAttribute("aria-expanded", "false");
      boton.querySelector(".menu-boton__texto").textContent = "Menú";
    }
  }
  if (boton && nav) {
    boton.addEventListener("click", function () {
      var abierto = cabecera.classList.toggle("menu-abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
      boton.querySelector(".menu-boton__texto").textContent = abierto ? "Cerrar" : "Menú";
      document.body.style.overflow = abierto ? "hidden" : "";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) cerrarMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cabecera.classList.contains("menu-abierto")) {
        cerrarMenu();
        boton.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 920) cerrarMenu();
    });
  }

  // Aparición sutil de bloques
  var bloques = document.querySelectorAll(".aparece");
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reducir) {
    bloques.forEach(function (b) { b.classList.add("visible"); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    bloques.forEach(function (b) { observador.observe(b); });
  }

  // Sección activa en la navegación
  var enlaces = document.querySelectorAll(".nav__lista a");
  if (enlaces.length && "IntersectionObserver" in window) {
    var mapa = {};
    enlaces.forEach(function (a) { mapa[a.getAttribute("href").slice(1)] = a; });
    var obsNav = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        var a = mapa[entrada.target.id];
        if (!a) return;
        if (entrada.isIntersecting) {
          enlaces.forEach(function (x) { x.removeAttribute("aria-current"); });
          a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(mapa).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) obsNav.observe(s);
    });
  }

  // Formulario: prepara un correo con mailto
  var form = document.getElementById("formulario");
  if (form) {
    var estado = document.getElementById("formulario-estado");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var faltantes = [];
      form.querySelectorAll("[required]").forEach(function (campo) {
        var valido = campo.value.trim() !== "" && (campo.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campo.value.trim()));
        campo.setAttribute("aria-invalid", valido ? "false" : "true");
        if (!valido) faltantes.push(campo);
      });
      if (faltantes.length) {
        estado.textContent = "Revise los campos obligatorios: nombre, empresa, un correo válido y el mensaje.";
        faltantes[0].focus();
        return;
      }
      var d = new FormData(form);
      var asunto = "Solicitud de diagnóstico: " + d.get("empresa");
      var cuerpo = [
        "Nombre: " + d.get("nombre"),
        "Empresa: " + d.get("empresa"),
        "Correo: " + d.get("correo"),
        d.get("telefono") ? "Teléfono: " + d.get("telefono") : null,
        d.get("tamano") ? "Tamaño de la empresa: " + d.get("tamano") : null,
        d.get("servicio") ? "Servicio de interés: " + d.get("servicio") : null,
        "",
        d.get("mensaje")
      ].filter(function (l) { return l !== null; }).join("\n");
      estado.textContent = "Se abrirá su programa de correo con el mensaje preparado.";
      window.location.href = "mailto:contacto@prudentiasafe.com?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
    });
  }
})();
