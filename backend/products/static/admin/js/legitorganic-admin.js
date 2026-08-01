// The control room uses one deliberate dark shell across browsers and devices.
(function enforceControlRoomTheme() {
  const apply = () => {
    document.documentElement.classList.remove('light', 'auto');
    document.documentElement.classList.add('dark');
  };

  apply();
  document.addEventListener('alpine:initialized', apply);
  window.addEventListener('load', apply);
})();

(function initialiseWritingAssistant() {
  const ready = (callback) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback);
    else callback();
  };

  const csrfToken = () => document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || '';
  const field = (id) => document.getElementById(id);
  const value = (id) => {
    const editor = window.editors && window.editors[id];
    return editor ? editor.getData() : (field(id)?.value || '');
  };
  const escapeHTML = (text) => String(text || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
  const paragraph = (text) => `<p>${escapeHTML(text)}</p>`;

  const setField = (id, nextValue, rich = false) => {
    const input = field(id);
    if (!input) return false;
    const current = value(id).replace(/<[^>]*>/g, '').trim();
    if (current && !window.confirm('Replace the existing writing in this field?')) return false;
    const content = rich ? nextValue : String(nextValue || '');
    if (rich && window.editors && window.editors[id]) window.editors[id].setData(content);
    else input.value = content;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };

  const selectedText = (id) => {
    const select = field(id);
    return select?.selectedOptions?.[0]?.textContent?.trim() || '';
  };

  const collectContext = (kind) => {
    if (kind === 'product') return {
      name: value('id_name'), description: value('id_description'), price: value('id_price'),
      unit: value('id_unit'), category: selectedText('id_category'), region: selectedText('id_region'),
      storage: value('id_storage_tips'), nutrition: value('id_nutritional_info')
    };
    if (kind === 'blog') return {
      title: value('id_title'), excerpt: value('id_excerpt'), content: value('id_content'),
      category: selectedText('id_category'), tags: value('id_tags')
    };
    const ingredientNames = Array.from(document.querySelectorAll('[name^="ingredients-"][name$="-name"]'))
      .map((input) => input.value.trim()).filter(Boolean).join(', ');
    return {
      title: value('id_title'), description: value('id_description'), servings: value('id_servings'),
      difficulty: selectedText('id_difficulty'), prep_time: value('id_prep_time'),
      cook_time: value('id_cook_time'), existing_ingredients: ingredientNames
    };
  };

  const renderPreview = (container, draft) => {
    container.replaceChildren();
    if (draft.titles) {
      draft.titles.forEach((title, index) => {
        const label = document.createElement('label');
        label.className = 'lo-writing-choice';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'lo-writing-title'; radio.value = title; radio.checked = index === 0;
        const span = document.createElement('span'); span.textContent = title;
        label.append(radio, span); container.appendChild(label);
      });
    } else if (draft.html) {
      container.innerHTML = draft.html;
    } else if (draft.text) {
      const p = document.createElement('p'); p.textContent = draft.text; container.appendChild(p);
    } else if (draft.ingredients && draft.steps) {
      const ingredients = document.createElement('div');
      ingredients.innerHTML = `<strong>Ingredients · ${draft.ingredients.length}</strong>`;
      const ingredientList = document.createElement('ul');
      draft.ingredients.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = [item.quantity, item.unit, item.name].filter(Boolean).join(' ');
        ingredientList.appendChild(li);
      });
      ingredients.appendChild(ingredientList);
      const steps = document.createElement('div');
      steps.innerHTML = `<strong>Steps · ${draft.steps.length}</strong>`;
      const stepList = document.createElement('ol');
      draft.steps.forEach((item) => { const li = document.createElement('li'); li.textContent = item.instruction; stepList.appendChild(li); });
      steps.appendChild(stepList); container.append(ingredients, steps);
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
    input.value = nextValue || '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const applyRecipeMethod = (draft) => {
    draft.ingredients.forEach((item) => {
      const index = inlineSlot('ingredients', 'name');
      if (index === null) return;
      fillInput(`ingredients-${index}-name`, item.name);
      fillInput(`ingredients-${index}-quantity`, item.quantity);
      fillInput(`ingredients-${index}-unit`, item.unit);
      fillInput(`ingredients-${index}-notes`, item.notes);
      if (item.product_id) fillInput(`ingredients-${index}-product`, String(item.product_id));
    });
    draft.steps.forEach((item, position) => {
      const index = inlineSlot('steps', 'instruction');
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
    const panel = document.querySelector('[data-writing-assistant]');
    if (!panel) return;
    const rawKind = panel.dataset.kind;
    const kind = rawKind === 'blogpost' ? 'blog' : rawKind;
    const task = panel.querySelector('[data-writing-task]');
    const instruction = panel.querySelector('[data-writing-instruction]');
    const generate = panel.querySelector('[data-writing-generate]');
    const result = panel.querySelector('[data-writing-result]');
    const preview = panel.querySelector('[data-writing-preview]');
    const status = panel.querySelector('[data-writing-status]');
    const apply = panel.querySelector('[data-writing-apply]');

    generate.addEventListener('click', async () => {
      status.textContent = '';
      if (instruction.value.trim().length < 8) {
        result.hidden = false; apply.hidden = true;
        status.textContent = 'Add a little more direction for the draft.';
        return;
      }
      generate.disabled = true; generate.textContent = 'Writing…';
      result.hidden = false; apply.hidden = true; preview.replaceChildren();
      status.textContent = 'Preparing a draft…';
      try {
        const response = await fetch('/admin/writing-assistant/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
          body: JSON.stringify({ kind, task: task.value, instruction: instruction.value, context: collectContext(kind) })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || 'The draft could not be generated.');
        panel._draft = data.draft;
        panel._draftTask = task.value;
        renderPreview(preview, data.draft);
        apply.hidden = false; status.textContent = 'Nothing has been saved.';
      } catch (error) {
        status.textContent = error.message || 'The draft could not be generated. Nothing was changed.';
      } finally {
        generate.disabled = false; generate.textContent = 'Generate draft';
      }
    });

    apply.addEventListener('click', () => {
      const draft = panel._draft;
      if (!draft) return;
      const draftTask = panel._draftTask;
      let applied = false;
      if (kind === 'product') {
        const ids = { description: 'id_description', storage: 'id_storage_tips', nutrition: 'id_nutritional_info' };
        applied = setField(ids[draftTask], paragraph(draft.text), true);
      } else if (kind === 'blog') {
        if (draftTask === 'titles') {
          const chosen = panel.querySelector('input[name="lo-writing-title"]:checked');
          applied = chosen ? setField('id_title', chosen.value) : false;
        } else if (draftTask === 'excerpt') applied = setField('id_excerpt', draft.text);
        else applied = setField('id_content', draft.html, true);
      } else if (draftTask === 'description') {
        applied = setField('id_description', paragraph(draft.text), true);
      } else {
        applyRecipeMethod(draft); applied = true;
      }
      status.textContent = applied ? 'Applied to the form. Review it, then save when ready.' : 'The existing field was left unchanged.';
    });
  });
})();
