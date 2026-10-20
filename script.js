(function () {
    "use strict";

    document.documentElement.classList.add("js");

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal sections as the story enters the viewport.
    var revealItems = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
        var revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -9% 0px", threshold: 0.08 });
        revealItems.forEach(function (item) { revealObserver.observe(item); });
    } else {
        revealItems.forEach(function (item) { item.classList.add("is-visible"); });
    }

    // The task loop is a small, readable story rather than a static list.
    var story = [
        {
            kicker: "START WITH A MAP",
            title: "Read the handoff. Locate the work.",
            copy: "The agent identifies the target project, scope, and first leads before it spends effort on a patch.",
            chips: ["onboarding note", "repo state", "scope"],
            time: "0.00 h",
            focus: "orient"
        },
        {
            kicker: "RECONSTRUCT THE STATE",
            title: "Search across the workplace.",
            copy: "Boards, documents, chat, reviews, and CI history carry partial answers. The agent has to reconcile versions and provenance.",
            chips: ["board", "docs", "CI history"],
            time: "0.42 h",
            focus: "investigate"
        },
        {
            kicker: "MAKE THE QUESTION COUNT",
            title: "Ask the person who owns the answer.",
            copy: "A precise question with context opens the right thread. A referral can reveal the next owner — or the requirement can stay out of reach.",
            chips: ["owner", "referral", "follow-up"],
            time: "0.96 h",
            focus: "ask"
        },
        {
            kicker: "TURN EVIDENCE INTO BEHAVIOR",
            title: "Change the repository. Check the contract.",
            copy: "The patch has to satisfy new behaviors while preserving the ones that already work. Code and tests are part of the same loop.",
            chips: ["patch", "F2P", "P2P"],
            time: "1.67 h",
            focus: "build"
        },
        {
            kicker: "STAY OPEN TO NEW EVIDENCE",
            title: "Revisit the work when the facts move.",
            copy: "A late trace, corrected version, or new reply can overturn the first diagnosis. A reliable agent changes course instead of defending it.",
            chips: ["new trace", "revision", "scope"],
            time: "2.54 h",
            focus: "revise"
        },
        {
            kicker: "MAKE THE HANDOFF TRUSTWORTHY",
            title: "Deliver the change — and the account of it.",
            copy: "A finished run reports the status of every requirement: what was established, what changed, which checks passed, and which questions remain open.",
            chips: ["delivery note", "checks", "open work"],
            time: "3.40 h",
            focus: "deliver"
        }
    ];

    var storyButtons = document.querySelectorAll(".story-step");
    var storyIndex = document.getElementById("story-index");
    var storyTime = document.getElementById("story-time");
    var storyKicker = document.getElementById("story-kicker");
    var storyTitle = document.getElementById("story-title");
    var storyDescription = document.getElementById("story-description");
    var storyChips = document.getElementById("story-chips");
    var storyFocus = document.getElementById("story-focus");
    var storyProgress = document.getElementById("story-progress");

    function renderStory(index) {
        var item = story[index];
        if (!item) return;
        storyButtons.forEach(function (button, buttonIndex) {
            var selected = buttonIndex === index;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-selected", selected ? "true" : "false");
        });
        storyIndex.textContent = String(index + 1).padStart(2, "0");
        storyTime.textContent = item.time;
        storyKicker.textContent = item.kicker;
        storyTitle.textContent = item.title;
        storyDescription.textContent = item.copy;
        storyFocus.textContent = item.focus;
        storyChips.innerHTML = item.chips.map(function (chip) {
            return "<span>" + chip + "</span>";
        }).join("");
        storyProgress.style.width = ((index + 1) / story.length * 100) + "%";
    }

    storyButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            renderStory(Number(button.dataset.step));
        });
    });
    renderStory(0);

    // Outcome chart: switch between partial delivery, preservation, and complete delivery.
    var metricCopy = {
        f2p: {
            label: "F2P · {leader} leads",
            copy: "The two leading models deliver close to two thirds of the new behavior. The other nine stay below 40%."
        },
        p2p: {
            label: "P2P · {leader} preserves the most",
            copy: "Every model preserves most existing behavior. A high P2P score alone does not show that the new behavior was delivered: GLM 5.2 leads P2P with 24.40% F2P."
        },
        pass: {
            label: "Pass rate · {leader} leads",
            copy: "Pass rate requires every F2P and every P2P node to pass in the same run. Nine of the eleven models complete at most one task."
        }
    };
    var metricButtons = document.querySelectorAll(".metric-button");
    var modelRows = Array.prototype.slice.call(document.querySelectorAll(".model-row"));
    var resultChart = document.getElementById("result-chart");
    var metricNumber = document.getElementById("metric-number");
    var metricLabel = document.getElementById("metric-label");
    var metricCopyEl = document.getElementById("metric-copy");

    function renderMetric(metric) {
        var key = metric === "pass" ? "pass" : metric;
        var ordered = modelRows.slice().sort(function (a, b) {
            return Number(b.dataset[key]) - Number(a.dataset[key]);
        });
        ordered.forEach(function (row) {
            var value = Number(row.dataset[key]);
            row.classList.toggle("is-leader", value === Math.max.apply(null, ordered.map(function (item) {
                return Number(item.dataset[key]);
            })));
            row.querySelector(".model-track i").style.width = Math.max(value, value === 0 ? 0 : 1.2) + "%";
            row.querySelector("b").textContent = value.toFixed(2);
            resultChart.appendChild(row);
        });
        metricButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.dataset.metric === metric);
        });
        var leader = ordered[0];
        var leaderValue = Number(leader.dataset[key]);
        metricNumber.innerHTML = leaderValue.toFixed(2) + "<span>%</span>";
        metricLabel.textContent = metricCopy[metric].label.replace("{leader}", leader.dataset.name);
        metricCopyEl.textContent = metricCopy[metric].copy;
    }

    metricButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            renderMetric(button.dataset.metric);
        });
    });
    renderMetric("f2p");

    // Requirement acquisition and tool calls against F2P, eleven models.
    // Medians and rates are the author-supplied values in the paper's appendix table.
    var acqModels = [
        { name: "GPT-6 Astra", logo: "gpt", acq: 67.8, all: 75.3, tools: 178, msgs: 21, hours: 3.00, f2p: 62.91 },
        { name: "Claude-Opus-5.5", logo: "claude", acq: 64.2, all: 70.7, tools: 213, msgs: 22, hours: 5.01, f2p: 63.84 },
        { name: "GLM 5.3", logo: "glm", acq: 58.8, all: 66.3, tools: 785, msgs: 23, hours: 2.46, f2p: 31.27 },
        { name: "Qwen3.8-Max", logo: "qwen", acq: 46.9, all: 56.6, tools: 696, msgs: 10, hours: 8.00, f2p: 35.70 },
        { name: "Seed Evolving", logo: "seed", acq: 44.3, all: 50.6, tools: 503, msgs: 9, hours: 4.46, f2p: 39.09 },
        { name: "Qwen3.8-Flash", logo: "qwen", acq: 40.1, all: 51.0, tools: 902, msgs: 10, hours: 5.53, f2p: 30.70 },
        { name: "Kimi K3", logo: "kimi", acq: 33.1, all: 45.2, tools: 301, msgs: 7, hours: 1.41, f2p: 27.08 },
        { name: "DeepSeek V4.1 Flash", logo: "deepseek", acq: 26.1, all: 39.5, tools: 1603, msgs: 6, hours: 8.00, f2p: 28.20 },
        { name: "Seed 2.1 Pro", logo: "seed", acq: 24.7, all: 36.7, tools: 229, msgs: 8, hours: 2.50, f2p: 21.01 },
        { name: "GLM 5.2", logo: "glm", acq: 20.4, all: 35.0, tools: 361, msgs: 5, hours: 2.06, f2p: 24.40 },
        { name: "DeepSeek V4 Pro", logo: "deepseek", acq: 1.8, all: 23.9, tools: 150, msgs: 0, hours: 0.90, f2p: 13.04 }
    ];
    // Label placement per axis: [dx, dy, anchor] in viewBox units.
    var acqLabels = {
        acq: {
            "GPT-6 Astra": [0, 26, "middle"], "Claude-Opus-5.5": [-17, 4, "end"], "GLM 5.3": [17, 4, "start"],
            "Qwen3.8-Max": [17, 4, "start"], "Seed Evolving": [-15, -12, "end"], "Qwen3.8-Flash": [12, 22, "start"],
            "Kimi K3": [12, 22, "start"], "DeepSeek V4.1 Flash": [-6, -17, "end"], "Seed 2.1 Pro": [15, 18, "start"],
            "GLM 5.2": [-17, 4, "end"], "DeepSeek V4 Pro": [17, 4, "start"]
        },
        tools: {
            "GPT-6 Astra": [0, 26, "middle"], "Claude-Opus-5.5": [17, 4, "start"], "GLM 5.3": [-17, 4, "end"],
            "Qwen3.8-Max": [15, -10, "start"], "Seed Evolving": [-15, -12, "end"], "Qwen3.8-Flash": [15, -12, "start"],
            "Kimi K3": [-17, -6, "end"], "DeepSeek V4.1 Flash": [10, 26, "end"], "Seed 2.1 Pro": [-17, 4, "end"],
            "GLM 5.2": [14, 20, "start"], "DeepSeek V4 Pro": [17, 4, "start"]
        }
    };
    var acqCopy = {
        acq: {
            rho: "0.94",
            label: "Spearman ρ with F2P · eleven models",
            copy: "The share of requirements held by colleagues that a model obtains orders the models almost exactly as F2P does."
        },
        tools: {
            rho: "0.08",
            label: "Spearman ρ with F2P · eleven models",
            copy: "Tool calls barely relate to delivery. DeepSeek V4.1 Flash makes 1,603 per run; GPT-6 Astra obtains more requirements with 178. The extra calls go into the repository and seldom into asking colleagues."
        }
    };
    var svg = document.getElementById("acq-svg");
    if (svg) {
        var NS = "http://www.w3.org/2000/svg";
        var box = { left: 58, right: 616, top: 22, bottom: 326 };
        var yScale = function (v) { return box.bottom - (v - 5) / (72 - 5) * (box.bottom - box.top); };
        var xScales = {
            acq: function (v) { return box.left + (v + 4) / (76 + 4) * (box.right - box.left); },
            tools: function (v) {
                var lo = Math.log10(110), hi = Math.log10(2600);
                return box.left + (Math.log10(v) - lo) / (hi - lo) * (box.right - box.left);
            }
        };
        var xTicks = { acq: [0, 20, 40, 60], tools: [200, 500, 1000, 2000] };
        var xTitles = { acq: "Requirements held by colleagues obtained (%)", tools: "Median tool calls per run (log scale)" };
        var el = function (tag, attrs, parent) {
            var node = document.createElementNS(NS, tag);
            Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
            (parent || svg).appendChild(node);
            return node;
        };
        var grid = el("g", { "class": "acq-grid" });
        [10, 30, 50, 70].forEach(function (v) {
            el("line", { x1: box.left, x2: box.right, y1: yScale(v), y2: yScale(v) }, grid);
            el("text", { x: box.left - 12, y: yScale(v) + 4, "text-anchor": "end", "class": "acq-tick" }, grid).textContent = v;
        });
        el("text", { x: 16, y: (box.top + box.bottom) / 2, transform: "rotate(-90 16 " + (box.top + box.bottom) / 2 + ")", "text-anchor": "middle", "class": "acq-axis-title" }).textContent = "F2P (%)";
        var xGrid = el("g", { "class": "acq-grid" });
        var xTitle = el("text", { x: (box.left + box.right) / 2, y: 368, "text-anchor": "middle", "class": "acq-axis-title" });
        el("line", { x1: box.left, x2: box.right, y1: box.bottom, y2: box.bottom, "class": "acq-baseline" });

        var tooltip = document.getElementById("acq-tooltip");
        var plot = document.getElementById("acq-plot");
        var points = acqModels.map(function (model) {
            var g = el("g", { "class": "acq-point", tabindex: "0", role: "img", "aria-label": model.name + ", " + model.acq + "% of requirements held by colleagues obtained, " + model.tools + " tool calls, F2P " + model.f2p.toFixed(2) + "%" });
            el("circle", { r: 18, "class": "acq-hit" }, g);
            el("circle", { r: 12.5, "class": "acq-chip" }, g);
            el("image", { href: "static/logos/" + model.logo + ".png", x: -8, y: -8, width: 16, height: 16 }, g);
            var label = el("text", { "class": "acq-label" }, g);
            label.textContent = model.name;
            var show = function () {
                tooltip.innerHTML = "<b>" + model.name + "</b>" +
                    "<span>F2P <i>" + model.f2p.toFixed(2) + "%</i></span>" +
                    "<span>Colleague req. obtained <i>" + model.acq.toFixed(1) + "%</i></span>" +
                    "<span>All req. obtained <i>" + model.all.toFixed(1) + "%</i></span>" +
                    "<span>Messages <i>" + model.msgs + "</i></span>" +
                    "<span>Tool calls <i>" + model.tools.toLocaleString("en-US") + "</i></span>" +
                    "<span>Hours <i>" + model.hours.toFixed(2) + "</i></span>";
                tooltip.hidden = false;
                var rect = plot.getBoundingClientRect();
                var mark = g.getBoundingClientRect();
                var left = mark.left - rect.left + mark.width / 2;
                var flip = left > rect.width * 0.62;
                tooltip.style.left = (flip ? left - 18 : left + 18) + "px";
                tooltip.style.top = (mark.top - rect.top + mark.height / 2) + "px";
                tooltip.classList.toggle("is-flipped", flip);
                g.classList.add("is-hover");
            };
            var hide = function () { tooltip.hidden = true; g.classList.remove("is-hover"); };
            g.addEventListener("pointerenter", show);
            g.addEventListener("pointerleave", hide);
            g.addEventListener("focus", show);
            g.addEventListener("blur", hide);
            return { model: model, g: g, label: label };
        });

        var renderAxis = function (axis) {
            while (xGrid.firstChild) xGrid.removeChild(xGrid.firstChild);
            xTicks[axis].forEach(function (v) {
                var x = xScales[axis](v);
                el("line", { x1: x, x2: x, y1: box.top, y2: box.bottom }, xGrid);
                el("text", { x: x, y: box.bottom + 20, "text-anchor": "middle", "class": "acq-tick" }, xGrid).textContent = v.toLocaleString("en-US");
            });
            xTitle.textContent = xTitles[axis];
            points.forEach(function (point) {
                var x = xScales[axis](point.model[axis]);
                var y = yScale(point.model.f2p);
                point.g.style.transform = "translate(" + x + "px," + y + "px)";
                var place = acqLabels[axis][point.model.name];
                point.label.setAttribute("x", place[0]);
                point.label.setAttribute("y", place[1]);
                point.label.setAttribute("text-anchor", place[2]);
            });
            document.querySelectorAll(".acq-button").forEach(function (button) {
                button.classList.toggle("is-active", button.dataset.axis === axis);
            });
            document.getElementById("acq-rho").innerHTML = "ρ " + acqCopy[axis].rho;
            document.getElementById("acq-rho-label").textContent = acqCopy[axis].label;
            document.getElementById("acq-copy").textContent = acqCopy[axis].copy;
        };
        document.querySelectorAll(".acq-button").forEach(function (button) {
            button.addEventListener("click", function () { renderAxis(button.dataset.axis); });
        });
        renderAxis("acq");

        var body = document.getElementById("acq-table-body");
        body.innerHTML = acqModels.map(function (m) {
            return "<tr><td>" + m.name + "</td><td>" + m.msgs + "</td><td>" + m.tools.toLocaleString("en-US") + "</td><td>" + m.hours.toFixed(2) +
                "</td><td>" + m.acq.toFixed(1) + "%</td><td>" + m.all.toFixed(1) + "%</td><td>" + m.f2p.toFixed(2) + "%</td></tr>";
        }).join("");
    }

    var copyButton = document.getElementById("copy-bibtex");
    if (copyButton && navigator.clipboard) {
        copyButton.addEventListener("click", function () {
            navigator.clipboard.writeText(document.getElementById("bibtex").textContent).then(function () {
                copyButton.textContent = "Copied";
                setTimeout(function () { copyButton.textContent = "Copy BibTeX"; }, 1600);
            });
        });
    }

    // A small amount of depth in the hero map keeps the opening frame alive.
    var heroVisual = document.querySelector(".hero-visual");
    if (heroVisual && !reduceMotion) {
        heroVisual.addEventListener("pointermove", function (event) {
            var rect = heroVisual.getBoundingClientRect();
            var x = (event.clientX - rect.left) / rect.width - 0.5;
            var y = (event.clientY - rect.top) / rect.height - 0.5;
            heroVisual.style.setProperty("--tilt-x", (x * 4).toFixed(2) + "deg");
            heroVisual.style.setProperty("--tilt-y", (y * -4).toFixed(2) + "deg");
        });
        heroVisual.addEventListener("pointerleave", function () {
            heroVisual.style.setProperty("--tilt-x", "0deg");
            heroVisual.style.setProperty("--tilt-y", "0deg");
        });
    }

    var lightbox = document.getElementById("fig-lightbox");
    var figButtons = Array.prototype.slice.call(document.querySelectorAll(".paper-fig-open"));
    if (lightbox && typeof lightbox.showModal === "function" && figButtons.length) {
        var lbImg = document.getElementById("fig-lightbox-img");
        var lbCap = document.getElementById("fig-lightbox-cap");
        var lbLabel = document.getElementById("fig-lightbox-label");
        var current = 0;
        var showFig = function (index) {
            current = (index + figButtons.length) % figButtons.length;
            var button = figButtons[current];
            var img = button.querySelector("img");
            var caption = button.parentNode.querySelector("figcaption");
            lbImg.src = img.src;
            lbImg.alt = img.alt;
            lbLabel.textContent = "Figure " + button.getAttribute("data-fig") + " / " + figButtons.length;
            lbCap.textContent = caption.textContent.replace(/^Figure \d+\s*/, "");
        };
        figButtons.forEach(function (button, index) {
            button.addEventListener("click", function () { showFig(index); lightbox.showModal(); });
        });
        document.getElementById("fig-prev").addEventListener("click", function () { showFig(current - 1); });
        document.getElementById("fig-next").addEventListener("click", function () { showFig(current + 1); });
        document.getElementById("fig-close").addEventListener("click", function () { lightbox.close(); });
        lightbox.addEventListener("click", function (event) { if (event.target === lightbox) { lightbox.close(); } });
        lightbox.addEventListener("keydown", function (event) {
            if (event.key === "ArrowLeft") { showFig(current - 1); }
            if (event.key === "ArrowRight") { showFig(current + 1); }
        });
    } else {
        figButtons.forEach(function (button) {
            button.addEventListener("click", function () { window.open(button.querySelector("img").src, "_blank", "noopener"); });
        });
    }
})();
