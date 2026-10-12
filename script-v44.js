// Tarangini Sarvagyam — Portfolio — shared behavior
(function () {
  "use strict";

  /* Fallback: make sure the page language is declared. */
  if (!document.documentElement.getAttribute("lang")) { document.documentElement.setAttribute("lang", "en"); }


  /* Landing on a page from a link starts at the top (unless the link points to a section). */
  (function () {
    try {
      var nav = performance.getEntriesByType("navigation")[0];
      var fresh = !nav || nav.type === "navigate";
      if (fresh && !window.location.hash) {
        if ("scrollRestoration" in history) { history.scrollRestoration = "manual"; }
        window.scrollTo(0, 0);
        window.addEventListener("load", function () { if (!window.location.hash) { window.scrollTo(0, 0); } });
      }
    } catch (e) { /* ignore */ }
  })();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Nav overlay ---------------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var overlay = document.querySelector("[data-nav-overlay]");
    if (!toggle || !overlay) return;

    var closeBtn = overlay.querySelector("[data-nav-close]");
    var firstLink = overlay.querySelector(".nav-links a");
    var lastFocusable = overlay.querySelector(".nav-social a:last-child") || firstLink;

    function openNav() {
      overlay.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (firstLink) firstLink.focus();
    }
    function closeNav() {
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      toggle.focus();
    }
    toggle.addEventListener("click", function () {
      var isOpen = overlay.classList.contains("is-open");
      if (isOpen) { closeNav(); } else { openNav(); }
    });
    if (closeBtn) closeBtn.addEventListener("click", closeNav);

    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeNav(); }
      if (e.key === "Tab" && firstLink && lastFocusable) {
        if (e.shiftKey && document.activeElement === firstLink) {
          e.preventDefault(); lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault(); firstLink.focus();
        }
      }
    });

    // mark current page
    var path = window.location.pathname.split("/").pop() || "index.html";
    overlay.querySelectorAll(".nav-links a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("is-current");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Stat count-up ---------------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    function animate(el) {
      var to = parseFloat(el.getAttribute("data-count-to"));
      var suffix = el.getAttribute("data-count-suffix") || "";
      var prefix = el.getAttribute("data-count-prefix") || "";
      var decimals = el.getAttribute("data-count-decimals") ? parseInt(el.getAttribute("data-count-decimals"), 10) : 0;
      var duration = 1200;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = to * eased;
        el.textContent = prefix + val.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = prefix + to.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Experience page: career timeline ---------------- */
  function initTimeline() {
    var timeline = document.querySelector(".timeline");
    if (!timeline) return;

    var nodes = Array.prototype.slice.call(timeline.querySelectorAll(".timeline-node"));
    var panels = Array.prototype.slice.call(document.querySelectorAll(".brand-panel"));
    if (!nodes.length || !panels.length) return;

    function activate(id, opts) {
      opts = opts || {};
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== id;
      });
      nodes.forEach(function (n) {
        var isMatch = n.getAttribute("data-panel") === id;
        n.classList.toggle("is-active", isMatch);
        if (isMatch) { n.setAttribute("aria-current", "step"); }
        else { n.removeAttribute("aria-current"); }
      });
      if (opts.scroll) {
        var panel = document.querySelector('.brand-panel[data-panel="' + id + '"]');
        if (panel) {
          panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
      }
    }

    nodes.forEach(function (n) {
      n.addEventListener("click", function () {
        activate(n.getAttribute("data-panel"), { scroll: true });
        // nodes that share a panel (Charles & Keith, Scotch & Soda) both light up
      });
      n.addEventListener("keydown", function (e) {
        var idx = nodes.indexOf(n);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          var next = nodes[Math.min(idx + 1, nodes.length - 1)];
          next.focus();
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          var prev = nodes[Math.max(idx - 1, 0)];
          prev.focus();
        }
      });
    });

    // Deep-link support: #ottobock etc. opens that panel directly;
    // otherwise fall back to the timeline's declared default (the latest role).
    var hashId = window.location.hash.replace("#", "");
    nodes.forEach(function (n) {
      if (n.getAttribute("data-alias") === hashId) { hashId = n.getAttribute("data-panel"); }
    });
    var hasHashPanel = nodes.some(function (n) { return n.getAttribute("data-panel") === hashId; });
    var initial = hasHashPanel ? hashId : (timeline.getAttribute("data-initial") || nodes[0].getAttribute("data-panel"));
    activate(initial);
  }

  /* ---------------- Accordions (Woods at Sasan sections) ---------------- */
  function initAccordions() {
    var accs = document.querySelectorAll("[data-acc]");
    accs.forEach(function (acc) {
      var items = Array.prototype.slice.call(acc.querySelectorAll(".acc-item"));
      var buttons = items.map(function (it) { return it.querySelector(".acc-btn"); });
      acc.classList.add("acc-ready");

      function setOpen(item, open) {
        item.classList.toggle("is-open", open);
        item.querySelector(".acc-btn").setAttribute("aria-expanded", open ? "true" : "false");
      }
      // data-acc-open: every section starts open and each toggles on its own.
      // Otherwise one section opens at a time, and a section marked is-open in the markup starts open.
      var openAll = acc.hasAttribute("data-acc-open");
      items.forEach(function (it) { setOpen(it, openAll || it.classList.contains("is-open")); });

      items.forEach(function (item) {
        var btn = item.querySelector(".acc-btn");
        btn.addEventListener("click", function () {
          var willOpen = !item.classList.contains("is-open");
          if (!openAll) items.forEach(function (o) { setOpen(o, false); });
          setOpen(item, willOpen);
          if (willOpen) {
            window.setTimeout(function () {
              var top = item.getBoundingClientRect().top;
              if (top < 90) {
                item.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
              }
            }, reduceMotion ? 0 : 420);
          }
        });
        btn.addEventListener("keydown", function (e) {
          var idx = buttons.indexOf(btn);
          var target = null;
          if (e.key === "ArrowDown") target = buttons[Math.min(idx + 1, buttons.length - 1)];
          else if (e.key === "ArrowUp") target = buttons[Math.max(idx - 1, 0)];
          else if (e.key === "Home") target = buttons[0];
          else if (e.key === "End") target = buttons[buttons.length - 1];
          if (target) { e.preventDefault(); target.focus(); }
        });
      });
    });
  }

  /* ---------------- Scrollable strips: keyboard access only when they scroll ---------------- */
  function initScrollRegions() {
    var regions = document.querySelectorAll("[data-scroll-region]");
    if (!regions.length) return;
    function update() {
      regions.forEach(function (r) {
        if (r.scrollWidth > r.clientWidth + 2) { r.setAttribute("tabindex", "0"); }
        else { r.removeAttribute("tabindex"); }
      });
    }
    update();
    window.addEventListener("resize", update);
    document.addEventListener("click", update);
  }

  /* ---------------- Copy to clipboard (email) ---------------- */
  function initCopyButtons() {
    var buttons = document.querySelectorAll("[data-copy]");
    buttons.forEach(function (btn) {
      var label = btn.querySelector("[data-copy-label]");
      var originalText = label ? label.textContent : null;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var value = btn.getAttribute("data-copy");
        function feedback() {
          if (label) {
            label.textContent = "Copied";
            setTimeout(function () {
              if (label) label.textContent = originalText;
            }, 1600);
          }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(feedback).catch(function () {
            fallbackCopy(value);
            feedback();
          });
        } else {
          fallbackCopy(value);
          feedback();
        }
      });
    });
  }

  function fallbackCopy(value) {
    var ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------------- Back to top ---------------- */
  function initBackToTop() {
    document.querySelectorAll("[data-back-to-top]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        var mark = document.querySelector(".wordmark");
        if (mark) mark.focus({ preventScroll: true });
      });
    });
  }

  /* ---------------- Footer river ---------------- */
  function initRiver() {
    var river = document.querySelector("[data-river]");
    if (!river) return;
    var NS = "http://www.w3.org/2000/svg";
    var U = 1200, H = 260;          // one repeating unit: 1200 wide; the svg holds two
    // top edge of each layer: a base height plus two sine harmonics that each fit a whole number of times into U
    var layers = [
      { base:0.36, amp:11, c1:2, c2:5, p1:0.4, p2:1.7, dur:46, top:"#CFEBF9", mid:"#8CCBEB", end:"#3F95C4", op:0.42, foam:0.30 },
      { base:0.50, amp:13, c1:3, c2:7, p1:2.1, p2:0.3, dur:36, top:"#9AD3EE", mid:"#55AEDC", end:"#23779F", op:0.62, foam:0.38 },
      { base:0.64, amp:12, c1:2, c2:6, p1:4.0, p2:2.2, dur:28, top:"#6BB9E2", mid:"#2D86B5", end:"#124F78", op:0.80, foam:0.46 },
      { base:0.78, amp:10, c1:3, c2:8, p1:1.2, p2:5.1, dur:21, top:"#3E9AC8", mid:"#1B6A97", end:"#0C3552", op:0.95, foam:0.55 }
    ];
    function topY(l, x) {
      var t = 2 * Math.PI * x / U;
      return l.base * H + l.amp * Math.sin(l.c1 * t + l.p1) + l.amp * 0.45 * Math.sin(l.c2 * t + l.p2);
    }
    layers.forEach(function (l, i) {
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 " + (U * 2) + " " + H);
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("class", "river-layer");
      svg.setAttribute("focusable", "false");
      svg.style.setProperty("--dur", l.dur + "s");
      svg.style.animationDelay = (-i * 7) + "s";
      var id = "river-g" + i;
      var defs = document.createElementNS(NS, "defs");
      var g = document.createElementNS(NS, "linearGradient");
      g.setAttribute("id", id); g.setAttribute("x1", "0"); g.setAttribute("y1", "0"); g.setAttribute("x2", "0"); g.setAttribute("y2", "1");
      [["0", l.top], ["0.35", l.mid], ["1", l.end]].forEach(function (s) {
        var st = document.createElementNS(NS, "stop");
        st.setAttribute("offset", s[0]); st.setAttribute("stop-color", s[1]); g.appendChild(st);
      });
      defs.appendChild(g); svg.appendChild(defs);

      var d = "M0," + H + " L0," + topY(l, 0).toFixed(1);
      var line = "M0," + topY(l, 0).toFixed(1);
      for (var x = 12; x <= U * 2; x += 12) {
        var y = topY(l, x).toFixed(1);
        d += " L" + x + "," + y; line += " L" + x + "," + y;
      }
      d += " L" + (U * 2) + "," + H + " Z";
      var body = document.createElementNS(NS, "path");
      body.setAttribute("d", d); body.setAttribute("fill", "url(#" + id + ")"); body.setAttribute("fill-opacity", l.op);
      svg.appendChild(body);

      // foam: a thin white edge along the crest, plus a broken, brighter line just beneath it
      var foam = document.createElementNS(NS, "path");
      foam.setAttribute("d", line); foam.setAttribute("fill", "none");
      foam.setAttribute("stroke", "#FFFFFF"); foam.setAttribute("stroke-opacity", l.foam);
      foam.setAttribute("stroke-width", "2"); foam.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(foam);
      var glint = document.createElementNS(NS, "path");
      var gl = "M0," + (topY(l, 0) + 16).toFixed(1);
      for (var gx = 12; gx <= U * 2; gx += 12) gl += " L" + gx + "," + (topY(l, gx) + 16).toFixed(1);
      glint.setAttribute("d", gl); glint.setAttribute("fill", "none");
      glint.setAttribute("stroke", "#FFFFFF"); glint.setAttribute("stroke-opacity", (l.foam * 0.7).toFixed(2));
      glint.setAttribute("stroke-width", "1.2"); glint.setAttribute("stroke-dasharray", "70 230");
      glint.setAttribute("stroke-linecap", "round"); glint.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(glint);
      river.appendChild(svg);
    });

    // flow only while the footer is on screen
    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { river.classList.toggle("is-flowing", e.isIntersecting); });
      }, { threshold: 0.05 }).observe(river);
    } else if (!reduceMotion) {
      river.classList.add("is-flowing");
    }
  }

  /* ---------------- Outside of Work: looping hero video with a pause control ---------------- */
  function initHeroVideo() {
    var v = document.querySelector("[data-hero-video]");
    var btn = document.querySelector("[data-video-toggle]");
    if (!v || !btn) return;
    var userPaused = false;
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    function setState(playing) {
      btn.setAttribute("aria-label", playing ? "Pause video" : "Play video");
      btn.classList.toggle("is-paused", !playing);
    }
    function tryPlay() {
      if (userPaused) return;
      var p = v.play();
      if (p && p.then) {
        p.then(function () { setState(true); }).catch(function () { setState(false); });
      }
    }
    // autoplay (muted, looping); the visible button is the pause control
    tryPlay();
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    ["touchstart", "pointerdown", "keydown", "scroll"].forEach(function (ev) {
      window.addEventListener(ev, function once() {
        window.removeEventListener(ev, once);
        if (v.paused) tryPlay();
      }, { passive: true });
    });
    btn.addEventListener("click", function () {
      if (v.paused) { userPaused = false; tryPlay(); }
      else { userPaused = true; v.pause(); setState(false); }
    });
  }



  /* ---------------- Education: looping clip with a pause control ---------------- */
  function initEduVideo() {
    var v = document.querySelector("[data-edu-video]");
    var btn = document.querySelector("[data-edu-video-toggle]");
    if (!v || !btn) return;
    var userPaused = false, visible = false;
    v.muted = true; v.defaultMuted = true; v.loop = true;
    function setState(playing) {
      btn.setAttribute("aria-label", playing ? "Pause video" : "Play video");
      btn.classList.toggle("is-paused", !playing);
    }
    function tryPlay() {
      if (userPaused || !visible) return;
      var p = v.play();
      if (p && p.then) { p.then(function () { setState(true); }).catch(function () { setState(false); }); }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible) tryPlay();
          else if (!v.paused) { v.pause(); setState(false); }
        });
      }, { threshold: 0.3 }).observe(v);
    } else { visible = true; tryPlay(); }
    v.addEventListener("loadeddata", tryPlay);
    btn.addEventListener("click", function () {
      if (v.paused) { userPaused = false; visible = true; tryPlay(); }
      else { userPaused = true; v.pause(); setState(false); }
    });
    setState(false);
  }

  /* ---------------- Home: flip cards ---------------- */
  function initFlip() {
    var cards = document.querySelectorAll("[data-flip]");
    cards.forEach(function (card) {
      var front = card.querySelector("[data-flip-front]");
      var back = card.querySelector("[data-flip-back]");
      if (!front || !back) return;
      function hide(el, on) {
        if (on) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
        else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
      }
      function setState(flipped) {
        card.classList.toggle("is-flipped", flipped);
        hide(front, flipped);
        hide(back, !flipped);
      }
      setState(false);
      function toggle() {
        var flipped = !card.classList.contains("is-flipped");
        setState(flipped);
        var next = (flipped ? back : front).querySelector("[data-flip-btn]");
        if (next) next.focus({ preventScroll: true });
      }
      card.querySelectorAll("[data-flip-btn]").forEach(function (b) { b.addEventListener("click", toggle); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && card.classList.contains("is-flipped")) toggle();
      });
    });
  }

  /* ---------------- Home: performance carousel ---------------- */
  function initCarousel() {
    document.querySelectorAll("[data-carousel]").forEach(function (root) {
      var vp = root.querySelector("[data-car-viewport]");
      var slides = [].slice.call(root.querySelectorAll(".car-slide"));
      var status = root.querySelector("[data-car-status]");
      var prev = root.querySelector("[data-car-prev]");
      var next = root.querySelector("[data-car-next]");
      var dotsWrap = root.querySelector("[data-car-dots]");
      if (!vp || !slides.length) return;
      var dots = [];
      slides.forEach(function (s, i) {
        s.setAttribute("role", "group");
        s.setAttribute("aria-roledescription", "slide");
        s.setAttribute("aria-label", (i + 1) + " of " + slides.length);
        if (dotsWrap) {
          var d = document.createElement("button");
          d.type = "button";
          d.className = "car-dot";
          d.setAttribute("aria-label", "Slide " + (i + 1) + " of " + slides.length);
          d.addEventListener("click", function () { goTo(i); });
          dotsWrap.appendChild(d);
          dots.push(d);
        }
      });
      function pad() { return slides[0].getBoundingClientRect().left - vp.getBoundingClientRect().left + vp.scrollLeft; }
      function current() {
        var base = vp.getBoundingClientRect().left + pad();
        var best = 0, bestD = Infinity;
        slides.forEach(function (s, i) {
          var d = Math.abs(s.getBoundingClientRect().left - base);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4) best = slides.length - 1;
        return best;
      }
      var shown = -1;
      function update() {
        var i = current();
        if (i !== shown) {
          shown = i;
          slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
          dots.forEach(function (d, k) { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
          if (status) status.textContent = (i + 1) + " / " + slides.length;
        }
        if (prev) prev.disabled = vp.scrollLeft <= 2;
        if (next) next.disabled = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4;
      }
      function goTo(i) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        var delta = slides[i].getBoundingClientRect().left - vp.getBoundingClientRect().left - pad();
        vp.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
      }
      if (prev) prev.addEventListener("click", function () { goTo(current() - 1); });
      if (next) next.addEventListener("click", function () { goTo(current() + 1); });
      var ticking = false;
      vp.addEventListener("scroll", function () {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () { ticking = false; update(); });
      }, { passive: true });
      window.addEventListener("resize", update);
      update();
    });
  }

  /* ---------------- Home: education canvas (draggable chips) ---------------- */
  function initEduCanvas() {
    var canvas = document.querySelector("[data-edu-canvas]");
    if (!canvas) return;
    var mq = window.matchMedia("(min-width: 961px) and (hover: hover) and (pointer: fine)");
    function sync() { canvas.classList.toggle("is-draggable", mq.matches); }
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync); else if (mq.addListener) mq.addListener(sync);
    var drag = null;
    canvas.addEventListener("pointerdown", function (e) {
      if (!mq.matches || e.button !== 0) return;
      var chip = e.target.closest(".chip");
      if (!chip) return;
      var cr = canvas.getBoundingClientRect(), r = chip.getBoundingClientRect();
      drag = {
        chip: chip, id: e.pointerId, sx: e.clientX, sy: e.clientY,
        tx: parseFloat(chip.style.getPropertyValue("--tx")) || 0,
        ty: parseFloat(chip.style.getPropertyValue("--ty")) || 0,
        minX: cr.left - r.left, maxX: cr.right - r.right, minY: cr.top - r.top, maxY: cr.bottom - r.bottom
      };
      chip.classList.add("is-dragging");
      try { chip.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = Math.max(drag.minX, Math.min(drag.maxX, e.clientX - drag.sx));
      var dy = Math.max(drag.minY, Math.min(drag.maxY, e.clientY - drag.sy));
      drag.chip.style.setProperty("--tx", (drag.tx + dx) + "px");
      drag.chip.style.setProperty("--ty", (drag.ty + dy) + "px");
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag.chip.classList.remove("is-dragging");
      drag = null;
    }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  /* ---------------- Home: personal corner, timeline 01 to 06 ---------------- */
  function initCorner() {
    var root = document.querySelector("[data-corner]");
    if (!root) return;
    var vp = root.querySelector("[data-cn-viewport]");
    var track = root.querySelector("[data-cn-track]");
    var prev = root.querySelector("[data-cn-prev]");
    var next = root.querySelector("[data-cn-next]");
    if (!vp || !track) return;
    var items = [].slice.call(track.children);
    function pad() { return items[0].getBoundingClientRect().left - vp.getBoundingClientRect().left + vp.scrollLeft; }
    function update() {
      if (prev) prev.disabled = vp.scrollLeft <= 2;
      if (next) next.disabled = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 4;
    }
    function step(dir) {
      var base = vp.getBoundingClientRect().left + pad();
      var target = null, k;
      if (dir > 0) {
        for (k = 0; k < items.length; k++) { if (items[k].getBoundingClientRect().left - base > 12) { target = items[k]; break; } }
      } else {
        for (k = items.length - 1; k >= 0; k--) { if (items[k].getBoundingClientRect().left - base < -12) { target = items[k]; break; } }
      }
      var delta = target ? target.getBoundingClientRect().left - base : dir * vp.clientWidth * 0.7;
      vp.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    var ticking = false;
    vp.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();

    /* mouse drag; touch and trackpad use native scrolling */
    var dragging = false, pending = null, moved = false;
    vp.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (e.target.closest("button, a")) return;
      pending = { x: e.clientX, left: vp.scrollLeft, id: e.pointerId };
      moved = false;
    });
    window.addEventListener("pointermove", function (e) {
      if (!pending || e.pointerId !== pending.id) return;
      var dx = e.clientX - pending.x;
      if (!dragging && Math.abs(dx) < 5) return;
      if (!dragging) {
        dragging = true;
        vp.classList.add("is-dragging");
        vp.style.scrollSnapType = "none";
        vp.style.scrollBehavior = "auto";
      }
      moved = true;
      vp.scrollLeft = pending.left - dx;
    });
    function endDrag() {
      pending = null;
      if (dragging) {
        dragging = false;
        vp.classList.remove("is-dragging");
        vp.style.scrollSnapType = "";
        vp.style.scrollBehavior = "";
      }
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    vp.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initRiver();
    initBackToTop();
    initNav();
    initReveal();
    initCounters();
    initCopyButtons();
    initTimeline();
    initAccordions();
    initScrollRegions();
    initHeroVideo();
    initEduVideo();
    initFlip();
    initCarousel();
    initEduCanvas();
    initCorner();
  });
})();


/* header: on small screens the contact row folds away once the page is scrolled */
(function(){
  var root=document.documentElement, on=false;
  function upd(){ var s=(window.scrollY||root.scrollTop)>48; if(s!==on){ on=s; root.classList.toggle('is-scrolled',s); } }
  window.addEventListener('scroll',upd,{passive:true}); upd();
})();
