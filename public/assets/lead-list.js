import { api, formatDate, leadLabels } from './workspace.js';

const root = document.getElementById('leadList');
const listUrl = root.dataset.listUrl;
const table = document.getElementById('leadTable');
const status = document.getElementById('listStatus');
const error = document.getElementById('listError');
const success = document.getElementById('listSuccess');
const pagination = document.getElementById('listPagination');
const previous = document.getElementById('previousPage');
const next = document.getElementById('nextPage');
const detailDialog = document.getElementById('detailDialog');
const detailStatus = document.getElementById('detailStatus');
const detailError = document.getElementById('detailError');
const details = document.getElementById('leadDetails');
const deleteDialog = document.getElementById('deleteDialog');
const deleteError = document.getElementById('deleteError');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

let page = 1;
let requestedPage = 1;
let loading = false;
let detailRequest;
let deleteTarget;

function leadUrl(id) {
    return `${listUrl}/${encodeURIComponent(id)}`;
}

function pageUrl(number) {
    const url = new URL(listUrl);
    url.searchParams.set('page', number);
    return url;
}

function action(tag, label, lead, style = 'secondary') {
    const element = document.createElement(tag);
    element.className = `btn btn-${style}`;
    element.textContent = label;
    element.setAttribute('aria-label', `${label} lead for ${lead.customer_name}`);
    if (tag === 'button') element.type = 'button';
    return element;
}

function renderRow(lead) {
    const row = table.tBodies[0].insertRow();
    const columns = [
        lead.customer_name, lead.mobile, lead.recommended_model, lead.priority, formatDate(lead.follow_up_date),
    ];
    const headers = table.tHead.rows[0].cells;
    columns.forEach((value, index) => {
        const cell = row.insertCell();
        cell.dataset.label = headers[index].textContent;
        cell.textContent = value;
    });

    const actions = row.insertCell();
    actions.dataset.label = 'Actions';
    const buttons = document.createElement('div');
    buttons.className = 'actions';
    const view = action('button', 'View', lead);
    view.addEventListener('click', () => viewLead(lead.id));
    const edit = action('a', 'Edit', lead);
    edit.href = `${root.dataset.editBase}/${encodeURIComponent(lead.id)}/edit`;
    const remove = action('button', 'Delete', lead, 'danger');
    remove.addEventListener('click', () => openDelete(lead));
    buttons.append(view, edit, remove);
    actions.append(buttons);
}

async function loadList(number = page) {
    if (loading) return;
    loading = true;
    requestedPage = number;
    status.textContent = 'Loading registered leads…';
    status.hidden = false;
    error.hidden = true;
    table.hidden = true;
    pagination.hidden = true;

    try {
        let result = await api(pageUrl(number));
        if (number > result.meta.last_page) {
            result = await api(pageUrl(result.meta.last_page));
        }
        const meta = result.meta;
        page = meta.current_page;
        table.tBodies[0].replaceChildren();
        result.data.forEach(renderRow);

        document.getElementById('listCount').textContent = `${meta.total} ${meta.total === 1 ? 'lead' : 'leads'}`;
        table.hidden = result.data.length === 0;
        status.textContent = 'No customer leads have been registered yet.';
        status.hidden = result.data.length > 0;
        pagination.hidden = meta.last_page <= 1;
        document.getElementById('currentPage').textContent = `Page ${page} of ${meta.last_page}`;
        previous.disabled = page <= 1;
        next.disabled = page >= meta.last_page;
    } catch (failure) {
        status.hidden = true;
        document.getElementById('listCount').textContent = '';
        document.getElementById('listErrorText').textContent = failure.message;
        error.hidden = false;
    } finally {
        loading = false;
    }
}

async function viewLead(id) {
    const request = new AbortController();
    detailRequest = request;
    details.replaceChildren();
    detailError.hidden = true;
    detailStatus.textContent = 'Loading lead details…';
    detailStatus.hidden = false;
    document.getElementById('detailTitle').textContent = `Lead #${id}`;
    detailDialog.showModal();

    try {
        const { data: lead } = await api(leadUrl(id), { signal: request.signal });
        if (request.signal.aborted) return;
        for (const [name, label] of Object.entries(leadLabels)) {
            const field = document.createElement('div');
            if (name === 'remarks') field.className = 'field full';
            const term = document.createElement('dt');
            term.textContent = label;
            const value = document.createElement('dd');
            value.textContent = name === 'follow_up_date' ? formatDate(lead[name]) : (lead[name] ?? '—');
            field.append(term, value);
            details.append(field);
        }
    } catch (failure) {
        if (request.signal.aborted) return;
        detailError.textContent = failure.message;
        detailError.hidden = false;
    } finally {
        if (!request.signal.aborted) detailStatus.hidden = true;
    }
}

function openDelete(lead) {
    deleteTarget = lead;
    deleteError.hidden = true;
    document.getElementById('deleteDescription').textContent = `This will permanently delete the registered lead for ${lead.customer_name}.`;
    deleteDialog.showModal();
}

async function deleteLead() {
    if (!deleteTarget || confirmDelete.disabled) return;
    confirmDelete.disabled = true;
    cancelDelete.disabled = true;
    confirmDelete.textContent = 'Deleting…';
    deleteError.hidden = true;

    try {
        await api(leadUrl(deleteTarget.id), { method: 'DELETE' });
        deleteDialog.close();
        success.textContent = 'Customer lead deleted successfully.';
        success.hidden = false;
        await loadList();
    } catch (failure) {
        deleteError.textContent = failure.message;
        deleteError.hidden = false;
    } finally {
        confirmDelete.disabled = false;
        cancelDelete.disabled = false;
        confirmDelete.textContent = 'Delete lead';
    }
}

detailDialog.addEventListener('close', () => detailRequest?.abort());
deleteDialog.addEventListener('cancel', event => {
    if (confirmDelete.disabled) event.preventDefault();
});
cancelDelete.addEventListener('click', () => deleteDialog.close());
confirmDelete.addEventListener('click', deleteLead);
document.getElementById('retryList').addEventListener('click', () => loadList(requestedPage));
previous.addEventListener('click', () => loadList(page - 1));
next.addEventListener('click', () => loadList(page + 1));
loadList();
