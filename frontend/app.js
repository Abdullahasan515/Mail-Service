const API_BASE = 'https://mail-server-ts6e.onrender.com/api';

let currentUser = null;
let currentView = 'login-view';
let currentMessages = [];
let currentFolder = 'inbox';
let selectedMessageId = null;

const loginView = document.getElementById('login-view');
const inboxView = document.getElementById('inbox-view');
const sentView = document.getElementById('sent-view');
const composeView = document.getElementById('compose-view');
const views = {
  'login-view': loginView,
  'inbox-view': inboxView,
  'sent-view': sentView,
  'compose-view': composeView
};

const navButtons = document.querySelectorAll('.nav-btn');
const toast = document.getElementById('toast');
const userInfo = document.getElementById('user-info');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const composeForm = document.getElementById('compose-form');

const inboxList = document.getElementById('inbox-list');
const sentList = document.getElementById('sent-list');

const messageModal = document.getElementById('message-modal');
const modalSubject = document.getElementById('modal-subject');
const modalFrom = document.getElementById('modal-from');
const modalTo = document.getElementById('modal-to');
const modalDate = document.getElementById('modal-date');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalDelete = document.getElementById('modal-delete');

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

function switchView(viewId) {
  Object.values(views).forEach(v => v && v.classList.add('hidden'));
  const view = views[viewId];
  if (view) {
    view.classList.remove('hidden');
    currentView = viewId;
  }
  navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
}

function setLoggedInState(isLoggedIn) {
  if (!userInfo) return;
  if (isLoggedIn) {
    userInfo.style.display = 'flex';
    const navLogin = document.getElementById('nav-login');
    const navInbox = document.getElementById('nav-inbox');
    const navSent = document.getElementById('nav-sent');
    const navCompose = document.getElementById('nav-compose');
    if (navLogin) navLogin.style.display = 'none';
    if (navInbox) navInbox.style.display = 'block';
    if (navSent) navSent.style.display = 'block';
    if (navCompose) navCompose.style.display = 'block';
  } else {
    userInfo.style.display = 'none';
    const navLogin = document.getElementById('nav-login');
    const navInbox = document.getElementById('nav-inbox');
    const navSent = document.getElementById('nav-sent');
    const navCompose = document.getElementById('nav-compose');
    if (navLogin) navLogin.style.display = 'block';
    if (navInbox) navInbox.style.display = 'none';
    if (navSent) navSent.style.display = 'none';
    if (navCompose) navCompose.style.display = 'none';
  }
}

setLoggedInState(false);

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentUser && btn.dataset.view !== 'login-view') {
      showToast('الرجاء تسجيل الدخول أولاً.');
      switchView('login-view');
      return;
    }
    const viewId = btn.dataset.view;
    switchView(viewId);
    if (viewId === 'inbox-view') {
      loadInbox();
    } else if (viewId === 'sent-view') {
      loadSent();
    }
  });
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const tabId = tab.dataset.tab;
    tabContents.forEach(c => c.classList.remove('active'));
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
      activeContent.classList.add('active');
    }
  });
});

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || 'فشل تسجيل الدخول.');
        return;
      }
      const user = await res.json();
      currentUser = user;
      if (userEmailSpan) {
        userEmailSpan.textContent = currentUser.email;
      }
      setLoggedInState(true);
      showToast('تم تسجيل الدخول بنجاح ✅');
      switchView('inbox-view');
      loadInbox();
    } catch (err) {
      showToast('حدث خطأ في الاتصال بالخادم.');
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || 'فشل إنشاء الحساب.');
        return;
      }
      showToast('تم إنشاء الحساب بنجاح ✅ يمكنك الآن تسجيل الدخول.');
      tabs.forEach(t => t.classList.remove('active'));
      const loginTabBtn = document.querySelector('[data-tab="login-tab"]');
      if (loginTabBtn) {
        loginTabBtn.classList.add('active');
      }
      tabContents.forEach(c => c.classList.remove('active'));
      const loginTab = document.getElementById('login-tab');
      if (loginTab) {
        loginTab.classList.add('active');
      }
      const loginEmailInput = document.getElementById('login-email');
      if (loginEmailInput && email) {
        loginEmailInput.value = email;
      }
    } catch (err) {
      showToast('حدث خطأ في الاتصال بالخادم.');
    }
  });
}

if (composeForm) {
  composeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('الرجاء تسجيل الدخول أولاً.');
      return;
    }
    const toInput = document.getElementById('compose-to');
    const subjectInput = document.getElementById('compose-subject');
    const bodyInput = document.getElementById('compose-body');
    const to = toInput ? toInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const body = bodyInput ? bodyInput.value.trim() : '';
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverEmail: to,
          subject,
          body
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || 'تعذر إرسال الرسالة.');
        return;
      }
      showToast('تم إرسال الرسالة ✉️');
      composeForm.reset();
      switchView('sent-view');
      loadSent();
    } catch (err) {
      showToast('حدث خطأ في الاتصال بالخادم.');
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    currentMessages = [];
    selectedMessageId = null;
    setLoggedInState(false);
    switchView('login-view');
    showToast('تم تسجيل الخروج.');
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ar-SA');
}

function renderMessages(container, folder, messages) {
  if (!container) return;
  container.innerHTML = '';
  if (!messages || messages.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'list-empty';
    emptyDiv.textContent = 'لا توجد رسائل حالياً.';
    container.appendChild(emptyDiv);
    return;
  }
  const header = document.createElement('div');
  header.className = 'list-header';
  const col1 = document.createElement('span');
  col1.textContent = folder === 'inbox' ? 'من' : 'إلى';
  const col2 = document.createElement('span');
  col2.textContent = 'الموضوع';
  const col3 = document.createElement('span');
  col3.textContent = 'التاريخ';
  const col4 = document.createElement('span');
  col4.textContent = 'الحالة';
  header.append(col1, col2, col3, col4);
  container.appendChild(header);
  messages.forEach(msg => {
    const row = document.createElement('div');
    row.className = 'list-row';
    if (!msg.isRead && folder === 'inbox') {
      row.classList.add('unread');
    }
    const who = document.createElement('span');
    who.textContent = folder === 'inbox' ? (msg.senderName || msg.senderEmail) : msg.receiverEmail;
    const subjectSpan = document.createElement('span');
    subjectSpan.textContent = msg.subject;
    const dateSpan = document.createElement('span');
    dateSpan.className = 'timestamp';
    dateSpan.textContent = formatDate(msg.createdAt);
    const status = document.createElement('span');
    status.className = 'pill';
    if (folder === 'inbox') {
      if (!msg.isRead) {
        status.classList.add('unread');
        status.textContent = 'غير مقروءة';
      } else {
        status.textContent = 'مقروءة';
      }
    } else {
      status.textContent = 'مرسلة';
    }
    row.append(who, subjectSpan, dateSpan, status);
    row.addEventListener('click', () => {
      openMessageModal(msg, folder);
    });
    container.appendChild(row);
  });
}

async function loadInbox() {
  if (!currentUser || !inboxList) return;
  try {
    const res = await fetch(`${API_BASE}/messages/inbox?userId=${currentUser.id}`);
    const data = await res.json().catch(() => []);
    currentFolder = 'inbox';
    currentMessages = data;
    renderMessages(inboxList, 'inbox', data);
  } catch (err) {
    showToast('تعذر تحميل صندوق الوارد.');
  }
}

async function loadSent() {
  if (!currentUser || !sentList) return;
  try {
    const res = await fetch(`${API_BASE}/messages/sent?userId=${currentUser.id}`);
    const data = await res.json().catch(() => []);
    currentFolder = 'sent';
    currentMessages = data;
    renderMessages(sentList, 'sent', data);
  } catch (err) {
    showToast('تعذر تحميل الرسائل المرسلة.');
  }
}

function openMessageModal(msg, folder) {
  if (!messageModal) return;
  selectedMessageId = msg.id;
  if (modalSubject) modalSubject.textContent = msg.subject;
  if (modalFrom) modalFrom.textContent = (msg.senderName || '') + ' <' + msg.senderEmail + '>';
  if (modalTo) modalTo.textContent = msg.receiverEmail;
  if (modalDate) modalDate.textContent = formatDate(msg.createdAt);
  if (modalBody) modalBody.textContent = msg.body;
  messageModal.classList.remove('hidden');
  if (folder === 'inbox' && !msg.isRead) {
    markAsRead(msg.id);
  }
}

function closeMessageModal() {
  if (!messageModal) return;
  messageModal.classList.add('hidden');
  selectedMessageId = null;
}

if (modalClose) {
  modalClose.addEventListener('click', closeMessageModal);
}

if (messageModal) {
  messageModal.addEventListener('click', (e) => {
    if (e.target === messageModal) {
      closeMessageModal();
    }
  });
}

async function markAsRead(messageId) {
  if (!currentUser) return;
  try {
    await fetch(`${API_BASE}/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });
    if (currentFolder === 'inbox') {
      loadInbox();
    }
  } catch (err) {}
}

if (modalDelete) {
  modalDelete.addEventListener('click', async () => {
    if (!currentUser || !selectedMessageId) return;
    const confirmed = window.confirm('هل أنت متأكد من حذف الرسالة؟');
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/messages/${selectedMessageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || 'تعذر حذف الرسالة.');
        return;
      }
      showToast('تم حذف الرسالة.');
      closeMessageModal();
      if (currentFolder === 'inbox') {
        loadInbox();
      } else {
        loadSent();
      }
    } catch (err) {
      showToast('حدث خطأ أثناء حذف الرسالة.');
    }
  });
}

switchView('login-view');
