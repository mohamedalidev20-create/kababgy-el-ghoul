import menu from "./menu-data.json" with { type: "json" };
const $ = s => document.querySelector(s);
const money = n => `${Number(n).toLocaleString("ar-EG")} جنيه`;
let cart = JSON.parse(localStorage.getItem("ghoulCartFinal") || "[]");
let activeCategory = "الكل";
const categories = ["الكل", ...new Set(menu.map(x => x.category))];
const escapeHtml = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function renderCategories(){
 $("#categories").innerHTML=categories.map(c=>`<button class="category-btn ${activeCategory===c?"active":""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
 $("#categories").querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderCategories();renderMenu()});
}
function foodPhotoUrl(item,index){
 // اختيار كلمات بحث مختلفة حسب اسم الصنف، بدل صورة عامة واحدة للقسم.
 const n=item.name.replace(/^وجبة\s*/,"").toLowerCase();
 const rules=[
  [/كباب|كندوز/,"beef,kebab,grilled"], [/كفتة|كفته/,"kofta,grilled,minced-meat"], [/شيش|طاووق|فراخ|فرخة|وراك|صدر|دجاج/,"chicken,shish-tawook,grilled"],
  [/طرب/ ,"grilled,lamb,caul-fat"], [/سجق/ ,"sausage,grilled"], [/حواوشي/ ,"hawawshi,meat"], [/برجر|برغر/ ,"burger,beef"], [/كبدة/ ,"liver,sandwich"],
  [/سمين|كرشة|ممبار|فشة|طحال|لحمة راس/ ,"egyptian,offal,stew"], [/طاجن|بامية|ملوخية|فتة|ورق عنب/ ,"egyptian,tagine,stew"],
  [/أرز|رز|مكرونة|مكرونه|اسباجتي|سباجيتي/ ,"rice,pasta,egyptian"], [/كريب/ ,"savory,crepe,stuffed"], [/بروستد|بانيه|استربس|ناجتس/ ,"fried,chicken,crispy"],
  [/بطاطس|سلطة|طحينة|بابا|مخلل|ثومية|حمص/ ,"mezze,appetizer,side-dish"], [/جبنة|جبن/ ,"cheese,sandwich"], [/ميكس|مشكل/ ,"mixed,grill,meat"],
  [/ساندوتش|سندوتش|رغيف|عيش/ ,"egyptian,sandwich,street-food"]
 ];
 let specific=rules.find(([re])=>re.test(n));
 const categoryTags={"الوجبات":"egyptian,grill,meal","المشويات":"grilled,bbq,meat","السمين":"egyptian,offal,stew","الأطباق الرئيسية":"egyptian,main-course","الطواجن":"egyptian,tagine,stew","السندوتشات":"sandwich,street-food","المقبلات":"mezze,appetizer","الأرز والمكرونات":"rice,pasta","الكريبات":"savory,crepe","البروستد":"fried,chicken"};
 const tags=specific?specific[1]:(categoryTags[item.category]||"egyptian,food");
 return `https://loremflickr.com/720/480/${tags}?lock=${index+401}`;
}
function renderMenu(){
 const term=$("#searchInput").value.trim().toLowerCase();
 const list=menu.map((item,index)=>({...item,index})).filter(x=>(activeCategory==="الكل"||x.category===activeCategory)&&(`${x.name} ${x.desc} ${x.category}`).toLowerCase().includes(term));
 $("#menuGrid").innerHTML=list.length?list.map(x=>`<article class="food-card"><div class="food-photo-wrap"><img class="food-photo" src="${foodPhotoUrl(x,x.index)}" alt="صورة ${escapeHtml(x.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=720&q=80'"></div><div class="food-info"><span class="food-category">${escapeHtml(x.category)}</span><h3>${escapeHtml(x.name)}</h3>${x.desc?`<p>${escapeHtml(x.desc)}</p>`:""}<div class="option-list">${x.options.map((o,j)=>`<div class="option-row"><span>${escapeHtml(o.label)}</span><b class="price">${money(o.price)}</b><button class="add-btn" data-add="${x.index}" data-option="${j}">+ أضف</button></div>`).join("")}</div></div></article>`).join(""):`<div class="empty">مفيش أصناف مطابقة للبحث.</div>`;
 $("#menuGrid").querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addToCart(Number(b.dataset.add),Number(b.dataset.option)));
}
function saveCart(){localStorage.setItem("ghoulCartFinal",JSON.stringify(cart));renderCart()}
function addToCart(index,optionIndex){const m=menu[index],o=m.options[optionIndex],key=`${index}-${optionIndex}`;const found=cart.find(x=>x.key===key);found?found.qty++:cart.push({key,index,optionIndex,qty:1});saveCart();toast("اتضاف للسلة")}
function changeQty(key,delta){const x=cart.find(i=>i.key===key);if(!x)return;x.qty+=delta;if(x.qty<=0)cart=cart.filter(i=>i.key!==key);saveCart()}
function getDetails(x){const m=menu[x.index],o=m.options[x.optionIndex];return {name:m.name,option:o.label,price:o.price,qty:x.qty}}
function renderCart(){
 const count=cart.reduce((a,x)=>a+x.qty,0),total=cart.reduce((a,x)=>a+menu[x.index].options[x.optionIndex].price*x.qty,0);
 $("#cartCount").textContent=count;$("#cartTotal").textContent=money(total);
 $("#cartItems").innerHTML=cart.length?cart.map(x=>{const d=getDetails(x);return `<div class="cart-row"><div><b>${escapeHtml(d.name)}</b><small>${escapeHtml(d.option)} · ${money(d.price)} للواحد</small></div><div class="qty"><button data-q="${x.key}" data-d="-1">−</button><b>${x.qty}</b><button data-q="${x.key}" data-d="1">+</button></div></div>`}).join(""):`<div class="empty">السلة لسه فاضية. اختار أكلك من المنيو ❤️</div>`;
 $("#cartItems").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>changeQty(b.dataset.q,Number(b.dataset.d)));
}
function openCart(){$("#cartDrawer").classList.add("open");$("#drawerBackdrop").classList.add("show")}
function closeCart(){$("#cartDrawer").classList.remove("open");$("#drawerBackdrop").classList.remove("show")}
function openCheckout(){if(!cart.length){toast("ضيف صنف للسلة الأول");return}closeCart();$("#checkoutBackdrop").classList.add("show")}
function closeCheckout(){$("#checkoutBackdrop").classList.remove("show")}
$("#checkoutForm").addEventListener("submit",e=>{
 e.preventDefault();if(!cart.length)return;
 const data=new FormData(e.currentTarget);
 const name=data.get("name").trim(),phone=data.get("phone").trim(),address=data.get("address").trim(),notes=data.get("notes").trim();
 const lines=cart.map(x=>{const d=getDetails(x);return `• ${d.name} (${d.option}) × ${d.qty} = ${money(d.price*d.qty)}`});
 const total=cart.reduce((s,x)=>s+menu[x.index].options[x.optionIndex].price*x.qty,0);
 const message=`طلب جديد من موقع كبابجي الغول\n\nالاسم: ${name}\nرقم الموبايل: ${phone}\nالعنوان: ${address}\n\nتفاصيل الطلب:\n${lines.join("\n")}\n\nالإجمالي: ${money(total)}\nملاحظات: ${notes||"لا يوجد"}\n\nبرجاء تأكيد الطلب.`;
 const url=`https://wa.me/201111472711?text=${encodeURIComponent(message)}`;
 window.open(url,"_blank","noopener");
 $("#checkoutMessage").textContent="اتفتح واتساب برسالة طلبك. اضغط إرسال داخل واتساب عشان توصل للمطعم.";
});
$("#cartOpen").onclick=openCart;$("#cartClose").onclick=closeCart;$("#drawerBackdrop").onclick=closeCart;
$("#checkoutOpen").onclick=openCheckout;$("#checkoutClose").onclick=closeCheckout;
$("#checkoutBackdrop").addEventListener("click",e=>{if(e.target.id==="checkoutBackdrop")closeCheckout()});
$("#searchInput").addEventListener("input",renderMenu);
$("#menuToggle").onclick=()=>$("#mainNav").classList.toggle("open");
$("#mainNav").querySelectorAll("a").forEach(a=>a.onclick=()=>$("#mainNav").classList.remove("open"));
$("#year").textContent=new Date().getFullYear();
renderCategories();renderMenu();renderCart();
