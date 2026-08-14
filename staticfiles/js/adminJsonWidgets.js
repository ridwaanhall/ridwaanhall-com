/*
 * Structured editors for the admin's JSON-backed fields.
 *
 * Contract (see apps/core/admin_widgets.py for the rationale):
 *   - The single <textarea name="..."> inside .jsonw-src is the only thing that
 *     gets submitted. We hide it and keep it in sync.
 *   - Everything we build is name-less, so Django's inlines.js has exactly one
 *     name to renumber when cloning a formset row, and no ids can collide.
 *   - The parsed JSON is the model. We mutate it in place and re-stringify.
 *     Values we never touch are never re-derived, so their exact bytes survive.
 *   - Never trim/normalise/collapse whitespace, and never use innerHTML for
 *     values: several stored class strings contain double spaces and several
 *     text values are raw HTML with real newlines.
 */
(function () {
    "use strict";

    var KINDS = {};

    // ---------------------------------------------------------------- helpers

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text !== undefined && text !== null) { node.textContent = text; }
        return node;
    }

    function button(label, className, onClick, title) {
        var b = el("button", "jsonw-btn " + (className || ""), label);
        b.type = "button";
        if (title) { b.title = title; }
        b.addEventListener("click", onClick);
        return b;
    }

    function input(value, placeholder) {
        var i = document.createElement("input");
        i.type = "text";
        i.className = "jsonw-input";
        i.value = value === undefined || value === null ? "" : value;
        if (placeholder) { i.placeholder = placeholder; }
        return i;
    }

    function textarea(value, opts) {
        var t = document.createElement("textarea");
        t.className = "jsonw-textarea" + (opts && opts.mono ? " jsonw-mono" : "");
        t.value = value === undefined || value === null ? "" : value;
        t.rows = (opts && opts.rows) || 3;
        if (opts && opts.mono) {
            t.setAttribute("wrap", "off");
            t.setAttribute("spellcheck", "false");
        }
        autoGrow(t);
        return t;
    }

    function autoGrow(t) {
        function grow() {
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight + 2, 600) + "px";
        }
        t.addEventListener("input", grow);
        setTimeout(grow, 0);
    }

    function move(list, from, to) {
        if (to < 0 || to >= list.length) { return false; }
        var item = list.splice(from, 1)[0];
        list.splice(to, 0, item);
        return true;
    }

    /* Row chrome shared by every repeatable list: move up/down + delete. */
    function rowControls(list, index, sync, opts) {
        var wrap = el("span", "jsonw-rowctl");
        wrap.appendChild(button("↑", "jsonw-btn-icon", function () {
            if (move(list, index, index - 1)) { sync(); }
        }, "Move up"));
        wrap.appendChild(button("↓", "jsonw-btn-icon", function () {
            if (move(list, index, index + 1)) { sync(); }
        }, "Move down"));
        wrap.appendChild(button("✕", "jsonw-btn-icon jsonw-btn-danger", function () {
            if (opts && opts.confirm && !window.confirm(opts.confirm)) { return; }
            list.splice(index, 1);
            sync();
        }, "Remove"));
        return wrap;
    }

    function emptyNote(text) {
        return el("p", "jsonw-empty", text);
    }

    // ------------------------------------------------------------- stringlist

    KINDS.stringlist = function (ui, model, opts, sync) {
        if (!Array.isArray(model)) { return false; }
        var label = opts.itemLabel || "item";

        if (!model.length) {
            ui.appendChild(emptyNote("No entries yet."));
        }

        model.forEach(function (value, index) {
            var row = el("div", "jsonw-row");
            row.appendChild(el("span", "jsonw-handle", String(index + 1)));

            var control = opts.multiline
                ? textarea(value, { rows: 3 })
                : input(value);
            control.classList.add("jsonw-grow");
            control.addEventListener("input", function () {
                model[index] = control.value;   // no trim: preserve bytes
                sync(true);
            });
            row.appendChild(control);
            row.appendChild(rowControls(model, index, sync));
            ui.appendChild(row);
        });

        var foot = el("div", "jsonw-foot");
        foot.appendChild(button("+ Add " + label, "jsonw-btn-add", function () {
            model.push("");
            sync();
        }));
        if (opts.allowsHtml) {
            foot.appendChild(el("span", "jsonw-badge jsonw-badge-html",
                "raw HTML — rendered unescaped"));
        }
        ui.appendChild(foot);
        return true;
    };

    // --------------------------------------------------------------- keyvalue

    /*
     * dict[str, str]. Objects are stored as jsonb in production, which
     * normalises key order, so there is deliberately no reorder control here --
     * it would appear to work locally and be a no-op in production.
     */
    function keyValueRows(ui, obj, opts, sync) {
        var keys = Object.keys(obj);
        if (!keys.length) {
            ui.appendChild(emptyNote("No entries yet."));
        }
        keys.forEach(function (key) {
            var row = el("div", "jsonw-row jsonw-row-kv");

            var keyInput = input(key, opts.keyLabel || "Label");
            keyInput.className += " jsonw-input-key";
            keyInput.addEventListener("change", function () {
                var next = keyInput.value;
                if (next === key) { return; }
                if (next === "") {
                    window.alert("A label cannot be empty.");
                    keyInput.value = key;
                    return;
                }
                if (Object.prototype.hasOwnProperty.call(obj, next)) {
                    window.alert("The label “" + next + "” is already used.");
                    keyInput.value = key;
                    return;
                }
                // Rebuild preserving position so the local (SQLite) preview
                // matches what the editor sees.
                var rebuilt = {};
                Object.keys(obj).forEach(function (k) {
                    if (k === key) { rebuilt[next] = obj[k]; } else { rebuilt[k] = obj[k]; }
                });
                Object.keys(obj).forEach(function (k) { delete obj[k]; });
                Object.keys(rebuilt).forEach(function (k) { obj[k] = rebuilt[k]; });
                sync();
            });

            var valueInput = textarea(obj[key], { rows: 2 });
            valueInput.classList.add("jsonw-grow");
            valueInput.placeholder = opts.valueLabel || "Description";
            valueInput.addEventListener("input", function () {
                obj[key] = valueInput.value;
                sync(true);
            });

            row.appendChild(keyInput);
            row.appendChild(valueInput);

            var ctl = el("span", "jsonw-rowctl");
            ctl.appendChild(button("✕", "jsonw-btn-icon jsonw-btn-danger", function () {
                delete obj[key];
                sync();
            }, "Remove"));
            row.appendChild(ctl);

            ui.appendChild(row);
        });
    }

    function addPairButton(obj, sync, label) {
        return button("+ Add " + (label || "entry"), "jsonw-btn-add", function () {
            var base = "New entry", name = base, n = 2;
            while (Object.prototype.hasOwnProperty.call(obj, name)) {
                name = base + " " + n; n += 1;
            }
            obj[name] = "";
            sync();
        });
    }

    KINDS.keyvalue = function (ui, model, opts, sync) {
        if (typeof model !== "object" || model === null || Array.isArray(model)) { return false; }
        keyValueRows(ui, model, opts, sync);
        var foot = el("div", "jsonw-foot");
        foot.appendChild(addPairButton(model, sync));
        ui.appendChild(foot);
        return true;
    };

    // -------------------------------------------------------- groupedkeyvalue

    KINDS.groupedkeyvalue = function (ui, model, opts, sync) {
        if (typeof model !== "object" || model === null || Array.isArray(model)) { return false; }
        var groups = Object.keys(model);

        if (!groups.length) { ui.appendChild(emptyNote("No groups yet.")); }

        groups.forEach(function (group) {
            var box = el("div", "jsonw-group");
            var head = el("div", "jsonw-group-head");

            var nameInput = input(group, opts.groupLabel || "Group");
            nameInput.className += " jsonw-input-group";
            nameInput.addEventListener("change", function () {
                var next = nameInput.value;
                if (next === group) { return; }
                if (next === "" || Object.prototype.hasOwnProperty.call(model, next)) {
                    window.alert(next === "" ? "A group name cannot be empty."
                        : "The group “" + next + "” already exists.");
                    nameInput.value = group;
                    return;
                }
                var rebuilt = {};
                Object.keys(model).forEach(function (k) {
                    if (k === group) { rebuilt[next] = model[k]; } else { rebuilt[k] = model[k]; }
                });
                Object.keys(model).forEach(function (k) { delete model[k]; });
                Object.keys(rebuilt).forEach(function (k) { model[k] = rebuilt[k]; });
                sync();
            });
            head.appendChild(nameInput);
            head.appendChild(button("✕ Remove group", "jsonw-btn-danger", function () {
                if (!window.confirm("Remove the group “" + group + "” and all its entries?")) { return; }
                delete model[group];
                sync();
            }));
            box.appendChild(head);

            var body = el("div", "jsonw-group-body");
            keyValueRows(body, model[group], opts, sync);
            var foot = el("div", "jsonw-foot");
            foot.appendChild(addPairButton(model[group], sync));
            body.appendChild(foot);
            box.appendChild(body);

            ui.appendChild(box);
        });

        var outer = el("div", "jsonw-foot");
        outer.appendChild(button("+ Add group", "jsonw-btn-add", function () {
            var base = "New group", name = base, n = 2;
            while (Object.prototype.hasOwnProperty.call(model, name)) {
                name = base + " " + n; n += 1;
            }
            model[name] = {};
            sync();
        }));
        ui.appendChild(outer);
        return true;
    };

    // ------------------------------------------------------ copyrightcredits

    KINDS.copyrightcredits = function (ui, model, opts, sync) {
        if (typeof model !== "object" || model === null || Array.isArray(model)) { return false; }

        // Fixed key set -- the privacy policy template hardcodes all four.
        [["owner", "Owner"], ["license", "License"]].forEach(function (pair) {
            var key = pair[0];
            var row = el("div", "jsonw-row");
            row.appendChild(el("span", "jsonw-label", pair[1]));
            var control = input(model[key] || "");
            control.classList.add("jsonw-grow");
            control.addEventListener("input", function () {
                model[key] = control.value;
                sync(true);
            });
            row.appendChild(control);
            ui.appendChild(row);
        });

        [["third_party_services", "Third-Party Services"], ["inspiration", "Inspiration"]]
            .forEach(function (pair) {
                var key = pair[0];
                if (typeof model[key] !== "object" || model[key] === null) { model[key] = {}; }
                var box = el("div", "jsonw-group");
                box.appendChild(el("div", "jsonw-group-head jsonw-group-head-static", pair[1]));
                var body = el("div", "jsonw-group-body");
                keyValueRows(body, model[key], opts, sync);
                var foot = el("div", "jsonw-foot");
                foot.appendChild(addPairButton(model[key], sync));
                body.appendChild(foot);
                box.appendChild(body);
                ui.appendChild(box);
            });
        return true;
    };

    // ---------------------------------------------------------- contentblocks

    var TEXTUAL = {};
    var LISTY = {};

    function blockSummary(block) {
        var raw = block.text || "";
        var flat = raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        if (block.type === "table") {
            flat = ((block.headers || []).join(" · ")) || "(table)";
        } else if (LISTY[block.type]) {
            flat = (block.items || []).length + " item(s)";
        }
        return flat.length > 70 ? flat.slice(0, 70) + "…" : flat;
    }

    function renderTextControl(box, block, sync) {
        var mono = block.type === "pre" || block.type === "code";
        var control = textarea(block.text || "", { rows: mono ? 8 : 3, mono: mono });
        control.addEventListener("input", function () {
            block.text = control.value;      // verbatim; may be raw HTML
            sync(true);
        });
        box.appendChild(control);
        box.appendChild(el("span", "jsonw-badge jsonw-badge-html",
            "raw HTML — rendered unescaped"));
    }

    function renderItemsControl(box, block, sync) {
        if (!Array.isArray(block.items)) { block.items = []; }
        var items = block.items;

        items.forEach(function (item, index) {
            var row = el("div", "jsonw-row");
            row.appendChild(el("span", "jsonw-handle", String(index + 1)));

            var isString = typeof item === "string";
            var control = input(isString ? item : (item.text || ""));
            control.classList.add("jsonw-grow");
            control.addEventListener("input", function () {
                if (typeof items[index] === "string") {
                    items[index] = control.value;
                } else {
                    items[index].text = control.value;
                }
                sync(true);
            });
            row.appendChild(control);

            // `class` on a list item is never read by the renderer, and 49 of
            // 85 stored items omit the key entirely. Show it, don't edit it --
            // that keeps the present/absent split byte-stable for free.
            if (!isString && Object.prototype.hasOwnProperty.call(item, "class")) {
                var badge = el("span", "jsonw-badge jsonw-badge-muted", "class");
                badge.title = item["class"];
                row.appendChild(badge);
            }

            row.appendChild(rowControls(items, index, sync));
            box.appendChild(row);
        });

        var foot = el("div", "jsonw-foot");
        foot.appendChild(button("+ Add list item", "jsonw-btn-add", function () {
            items.push({ type: "li", text: "" });   // matches the majority variant
            sync();
        }));
        box.appendChild(foot);
    }

    function renderTableControl(box, block, sync) {
        if (!Array.isArray(block.headers)) { block.headers = []; }
        if (!Array.isArray(block.rows)) { block.rows = []; }
        var headers = block.headers, rows = block.rows;

        var table = el("table", "jsonw-table");

        var thead = el("thead");
        var htr = el("tr");
        headers.forEach(function (header, col) {
            var th = el("th");
            var control = input(header);
            control.addEventListener("input", function () {
                headers[col] = control.value;
                sync(true);
            });
            th.appendChild(control);
            th.appendChild(button("✕", "jsonw-btn-icon jsonw-btn-danger", function () {
                if (!window.confirm("Remove this column from every row?")) { return; }
                headers.splice(col, 1);
                rows.forEach(function (r) { r.splice(col, 1); });
                sync();
            }, "Remove column"));
            htr.appendChild(th);
        });
        var addCol = el("th");
        addCol.appendChild(button("+ col", "jsonw-btn-add", function () {
            headers.push("");
            rows.forEach(function (r) { r.push(""); });   // keep it rectangular
            sync();
        }));
        htr.appendChild(addCol);
        thead.appendChild(htr);
        table.appendChild(thead);

        var tbody = el("tbody");
        rows.forEach(function (row, rowIndex) {
            var tr = el("tr");
            row.forEach(function (cell, col) {
                var td = el("td");
                var control = /\n/.test(cell) ? textarea(cell, { rows: 2 }) : input(cell);
                control.addEventListener("input", function () {
                    rows[rowIndex][col] = control.value;
                    sync(true);
                });
                td.appendChild(control);
                tr.appendChild(td);
            });
            var ctl = el("td");
            ctl.appendChild(rowControls(rows, rowIndex, sync));
            tr.appendChild(ctl);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        box.appendChild(table);

        var foot = el("div", "jsonw-foot");
        foot.appendChild(button("+ Add row", "jsonw-btn-add", function () {
            rows.push(headers.map(function () { return ""; }));
            sync();
        }));
        box.appendChild(foot);
    }

    function renderScalarControls(box, block, keys, sync) {
        keys.forEach(function (key) {
            var row = el("div", "jsonw-row");
            row.appendChild(el("span", "jsonw-label", key));
            var control = input(block[key] || "");
            control.classList.add("jsonw-grow");
            control.addEventListener("input", function () {
                if (control.value === "" && key === "target") {
                    delete block[key];          // optional: don't invent the key
                } else {
                    block[key] = control.value;
                }
                sync(true);
            });
            row.appendChild(control);
            box.appendChild(row);
        });
    }

    function rebuildBlockForType(block, nextType) {
        var out = { type: nextType };
        if (Object.prototype.hasOwnProperty.call(block, "class")) { out["class"] = block["class"]; }
        if (TEXTUAL[nextType] && TEXTUAL[block.type]) { out.text = block.text || ""; }
        else if (TEXTUAL[nextType]) { out.text = ""; }
        else if (LISTY[nextType]) { out.items = LISTY[block.type] ? (block.items || []) : []; }
        else if (nextType === "table") {
            out.headers = block.headers || [];
            out.rows = block.rows || [];
        } else if (nextType === "a") { out.text = block.text || ""; out.href = block.href || ""; }
        else if (nextType === "img") { out.src = block.src || ""; out.alt = block.alt || ""; }
        return out;
    }

    KINDS.contentblocks = function (ui, model, opts, sync) {
        if (!Array.isArray(model)) { return false; }

        (opts.textTypes || []).forEach(function (t) { TEXTUAL[t] = true; });
        (opts.listTypes || []).forEach(function (t) { LISTY[t] = true; });

        if (!model.length) { ui.appendChild(emptyNote("No content blocks yet.")); }

        model.forEach(function (block, index) {
            var box = el("div", "jsonw-block");

            var head = el("div", "jsonw-block-head");
            head.appendChild(el("span", "jsonw-handle", String(index + 1)));

            var select = document.createElement("select");
            select.className = "jsonw-select";
            (opts.blockTypes || []).forEach(function (t) {
                var o = document.createElement("option");
                o.value = t; o.textContent = t;
                if (t === block.type) { o.selected = true; }
                select.appendChild(o);
            });
            if (!(opts.blockTypes || []).includes(block.type)) {
                var custom = document.createElement("option");
                custom.value = block.type; custom.textContent = block.type + " (custom)";
                custom.selected = true;
                select.appendChild(custom);
            }
            select.addEventListener("change", function () {
                var next = select.value;
                var losesData = (LISTY[block.type] && (block.items || []).length && !LISTY[next]) ||
                    (block.type === "table" && (block.rows || []).length && next !== "table");
                if (losesData && !window.confirm(
                    "Changing the type from “" + block.type + "” to “" + next +
                    "” will discard this block's existing content. Continue?")) {
                    select.value = block.type;
                    return;
                }
                model[index] = rebuildBlockForType(block, next);
                sync();
            });
            head.appendChild(select);

            var cls = input(block["class"] === undefined ? "" : block["class"], "css class");
            cls.className += " jsonw-input-class";
            cls.addEventListener("input", function () {
                block["class"] = cls.value;     // never trimmed: double spaces are real
                sync(true);
            });
            head.appendChild(cls);

            head.appendChild(el("span", "jsonw-summary", blockSummary(block)));
            head.appendChild(rowControls(model, index, sync));
            box.appendChild(head);

            var body = el("div", "jsonw-block-body");
            if (LISTY[block.type]) { renderItemsControl(body, block, sync); }
            else if (block.type === "table") { renderTableControl(body, block, sync); }
            else if (block.type === "a") {
                renderTextControl(body, block, sync);
                renderScalarControls(body, block, ["href", "target"], sync);
            } else if (block.type === "img") {
                renderScalarControls(body, block, ["src", "alt"], sync);
            } else if (block.type === "br" || block.type === "hr") {
                body.appendChild(emptyNote("This block has no content."));
            } else {
                renderTextControl(body, block, sync);
            }
            box.appendChild(body);

            ui.appendChild(box);
        });

        var foot = el("div", "jsonw-foot");
        foot.appendChild(button("+ Add block", "jsonw-btn-add", function () {
            model.push({ type: "p", "class": "", text: "" });
            sync();
        }));
        ui.appendChild(foot);
        return true;
    };

    // ------------------------------------------------------------------- boot

    function build(root) {
        var kind = root.dataset.jsonw;
        var render = KINDS[kind];
        var source = root.querySelector(".jsonw-src textarea");
        if (!render || !source) { return; }

        var opts = {};
        try { opts = JSON.parse(root.dataset.jsonwOptions || "{}"); } catch (e) { opts = {}; }

        var model;
        try {
            model = JSON.parse(source.value || "null");
        } catch (e) {
            // Malformed JSON (or a server-side validation bounce): leave the raw
            // textarea visible so nothing is lost and it stays fixable by hand.
            return;
        }
        if (model === null || model === undefined) {
            model = (kind === "stringlist" || kind === "contentblocks") ? [] : {};
        }

        var ui = root.querySelector(".jsonw-ui");

        function sync(skipRepaint) {
            source.value = JSON.stringify(model);
            if (!skipRepaint) { paint(); }
        }

        function paint() {
            ui.textContent = "";
            if (render(ui, model, opts, sync) === false) { return; }
        }

        // Probe first: if the stored value doesn't match the expected shape,
        // bail out and leave the raw textarea rather than mangling the data.
        var probe = document.createElement("div");
        if (render(probe, model, opts, function () {}) === false) { return; }

        paint();
        ui.hidden = false;
        root.classList.add("jsonw-ready");
        source.value = JSON.stringify(model);
    }

    function initAll(root) {
        (root.querySelectorAll ? root.querySelectorAll(".jsonw") : []).forEach(function (node) {
            if (node.closest(".empty-form")) { return; }   // the __prefix__ template
            if (node.dataset.jsonwReady === "1") { return; }
            node.dataset.jsonwReady = "1";
            build(node);
        });
    }

    document.addEventListener("DOMContentLoaded", function () { initAll(document); });

    // Django 6 dispatches a native, bubbling CustomEvent on the new inline row.
    document.addEventListener("formset:added", function (event) {
        if (event.target && event.target.querySelectorAll) { initAll(event.target); }
    });
})();
