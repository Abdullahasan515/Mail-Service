
const API_BASE = 'https://mail-server-ts6e.onrender.com';

let currentUser = null;
let currentView = 'login-view';
let currentMessages = [];
let currentFolder = 'inbox';
let selectedMessageId = null;

const loginView = document.getElementById('login-view');
const inboxView = document.getElementById('inbox-view');
const sentView = document.getElementById('sent-view');
const composeView = document.getElementById('compose-view');
const views = { 'login-view': loginView, 'inbox-view': inboxView, 'sent-view': sentView, 'compose-view': composeView };

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
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

function switchView(viewId) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
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
  if (isLoggedIn) {
    userInfo.style.display = 'flex';
    document.getElementById('nav-login').style.display = 'none';
    document.getElementById('nav-inbox').style.display = 'block';
    document.getElementById('nav-sent').style.display = 'block';
    document.getElementById('nav-compose').style.display = 'block';
  } else {
    userInfo.style.display = 'none';
    document.getElementById('nav-login').style.display = 'block';
    document.getElementById('nav-inbox').style.display = 'none';
    document.getElementById('nav-sent').style.display = 'none';
    document.getElementById('nav-compose').style.display = 'none';
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
    document.getElementById(tabId).classList.add('active');
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.message || 'فشل تسجيل الدخول.');
      return;
    }
    const user = await res.json();
    currentUser = user;
    userEmailSpan.textContent = currentUser.email;
    setLoggedInState(true);
    showToast('تم تسجيل الدخول بنجاح ✅');
    switchView('inbox-view');
    loadInbox();
  } catch (err) {
    console.error(err);
    showToast('حدث خطأ في الاتصال بالخادم.');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'فشل إنشاء الحساب.');
      return;
    }
    showToast('تم إنشاء الحساب بنجاح ✅ يمكنك الآن تسجيل الدخول.');
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="login-tab"]').classList.add('active');
    tabContents.forEach(c => c.classList.remove('active'));
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('login-email').value = email;
  } catch (err) {
    console.error(err);
    showToast('حدث خطأ في الاتصال بالخادم.');
  }
});

composeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) {
    showToast('الرجاء تسجيل الدخول أولاً.');
    return;
  }
  const to = document.getElementById('compose-to').value.trim();
  const subject = document.getElementById('compose-subject').value.trim();
  const body = document.getElementById('compose-body').value.trim();
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
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'تعذر إرسال الرسالة.');
      return;
    }
    showToast('تم إرسال الرسالة ✉️');
    composeForm.reset();
    switchView('sent-view');
    loadSent();
  } catch (err) {
    console.error(err);
    showToast('حدث خطأ في الاتصال بالخادم.');
  }
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  currentMessages = [];
  selectedMessageId = null;
  setLoggedInState(false);
  switchView('login-view');
  showToast('تم تسجيل الخروج.');
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ar-SA');
}

function renderMessages(container, folder, messages) {
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
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_BASE}/messages/inbox?userId=${currentUser.id}`);
    const data = await res.json();
    currentFolder = 'inbox';
    currentMessages = data;
    renderMessages(inboxList, 'inbox', data);
  } catch (err) {
    console.error(err);
    showToast('تعذر تحميل صندوق الوارد.');
  }
}

async function loadSent() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_BASE}/messages/sent?userId=${currentUser.id}`);
    const data = await res.json();
    currentFolder = 'sent';
    currentMessages = data;
    renderMessages(sentList, 'sent', data);
  } catch (err) {
    console.error(err);
    showToast('تعذر تحميل الرسائل المرسلة.');
  }
}

function openMessageModal(msg, folder) {
  selectedMessageId = msg.id;
  modalSubject.textContent = msg.subject;
  modalFrom.textContent = `${msg.senderName || ''} <${msg.senderEmail}>`;
  modalTo.textContent = msg.receiverEmail;
  modalDate.textContent = formatDate(msg.createdAt);
  modalBody.textContent = msg.body;
  messageModal.classList.remove('hidden');
  if (folder === 'inbox' && !msg.isRead) {
    markAsRead(msg.id);
  }
}

function closeMessageModal() {
  messageModal.classList.add('hidden');
  selectedMessageId = null;
}

modalClose.addEventListener('click', closeMessageModal);
messageModal.addEventListener('click', (e) => {
  if (e.target === messageModal) {
    closeMessageModal();
  }
});

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
  } catch (err) {
    console.error(err);
  }
}

modalDelete.addEventListener('click', async () => {
  if (!currentUser || !selectedMessageId) return;
  if (!confirm('هل أنت متأكد من حذف الرسالة؟')) {
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/messages/${selectedMessageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });
    const data = await res.json();
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
    console.error(err);
    showToast('حدث خطأ أثناء حذف الرسالة.');
  }
});

switchView('login-view');
