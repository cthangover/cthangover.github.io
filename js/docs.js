(function () {
  "use strict";

  var DOCS_BASE = "docs/";
  var container = null;
  var currentPage = null;
  var docsIndex = {};
  var docsLoaded = false;
  var docsTree = [];
  var searchTimer = null;

  function esc(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function loadText(url, onSuccess, onError) {
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(onSuccess)
      .catch(function (fetchErr) {
        if (location.protocol !== "file:") {
          onError(fetchErr);
          return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function () {
          if (xhr.status === 0 || xhr.status === 200) {
            onSuccess(xhr.responseText);
          } else {
            onError(new Error("XHR status " + xhr.status));
          }
        };
        xhr.onerror = function () {
          onError(
            new Error(
              "Cannot load docs via file:// protocol. " +
                "Run a local server: npx serve site/  or  python -m http.server -d site/"
            )
          );
        };
        try {
          xhr.send();
        } catch (e) {
          onError(e);
        }
      });
  }


  function preloadAllDocs(callback) {
    if (docsLoaded) {
      if (callback) callback();
      return;
    }

    var indexUrl = DOCS_BASE + "docs-index.json";

    fetch(indexUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        docsIndex = data;
        docsTree = data._tree || [];
        docsLoaded = true;
    renderSidebar(null);
    initResize();
        if (callback) callback();
      })
      .catch(function () {
        docsLoaded = true;
        if (callback) callback();
      });
  }

  function matchText(text, query) {
    var lower = text.toLowerCase();
    var words = query.toLowerCase().split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i] && lower.indexOf(words[i]) === -1) {
        return false;
      }
    }
    return true;
  }

  function filterTree(nodes, query) {
    var result = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var text = docsIndex[node.slug] || "";
      var selfMatch = matchText(text, query);
      var filteredChildren = node.children
        ? filterTree(node.children, query)
        : [];

      if (selfMatch || filteredChildren.length > 0) {
        var copy = { title: node.title, slug: node.slug };
        if (filteredChildren.length > 0) {
          copy.children = filteredChildren;
        }
        result.push(copy);
      }
    }
    return result;
  }

  function doSearch(query) {
    var clear = document.getElementById("searchClear");
    query = query.trim();

    if (clear) {
      clear.classList.toggle("visible", query.length > 0);
    }

    if (!query) {
      renderSidebar(null);
      return;
    }

    if (!docsLoaded) {
      preloadAllDocs(function () {
        doSearch(query);
      });
      return;
    }

    var filtered = filterTree(docsTree, query);
    renderSidebar(filtered);
  }

  function loadPage(name) {
    if (!container) return;
    if (!name) name = "index";

    currentPage = name;

    if (docsIndex[name]) {
      container.innerHTML = marked.parse(docsIndex[name]);
      updateSidebarActive(name);
      return;
    }

    var url = DOCS_BASE + name + ".md";

    loadText(
      url,
      function (md) {
        docsIndex[name] = md;
        container.innerHTML = marked.parse(md);
        updateSidebarActive(name);
      },
      function (err) {
        var msg =
          "<p>Document not found: <code>" +
          esc(name) +
          ".md</code></p>";
        if (location.protocol === "file:") {
          msg +=
            "<p class='docs-hint'>Cannot load files via file:// protocol in this browser.</p>" +
            "<p class='docs-hint'>Run a local server: <code>npx serve site/</code></p>";
        }
        msg += '<p><a href="#/docs/">Back to Documentation</a></p>';
        container.innerHTML = '<div class="docs-error">' + msg + "</div>";
        console.warn("docs.js:", err.message || err);
      }
    );
  }

  function buildTreeHtml(nodes, level) {
    if (!level) level = 0;
    if (!nodes || nodes.length === 0) return "";
    var html = '<ul class="sidebar-level">';
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var hasChildren = node.children && node.children.length > 0;
      var indent = 14 + level * 18;
      html += '<li class="sidebar-item">';
      if (node.slug) {
        html +=
          '<a href="#/docs/' +
          node.slug +
          '" class="sidebar-link" data-slug="' +
          node.slug +
          '" style="padding-left:' +
          indent +
          'px">' +
          esc(node.title) +
          "</a>";
      } else {
        html +=
          '<span class="sidebar-category" style="padding-left:' +
          indent +
          'px">' +
          esc(node.title) +
          "</span>";
      }
      if (hasChildren) {
        html += buildTreeHtml(node.children, level + 1);
      }
      html += "</li>";
    }
    html += "</ul>";
    return html;
  }

  function renderSidebar(tree) {
    var el = document.getElementById("sidebarTree");
    if (!el) return;
    el.innerHTML = buildTreeHtml(tree || docsTree);
    if (currentPage) {
      updateSidebarActive(currentPage);
    }
  }

  function updateSidebarActive(slug) {
    var links = document.querySelectorAll(".sidebar-link");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-slug") === slug) {
        links[i].classList.add("active");
      } else {
        links[i].classList.remove("active");
      }
    }
  }

  function toggleSidebar() {
    var isOpen = document.body.classList.contains("sidebar-open");
    if (isOpen) {
      document.body.classList.remove("sidebar-open");
    } else {
      document.body.classList.add("sidebar-open");
    }
    var toggle = document.getElementById("sidebarToggle");
    if (toggle) {
      toggle.setAttribute(
        "aria-expanded",
        document.body.classList.contains("sidebar-open") ? "true" : "false"
      );
    }
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    var toggle = document.getElementById("sidebarToggle");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  function enterDocsMode(page) {
    if (!page) page = "index";
    document.body.classList.remove("nav-open");
    var navToggle = document.getElementById("navToggle");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    document.body.classList.add("docs-mode");
    if (page !== currentPage) {
      loadPage(page);
    }
    preloadAllDocs();
  }

  function exitDocsMode() {
    document.body.classList.remove("docs-mode");
    document.body.classList.remove("sidebar-open");
    currentPage = null;
    if (container) {
      container.innerHTML = "";
    }
    var input = document.getElementById("docsSearch");
    if (input) input.value = "";
    var clear = document.getElementById("searchClear");
    if (clear) clear.classList.remove("visible");
    if (location.hash && location.hash.startsWith("#/docs/")) {
      history.replaceState(null, "", window.location.pathname);
    } else if (location.hash === "#docs") {
      history.replaceState(null, "", window.location.pathname);
    }
  }

  function handleRoute() {
    var hash = location.hash;

    if (hash.startsWith("#/docs/")) {
      if (!document.body.classList.contains("docs-mode")) {
        enterDocsMode("index");
      }
      var page = hash.slice(7);
      if (!page) page = "index";
      loadPage(page);
      return;
    }

    if (hash === "#docs") {
      enterDocsMode("index");
      history.replaceState(null, "", "#/docs/");
      return;
    }

    if (document.body.classList.contains("docs-mode") && !hash) {
      exitDocsMode();
    }
  }

  function initResize() {
    var sidebar = document.getElementById("docs-sidebar");
    if (!sidebar) return;

    var saved = localStorage.getItem("docs-sidebar-width");
    if (saved) {
      sidebar.style.width = saved + "px";
    }

    var layout = sidebar.parentNode;
    if (!layout || !layout.classList.contains("docs-layout")) return;

    var handle = document.createElement("div");
    handle.className = "sidebar-resize-handle";
    var mainEl = sidebar.nextElementSibling;
    if (mainEl && mainEl.classList.contains("sidebar-overlay")) {
      mainEl = mainEl.nextElementSibling;
    }
    layout.insertBefore(handle, mainEl);

    var isResizing = false;
    var startX = 0;
    var startW = 0;

    handle.addEventListener("mousedown", function (e) {
      isResizing = true;
      startX = e.clientX;
      startW = sidebar.offsetWidth;
      handle.classList.add("active");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!isResizing) return;
      var w = Math.max(180, Math.min(500, startW + e.clientX - startX));
      sidebar.style.width = w + "px";
    });

    document.addEventListener("mouseup", function () {
      if (!isResizing) return;
      isResizing = false;
      handle.classList.remove("active");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem("docs-sidebar-width", sidebar.offsetWidth);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    container = document.getElementById("docs-content");
    if (!container) return;

    renderSidebar(null);

    var useExt = {};

    if (typeof hljs !== "undefined") {
      useExt.renderer = {
        code: function (token) {
          var lang = token.lang || "";
          if (lang && hljs.getLanguage(lang)) {
            try {
              var result = hljs.highlight(token.text, { language: lang });
              return (
                '<pre><code class="hljs language-' +
                lang +
                '">' +
                result.value +
                "</code></pre>\n"
              );
            } catch (e) {}
          }
          var escaped = token.escaped
            ? token.text
            : token.text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
          return (
            "<pre><code" +
            (lang ? ' class="language-' + lang + '"' : "") +
            ">" +
            escaped +
            "</code></pre>\n"
          );
        },
      };
    }

    useExt.walkTokens = function (token) {
      if (token.type !== "link" || !token.href) return;
      var href = token.href;

      if (/^(https?:|#|mailto:|data:|\/\/)/i.test(href)) return;
      if (href.startsWith("#/docs/")) return;
      if (/\.(png|jpg|jpeg|gif|svg|webp|mp4|webm|mp3|ogg|wav|css|js)(\?.*)?$/i.test(href)) return;

      var page = href;
      var isDir = page.endsWith("/");

      if (/\.md$/i.test(page)) {
        page = page.replace(/\.md$/i, "");
      }
      if (page.endsWith("/")) {
        page = page.slice(0, -1);
      }

      if (page.startsWith("../") || page.startsWith("./")) {
        var baseParts = (currentPage || "index").split("/");
        baseParts.pop();
        var parts = page.split("/");
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] === "..") {
            if (baseParts.length > 0) baseParts.pop();
          } else if (parts[i] !== ".") {
            baseParts.push(parts[i]);
          }
        }
        page = baseParts.join("/");
      }

      if (isDir && !page.endsWith("/index")) {
        page += "/index";
      }

      token.href = "#/docs/" + page;
    };

    marked.use(useExt);

    container.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href) return;

      if (href.startsWith("#/docs/")) {
        e.preventDefault();
        var page = href.slice(7);
        if (!page) page = "index";
        if (location.hash !== href) {
          history.pushState(null, "", href);
        }
        if (!document.body.classList.contains("docs-mode")) {
          enterDocsMode(page);
        } else {
          loadPage(page);
          closeSidebar();
        }
        return;
      }

      if (/^(https?:|#|mailto:|data:|\/\/)/i.test(href)) return;
      if (/\.(png|jpg|jpeg|gif|svg|webp|mp4|webm|mp3|ogg|wav|css|js)(\?.*)?$/i.test(href)) return;

      e.preventDefault();
      var page = href;
      var isDir = page.endsWith("/");
      if (/\.md$/i.test(page)) {
        page = page.replace(/\.md$/i, "");
      }
      if (page.endsWith("/")) {
        page = page.slice(0, -1);
      }
      if (page.startsWith("../") || page.startsWith("./")) {
        var baseParts = (currentPage || "index").split("/");
        baseParts.pop();
        var parts = page.split("/");
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] === "..") {
            if (baseParts.length > 0) baseParts.pop();
          } else if (parts[i] !== ".") {
            baseParts.push(parts[i]);
          }
        }
        page = baseParts.join("/");
      }
      if (isDir && !page.endsWith("/index")) {
        page += "/index";
      }
      var newHref = "#/docs/" + page;
      if (location.hash !== newHref) {
        history.pushState(null, "", newHref);
      }
      loadPage(page);
      closeSidebar();
    });

    var sidebarTree = document.getElementById("sidebarTree");
    if (sidebarTree) {
      sidebarTree.addEventListener("click", function (e) {
        var a = e.target.closest(".sidebar-link");
        if (!a) return;
        e.preventDefault();
        var slug = a.getAttribute("data-slug");
        if (slug) {
          var href = "#/docs/" + slug;
          if (location.hash !== href) {
            history.pushState(null, "", href);
          }
          loadPage(slug);
          closeSidebar();
        }
      });
    }

    var searchInput = document.getElementById("docsSearch");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        if (searchTimer) clearTimeout(searchTimer);
        var query = searchInput.value;
        searchTimer = setTimeout(function () {
          doSearch(query);
        }, 200);
      });
    }

    var searchClear = document.getElementById("searchClear");
    if (searchClear) {
      searchClear.addEventListener("click", function () {
        var input = document.getElementById("docsSearch");
        if (input) {
          input.value = "";
          doSearch("");
          input.focus();
        }
      });
    }

    var backLink = document.querySelector(".docs-back-link");
    if (backLink) {
      backLink.addEventListener("click", function (e) {
        e.preventDefault();
        exitDocsMode();
      });
    }

    var sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", toggleSidebar);
    }

    var navToggle = document.getElementById("navToggle");
    if (navToggle) {
      navToggle.addEventListener("click", function () {
        document.body.classList.toggle("nav-open");
        var expanded = document.body.classList.contains("nav-open");
        navToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      });
    }

    var navLinks = document.querySelector(".nav-links");
    if (navLinks) {
      navLinks.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          document.body.classList.remove("nav-open");
          if (navToggle) navToggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    var overlay = document.querySelector(".sidebar-overlay");
    if (overlay) {
      overlay.addEventListener("click", closeSidebar);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (document.body.classList.contains("sidebar-open")) {
          closeSidebar();
        }
        if (document.body.classList.contains("nav-open")) {
          document.body.classList.remove("nav-open");
          if (navToggle) navToggle.setAttribute("aria-expanded", "false");
        }
      }
    });

    window.addEventListener("popstate", handleRoute);
    window.addEventListener("hashchange", function () {
      handleRoute();
    });

    handleRoute();
  });
})();
