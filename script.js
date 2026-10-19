'use strict';

// Larancio — versão 1.0: vitrine de demonstração.
// Substitua produtos e preços ilustrativos pelos dados reais antes de publicar uma loja comercial.
const products = [
  // Sabonetes: imagens do conceito visual aprovado. Sem opções de cor.
  {id:'sabonete-laranja', name:'Sabonete Vegetal Laranja', price:29.90, category:'sabonetes', image:'assets/sabonete-laranja.webp', alt:'Sabonete Larancio Laranja com gravação e embalagem ilustrada de laranjas sobre base de travertino', description:'Sabonete vegetal de laranja da coleção Larancio, com apresentação botânica inspirada nos cítricos.'},
  {id:'sabonete-pessego', name:'Sabonete Vegetal Pêssego', price:29.90, category:'sabonetes', image:'assets/sabonete-pessego.webp', alt:'Sabonete Larancio Pêssego com embalagem ilustrada de pêssegos sobre base de travertino', description:'Sabonete vegetal de pêssego da coleção Larancio, com apresentação em tons suaves e delicados.'},
  {id:'sabonete-jasmim', name:'Sabonete Vegetal Jasmim', price:29.90, category:'sabonetes', image:'assets/sabonete-jasmim.webp', alt:'Sabonete Larancio Jasmim com flores brancas de centro amarelo na embalagem sobre base de travertino', description:'Sabonete vegetal de jasmim da coleção Larancio, com apresentação floral em branco e amarelo.'},
  {id:'sabonete-baunilha', name:'Sabonete Vegetal Baunilha', price:32.90, category:'sabonetes', image:'assets/sabonete-baunilha.webp', alt:'Sabonete Larancio Baunilha com flores claras e vagens de baunilha na embalagem sobre base de travertino', description:'Sabonete vegetal de baunilha da coleção Larancio, com apresentação cremosa em tons de linho.'},
  {id:'vela-nuvem', name:'Vela Decorativa Nuvem', price:129.90, category:'velas', image:'assets/vela-nuvem.webp', alt:'Vela escultural clara formada por pequenas esferas', description:'Uma peça decorativa de linhas suaves, criada para acrescentar textura e delicadeza a qualquer ambiente.', colors:['#ead5bc','#bc6b49','#777458']},
  {id:'vela-terracota', name:'Vela Aromática Terracota', price:159.90, category:'velas', image:'assets/vela-terracota.webp', alt:'Vela acesa em recipiente âmbar com etiqueta Larancio', description:'A atmosfera acolhedora da luz da vela, em um recipiente âmbar de inspiração atemporal.', colors:['#c0a080','#bc6b49','#777458']},
  {id:'difusor', name:'Difusor de Ambiente', price:189.90, category:'decoracao', image:'assets/difusor.webp', alt:'Difusor âmbar de ambiente com varetas de madeira', description:'Um pequeno ritual de cuidado e bem-estar para compor a decoração da sua casa.', colors:['#e5ccb0','#bc6b49','#777458']},
  {id:'bandeja', name:'Bandeja em Travertino', price:249.90, category:'decoracao', image:'assets/bandeja.webp', alt:'Bandeja clara em pedra com arranjo de flores secas', description:'Um objeto versátil, de presença delicada, para organizar e compor ambientes com naturalidade.', colors:['#785b42','#d3ae8e','#bb885e']}
];
const BRL=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const qs=s=>document.querySelector(s);
const qsa=s=>[...document.querySelectorAll(s)];
const safeLoad=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const safeSave=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
let cart=Object.fromEntries(Object.entries(safeLoad('larancio-demo-cart',{})).filter(([id,qty])=>products.some(p=>p.id===id)&&Number.isInteger(qty)&&qty>0&&qty<=99));
let wishlist=safeLoad('larancio-demo-wishlist',[]);if(!Array.isArray(wishlist))wishlist=[];
let category='all',query='',sort='featured',activeProduct=null,slideIndex=0,slideTimer,toastTimer;

function notify(message){const el=qs('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3000)}
function getProduct(id){return products.find(p=>p.id===id)}
// Reutiliza os mesmos cartões, favoritos, modal e sacola do site original.
// Somente sabonetes deixam de ter seletores de cores.
function productCard(p){
  const swatches = p.category === 'sabonetes' ? '' : `<div class="swatches" aria-label="Cores ilustrativas">${p.colors.map((c,i)=>`<button type="button" class="swatch ${i===0?'active':''}" style="--swatch:${c}" data-color="${p.id}" aria-label="Opção de cor ${i+1} (demonstrativa)" aria-pressed="${i===0}"></button>`).join('')}</div>`;
  return `<article class="product-card">
    <div class="product-image-wrap" data-view-product="${p.id}" role="button" tabindex="0" aria-label="Ver detalhes de ${p.name}"><img src="${p.image}" alt="${p.alt}" loading="lazy"><button type="button" class="wish-button ${wishlist.includes(p.id)?'is-liked':''}" data-wish="${p.id}" aria-label="${wishlist.includes(p.id)?'Remover dos':'Adicionar aos'} favoritos" aria-pressed="${wishlist.includes(p.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.3 5.3 0 0 0-7.5 0L12 6.2l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.6a5.3 5.3 0 0 0 0-7.5Z"/></svg></button></div>
    <div class="product-details"><button class="product-name" type="button" data-view-product="${p.id}">${p.name}</button><div class="product-price">${BRL.format(p.price)}</div>${swatches}<button type="button" class="card-add" data-add-cart="${p.id}">Adicionar à sacola +</button></div>
  </article>`;
}
function renderSoapProducts(){
  qs('#soap-grid').innerHTML = products.filter(p=>p.category==='sabonetes').map(productCard).join('');
}
function renderProducts(){
  // A vitrine antiga permanece com os produtos originais na página inicial.
  // Sabonetes também podem ser encontrados pela busca e em “Ver todos”.
  let visible=products.filter(p=>(category==='all'? (query || p.category!=='sabonetes') : p.category===category)&&(!query||`${p.name} ${p.description}`.toLocaleLowerCase('pt-BR').includes(query)));
  if(sort==='low')visible.sort((a,b)=>a.price-b.price);if(sort==='high')visible.sort((a,b)=>b.price-a.price);if(sort==='alpha')visible.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  qs('#product-grid').innerHTML=visible.map(productCard).join('');
  qs('#no-results').hidden=visible.length!==0;
  qs('#catalog-count').textContent=`${visible.length} ${visible.length===1?'produto':'produtos'}`;
  const title=qs('#arrivals-title'),kicker=qs('#section-kicker');
  if(query){title.textContent=`Resultados para “${query}”`;kicker.textContent='Busca';}
  else if(category==='sabonetes'){title.textContent='Descubra nossos sabonetes.';kicker.textContent='Coleção';}
  else if(category==='velas'){title.textContent='Velas para todos os momentos.';kicker.textContent='Coleção';}
  else if(category==='decoracao'){title.textContent='Detalhes que transformam.';kicker.textContent='Coleção';}
  else if(category==='vestuario'){title.textContent='Vestuário — em breve.';kicker.textContent='Nova coleção';}
  else{title.textContent='Descubra nossos lançamentos.';kicker.textContent='Novidades';}
  qs('#catalog-toolbar').hidden=category==='all'&&!query;
}

function renderCart(){
  const entries=Object.entries(cart).map(([id,quantity])=>({product:getProduct(id),quantity})).filter(x=>x.product);
  const count=entries.reduce((sum,item)=>sum+item.quantity,0);
  const total=entries.reduce((sum,item)=>sum+item.product.price*item.quantity,0);
  const badge=qs('#cart-count');badge.hidden=count===0;badge.textContent=count>99?'99+':count;
  qs('#cart-heading-count').textContent=`(${count})`;qs('#cart-total').textContent=BRL.format(total);
  qs('#cart-items').innerHTML=entries.length?entries.map(({product:p,quantity})=>`<div class="cart-product"><img src="${p.image}" alt="${p.alt}"><div class="cart-product-info"><strong>${p.name}</strong><p>${BRL.format(p.price)}</p><div class="cart-actions"><button type="button" data-cart-change="${p.id}" data-delta="-1" aria-label="Remover uma unidade">−</button><span>${quantity}</span><button type="button" data-cart-change="${p.id}" data-delta="1" aria-label="Adicionar uma unidade">+</button><button type="button" class="cart-remove" data-cart-remove="${p.id}">Remover</button></div></div></div>`).join(''):`<div class="cart-empty"><svg viewBox="0 0 24 24"><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><h3>Sua sacola está vazia.</h3><p>Há sempre espaço para um novo ritual.</p><button class="button button-outline" type="button" data-continue-shopping>Conhecer produtos →</button></div>`;
  safeSave('larancio-demo-cart',cart);
}
function addToCart(id,qty=1){if(!getProduct(id))return;cart[id]=Math.min(99,(cart[id]||0)+qty);renderCart();notify('Adicionado à sua sacola.');}
function lock(){document.body.classList.add('locked')}
function closeDrawers(){qsa('.drawer.is-open').forEach(d=>{d.classList.remove('is-open');d.setAttribute('aria-hidden','true')});qs('#backdrop').hidden=true;document.body.classList.remove('locked')}
function openDrawer(id){closeSearch();closeProduct();closeDrawers();qs(id).classList.add('is-open');qs(id).setAttribute('aria-hidden','false');qs('#backdrop').hidden=false;lock()}
function openSearch(){closeDrawers();closeProduct();qs('#search-panel').hidden=false;qs('#backdrop').hidden=false;lock();qs('#search-input').focus()}
function closeSearch(){qs('#search-panel').hidden=true;if(!qs('.drawer.is-open'))qs('#backdrop').hidden=true;document.body.classList.remove('locked')}
function openProduct(id){const p=getProduct(id);if(!p)return;closeDrawers();closeSearch();activeProduct=id;qs('#modal-product-image').src=p.image;qs('#modal-product-image').alt=p.alt;qs('#modal-product-name').textContent=p.name;qs('#modal-product-price').textContent=BRL.format(p.price);qs('#modal-product-description').textContent=p.description;qs('#product-quantity').value=1;qs('#product-modal').hidden=false;lock()}
function closeProduct(){qs('#product-modal').hidden=true;activeProduct=null;document.body.classList.remove('locked')}
function setCategory(next){category=next;query='';qs('#search-input').value='';renderProducts();closeDrawers()}
function setSlide(index){slideIndex=(index+3)%3;qsa('.hero-slide').forEach((el,i)=>{el.classList.toggle('is-active',i===slideIndex);el.setAttribute('aria-hidden',i!==slideIndex?'true':'false')});qs('#slide-current').textContent=String(slideIndex+1).padStart(2,'0');qs('#slide-progress').style.transform=`translateX(${slideIndex*100}%)`}
function cycleSlide(delta){setSlide(slideIndex+delta);clearInterval(slideTimer);slideTimer=setInterval(()=>setSlide(slideIndex+1),9000)}
function searchNow(){query=qs('#search-input').value.trim().toLocaleLowerCase('pt-BR').slice(0,80);category='all';renderProducts();closeSearch();qs('#novidades').scrollIntoView({behavior:'smooth'})}

// Delegação de eventos: os cartões são renderizados dinamicamente.
document.addEventListener('click',event=>{
  const target=event.target;
  const menu=target.closest('[data-open-menu]');if(menu){openDrawer('#menu-drawer');return}
  const cartButton=target.closest('[data-open-cart]');if(cartButton){openDrawer('#cart-drawer');return}
  if(target.closest('[data-close-drawer]')){closeDrawers();return}
  const cat=target.closest('[data-category]');if(cat){setCategory(cat.dataset.category);return}
  const all=target.closest('#show-all,#clear-filters');if(all){setCategory('all');return}
  const wish=target.closest('[data-wish]');if(wish){const id=wish.dataset.wish;wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];safeSave('larancio-demo-wishlist',wishlist);renderProducts();renderSoapProducts();notify(wishlist.includes(id)?'Adicionado aos favoritos.':'Removido dos favoritos.');return}
  const add=target.closest('[data-add-cart]');if(add){addToCart(add.dataset.addCart);return}
  const view=target.closest('[data-view-product]');if(view){openProduct(view.dataset.viewProduct);return}
  const color=target.closest('[data-color]');if(color){color.parentElement.querySelectorAll('.swatch').forEach(el=>{el.classList.remove('active');el.setAttribute('aria-pressed','false')});color.classList.add('active');color.setAttribute('aria-pressed','true');notify('Cor ilustrativa selecionada.');return}
  const change=target.closest('[data-cart-change]');if(change){const id=change.dataset.cartChange;cart[id]=Math.min(99,Math.max(0,(cart[id]||0)+Number(change.dataset.delta)));if(!cart[id])delete cart[id];renderCart();return}
  const remove=target.closest('[data-cart-remove]');if(remove){delete cart[remove.dataset.cartRemove];renderCart();return}
  if(target.closest('[data-continue-shopping]')){closeDrawers();qs('#novidades').scrollIntoView({behavior:'smooth'});return}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeDrawers();closeSearch();closeProduct()}if((event.key==='Enter'||event.key===' ')&&event.target.matches('.product-image-wrap')){event.preventDefault();openProduct(event.target.dataset.viewProduct)}});
qs('#backdrop').addEventListener('click',()=>{closeDrawers();closeSearch()});
qs('#search-trigger').addEventListener('click',openSearch);
qs('#close-search').addEventListener('click',closeSearch);
qs('#search-submit').addEventListener('click',searchNow);
qs('#search-input').addEventListener('keydown',event=>{if(event.key==='Enter')searchNow()});
qs('#close-product').addEventListener('click',closeProduct);
qs('#product-modal').addEventListener('click',event=>{if(event.target===qs('#product-modal'))closeProduct()});
qs('#quantity-minus').addEventListener('click',()=>{const e=qs('#product-quantity');e.value=Math.max(1,(Number(e.value)||1)-1)});
qs('#quantity-plus').addEventListener('click',()=>{const e=qs('#product-quantity');e.value=Math.min(20,(Number(e.value)||1)+1)});
qs('#modal-add-cart').addEventListener('click',()=>{if(!activeProduct)return;addToCart(activeProduct,Math.max(1,Math.min(20,Number(qs('#product-quantity').value)||1)));closeProduct();openDrawer('#cart-drawer')});
qs('#sort-select').addEventListener('change',event=>{sort=event.target.value;renderProducts()});
qs('#prev-slide').addEventListener('click',()=>cycleSlide(-1));qs('#next-slide').addEventListener('click',()=>cycleSlide(1));
qs('#account-trigger').addEventListener('click',()=>notify('Área do cliente disponível em uma próxima etapa.'));
qs('#year').textContent=new Date().getFullYear();
renderSoapProducts();renderProducts();renderCart();setSlide(0);
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){slideTimer=setInterval(()=>setSlide(slideIndex+1),9000)}
