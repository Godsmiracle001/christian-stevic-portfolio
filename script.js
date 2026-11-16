(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme ---------- */
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  const saved = store.get("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  root.dataset.theme = saved || (prefersLight ? "light" : "dark");

  document.getElementById("themeToggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    store.set("theme", root.dataset.theme);
  });

  /* ---------- Nav: scroll state, mobile menu, active link ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");
  const closeMenu = () => {
    links.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  };
  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  const navAnchors = [...links.querySelectorAll('a[href^="#"]:not(.btn)')];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 70}ms`;
    revealer.observe(el);
  });

  /* ---------- Count-up stats ---------- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const fmt = (n) => n.toFixed(decimals) + suffix;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counter = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counter.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => counter.observe(el));

  /* ---------- Typed terminal ---------- */
  // Each token: [cssClass | null, text]
  const tokens = [
    ["tk-kw", "class "], ["tk-fn", "Engineer"], [null, ":\n"],
    [null, "    name     = "], ["tk-str", '"Christian James Stevic"'], [null, "\n"],
    [null, "    role     = "], ["tk-str", '"Senior Software Engineer"'], [null, "\n"],
    [null, "    years    = "], ["tk-num", "12"], [null, "\n"],
    [null, "    stack    = ["], ["tk-str", '"Python"'], [null, ", "], ["tk-str", '"TypeScript"'], [null, ",\n"],
    [null, "                "], ["tk-str", '"Go"'], [null, ", "], ["tk-str", '"Java"'], [null, ", "], ["tk-str", '"C++"'], [null, "]\n"],
    [null, "    cloud    = {"], ["tk-str", '"AWS"'], [null, ", "], ["tk-str", '"GCP"'], [null, ", "], ["tk-str", '"Azure"'], [null, ", "], ["tk-str", '"k8s"'], [null, "}\n\n"],
    [null, "    "], ["tk-kw", "def "], ["tk-fn", "focus"], [null, "(self):\n"],
    [null, "        "], ["tk-kw", "return "], [null, "["], ["tk-str", '"scalable systems"'], [null, ",\n"],
    [null, "                "], ["tk-str", '"clean code review"'], [null, ",\n"],
    [null, "                "], ["tk-str", '"AI code evaluation"'], [null, "]\n\n"],
    ["tk-com", "# >>> Engineer().status\n"],
    ["tk-str", "'available for new challenges ✓'"],
  ];

  const out = document.getElementById("typed");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const render = (n) => {
    let html = "", left = n;
    for (const [cls, text] of tokens) {
      if (left <= 0) break;
      const part = esc(text.slice(0, left));
      html += cls ? `<span class="${cls}">${part}</span>` : part;
      left -= text.length;
    }
    out.innerHTML = html;
  };
  const total = tokens.reduce((n, [, t]) => n + t.length, 0);

  if (reduceMotion) {
    render(total);
  } else {
    let i = 0;
    const type = () => {
      i += 1;
      render(i);
      if (i < total) setTimeout(type, out.textContent.endsWith("\n") ? 90 : 16 + Math.random() * 22);
    };
    setTimeout(type, 500);
  }

  /* ---------- Copy email ---------- */
  const toast = document.getElementById("toast");
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), 2000);
  };
  document.getElementById("copyEmail").addEventListener("click", async (e) => {
    const email = e.currentTarget.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast("Email copied to clipboard");
    } catch {
      showToast(email);
    }
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
