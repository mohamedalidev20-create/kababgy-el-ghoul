const $ = (selector) => document.querySelector(selector);
let menuItems = [];
let activeCategory = "الكل";
let cart = [];

const money = (value) => `${Number(value).toLocaleString("ar-EG")} جنيه`;

async function loadMenu() {
  try {
    const response = await fetch("./menu-data-final.json");
    if (!response.ok) throw new Error("تعذر تحميل المنيو");
    menuItems = await response.json();
    renderCategories();
    renderMenu();
  } catch (error) {
    $("#menuGrid").innerHTML = '<p class="empty">حصلت مشكلة في تحميل المنيو. حدّث الصفحة وحاول تاني.</p>';
    console.error(error);
  }
}

function renderCategories() {
  const categories = ["الكل", ...new Set(menuItems.map(item => item.category))];
  $("#categories").innerHTML = categories.map(category => `
    <button type="button" class="category-btn ${activeCategory === category ? "active" : ""}" data-cat="${category}">${category}</button>
  `).join("");
  $("#categories").querySelectorAll("[data-cat]").forEach(button => {
    button.onclick = () => {
      activeCategory = button.dataset.cat;
      renderCategories();
      renderMenu();
    };
  });
}

function foodPhotoUrl(item, index) {
  const photos = {
    "الوجبات": ["photo-1544025162-d76694265947", "photo-1558030006-450675393462", "photo-1547592180-85f173990554"],
    "المشويات": ["photo-1558030006-450675393462", "photo-1544025162-d76694265947", "photo-1529692236671-f1f6cf9683ba"],
    "السمين": ["photo-1547592180-85f173990554", "photo-1547592166-23ac45744acd"],
    "الأطباق الرئيسية": ["photo-1547592180-85f173990554", "photo-1547592166-23ac45744acd", "photo-1515003197210-e0cd7184f8b5"],
    "الطواجن": ["photo-1547592180-85f173990554", "photo-1547592166-23ac45744acd"],
    "السندوتشات": ["photo-1553909489-cd47e0ef937f", "photo-1568901346375-23c9450c58cd", "photo-1528735602780-2552fd46c7af"],
    "المقبلات": ["photo-1512621776951-a57141f2eefd", "photo-1547592180-85f173990554"],
    "الأرز والمكرونات": ["photo-1473093295043-cdd812d0e601", "photo-1551183053-bf91a1d81141"],
    "الكريبات": ["photo-1513104890138-7c749659a591", "photo-1565299624946-b28f40a0ae38"],
    "البروستد": ["photo-1626082927389-6cd097cdc6ec", "photo-1562967914-608f82629710", "photo-1569691899455-5dc7a9e6a9b7"]
  };
  const list = photos[item.category] || photos["الوجبات"];
  return `https://images.unsplash.com/${list[index % list.length]}?auto=format&fit=crop&w=720&q=80`;
}

function renderMenu() {
  const term = $("#searchInput").value.trim().toLowerCase();
  const filtered = menuItems.filter(item => {
    const categoryMatch = activeCategory === "الكل" || item.category === activeCategory;
    const textMatch = `${item.name} ${item.category} ${item.desc || ""}`.toLowerCase().includes(term);
    return categoryMatch && textMatch;
  });
  if (!filtered.length) {
    $("#menuGrid").innerHTML = '<p class="empty">مفيش أصناف مطابقة للبحث.</p>';
    return;
  }
  $("#menuGrid").innerHTML = filtered.map((item, index) => `
    <article class="food-card">
      <div class="food-photo-wrap"><img class="food-photo" src="${foodPhotoUrl(item, index)}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('photo-unavailable')"></div>
      <div class="food-info"><span class="food-category">${item.category}</span><h3>${item.name}</h3>
      ${item.desc ? `<p>${item.desc}</p>` : ""}
      <div class="option-list">${(item.options || []).map((option, optionIndex) => `
        <div class="option-row"><span>${option.label}</span><strong class="price">${money(option.price)}</strong>
        <button class="add-btn" type="button" data-item="${menuItems.indexOf(item)}" data-option="${optionIndex}">أضف للسلة</button></div>`).join("")}</div>
      </div>
    </article>
  `).join("");
  $("#menuGrid").querySelectorAll(".add-btn").forEach(button => button.addEventListener("click", () => {
    const item = menuItems[Number(button.dataset.item)];
    const option = item.options[Number(button.dataset.option)];
    addToCart(item, option);
  }));
}

function addToCart(item, option) {
  const key = `${item.name}__${option.label}__${option.price}`;
  const existing = cart.find(row => row.key === key);
  if (existing) existing.qty += 1;
  else cart.push({ key, name: item.name, label: option.label, price: Number(option.price), qty: 1 });
  renderCart();
  showToast("اتضاف للسلة بنجاح");
}

function renderCart() {
  const count = cart.reduce((sum, row) => sum + row.qty, 0);
  const total = cart.reduce((sum, row) => sum + row.price * row.qty, 0);
  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(total);
  $("#cartItems").innerHTML = cart.length ? cart.map(row => `
    <div class="cart-row"><div><strong>${row.name}</strong><small>${row.label} — ${money(row.price)}</small></div>
    <div class="qty"><button type="button" data-action="minus" data-key="${row.key}">−</button><b>${row.qty}</b><button type="button" data-action="plus" data-key="${row.key}">+</button></div></div>
  `).join("") : '<p class="empty">السلة لسه فاضية. اختار أكلك من المنيو.</p>';
  $("#cartItems").querySelectorAll("button[data-action]").forEach(button => button.onclick = () => changeQty(button.dataset.key, button.dataset.action));
}

function changeQty(key, action) {
  const row = cart.find(item => item.key === key);
  if (!row) return;
  row.qty += action === "plus" ? 1 : -1;
  if (row.qty <= 0) cart = cart.filter(item => item.key !== key);
  renderCart();
}

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#drawerBackdrop").classList.add("show");
}
function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#drawerBackdrop").classList.remove("show");
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

$("#searchInput").addEventListener("input", renderMenu);
$("#cartOpen").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
$("#drawerBackdrop").addEventListener("click", closeCart);
$("#checkoutOpen").addEventListener("click", () => {
  if (!cart.length) return showToast("السلة فاضية، اختار أصناف الأول");
  closeCart();
  $("#checkoutBackdrop").classList.add("show");
});
$("#checkoutClose").addEventListener("click", () => $("#checkoutBackdrop").classList.remove("show"));
$("#checkoutBackdrop").addEventListener("click", event => {
  if (event.target === $("#checkoutBackdrop")) $("#checkoutBackdrop").classList.remove("show");
});
$("#checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!cart.length) return;
  const form = new FormData(event.currentTarget);
  const total = cart.reduce((sum, row) => sum + row.price * row.qty, 0);
  const lines = cart.map(row => `• ${row.name} (${row.label}) × ${row.qty} = ${row.price * row.qty} جنيه`);
  const message = [
    "طلب جديد من موقع كبابجي الغول", "", ...lines, "", `الإجمالي: ${total} جنيه`,
    `الاسم: ${form.get("name")}`, `رقم الموبايل: ${form.get("phone")}`,
    `العنوان: ${form.get("address")}`, `ملاحظات: ${form.get("notes") || "لا يوجد"}`
  ].join("\n");
  window.open(`https://wa.me/201111472711?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  $("#checkoutMessage").textContent = "راجع تفاصيل الطلب واضغط إرسال داخل واتساب.";
});

$("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));
$("#mainNav").querySelectorAll("a").forEach(link => link.addEventListener("click", () => $("#mainNav").classList.remove("open")));
$("#year").textContent = new Date().getFullYear();
loadMenu();
