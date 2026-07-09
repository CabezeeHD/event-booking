const API = 'api';

let currentUser = null;
let authToken = localStorage.getItem('authToken');
let eventsCache = [];
let bookingsCache = [];
let usersCache = [];
let paymentsCache = [];
let notificationsCache = [];


function getItemId(item) {
  return item.id || item._id;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.setTimeout(() => toast.classList.add('hidden'), 2800);
}

function isAdmin() {
  return currentUser?.role === 'admin';
}

function currentUserIdentifiers() {
  if (!currentUser) return [];
  return [currentUser.id, currentUser.username, currentUser.email].filter(Boolean);
}

function belongsToCurrentUser(value) {
  return currentUserIdentifiers().includes(value);
}

function displayUser(value) {
  if (!value) return 'Unknown user';

  if (belongsToCurrentUser(value)) {
    return currentUser.username || currentUser.email || value;
  }

  const user = usersCache.find(item =>
    item.id === value ||
    item.email === value ||
    item.name === value
  );

  return user?.name || value;
}

function findEvent(value) {
  return eventsCache.find(event =>
    getItemId(event) === value ||
    event.title === value
  );
}

function displayEvent(value) {
  if (!value) return 'Unknown event';
  return findEvent(value)?.title || value;
}

function formatNotificationText(value) {
  let text = String(value ?? '');

  eventsCache.forEach(event => {
    const eventId = getItemId(event);
    if (!eventId || !event.title) return;
    text = text.replaceAll(eventId, event.title);
  });

  return text;
}

function applyPermissions() {
  const usersNav = document.querySelector('[data-page="users-page"]');
  usersNav.classList.toggle('hidden', !isAdmin());
}

async function getJson(path) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Request failed');
    return [];
  }
}

async function postJson(path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const details = await res.json().catch(() => ({}));
      throw new Error(details.error || `${path} failed: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Request failed');
    return null;
  }
}

async function patchJson(path) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'PATCH',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Request failed');
    return null;
  }
}

async function showPage(pageId) {
  if (pageId === 'users-page' && !isAdmin()) {
    showToast('Only admins can view users');
    pageId = 'events-page';
  }

  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(button => button.classList.remove('active'));

  document.getElementById(pageId).classList.add('active');
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

  const title = document.querySelector(`#${pageId} h2`).textContent;
  document.getElementById('page-title').textContent = title;

  const loaders = {
    'events-page': loadEvents,
    'bookings-page': loadBookings,
    'users-page': loadUsers,
    'payments-page': loadPayments,
    'notifications-page': loadNotifications,
  };

  await loaders[pageId]?.();
}

async function login(event) {
  event.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error('Login failed');

    const loginResult = await res.json();
    authToken = loginResult.token;
    localStorage.setItem('authToken', authToken);

    currentUser = loginResult.user;
    document.getElementById('current-user').textContent = `${currentUser.username} (${currentUser.role})`;
    document.getElementById('booking-userId').value = currentUser.username;
    document.getElementById('payment-payer').value = currentUser.username;

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    applyPermissions();
    loadAll();
  } catch (error) {
    showToast('Login failed');
  }
}

function logout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('authToken');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function tryRestoreSession() {
  if (!authToken) return;
  try {
    const base64 = authToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload.exp * 1000 < Date.now()) { logout(); return; }
    currentUser = { id: payload.sub, username: payload.username, email: payload.email, role: payload.role };
    document.getElementById('current-user').textContent = `${currentUser.username} (${currentUser.role})`;
    document.getElementById('booking-userId').value = currentUser.username;
    document.getElementById('payment-payer').value = currentUser.username;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    applyPermissions();
    loadAll();
  } catch { logout(); }
}

async function loadAll() {
  await loadEvents();
  if (isAdmin()) {
    await loadUsers();
  }
  await loadBookings();
  await loadPayments();
  await loadNotifications();
}

async function loadEvents() {
  eventsCache = await getJson('/events');
  const list = document.getElementById('events-list');

  if (!eventsCache.length) {
    list.innerHTML = '<div class="empty-state">No events found.</div>';
    return;
  }

  list.innerHTML = eventsCache.map(event => `
    <article class="card">
      <div class="event-image"></div>
      <div class="card-body">
        <div class="meta-row">
          <h3>${escapeHtml(event.title)}</h3>
          <span class="badge">${escapeHtml(event.capacity)} spots</span>
        </div>
        <p class="muted">${escapeHtml(event.location)}</p>
        ${event.price != null ? `<p class="muted">${escapeHtml(String(event.price))} DKK</p>` : ''}
        <button class="btn primary full" type="button" onclick="prepareBooking('${escapeHtml(getItemId(event))}')">
          Book Event
        </button>
      </div>
    </article>
  `).join('');
}

async function createEvent(event) {
  event.preventDefault();

  const body = {
    title: document.getElementById('event-title').value.trim(),
    location: document.getElementById('event-location').value.trim(),
    capacity: Number(document.getElementById('event-capacity').value),
    price: Number(document.getElementById('event-price').value),
  };

  const createdEvent = await postJson('/events', body);
  if (!createdEvent) return;

  document.getElementById('event-form').reset();
  showToast('Event created');
  loadEvents();
}

function prepareBooking(eventId) {
  const eventItem = findEvent(eventId);

  document.getElementById('booking-userId').value = currentUser?.username || currentUser?.email || '';
  document.getElementById('booking-eventId').value = eventId;
  document.getElementById('booking-event-name').value = eventItem?.title || '';
  document.getElementById('booking-quantity').value = 1;
  showPage('bookings-page');
}

async function loadBookings() {
  bookingsCache = await getJson('/bookings');
  const list = document.getElementById('bookings-list');
  const visibleBookings = bookingsCache.filter(booking => belongsToCurrentUser(booking.userId));

  if (!visibleBookings.length) {
    list.innerHTML = '<div class="empty-state">No bookings found.</div>';
    return;
  }

  list.innerHTML = visibleBookings.map(booking => {
    const eventItem = eventsCache.find(event => getItemId(event) === booking.eventId);
    const bookingId = getItemId(booking);

    return `
      <article class="list-item">
        <div class="meta-row">
          <div>
            <h3>${escapeHtml(eventItem?.title || displayEvent(booking.eventId))}</h3>
            <p class="muted">Booked by ${escapeHtml(displayUser(booking.userId))}</p>
          </div>
          <span class="badge ${escapeHtml(booking.status || 'pending')}">${escapeHtml(booking.status || 'pending')}</span>
        </div>
        <div class="item-actions">
          <button class="btn primary" type="button" onclick="preparePayment('${escapeHtml(bookingId)}')">Pay Booking</button>
        </div>
      </article>
    `;
  }).join('');
}

async function createBooking(event) {
  event.preventDefault();

  const body = {
    userId: currentUser.username,
    eventId: document.getElementById('booking-eventId').value.trim(),
    quantity: Number(document.getElementById('booking-quantity').value),
  };

  const booking = await postJson('/bookings', body);
  if (!booking) return;

  document.getElementById('booking-form').reset();
  document.getElementById('booking-userId').value = currentUser.username;
  showToast('Booking created');
  loadBookings();
}

async function loadUsers() {
  if (!isAdmin()) {
    showToast('Only admins can view users');
    showPage('events-page');
    return;
  }

  usersCache = await getJson('/users');
  const list = document.getElementById('users-list');

  if (!usersCache.length) {
    list.innerHTML = '<div class="empty-state">No users found.</div>';
    return;
  }

  list.innerHTML = usersCache.map(user => `
    <article class="list-item">
      <h3>${escapeHtml(user.name || 'Unnamed user')}</h3>
      <p class="muted">${escapeHtml(user.email)}</p>
    </article>
  `).join('');
}

async function createUser(event) {
  event.preventDefault();

  if (!isAdmin()) {
    showToast('Only admins can create users');
    return;
  }

  const body = {
    name: document.getElementById('user-name').value.trim(),
    email: document.getElementById('user-email').value.trim(),
  };

  const user = await postJson('/users', body);
  if (!user) return;

  document.getElementById('user-form').reset();
  showToast('User created');
  loadUsers();
}

function preparePayment(bookingId) {
  const booking = bookingsCache.find(item => getItemId(item) === bookingId);
  const eventItem = eventsCache.find(event => getItemId(event) === booking?.eventId);

  document.getElementById('payment-payer').value = currentUser?.username || currentUser?.email || booking?.userId || '';
  document.getElementById('payment-payee').value = 'Event Booking ApS';
  document.getElementById('payment-amount').value = (booking?.quantity ?? 1) * (eventItem?.price ?? 0);
  document.getElementById('payment-currency').value = 'DKK';
  document.getElementById('payment-bookingId').value = bookingId || '';

  showToast(`Ready to pay for ${eventItem?.title || 'booking'}`);
  showPage('payments-page');
}

async function loadPayments() {
  paymentsCache = await getJson('/payments');
  const list = document.getElementById('payments-list');
  const visiblePayments = paymentsCache.filter(payment => belongsToCurrentUser(payment.payer));

  if (!visiblePayments.length) {
    list.innerHTML = '<div class="empty-state">No payments found.</div>';
    return;
  }

  list.innerHTML = visiblePayments.map(payment => `
    <article class="list-item">
      <div class="meta-row">
        <div>
          <h3>${escapeHtml(payment.amount)} ${escapeHtml(payment.currency || 'DKK')}</h3>
          <p class="muted">${escapeHtml(displayUser(payment.payer))} to ${escapeHtml(payment.payee)}</p>
        </div>
        <span class="badge ${escapeHtml(payment.status || 'completed')}">${escapeHtml(payment.status || 'completed')}</span>
      </div>
    </article>
  `).join('');
}

async function createPayment(event) {
  event.preventDefault();

  const bookingId = document.getElementById('payment-bookingId').value.trim();
  const body = {
    payer: currentUser.username,
    payee: document.getElementById('payment-payee').value.trim(),
    amount: Number(document.getElementById('payment-amount').value),
    currency: document.getElementById('payment-currency').value.trim() || 'DKK',
    ...(bookingId ? { bookingId } : {}),
  };

  const payment = await postJson('/payments', body);
  if (!payment) return;

  document.getElementById('payment-bookingId').value = '';
  showToast('Payment created');
  loadPayments();
  setTimeout(loadBookings, 1000);
}

async function loadNotifications() {
  notificationsCache = await getJson('/notifications');
  const list = document.getElementById('notifications-list');
  const visibleNotifications = currentUser
    ? notificationsCache.filter(notification =>
        notification.recipient === currentUser.email ||
        notification.recipient === currentUser.username ||
        notification.recipient === currentUser.id ||
        notification.userId === currentUser.id ||
        notification.userId === currentUser.email
      )
    : notificationsCache;

  if (!visibleNotifications.length) {
    list.innerHTML = '<div class="empty-state">No notifications found.</div>';
    return;
  }

  list.innerHTML = visibleNotifications.map(notification => {
    const eventName = displayEvent(notification.eventId || notification.event);
    const hasEvent = eventName !== 'Unknown event';

    return `
      <article class="list-item">
        <div class="meta-row">
          <div>
            <h3>${escapeHtml(formatNotificationText(notification.title || 'Notification'))}</h3>
            <p class="muted">${escapeHtml(formatNotificationText(notification.message))}</p>
            ${hasEvent ? `<p class="muted">Event: ${escapeHtml(eventName)}</p>` : ''}
          </div>
          <span class="badge ${notification.read ? 'read' : 'unread'}">${notification.read ? 'read' : 'unread'}</span>
        </div>
        ${!notification.read ? `
        <div class="item-actions">
          <button class="btn secondary" type="button" onclick="markNotificationRead('${escapeHtml(getItemId(notification))}')">Mark as read</button>
        </div>` : ''}
      </article>
    `;
  }).join('');
}

async function markNotificationRead(id) {
  await patchJson(`/notifications/${id}/read`);
  loadNotifications();
}


document.getElementById('login-form').addEventListener('submit', login);
document.getElementById('btn-logout').addEventListener('click', logout);

document.querySelectorAll('.nav-btn').forEach(button => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

document.getElementById('btn-load-events').addEventListener('click', loadEvents);
document.getElementById('btn-load-bookings').addEventListener('click', loadBookings);
document.getElementById('btn-load-users').addEventListener('click', loadUsers);
document.getElementById('btn-load-payments').addEventListener('click', loadPayments);
document.getElementById('btn-load-notifications').addEventListener('click', loadNotifications);

document.getElementById('event-form').addEventListener('submit', createEvent);
document.getElementById('booking-form').addEventListener('submit', createBooking);
document.getElementById('user-form').addEventListener('submit', createUser);
document.getElementById('payment-form').addEventListener('submit', createPayment);

tryRestoreSession();