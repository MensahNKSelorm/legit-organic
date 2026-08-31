// The control room uses one deliberate dark shell across browsers and devices.
(function enforceControlRoomTheme() {
  const apply = () => {
    document.documentElement.classList.remove("light", "auto");
    document.documentElement.classList.add("dark");
  };

  apply();
  document.addEventListener("alpine:initialized", apply);
  window.addEventListener("load", apply);
})();

(function initialiseAdminNotifications() {
  const ready = (callback) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  };
  const csrfToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || "";
  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken(),
        ...(options.headers || {}),
      },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.detail || "The request failed.");
    return data;
  };
  const timeAgo = (value) => {
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  const applicationKey = (value) => {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (character) => character.charCodeAt(0));
  };

  ready(() => {
    if (!document.body.classList.contains("dashboard") && !document.querySelector("#header-inner"))
      return;
    const shell = document.createElement("div");
    shell.className = "lo-admin-notifications";
    shell.innerHTML = `
      <button type="button" class="lo-admin-bell" aria-label="Notifications" aria-expanded="false">
        <span class="material-symbols-outlined" aria-hidden="true">notifications</span>
        <span class="lo-admin-notification-count" hidden></span>
      </button>
      <section class="lo-admin-notification-panel" aria-label="Notifications" hidden>
        <header><strong>Notifications</strong><button type="button" data-mark-all>Mark all read</button></header>
        <div class="lo-admin-push" hidden>
          <strong>Never miss a new order</strong>
          <span>Enable alerts on this browser or phone.</span>
          <button type="button" data-enable-push>Enable browser alerts</button>
          <small data-push-error></small>
        </div>
        <div class="lo-admin-notification-list"><p class="lo-admin-notification-state">Loading…</p></div>
      </section>`;
    document.body.appendChild(shell);

    const bell = shell.querySelector(".lo-admin-bell");
    const panel = shell.querySelector(".lo-admin-notification-panel");
    const count = shell.querySelector(".lo-admin-notification-count");
    const list = shell.querySelector(".lo-admin-notification-list");
    const push = shell.querySelector(".lo-admin-push");
    const pushButton = shell.querySelector("[data-enable-push]");
    const pushError = shell.querySelector("[data-push-error]");
    let notifications = [];

    const render = (unreadCount) => {
      count.hidden = unreadCount === 0;
      count.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      bell.setAttribute(
        "aria-label",
        unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
      );
      if (!notifications.length) {
        list.innerHTML = '<p class="lo-admin-notification-state">No notifications yet.</p>';
        return;
      }
      list.replaceChildren(
        ...notifications.map((notification) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `lo-admin-notification-row${notification.is_read ? "" : " is-unread"}`;
          const title = document.createElement("strong");
          title.textContent = notification.title;
          const body = document.createElement("span");
          body.textContent = notification.body;
          const time = document.createElement("small");
          time.textContent = timeAgo(notification.created_at);
          button.append(title, body, time);
          button.addEventListener("click", async () => {
            if (!notification.is_read) {
              await request(`/api/notifications/${notification.id}/read/`, {
                method: "PATCH",
                body: "{}",
              }).catch(() => {});
            }
            if (notification.link) window.location.assign(notification.link);
          });
          return button;
        })
      );
    };
    const refresh = async () => {
      try {
        const data = await request("/api/notifications/");
        notifications = data.results;
        render(data.unread_count);
      } catch (error) {
        list.innerHTML = `<p class="lo-admin-notification-state">${error.message || "Notifications could not be loaded."}</p>`;
      }
    };

    bell.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      bell.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) refresh();
    });
    document.addEventListener("click", (event) => {
      if (!shell.contains(event.target)) {
        panel.hidden = true;
        bell.setAttribute("aria-expanded", "false");
      }
    });
    shell.querySelector("[data-mark-all]").addEventListener("click", async () => {
      await request("/api/notifications/mark-all-read/", { method: "POST", body: "{}" });
      notifications = notifications.map((notification) => ({ ...notification, is_read: true }));
      render(0);
    });

    if ("serviceWorker" in navigator && "PushManager" in window) {
      Promise.all([
        request("/api/notifications/push/config/"),
        navigator.serviceWorker
          .register("/admin-push-sw.js")
          .then((registration) => registration.pushManager.getSubscription()),
      ])
        .then(([config, subscription]) => {
          push.hidden = !config.enabled || Boolean(subscription);
          push.dataset.publicKey = config.public_key || "";
        })
        .catch(() => {
          push.hidden = true;
        });
    }
    pushButton.addEventListener("click", async () => {
      pushButton.disabled = true;
      pushError.textContent = "";
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted")
          throw new Error("Notifications were not allowed in this browser.");
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationKey(push.dataset.publicKey),
        });
        await request("/api/notifications/push/subscription/", {
          method: "POST",
          body: JSON.stringify(subscription.toJSON()),
        });
        push.hidden = true;
      } catch (error) {
        pushError.textContent = error.message || "Browser alerts could not be enabled.";
      } finally {
        pushButton.disabled = false;
      }
    });

    refresh();
    window.setInterval(refresh, 30000);
  });
})();

(function initialiseWritingAssistant() {
  const ready = (callback) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  };

  const csrfToken = () => document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || "";
  const field = (id) => document.getElementById(id);
  const value = (id) => {
    const editor = window.editors && window.editors[id];
    return editor ? editor.getData() : field(id)?.value || "";
  };
  const escapeHTML = (text) =>
    String(text || "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[char]
    );
  const paragraph = (text) => `<p>${escapeHTML(text)}</p>`;

  const setField = (id, nextValue, rich = false) => {
    const input = field(id);
    if (!input) return false;
    const current = value(id)
      .replace(/<[^>]*>/g, "")
      .trim();
    if (current && !window.confirm("Replace the existing writing in this field?")) return false;
    const content = rich ? nextValue : String(nextValue || "");
    if (rich && window.editors && window.editors[id]) window.editors[id].setData(content);
    else input.value = content;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  const selectedText = (id) => {
    const select = field(id);
    return select?.selectedOptions?.[0]?.textContent?.trim() || "";
  };

  const collectContext = (kind) => {
    if (kind === "product")
      return {
        name: value("id_name"),
        description: value("id_description"),
        price: value("id_price"),
        unit: value("id_unit"),
        category: selectedText("id_category"),
        region: selectedText("id_region"),
        storage: value("id_storage_tips"),
        nutrition: value("id_nutritional_info"),
      };
    if (kind === "blog")
      return {
        title: value("id_title"),
        excerpt: value("id_excerpt"),
        content: value("id_content"),
        category: selectedText("id_category"),
        tags: value("id_tags"),
      };
    const ingredientNames = Array.from(
      document.querySelectorAll('[name^="ingredients-"][name$="-name"]')
    )
      .map((input) => input.value.trim())
      .filter(Boolean)
      .join(", ");
    return {
      title: value("id_title"),
      description: value("id_description"),
      servings: value("id_servings"),
      difficulty: selectedText("id_difficulty"),
      prep_time: value("id_prep_time"),
      cook_time: value("id_cook_time"),
      existing_ingredients: ingredientNames,
    };
  };

  const renderPreview = (container, draft) => {
    container.replaceChildren();
    if (draft.titles) {
      draft.titles.forEach((title, index) => {
        const label = document.createElement("label");
        label.className = "lo-writing-choice";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "lo-writing-title";
        radio.value = title;
        radio.checked = index === 0;
        const span = document.createElement("span");
        span.textContent = title;
        label.append(radio, span);
        container.appendChild(label);
      });
    } else if (draft.html) {
      container.innerHTML = draft.html;
    } else if (draft.text) {
      const p = document.createElement("p");
      p.textContent = draft.text;
      container.appendChild(p);
    } else if (draft.ingredients && draft.steps) {
      const ingredients = document.createElement("div");
      ingredients.innerHTML = `<strong>Ingredients · ${draft.ingredients.length}</strong>`;
      const ingredientList = document.createElement("ul");
      draft.ingredients.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = [item.quantity, item.unit, item.name].filter(Boolean).join(" ");
        ingredientList.appendChild(li);
      });
      ingredients.appendChild(ingredientList);
      const steps = document.createElement("div");
      steps.innerHTML = `<strong>Steps · ${draft.steps.length}</strong>`;
      const stepList = document.createElement("ol");
      draft.steps.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item.instruction;
        stepList.appendChild(li);
      });
      steps.appendChild(stepList);
      container.append(ingredients, steps);
    }
  };

  const inlineSlot = (prefix, fieldName) => {
    const total = field(`id_${prefix}-TOTAL_FORMS`);
    if (!total) return null;
    for (let index = 0; index < Number(total.value); index += 1) {
      const input = document.querySelector(`[name="${prefix}-${index}-${fieldName}"]`);
      const deleted = document.querySelector(`[name="${prefix}-${index}-DELETE"]`)?.checked;
      if (input && !deleted && !input.value.trim()) return index;
    }
    const add = document.querySelector(`#${prefix}-group .add-row a`);
    if (!add) return null;
    add.click();
    return Number(total.value) - 1;
  };

  const fillInput = (name, nextValue) => {
    const input = document.querySelector(`[name="${name}"]`);
    if (!input) return;
    input.value = nextValue || "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const applyRecipeMethod = (draft) => {
    draft.ingredients.forEach((item) => {
      const index = inlineSlot("ingredients", "name");
      if (index === null) return;
      fillInput(`ingredients-${index}-name`, item.name);
      fillInput(`ingredients-${index}-quantity`, item.quantity);
      fillInput(`ingredients-${index}-unit`, item.unit);
      fillInput(`ingredients-${index}-notes`, item.notes);
      if (item.product_id) fillInput(`ingredients-${index}-product`, String(item.product_id));
    });
    draft.steps.forEach((item, position) => {
      const index = inlineSlot("steps", "instruction");
      if (index === null) return;
      fillInput(`steps-${index}-step_number`, String(position + 1));
      const id = `id_steps-${index}-instruction`;
      const html = paragraph(item.instruction);
      const input = field(id);
      if (input) input.value = html;
      if (window.editors && window.editors[id]) window.editors[id].setData(html);
    });
  };

  ready(() => {
    const panel = document.querySelector("[data-writing-assistant]");
    if (!panel) return;
    const rawKind = panel.dataset.kind;
    const kind = rawKind === "blogpost" ? "blog" : rawKind;
    const task = panel.querySelector("[data-writing-task]");
    const instruction = panel.querySelector("[data-writing-instruction]");
    const generate = panel.querySelector("[data-writing-generate]");
    const result = panel.querySelector("[data-writing-result]");
    const preview = panel.querySelector("[data-writing-preview]");
    const status = panel.querySelector("[data-writing-status]");
    const apply = panel.querySelector("[data-writing-apply]");

    generate.addEventListener("click", async () => {
      status.textContent = "";
      if (instruction.value.trim().length < 8) {
        result.hidden = false;
        apply.hidden = true;
        status.textContent = "Add a little more direction for the draft.";
        return;
      }
      generate.disabled = true;
      generate.textContent = "Writing…";
      result.hidden = false;
      apply.hidden = true;
      preview.replaceChildren();
      status.textContent = "Preparing a draft…";
      try {
        const response = await fetch("/admin/writing-assistant/", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken() },
          body: JSON.stringify({
            kind,
            task: task.value,
            instruction: instruction.value,
            context: collectContext(kind),
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "The draft could not be generated.");
        panel._draft = data.draft;
        panel._draftTask = task.value;
        renderPreview(preview, data.draft);
        apply.hidden = false;
        status.textContent = "Nothing has been saved.";
      } catch (error) {
        status.textContent =
          error.message || "The draft could not be generated. Nothing was changed.";
      } finally {
        generate.disabled = false;
        generate.textContent = "Generate draft";
      }
    });

    apply.addEventListener("click", () => {
      const draft = panel._draft;
      if (!draft) return;
      const draftTask = panel._draftTask;
      let applied = false;
      if (kind === "product") {
        const ids = {
          description: "id_description",
          storage: "id_storage_tips",
          nutrition: "id_nutritional_info",
        };
        applied = setField(ids[draftTask], paragraph(draft.text), true);
      } else if (kind === "blog") {
        if (draftTask === "titles") {
          const chosen = panel.querySelector('input[name="lo-writing-title"]:checked');
          applied = chosen ? setField("id_title", chosen.value) : false;
        } else if (draftTask === "excerpt") applied = setField("id_excerpt", draft.text);
        else applied = setField("id_content", draft.html, true);
      } else if (draftTask === "description") {
        applied = setField("id_description", paragraph(draft.text), true);
      } else {
        applyRecipeMethod(draft);
        applied = true;
      }
      status.textContent = applied
        ? "Applied to the form. Review it, then save when ready."
        : "The existing field was left unchanged.";
    });
  });
})();
