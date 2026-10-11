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
            kicker: "TURN EVIDENCE INTO BEHAVIOUR",
            title: "Change the repository. Check the contract.",
            copy: "The patch has to satisfy new behaviours while preserving the ones that already work. Code and tests are part of the same loop.",
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
            copy: "A finished run records what was established, what changed, which checks passed, and which questions remain open.",
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
            label: "F2P · Opus-5.5 leads partial delivery",
            copy: "The strongest systems implement a substantial fraction of requested behaviours. Complete delivery remains a different, much harder bar."
        },
        p2p: {
            label: "P2P · Opus-5.5 preserves the most",
            copy: "Preservation is a real constraint, but a high P2P score alone does not prove that the new behaviour was delivered."
        },
        pass: {
            label: "Pass rate · GPT-6 Astra leads complete delivery",
            copy: "Pass rate asks for every F2P and every P2P node to pass in the same run. It is the benchmark's end-to-end bar."
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
        metricLabel.textContent = metricCopy[metric].label;
        metricCopyEl.textContent = metricCopy[metric].copy;
    }

    metricButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            renderMetric(button.dataset.metric);
        });
    });
    renderMetric("f2p");

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
})();
