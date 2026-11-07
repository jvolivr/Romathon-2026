import { openModal } from './modals.js';
import { escapeHTML as e } from './cards.js';
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
if (login) bindForm(login, async form => {
    const status = form.querySelector('.form-status'); status.textContent = 'Entrando…';
    try {
        const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.elements.email.value, password: form.elements.password.value }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error);
        location.assign('/meu-espaco');
    } catch (error) { status.textContent = error.message || 'Não foi possível entrar. Tente novamente.'; clearPasswords(form); }
});
document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-password]');
    if (toggle) { const input = document.getElementById(toggle.dataset.password); const show = input.type === 'password'; input.type = show ? 'text' : 'password'; toggle.textContent = show ? 'Ocultar' : 'Mostrar'; toggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); toggle.setAttribute('aria-pressed', String(show)); }
    const button = event.target.closest('[data-form]'); if (button) showForm(button.dataset.form);
});
const partnerFields = {
    guia: field('languages', 'Idiomas') + field('regions', 'Regiões atendidas'),
    oficina: field('activity', 'Atividade') + field('duration', 'Duração'),
    cultura: field('hours', 'Dias e horários'),
    restaurante: field('hours', 'Horários') + field('specialties', 'Especialidades')
};
function showForm(type) {
    let title, intro, fields, submit;
    if (type === 'signup') {
        title = 'Criar conta'; intro = 'Crie sua conta para guardar seus dados e acessar seu espaço.';
        fields = field('name', 'Nome', 'text', 'autocomplete="name"') + field('email', 'E-mail', 'email', 'autocomplete="email"') + field('password', 'Senha', 'password', 'autocomplete="new-password"') + field('confirm', 'Confirmação de senha', 'password', 'autocomplete="new-password"'); submit = 'Criar conta';
    } else if (type === 'recover') {
        title = 'Recuperar senha'; intro = 'A recuperação por e-mail ainda não está configurada. Entre em contato com quem administra o projeto para redefinir sua senha.'; fields = field('email', 'E-mail', 'email'); submit = 'Fechar';
    } else if (type === 'password') {
        title = 'Alterar senha'; intro = 'Confirme sua senha atual e escolha uma nova senha de 8 a 128 caracteres.';
        fields = field('current', 'Senha atual', 'password', 'autocomplete="current-password"') + field('password', 'Nova senha', 'password', 'autocomplete="new-password"') + field('confirm', 'Confirmação', 'password', 'autocomplete="new-password"'); submit = 'Alterar senha';
    } else if (type === 'profile') {
        title = 'Editar perfil'; intro = 'Atualize o nome e o e-mail salvos na sua conta.';
        fields = field('name', 'Nome', 'text', `value="${e(document.querySelector('#profile-name').textContent)}"`) + field('email', 'E-mail', 'email', `value="${e(document.querySelector('#profile-email').textContent)}"`); submit = 'Salvar perfil';
    } else if (type === 'partner') {
        title = 'Faça parte da Rota Criativa'; intro = 'Cadastre seu serviço para aparecer na listagem. É permitido um anúncio por conta.';
        fields = '<label for="f-type">Tipo de parceiro</label><select id="f-type" name="type" required><option value="guia">Guia turístico</option><option value="oficina">Artesão ou oficina</option><option value="cultura">Feira ou espaço cultural</option><option value="restaurante">Restaurante</option></select>' + field('name', 'Nome do profissional ou estabelecimento') + textarea('description', 'Descrição') + field('neighborhood', 'Bairro') + field('address', 'Endereço (quando aplicável)') + field('contact', 'Contato') + '<div id="conditional-fields"></div>'; submit = 'Cadastrar serviço';
    } else return;
    openModal(`<h2 id="modal-title">${title}</h2><p>${intro}</p><form id="modal-form" novalidate>${fields}<button class="primary full" type="submit">${submit}</button><p class="form-status" role="status"></p></form>`);
    const form = document.querySelector('#modal-form');
    if (type === 'partner') {
        const update = () => { document.querySelector('#conditional-fields').innerHTML = partnerFields[form.elements.type.value]; const guide = form.elements.type.value === 'guia'; form.elements.address.disabled = guide; form.elements.address.required = false; form.elements.address.closest('.field').hidden = guide; };
        form.elements.type.addEventListener('change', update); update();
    }
    bindForm(form, async form => {
        const status = form.querySelector('.form-status');
        if (type === 'signup') {
            status.textContent = 'Criando conta…';
            try {
                const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.elements.name.value, email: form.elements.email.value, password: form.elements.password.value }) });
                const result = await response.json(); if (!response.ok) throw new Error(result.error);
                location.assign('/meu-espaco');
            } catch (error) { status.textContent = error.message || 'Não foi possível criar a conta.'; clearPasswords(form); }
        } else if (type === 'profile') {
            status.textContent = 'Salvando…';
            try {
                const response = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.elements.name.value, email: form.elements.email.value }) });
                const result = await response.json(); if (!response.ok) throw new Error(result.error);
                document.querySelector('#profile-name').textContent = result.user.name;
                document.querySelector('#profile-email').textContent = result.user.email;
            } catch (error) { status.textContent = error.message || 'Não foi possível salvar o perfil.'; return; }
            status.textContent = 'Perfil salvo com sucesso.';
        } else if (type === 'password' || type === 'partner') {
            status.textContent = 'Salvando…';
            const button = form.querySelector('[type="submit"]'); button.disabled = true;
            try {
                const response = await fetch(type === 'password' ? '/api/password' : '/api/services', {
                    method: type === 'password' ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(form)))
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                status.textContent = type === 'password' ? 'Senha alterada com sucesso.' : 'Serviço cadastrado e disponível em Explorar.';
                if (type === 'partner') document.dispatchEvent(new CustomEvent('catalogchange'));
                form.reset();
                if (type === 'partner') form.elements.type.dispatchEvent(new Event('change'));
            } catch (error) { status.textContent = error.message || 'Não foi possível salvar. Tente novamente.'; }
            finally { clearPasswords(form); button.disabled = false; }
        } else {
            status.textContent = 'A recuperação por e-mail ainda não está configurada.';
        }
    });
}
window.addEventListener('pagehide', () => { if (login) clearPasswords(login); });
