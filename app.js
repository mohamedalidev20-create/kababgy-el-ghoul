import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const menu = [
 {id:1,name:"كريب شاورما فراخ",category:"كريب",price:120,desc:"كريب محشو شاورما فراخ وصوصات.",img:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"},
 {id:2,name:"كريب بطاطس",category:"كريب",price:70,desc:"كريب بطاطس مقرمشة وصوص مميز.",img:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80"},
 {id:3,name:"كريب ميكس جبن",category:"كريب",price:90,desc:"تشكيلة جبن بطعم غني.",img:"https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"},
 {id:4,name:"وجبة بروستد قطعة",category:"بروستد",price:100,desc:"قطعة دجاج بروستد مع الإضافات.",img:"https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"},
 {id:5,name:"وجبة بروستد ورك",category:"بروستد",price:120,desc:"ورك دجاج مقرمش بطعم مميز.",img:"https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80"},
 {id:6,name:"وجبة بروستد صدر",category:"بروستد",price:140,desc:"صدر دجاج بروستد مع البطاطس.",img:"https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=800&q=80"},
 {id:7,name:"كفتة مشوية",category:"مشويات",price:200,desc:"كفتة مشوية على الطريقة الشرقية.",img:"https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80"},
 {id:8,name:"طرب مشوي",category:"مشويات",price:220,desc:"طرب متبل ومشوي بعناية.",img:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"},
 {id:9,name:"ريش ضاني",category:"مشويات",price:270,desc:"ريش ضاني مشوية بتتبيلة شرقية.",img:"https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80"},
 {id:10,name:"شيش طاووق",category:"مشويات",price:170,desc:"قطع فراخ متبلة ومشوية.",img:"https://images.unsplash.com/photo-1532634896-26909d0d4b6b?auto=format&fit=crop&w=800&q=80"},
 {id:11,name:"محشي ورق عنب",category:"مقبلات",price:75,desc:"ورق عنب بحشوة أرز متبلة.",img:"https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=800&q=80"},
 {id:12,name:"سمبوسك",category:"مقبلات",price:60,desc:"سمبوسك مقرمش بحشوة لذيذة.",img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"},
 {id:13,name:"أرز بالشعرية",category:"أرز ومكرونات",price:40,desc:"أرز بالشعرية بطعم بيتي.",img:"https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80"},
 {id:14,name:"مكرونة بشاميل",category:"أرز ومكرونات",price:85,desc:"مكرونة بشاميل بالفرن.",img:"https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80"},
 {id:15,name:"وجبة الغول المشكلة",category:"وجبات",price:280,desc:"تشكيلة من اختيارات المطعم المميزة.",img:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"}
];

const $ = s => document.querySelector(s);
const money = n => `${Number(n).toLocaleString("ar-EG")} جنيه`;
let cart = JSON.parse(localStorage.getItem("ghoulCart") || "[]");
let activeCategory = "الكل";
let db = null, auth = null, firebaseReady = false, unsubscribeOrders = null;
const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("PUT_YOUR");
if (configured) {
  try { const app = initializeApp(firebaseConfig); db = getFirestore(app); auth = getAuth(app); firebaseReady = true; }
  catch(e) { console.error(e); }
}

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function renderCategories(){
 const cats=["الكل",...new Set(menu.map(x=>x.category))];
 $("#categories").innerHTML=cats.map(c=>`<button class="category-btn ${activeCategory===c?"active":""}" data-cat="${c}">${c}</button>`).join("");
 $("#categories").querySelectorAll("button").forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderCategories();renderMenu()});
}
function renderMenu(){
 const term=$("#searchInput").value.trim().toLowerCase();
 const list=menu.filter(x=>(activeCategory==="الكل"||x.category===activeCategory)&&x.name.toLowerCase().includes(term));
 $("#menuGrid").innerHTML=list.length?list.map(x=>`<article class="food-card"><img class="food-img" src="${x.img}" alt="${x.name}" loading="lazy"><div class="food-info"><h3>${x.name}</h3><p>${x.desc}</p><div class="food-bottom"><span class="price">${money(x.price)}</span><button class="add-btn" data-add="${x.id}">+ أضف للسلة</button></div></div></article>`).join(""):`<div class="empty">مفيش أصناف مطابقة للبحث.</div>`;
 $("#menuGrid").querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addToCart(Number(b.dataset.add)));
}
function saveCart(){localStorage.setItem("ghoulCart",JSON.stringify(cart));renderCart()}
function addToCart(id){const item=cart.find(x=>x.id===id);item?item.qty++:cart.push({id,qty:1});saveCart();toast("اتضاف للسلة بنجاح")}
function changeQty(id,delta){const x=cart.find(i=>i.id===id);if(!x)return;x.qty+=delta;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);saveCart()}
function renderCart(){
 const count=cart.reduce((a,x)=>a+x.qty,0), total=cart.reduce((a,x)=>a+menu.find(m=>m.id===x.id).price*x.qty,0);
 $("#cartCount").textContent=count;$("#cartTotal").textContent=money(total);
 $("#cartItems").innerHTML=cart.length?cart.map(x=>{const m=menu.find(i=>i.id===x.id);return `<div class="cart-row"><div><b>${m.name}</b><small>${money(m.price)} للواحد</small></div><div class="qty"><button data-q="${x.id}" data-d="-1">−</button><b>${x.qty}</b><button data-q="${x.id}" data-d="1">+</button></div></div>`}).join(""):`<div class="empty">السلة لسه فاضية. اختار أكلك من المنيو ❤️</div>`;
 $("#cartItems").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.q),Number(b.dataset.d)));
}
function openCart(){ $("#cartDrawer").classList.add("open");$("#drawerBackdrop").classList.add("show")}
function closeCart(){ $("#cartDrawer").classList.remove("open");$("#drawerBackdrop").classList.remove("show")}
function openCheckout(){if(!cart.length){toast("ضيف صنف للسلة الأول");return}closeCart();$("#checkoutBackdrop").classList.add("show")}
function closeCheckout(){$("#checkoutBackdrop").classList.remove("show")}
function orderPayload(form){
 const data=new FormData(form), items=cart.map(x=>{const m=menu.find(i=>i.id===x.id);return {id:m.id,name:m.name,price:m.price,qty:x.qty}});
 return {customer:{name:data.get("name").trim(),phone:data.get("phone").trim(),address:data.get("address").trim()},notes:data.get("notes").trim(),items,total:items.reduce((s,x)=>s+x.price*x.qty,0),status:"جديد",createdAt:firebaseReady?serverTimestamp():new Date().toISOString()};
}
async function submitOrder(e){
 e.preventDefault();if(!cart.length)return;
 const btn=e.submitter;btn.disabled=true;btn.textContent="جاري إرسال الطلب...";
 try{
  const order=orderPayload(e.currentTarget);
  if(firebaseReady){await addDoc(collection(db,"orders"),order);}
  else{
   const orders=JSON.parse(localStorage.getItem("ghoulDemoOrders")||"[]");
   orders.unshift({...order,id:"DEMO-"+Date.now(),createdAt:new Date().toISOString()});
   localStorage.setItem("ghoulDemoOrders",JSON.stringify(orders));
  }
  cart=[];saveCart();e.currentTarget.reset();closeCheckout();
  toast(firebaseReady?"تم إرسال طلبك للمطعم بنجاح":"تم حفظ الطلب كتجربة على نفس الجهاز فقط");
  if(!firebaseReady) alert("تنبيه: الموقع الآن في وضع التجربة. الطلب محفوظ على هذا الجهاز فقط ولن يصل للمطعم قبل إعداد Firebase.");
 }catch(err){console.error(err);$("#checkoutMessage").textContent="حصلت مشكلة في إرسال الطلب. حاول مرة تانية."}
 finally{btn.disabled=false;btn.textContent="تأكيد الطلب"}
}
function showAdmin(){document.querySelector("main").hidden=true;document.querySelector("footer").hidden=true;document.querySelector(".site-header").hidden=true;document.querySelector(".topline").hidden=true;$("#adminPanel").hidden=false}
function hideAdmin(){document.querySelector("main").hidden=false;document.querySelector("footer").hidden=false;document.querySelector(".site-header").hidden=false;document.querySelector(".topline").hidden=false;$("#adminPanel").hidden=true;location.hash=""}
function renderOrders(orders){
 $("#adminSummary").innerHTML=[["كل الطلبات",orders.length],["طلبات جديدة",orders.filter(o=>o.status==="جديد").length],["قيد التحضير",orders.filter(o=>o.status==="قيد التحضير").length]].map(([a,b])=>`<div class="summary-box">${a}<b>${b}</b></div>`).join("");
 $("#adminOrderList").innerHTML=orders.length?orders.map(o=>`<article class="order-card"><div class="order-head"><b>طلب #${String(o.id).slice(-6)}</b><select class="status-select" data-status="${o.id}">${["جديد","تم التأكيد","قيد التحضير","جاهز للاستلام","خرج للتوصيل","تم التسليم","ملغي"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></div><p>العميل: ${escapeHtml(o.customer?.name||"")} — ${escapeHtml(o.customer?.phone||"")}<br>العنوان: ${escapeHtml(o.customer?.address||"")}<br>ملاحظات: ${escapeHtml(o.notes||"لا يوجد")}</p><div class="order-lines">${(o.items||[]).map(i=>`${escapeHtml(i.name)} × ${i.qty} — ${money(i.price*i.qty)}`).join("<br>")}</div><b class="price">الإجمالي: ${money(o.total)}</b></article>`).join(""):`<div class="empty">مفيش طلبات لسه.</div>`;
 $("#adminOrderList").querySelectorAll("[data-status]").forEach(sel=>sel.onchange=()=>updateStatus(sel.dataset.status,sel.value));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function updateStatus(id,status){
 try{if(firebaseReady)await updateDoc(doc(db,"orders",id),{status});else{const a=JSON.parse(localStorage.getItem("ghoulDemoOrders")||"[]");const x=a.find(o=>o.id===id);if(x)x.status=status;localStorage.setItem("ghoulDemoOrders",JSON.stringify(a));renderOrders(a)}}catch(e){toast("تعذر تحديث الحالة");console.error(e)}
}
$("#checkoutForm").addEventListener("submit",submitOrder);
$("#cartOpen").onclick=openCart;$("#cartClose").onclick=closeCart;$("#drawerBackdrop").onclick=closeCart;
$("#checkoutOpen").onclick=openCheckout;$("#checkoutClose").onclick=closeCheckout;
$("#checkoutBackdrop").addEventListener("click",e=>{if(e.target.id==="checkoutBackdrop")closeCheckout()});
$("#searchInput").addEventListener("input",renderMenu);
$("#menuToggle").onclick=()=>$("#mainNav").classList.toggle("open");
$("#mainNav").querySelectorAll("a").forEach(a=>a.onclick=()=>$("#mainNav").classList.remove("open"));
$("#year").textContent=new Date().getFullYear();
$("#adminLogout").onclick=async()=>{if(auth&&firebaseReady)await signOut(auth);if(unsubscribeOrders)unsubscribeOrders();hideAdmin()};
$("#adminLoginForm").onsubmit=async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);$("#adminLoginMessage").textContent="";
 if(!firebaseReady){$("#adminLoginMessage").textContent="اضبط بيانات Firebase أولاً لتفعيل دخول الإدارة.";return}
 try{await signInWithEmailAndPassword(auth,f.get("email"),f.get("password"))}
 catch(err){$("#adminLoginMessage").textContent="بيانات الدخول غير صحيحة أو الحساب غير مفعّل."}
};
if(location.hash==="#admin"){showAdmin()}
if(firebaseReady){
 onAuthStateChanged(auth,user=>{
  if(location.hash!=="#admin")return;
  if(user){$("#adminLoginBox").hidden=true;$("#adminOrders").hidden=false;
   if(unsubscribeOrders)unsubscribeOrders();
   unsubscribeOrders=onSnapshot(query(collection(db,"orders"),orderBy("createdAt","desc")),snap=>renderOrders(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>{console.error(err);toast("تعذر تحميل الطلبات")});
  }else{$("#adminLoginBox").hidden=false;$("#adminOrders").hidden=true}
 });
}else if(location.hash==="#admin"){
 $("#adminLoginBox").hidden=true;$("#adminOrders").hidden=false;
 renderOrders(JSON.parse(localStorage.getItem("ghoulDemoOrders")||"[]"));
}
renderCategories();renderMenu();renderCart();
window.addEventListener("hashchange",()=>{if(location.hash==="#admin"){showAdmin();if(!firebaseReady){$("#adminLoginBox").hidden=true;$("#adminOrders").hidden=false;renderOrders(JSON.parse(localStorage.getItem("ghoulDemoOrders")||"[]"))}}});
