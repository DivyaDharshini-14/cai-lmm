import { api, formatDate, leadLabels, workspaceToday } from './workspace.js';

const form = document.getElementById('leadForm');
const fields = document.getElementById('formFields');
const status = document.getElementById('formStatus');
const errorBox = document.getElementById('formError');
const errorText = document.getElementById('formErrorText');
const retry = document.getElementById('retryForm');
const success = document.getElementById('success');
const submit = form.querySelector('[type="submit"]');
const reset = form.querySelector('[type="reset"]');
const company = form.elements.company_name;
const hotspot = form.elements.hotspot;
const model = form.elements.recommended_model;
const followUp = form.elements.follow_up_date;
const choiceGroups = form.querySelectorAll('[data-choices]');
const editing = form.dataset.editing === 'true';
const submitLabel = submit.textContent;

let catalog;
let savedLead = null;
let saving = false;

function options(field, scope = '') {
    return (catalog[field] ?? []).filter(option => option.scope === scope);
}

function fillSelect(select, choices, placeholder) {
    const prompt = placeholder ?? select.options[0].text;
    select.replaceChildren(new Option(prompt, ''), ...choices.map(option => new Option(option.value, option.value)));
}

function renderChoices(group) {
    const name = group.dataset.choices;
    group.replaceChildren(...options(name).map(option => {
        const label = document.createElement('label');
        label.className = 'choice';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = name;
        radio.value = option.value;
        radio.required = group.hasAttribute('data-required');
        const text = document.createElement('span');
        if (name === 'priority') {
            const title = document.createElement('b');
            const description = document.createElement('small');
            title.textContent = option.value;
            description.textContent = option.description;
            text.append(title, description);
        } else {
            text.textContent = option.value;
        }
        label.append(radio, text);
        return label;
    }));
}

function syncCompany() {
    const type = options('business_type').find(option => option.value === form.elements.business_type.value);
    const required = type?.requires_company === true;
    company.closest('.field').classList.toggle('hidden', !required);
    company.required = required;
    company.disabled = !required;
    if (!required) company.value = '';
}

function syncApplication(application) {
    const hasApplication = Boolean(application);
    const name = application ? application.toLowerCase() : '';
    document.getElementById('hotspotLabel').textContent = `${application} hotspots`;
    hotspot.closest('.field').classList.toggle('hidden', !hasApplication);
    hotspot.required = hasApplication;
    hotspot.disabled = !hasApplication;
    model.disabled = !hasApplication;
    fillSelect(hotspot, hasApplication ? options('hotspot', application) : [],
        hasApplication ? `Select ${name} hotspot` : 'Select hotspot');
    fillSelect(model, hasApplication ? options('recommended_model', application) : [],
        hasApplication ? 'Select recommended model' : 'Select application first');
}

function syncDate() {
    const today = workspaceToday();
    const originalDate = editing ? savedLead?.follow_up_date : null;
    followUp.min = originalDate && originalDate < today && followUp.value === originalDate ? originalDate : today;
    document.getElementById('todayLabel').textContent = formatDate(today);
}

function populate(lead = {}) {
    syncApplication(lead.application ?? '');
    for (const control of fields.elements) {
        const value = lead[control.name] ?? '';
        if (control.type === 'radio') {
            control.checked = control.value === value;
        } else {
            control.value = value;
        }
    }
    syncCompany();
    syncDate();
}

function clearErrors() {
    errorBox.hidden = true;
    for (const message of form.querySelectorAll('.field-error')) message.remove();
    for (const control of form.querySelectorAll('[aria-invalid="true"]')) {
        control.removeAttribute('aria-invalid');
        if (control.dataset.originalDescription) {
            control.setAttribute('aria-describedby', control.dataset.originalDescription);
        } else {
            control.removeAttribute('aria-describedby');
        }
    }
}

function showError(error, allowRetry = false) {
    errorText.textContent = error.message;
    retry.hidden = !allowRetry;
    errorBox.hidden = false;
    let firstControl;
    for (const [name, messages] of Object.entries(error.fields ?? {})) {
        const controls = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
        if (!controls.length) continue;
        const message = document.createElement('p');
        message.className = 'field-error';
        message.id = `error-${name}`;
        message.textContent = messages[0];
        controls[0].closest('.field').append(message);
        for (const control of controls) {
            control.dataset.originalDescription = control.getAttribute('aria-describedby') ?? '';
            control.setAttribute('aria-invalid', 'true');
            control.setAttribute('aria-describedby', `${control.dataset.originalDescription} ${message.id}`.trim());
        }
        firstControl ??= controls[0];
    }
    (firstControl ?? errorBox).focus();
}

function showSuccess(lead) {
    const headline = document.createElement('strong');
    headline.textContent = editing ? 'Lead details updated successfully.' : 'Lead details saved successfully.';
    const details = document.createElement('div');
    details.className = 'saved-details';
    details.textContent = Object.entries(leadLabels)
        .filter(([name]) => lead[name] !== null)
        .map(([name, label]) => `${label}: ${lead[name]}`).join('\n');
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn btn-secondary';
    copy.textContent = 'Copy lead details';
    copy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(details.textContent);
            copy.textContent = 'Copied';
        } catch {
            copy.textContent = 'Copy unavailable';
        }
    });
    success.replaceChildren(headline, details, copy);
    success.hidden = false;
    success.focus({ preventScroll: true });
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadForm() {
    clearErrors();
    status.textContent = 'Loading lead form…';
    status.hidden = false;
    form.setAttribute('aria-busy', 'true');
    try {
        const [choices, lead] = await Promise.all([
            api(form.dataset.optionsUrl),
            editing ? api(form.dataset.leadUrl) : null,
        ]);
        catalog = choices.data;
        const groups = ['business_type', 'vehicle_category', 'current_vehicle', ...Array.from(choiceGroups, group => group.dataset.choices)];
        const missingGroup = groups.some(name => !options(name).length);
        const missingApplicationOptions = options('application').some(({ value }) =>
            !options('hotspot', value).length || !options('recommended_model', value).length);
        if (missingGroup || missingApplicationOptions) {
            throw new Error('Lead options are unavailable. Ask your workspace administrator to check the option catalog.');
        }

        savedLead = lead?.data ?? null;
        for (const name of ['business_type', 'vehicle_category', 'current_vehicle']) {
            fillSelect(form.elements[name], options(name));
        }
        for (const group of choiceGroups) renderChoices(group);
        populate(savedLead ?? {});
        fields.disabled = false;
        submit.disabled = false;
        reset.disabled = false;
    } catch (error) {
        showError(error, true);
    } finally {
        status.hidden = true;
        form.removeAttribute('aria-busy');
    }
}

form.addEventListener('change', event => {
    if (event.target.name === 'business_type') syncCompany();
    if (event.target.name === 'application') syncApplication(event.target.value);
    if (event.target === followUp) syncDate();
});

form.addEventListener('input', () => {
    clearErrors();
    success.hidden = true;
    submit.disabled = false;
});

form.addEventListener('reset', event => {
    event.preventDefault();
    clearErrors();
    success.hidden = true;
    submit.disabled = false;
    populate(editing ? savedLead : {});
});

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || fields.disabled || submit.disabled) return;
    syncDate();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    clearErrors();
    success.hidden = true;
    saving = true;
    fields.disabled = true;
    submit.disabled = true;
    reset.disabled = true;
    submit.textContent = 'Saving…';
    form.setAttribute('aria-busy', 'true');

    let failure;
    try {
        const result = await api(form.dataset.leadUrl, { method: editing ? 'PUT' : 'POST', data });
        savedLead = result.data;
        populate(savedLead);
    } catch (error) {
        failure = error;
    } finally {
        saving = false;
        fields.disabled = false;
        reset.disabled = false;
        submit.textContent = submitLabel;
        form.removeAttribute('aria-busy');
    }

    if (failure) {
        submit.disabled = false;
        showError(failure);
    } else {
        showSuccess(savedLead);
    }
});

retry.addEventListener('click', loadForm);
syncDate();
loadForm();
