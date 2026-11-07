import { openModal, notify } from './modals.js';
import { escapeHTML as e } from './cards.js';
const future = 'Esta operação depende da integração futura com o servidor.';
function field(name, label, type = 'text', extra = '') {
    return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" ${extra} required aria-describedby="f-${name}-error"><small class="field-error" id="f-${name}-error"></small></div>`;
}
function textarea(name, label) { return `<div class="field"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" required aria-describedby="f-${name}-error"></textarea><small class="field-error" id="f-${name}-error"></small></div>`; }
function error(input, message) {
    input.setAttribute('aria-invalid', String(Boolean(message)));
    const element = document.getElementById(input.id + '-error');
    if (element) { element.textContent = message; input.setAttribute('aria-describedby', element.id); }
}
function validate(form) {
    let first;
    for (const input of form.querySelectorAll('input,textarea,select')) {
        if (input.disabled) continue;
        let message = '';
        if (input.required && !input.value.trim()) message = 'Preencha este campo.';
        else if (input.type === 'email' && input.validity.typeMismatch) message = 'Informe um e-mail válido.';
        else if (!input.validity.valid) message = 'Verifique o valor informado.';
        if (input.name === 'confirm' && input.value !== form.elements.password.value) message = 'As senhas precisam ser iguais.';
        error(input, message); if (message && !first) first = input;
    }
    first?.focus(); return !first;
}
function clearPasswords(form) { form.querySelectorAll('input[name="password"], input[name="confirm"], input[name="current"]').forEach(input => { input.value = ''; }); }
function bindForm(form, callback) {
    form.addEventListener('submit', event => { event.preventDefault(); if (validate(form)) callback(form); });
}
const login = document.querySelector('#login-form');
if (login) bindForm(login, form => { clearPasswords(form); form.querySelector('.form-status').textContent = 'A autenticação será disponibilizada após a integração com o servidor.'; });
document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-password]');
    if (toggle) { const input = document.getElementById(toggle.dataset.password); const show = input.type === 'password'; input.type = show ? 'text' : 'password'; toggle.textContent = show ? 'Ocultar' : 'Mostrar'; toggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); toggle.setAttribute('aria-pressed', String(show)); }
    const button = event.target.closest('[data-form]'); if (button) showForm(button.dataset.form);
});
let profileUrl;
const partnerFields = {
    guia: field('languages', 'Idiomas') + field('regions', 'Regiões atendidas'),
    oficina: field('activity', 'Atividade') + field('duration', 'Duração'),
    cultura: field('hours', 'Dias e horários'),
    restaurante: field('hours', 'Horários') + field('specialties', 'Especialidades')
};
function showForm(type) {
    let title, intro, fields, submit;
    if (type === 'signup') {
        title = 'Criar conta'; intro = 'Conheça o formulário. Nenhum cadastro será realizado.';
        fields = field('name', 'Nome', 'text', 'autocomplete="name"') + field('email', 'E-mail', 'email', 'autocomplete="email"') + field('password', 'Senha', 'password', 'autocomplete="new-password"') + field('confirm', 'Confirmação de senha', 'password', 'autocomplete="new-password"'); submit = 'Visualizar cadastro';
    } else if (type === 'recover') {
        title = 'Recuperar senha'; intro = 'O envio de um link de recuperação estará disponível após a integração. Nenhum e-mail será enviado nesta demonstração.'; fields = field('email', 'E-mail', 'email'); submit = 'Solicitar recuperação';
    } else if (type === 'password') {
        title = 'Alterar senha'; intro = 'Formulário demonstrativo. Nenhuma senha será alterada ou armazenada.';
        fields = field('current', 'Senha atual', 'password', 'autocomplete="current-password"') + field('password', 'Nova senha', 'password', 'autocomplete="new-password"') + field('confirm', 'Confirmação', 'password', 'autocomplete="new-password"'); submit = 'Validar prévia';
    } else if (type === 'profile') {
        title = 'Editar perfil'; intro = 'Alteração visual apenas nesta página, sem gravação em banco. Ao recarregar ou navegar, ela será perdida.';
        fields = field('name', 'Nome', 'text', `value="${e(document.querySelector('#profile-name').textContent)}"`) + field('email', 'E-mail', 'email', `value="${e(document.querySelector('#profile-email').textContent)}"`) + '<label for="f-photo">Imagem de perfil (PNG, JPEG ou WebP, até 2 MB)</label><input id="f-photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="f-photo-error"><small class="field-error" id="f-photo-error"></small><img id="photo-preview" class="photo-preview" alt="Prévia local da imagem" hidden>'; submit = 'Atualizar prévia';
    } else if (type === 'partner') {
        title = 'Faça parte da Rota Criativa'; intro = 'Prepare uma solicitação demonstrativa. Não há envio, publicação ou armazenamento de dados.';
        fields = '<label for="f-type">Tipo de parceiro</label><select id="f-type" name="type" required><option value="guia">Guia turístico</option><option value="oficina">Artesão ou oficina</option><option value="cultura">Feira ou espaço cultural</option><option value="restaurante">Restaurante</option></select>' + field('name', 'Nome do profissional ou estabelecimento') + textarea('description', 'Descrição') + field('neighborhood', 'Bairro') + field('address', 'Endereço (quando aplicável)') + field('contact', 'Contato') + '<div id="conditional-fields"></div>'; submit = 'Concluir prévia';
    } else return;
    let draftUrl, fileValid = true, fileReady = true, selectionVersion = 0;
    openModal(`<h2 id="modal-title">${title}</h2><p>${intro}</p><form id="modal-form" novalidate>${fields}<button class="primary full" type="submit">${submit}</button><p class="form-status" role="status"></p></form>`, () => { selectionVersion++; if (draftUrl) URL.revokeObjectURL(draftUrl); });
    const form = document.querySelector('#modal-form');
    if (type === 'partner') {
        const update = () => { document.querySelector('#conditional-fields').innerHTML = partnerFields[form.elements.type.value]; const guide = form.elements.type.value === 'guia'; form.elements.address.disabled = guide; form.elements.address.required = !guide; form.elements.address.closest('.field').hidden = guide; };
        form.elements.type.addEventListener('change', update); update();
    }
    if (type === 'profile') {
        form.elements.photo.addEventListener('change', () => {
            const version = ++selectionVersion;
            const file = form.elements.photo.files[0];
            if (draftUrl) URL.revokeObjectURL(draftUrl); draftUrl = null;
            const preview = document.querySelector('#photo-preview'); preview.hidden = true;
            fileValid = true; fileReady = true; error(form.elements.photo, '');
            if (!file) return;
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { fileValid = false; error(form.elements.photo, 'Escolha PNG, JPEG ou WebP de até 2 MB.'); return; }
            draftUrl = URL.createObjectURL(file); fileReady = false;
            preview.onload = () => { if (version !== selectionVersion) return; fileReady = true; preview.hidden = false; };
            preview.onerror = () => { if (version !== selectionVersion) return; fileValid = false; fileReady = true; error(form.elements.photo, 'Não foi possível ler esta imagem.'); };
            preview.src = draftUrl;
        });
    }
    bindForm(form, form => {
        const status = form.querySelector('.form-status');
        if (type === 'profile') {
            if (!fileValid || !fileReady) { error(form.elements.photo, fileReady ? 'Escolha uma imagem válida antes de continuar.' : 'Aguarde a leitura da imagem.'); form.elements.photo.focus(); return; }
            document.querySelector('#profile-name').textContent = form.elements.name.value.trim();
            document.querySelector('#profile-email').textContent = form.elements.email.value.trim();
            if (draftUrl) { if (profileUrl) URL.revokeObjectURL(profileUrl); profileUrl = URL.createObjectURL(form.elements.photo.files[0]); document.querySelector('#profile-avatar').src = profileUrl; }
            status.textContent = 'Prévia atualizada apenas nesta página. Nada foi gravado em banco.';
        } else {
            clearPasswords(form);
            status.textContent = type === 'partner' ? 'Prévia de solicitação em análise. O envio real será disponibilizado após a integração.' : type === 'signup' ? 'Campos validados. O cadastro real depende da integração futura.' : type === 'recover' ? 'A recuperação depende da integração futura. Nenhum e-mail foi enviado.' : future + ' Nenhuma senha foi alterada.';
            if (type === 'partner') { form.reset(); form.elements.type.dispatchEvent(new Event('change')); }
        }
    });
}
window.addEventListener('pagehide', () => { if (profileUrl) URL.revokeObjectURL(profileUrl); if (login) clearPasswords(login); });
