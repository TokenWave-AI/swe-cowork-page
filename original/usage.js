(function () {
    "use strict";
    var root = document.getElementById("usage");
    if (!root) return;

    var metrics = {
        calls: { key: "median_model_calls", label: "Model calls", divisor: 1, range: [50, 1200], ticks: [200, 400, 600, 800, 1000], copy: "Each model call is one request to the model. A run can contain many calls before the agent hands over its work." },
        input: { key: "median_input_tokens", label: "Input tokens", divisor: 1e6, range: [10, 65], ticks: [20, 30, 40, 50, 60], copy: "Input usage includes tokens processed across repeated calls within a run. Seed Evolving’s input median is approximate." },
        output: { key: "median_output_tokens", label: "Output tokens", divisor: 1e6, range: [0.035, 5], ticks: [0.05, 0.1, 0.3, 1, 3], log: true, copy: "Output usage counts tokens generated within a run. Seed Evolving has no reported output median and is omitted from this view." },
        tools: { key: "median_tool_calls", label: "Tool calls", divisor: 1, range: [110, 2500], ticks: [200, 500, 1000, 2000], log: true, copy: "These tool-call medians come from the usage snapshots. The requirement-acquisition chart above uses its own run archive." },
        compactions: { key: "median_compactions", label: "Context compactions", divisor: 1, range: [-3, 40], ticks: [0, 10, 20, 30, 40], copy: "Compactions summarize the conversation to free context space. The linear axis includes Claude-Opus-5.5’s median of zero." }
    };
    var svg = document.getElementById("usage-svg");
    var tooltip = document.getElementById("usage-tooltip");
    var axis = "input", selected = "gpt", models = [];
    var compact = window.matchMedia("(max-width: 680px)");
    var buttons = root.querySelectorAll("[data-usage]");

    function element(tag, attrs, parent, text) {
        var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
        if (text !== undefined) node.textContent = text;
        (parent || svg).appendChild(node);
        return node;
    }

    function format(model, metric, unit) {
        var value = model[metric.key];
        if (value === null) return "—";
        var prefix = metric.key === "median_input_tokens" && model.approximate_input_metrics ? "≈" : "";
        return prefix + (value / metric.divisor).toLocaleString("en-US", { maximumFractionDigits: 3 }) + (unit && metric.divisor === 1e6 ? "M" : "");
    }

    function select(model) {
        selected = model.id;
        var metric = metrics[axis];
        document.getElementById("usage-model").textContent = model.name;
        var value = document.getElementById("usage-value");
        value.textContent = format(model, metric, false);
        if (metric.divisor === 1e6) {
            var unit = document.createElement("span");
            unit.textContent = "M";
            value.appendChild(unit);
        }
        document.getElementById("usage-value-label").textContent = "Median " + metric.label.toLowerCase() + " per run";
        document.getElementById("usage-f2p").textContent = model.f2p_percent.toFixed(2) + "%";
        document.getElementById("usage-copy").textContent = metric.copy;
        root.querySelectorAll("[data-model]").forEach(function (node) {
            var active = node.dataset.model === selected;
            node.classList.toggle("is-selected", active);
            node.setAttribute("aria-pressed", String(active));
        });
    }

    function showTooltip(model, point) {
        tooltip.replaceChildren();
        var name = document.createElement("b");
        name.textContent = model.name;
        tooltip.appendChild(name);
        [["Median " + metrics[axis].label.toLowerCase(), format(model, metrics[axis], true)], ["F2P", model.f2p_percent.toFixed(2) + "%"]].forEach(function (pair) {
            var row = document.createElement("span"), value = document.createElement("i");
            row.textContent = pair[0]; value.textContent = pair[1];
            row.appendChild(value); tooltip.appendChild(row);
        });
        tooltip.hidden = false;
        var plot = document.getElementById("usage-plot").getBoundingClientRect();
        var mark = point.querySelector("circle").getBoundingClientRect();
        tooltip.style.left = Math.max(0, Math.min(mark.left - plot.left + 20, plot.width - tooltip.offsetWidth)) + "px";
        tooltip.style.top = Math.max(0, mark.top - plot.top - tooltip.offsetHeight - 8) + "px";
    }

    function overlap(a, b) {
        return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    }

    function placeLabels(points, box) {
        if (compact.matches) return;
        var placed = [], markers = points.map(function (p) { return { left: p.x - 15, right: p.x + 15, top: p.y - 15, bottom: p.y + 15 }; });
        var candidates = [[20, 4, "start"], [-20, 4, "end"], [0, -22, "middle"], [0, 32, "middle"], [18, -18, "start"], [-18, -18, "end"], [18, 28, "start"], [-18, 28, "end"], [0, -38, "middle"], [0, 48, "middle"]];
        points.forEach(function (p) {
            var label = element("text", { "class": "acq-label usage-label" }, p.node, p.model.name), best;
            candidates.forEach(function (c, i) {
                label.setAttribute("x", c[0]); label.setAttribute("y", c[1]); label.setAttribute("text-anchor", c[2]);
                var b = label.getBBox(), bounds = { left: p.x + b.x - 2, right: p.x + b.x + b.width + 2, top: p.y + b.y - 2, bottom: p.y + b.y + b.height + 2 };
                var cost = ((b.width + 4) * (b.height + 4) - overlap(bounds, box)) * 100;
                placed.forEach(function (r) { cost += overlap(bounds, r) * 30; });
                markers.forEach(function (r) { cost += overlap(bounds, r) * 25; });
                cost += i;
                if (!best || cost < best.cost) best = { candidate: c, bounds: bounds, cost: cost };
            });
            label.setAttribute("x", best.candidate[0]); label.setAttribute("y", best.candidate[1]); label.setAttribute("text-anchor", best.candidate[2]);
            placed.push(best.bounds);
        });
    }

    function render() {
        var metric = metrics[axis];
        var visible = models.filter(function (m) { return m[metric.key] !== null; });
        var width = compact.matches ? 400 : 640;
        var box = { left: 52, right: width - 24, top: 22, bottom: 338 };
        var transform = metric.log ? Math.log10 : function (x) { return x; };
        var low = transform(metric.range[0]), high = transform(metric.range[1]);
        function xScale(v) { return box.left + (transform(v / metric.divisor) - low) / (high - low) * (box.right - box.left); }
        function yScale(v) { return box.bottom - (v - 10) / 60 * (box.bottom - box.top); }
        tooltip.hidden = true;
        svg.replaceChildren();
        svg.setAttribute("viewBox", "0 0 " + width + " 400");
        element("title", { id: "usage-svg-title" }, svg, "Median " + metric.label.toLowerCase() + " per run against full-release F2P");
        var grid = element("g", { "class": "acq-grid" });
        [10, 30, 50, 70].forEach(function (value) {
            var y = yScale(value);
            element("line", { x1: box.left, x2: box.right, y1: y, y2: y }, grid);
            element("text", { x: box.left - 10, y: y + 4, "text-anchor": "end", "class": "acq-tick" }, grid, value);
        });
        metric.ticks.forEach(function (value) {
            var x = xScale(value * metric.divisor);
            element("line", { x1: x, x2: x, y1: box.top, y2: box.bottom }, grid);
            element("text", { x: x, y: box.bottom + 20, "text-anchor": "middle", "class": "acq-tick" }, grid, value.toLocaleString("en-US"));
        });
        element("text", { x: 14, y: 180, transform: "rotate(-90 14 180)", "text-anchor": "middle", "class": "acq-axis-title" }, svg, "F2P (%)");
        element("text", { x: (box.left + box.right) / 2, y: 386, "text-anchor": "middle", "class": "acq-axis-title" }, svg, "Median " + metric.label.toLowerCase() + " per run" + (metric.divisor === 1e6 ? " (M)" : ""));
        element("line", { x1: box.left, x2: box.right, y1: box.bottom, y2: box.bottom, "class": "acq-baseline" });
        var markerBoxes = [];
        var points = visible.map(function (model) {
            var actualX = xScale(model[metric.key]), actualY = yScale(model.f2p_percent);
            var positions = [[0, 0], [0, 32], [0, -32], [32, 0], [-32, 0], [0, 64], [0, -64]];
            var best;
            positions.forEach(function (offset) {
                var x = actualX + offset[0], y = actualY + offset[1];
                var bounds = { left: x - 15, right: x + 15, top: y - 15, bottom: y + 15 };
                var cost = (900 - overlap(bounds, box)) * 100 + Math.abs(offset[0]) + Math.abs(offset[1]);
                markerBoxes.forEach(function (other) { cost += overlap(bounds, other) * 50; });
                if (!best || cost < best.cost) best = { x: x, y: y, bounds: bounds, cost: cost };
            });
            var x = best.x, y = best.y;
            markerBoxes.push(best.bounds);
            if (x !== actualX || y !== actualY) {
                element("line", { x1: actualX, y1: actualY, x2: x, y2: y, stroke: "#8a98ad", "stroke-width": 1, "class": "usage-marker-leader" });
                element("circle", { cx: actualX, cy: actualY, r: 2.5, fill: "#d0d8e6", "class": "usage-value-point" });
            }
            var point = element("g", { "class": "acq-point usage-point", transform: "translate(" + x + " " + y + ")", tabindex: "0", role: "button", "data-model": model.id, "aria-label": model.name + ", median " + metric.label.toLowerCase() + " " + format(model, metric, true) + ", F2P " + model.f2p_percent.toFixed(2) + "%" });
            element("circle", { r: 20, "class": "acq-hit" }, point);
            element("circle", { r: 13, "class": "acq-chip" }, point);
            element("image", { href: "static/logos/" + model.icon + ".png", x: -8, y: -8, width: 16, height: 16 }, point);
            point.addEventListener("pointerenter", function (event) { if (event.pointerType !== "touch") { select(model); showTooltip(model, point); } });
            point.addEventListener("pointerleave", function () { tooltip.hidden = true; });
            point.addEventListener("focus", function () { select(model); showTooltip(model, point); });
            point.addEventListener("blur", function () { tooltip.hidden = true; });
            point.addEventListener("click", function () { select(model); });
            point.addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(model); } if (event.key === "Escape") tooltip.hidden = true; });
            return { node: point, x: x, y: y, model: model };
        });
        placeLabels(points, box);
        buttons.forEach(function (button) {
            var active = button.dataset.usage === axis;
            button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active));
        });
        root.querySelectorAll(".usage-model-button").forEach(function (button) {
            button.disabled = !visible.some(function (model) { return model.id === button.dataset.model; });
        });
        document.getElementById("usage-status").textContent = visible.length + " models · median per run · " + (metric.log ? "logarithmic" : "linear") + " horizontal axis";
        select(visible.find(function (model) { return model.id === selected; }) || visible[0]);
    }

    fetch("static/data/usage-medians.json?v=20261022-usage-v6").then(function (response) {
        if (!response.ok) throw new Error("Usage data could not be loaded");
        return response.json();
    }).then(function (data) {
        models = data.models;
        models.forEach(function (model) {
            var button = document.createElement("button"), icon = document.createElement("img");
            button.type = "button"; button.className = "usage-model-button"; button.dataset.model = model.id;
            icon.src = "static/logos/" + model.icon + ".png"; icon.alt = "";
            button.appendChild(icon); button.appendChild(document.createTextNode(model.name));
            button.addEventListener("click", function () { tooltip.hidden = true; select(model); });
            document.getElementById("usage-models").appendChild(button);
            var row = document.createElement("tr"), name = document.createElement("th");
            name.scope = "row"; name.textContent = model.name; row.appendChild(name);
            ["calls", "input", "output", "tools", "compactions"].forEach(function (key) {
                var cell = document.createElement("td"); cell.textContent = format(model, metrics[key], false); row.appendChild(cell);
            });
            var score = document.createElement("td"); score.textContent = model.f2p_percent.toFixed(2) + "%"; row.appendChild(score);
            document.getElementById("usage-table-body").appendChild(row);
        });
        document.getElementById("usage-interactive").hidden = false;
        buttons.forEach(function (button) { button.disabled = false; button.addEventListener("click", function () { axis = button.dataset.usage; render(); }); });
        compact.addEventListener("change", render);
        render();
        document.fonts.ready.then(render);
    }).catch(function () {
        document.getElementById("usage-status").textContent = "The interactive data could not be loaded. View the figures below or open a PDF.";
    });
})();
