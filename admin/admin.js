/* Espace admin (/admin) : connexion, liste des inscrits à la newsletter, export PDF, changement du mot de passe.
   Deux pages : les inscrits (#) et le mot de passe (#mot-de-passe). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var RESET_MAIL = "publix360bh@gmail.com";
  var VIEWS = ["vLoading", "vError", "vLogin", "vSetup", "vList", "vPassword"];
  var subs = [];
  var connected = false;
  var TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>';

  function show(id) {
    VIEWS.forEach(function (v) { $(v).hidden = v !== id; });
    $("nav").hidden = !connected;
    $("navList").setAttribute("aria-current", id === "vList" ? "page" : "false");
    $("navPw").setAttribute("aria-current", id === "vPassword" ? "page" : "false");
  }
  function say(el, text, ok) {
    el.hidden = !text;
    el.textContent = text || "";
    if (ok !== undefined) el.className = ok ? "adm-ok" : "adm-err";
  }
  var onPasswordPage = function () { return location.hash === "#mot-de-passe"; };
  function route() { if (connected) show(onPasswordPage() ? "vPassword" : "vList"); }
  function goList() {
    if (location.hash) history.pushState(null, "", location.pathname);
    route();
  }
  function post(url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  }
  function expired() {
    connected = false;
    if (location.hash) history.pushState(null, "", location.pathname);
    showLogin("Session expirée, reconnectez-vous.");
  }
  function showLogin(msg) {
    connected = false;
    show("vLogin");
    say($("loginMsg"), msg || "");
  }

  /* ---------- chargement ---------- */
  function load() {
    return fetch("/api/admin/subscribers", { cache: "no-store" })
      .then(function (res) {
        if (res.status === 401) return showLogin();
        if (res.status === 503) { connected = false; return show("vSetup"); }
        if (!res.ok) throw new Error(res.status);
        return res.json().then(function (data) {
          subs = data.subscribers || [];
          connected = true;
          render();
          route();
        });
      })
      .catch(function () {
        show("vError");
        say($("vError"), "Impossible de charger la liste. Vérifiez la connexion internet puis rechargez la page.");
      });
  }

  /* ---------- connexion ---------- */
  $("vLogin").addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = $("pw").value, btn = e.target.querySelector('button[type="submit"]');
    if (!pw) return say($("loginMsg"), "Saisissez le mot de passe.");
    btn.disabled = true; btn.textContent = "Connexion…"; say($("loginMsg"), "");
    post("/api/admin/login", { password: pw })
      .then(function (res) {
        if (res.ok) { $("pw").value = ""; return load(); }
        say($("loginMsg"),
          res.status === 401 ? "Mot de passe incorrect."
          : res.status === 429 ? "Trop d'essais. Réessayez dans 15 minutes."
          : res.status === 503 ? "L'espace admin n'est pas encore configuré dans Vercel."
          : "La connexion a échoué. Réessayez.");
      })
      .catch(function () { say($("loginMsg"), "La connexion a échoué. Vérifiez votre connexion internet."); })
      .then(function () { btn.disabled = false; btn.textContent = "Se connecter"; });
  });
  $("forgotBtn").addEventListener("click", function () {
    var open = $("forgot").hidden;
    $("forgot").hidden = !open;
    this.setAttribute("aria-expanded", String(open));
  });
  $("forgotMail").href = "mailto:" + RESET_MAIL + "?subject=" + encodeURIComponent("Mot de passe oublié – espace admin Publix 360") +
    "&body=" + encodeURIComponent("Bonjour,\n\nJ'ai oublié le mot de passe de l'espace admin du site Publix 360. Pouvez-vous m'en communiquer un nouveau ?\n\nMerci.");

  /* ---------- navigation ---------- */
  $("navList").addEventListener("click", function (e) { e.preventDefault(); goList(); });
  $("back").addEventListener("click", goList);
  window.addEventListener("hashchange", route);
  $("logout").addEventListener("click", function () {
    post("/api/admin/logout").catch(function () {}).then(function () {
      subs = []; render();
      if (location.hash) history.pushState(null, "", location.pathname);
      showLogin();
    });
  });

  /* ---------- liste ---------- */
  function fmtDate(iso) {
    return iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function filtered() {
    var t = $("q").value.trim().toLowerCase();
    if (!t) return subs;
    return subs.filter(function (s) { return (s.prenom + " " + s.email + " " + s.interets.join(" ")).toLowerCase().indexOf(t) !== -1; });
  }
  function render() {
    var since = Date.now() - 30 * 24 * 3600 * 1000;
    var recent = subs.filter(function (s) { return s.date && new Date(s.date).getTime() >= since; }).length;
    $("stats").innerHTML = "";
    $("stats").append(el("b", "", String(subs.length)), " inscrit" + (subs.length > 1 ? "s" : "") + " · ", el("b", "", String(recent)), " ces 30 derniers jours");

    var shown = filtered(), q = $("q").value.trim();
    $("pdf").disabled = !shown.length;
    $("empty").hidden = subs.length > 0;
    say($("noResult"), subs.length && !shown.length ? "Aucun résultat pour « " + q + " »." : "");
    var list = $("list");
    list.innerHTML = "";
    shown.forEach(function (s) {
      var li = el("li");
      var who = el("div", "adm-who");
      who.append(s.prenom ? el("b", "", s.prenom) : (function () { var b = el("b"); b.append(el("i", "", "Sans prénom")); return b; })());
      var a = el("a", "", s.email); a.href = "mailto:" + s.email; who.append(a);
      var tags = el("div", "adm-tags");
      s.interets.forEach(function (i) { tags.append(el("span", "", i)); });
      var del = el("button", "adm-del");
      del.type = "button";
      del.innerHTML = TRASH;
      del.title = "Retirer de la newsletter";
      del.setAttribute("aria-label", "Retirer " + s.email);
      del.addEventListener("click", function () { remove(s); });
      li.append(el("span", "adm-date", fmtDate(s.date)), who, tags, del);
      list.append(li);
    });
  }
  $("q").addEventListener("input", render);

  function remove(s) {
    if (!confirm("Retirer " + s.email + " de la newsletter ?\nCette action est définitive.")) return;
    fetch("/api/admin/subscribers?email=" + encodeURIComponent(s.email), { method: "DELETE" })
      .catch(function () { return null; })
      .then(function (res) {
        if (res && res.status === 401) return expired();
        if (res && (res.ok || res.status === 404)) {
          subs = subs.filter(function (x) { return x.email !== s.email; });
          render();
          say($("notice"), s.email + " a été retiré.", true);
        } else {
          say($("notice"), "La suppression a échoué. Réessayez.", false);
        }
      });
  }

  /* ---------- export PDF (jsPDF n'est téléchargé qu'au premier export) ---------- */
  function script(src) {
    return new Promise(function (ok, ko) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = ko;
      document.head.appendChild(s);
    });
  }
  var pdfLibs = null;
  function loadPdfLibs() {
    if (!pdfLibs) pdfLibs = script("vendor/jspdf.umd.min.js").then(function () { return script("vendor/jspdf.plugin.autotable.min.js"); });
    return pdfLibs;
  }
  $("pdf").addEventListener("click", function () {
    var btn = this, rows = filtered(), q = $("q").value.trim();
    btn.disabled = true;
    loadPdfLibs()
      .then(function () { exportPdf(rows, q); })
      .catch(function () { pdfLibs = null; say($("notice"), "L'export PDF a échoué. Réessayez.", false); })
      .then(function () { btn.disabled = !filtered().length; });
  });

  function exportPdf(rows, search) {
    var INK = [5, 6, 8], RED = [210, 26, 71], GREY = [110, 116, 128];
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var now = new Date(), margin = 14;
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor.apply(doc, INK);
    doc.text("Publix 360° – Inscrits à la newsletter", margin, 20);
    doc.setDrawColor.apply(doc, RED); doc.setLineWidth(0.8).line(margin, 24, margin + 22, 24);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor.apply(doc, GREY);
    doc.text([
      "Exporté le " + now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) +
        " à " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      rows.length + " inscrit" + (rows.length > 1 ? "s" : "") + (search ? " (recherche : « " + search + " »)" : ""),
    ], margin, 31);
    var autoTable = (window.jspdf_autotable && window.jspdf_autotable.autoTable) || function (d, o) { return d.autoTable(o); };
    autoTable(doc, {
      startY: 42,
      margin: { left: margin, right: margin, bottom: 18 },
      head: [["Date", "Prénom", "E-mail", "Centres d'intérêt"]],
      body: rows.map(function (s) {
        return [s.date ? new Date(s.date).toLocaleDateString("fr-FR") : "—", s.prenom || "—", s.email, s.interets.join(", ") || "—"];
      }),
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 2.6, textColor: INK, lineColor: [225, 228, 234], lineWidth: 0.2, overflow: "linebreak" },
      headStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 247, 249] },
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 34 }, 2: { cellWidth: 70 } },
      didDrawPage: function () {
        var h = doc.internal.pageSize.getHeight();
        doc.setFontSize(8.5).setTextColor.apply(doc, GREY);
        doc.text("PUBLIX 360 SARLU · Document interne – données personnelles, ne pas diffuser", margin, h - 8);
        doc.text("Page " + doc.getCurrentPageInfo().pageNumber, doc.internal.pageSize.getWidth() - margin, h - 8, { align: "right" });
      },
    });
    doc.save("inscrits-newsletter-" + now.toISOString().slice(0, 10) + ".pdf");
  }

  /* ---------- mot de passe ---------- */
  $("pwForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target, btn = form.querySelector('button[type="submit"]'), msg = $("pwMsg");
    var cur = $("pwCur").value, next = $("pwNew").value, conf = $("pwConf").value;
    if (!cur) return say(msg, "Saisissez le mot de passe actuel.", false);
    if (next.length < 10) return say(msg, "Le nouveau mot de passe doit faire au moins 10 caractères.", false);
    if (next !== conf) return say(msg, "Les deux nouveaux mots de passe ne sont pas identiques.", false);
    btn.disabled = true; btn.textContent = "Enregistrement…"; say(msg, "");
    post("/api/admin/password", { current: cur, next: next })
      .then(function (res) {
        if (res.status === 401) return expired();
        if (res.ok) { form.reset(); return say(msg, "Mot de passe changé. Les autres appareils connectés ont été déconnectés.", true); }
        return res.json().catch(function () { return {}; }).then(function (d) {
          say(msg,
            d.error === "wrong_password" ? "Le mot de passe actuel est incorrect."
            : d.error === "same_password" ? "Le nouveau mot de passe est identique à l'actuel."
            : d.error === "too_short" ? "Le nouveau mot de passe doit faire au moins 10 caractères."
            : res.status === 429 ? "Trop d'essais. Réessayez dans 15 minutes."
            : "Le changement a échoué. Réessayez.", false);
        });
      })
      .catch(function () { say(msg, "Le changement a échoué. Vérifiez votre connexion internet.", false); })
      .then(function () { btn.disabled = false; btn.textContent = "Enregistrer"; });
  });

  load();
})();
