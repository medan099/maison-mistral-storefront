import { products, imageUrl, money } from './catalog.js';

const cartKey = 'maison-mistral-panier';
const favoriteKey = 'maison-mistral-favoris';
const checkoutKey = 'maison-mistral-coordonnees';
const receiptKey = 'maison-mistral-dernier-recap';
const page = document.body.dataset.page;
const main = document.querySelector('#page-content');
const cart = new Map();
const favorites = new Set(readJson(localStorage, favoriteKey, []));
let toastTimer;

readJson(localStorage, cartKey, []).forEach(row => {
  const product = products.find(item => item.id === row.id);
  if (product && Number(row.quantity) > 0) cart.set(product.id, { product, quantity: Number(row.quantity) });
});

function readJson(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function checkoutData() {
  return readJson(sessionStorage, checkoutKey, { name: '', email: '', phone: '', address: '', city: '', postal: '', country: 'France', delivery: 'standard', payment: 'carte-demo' });
}

function saveCheckout(data) {
  writeJson(sessionStorage, checkoutKey, data);
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function renderChrome() {
  const count = [...cart.values()].reduce((sum, row) => sum + row.quantity, 0);
  document.querySelector('#site-header').innerHTML =
    '<div class="topline"><span>Livraison offerte dès 150 €</span><span>Des objets faits pour les cuisines vivantes&nbsp; ✳ &nbsp;Depuis 1987</span><span>Atelier du Sud, France</span></div>' +
    '<header class="site-header"><button class="menu-toggle" id="menu-toggle" aria-label="Ouvrir le menu"><span></span><span></span></button><a class="brand" href="/index.html" aria-label="Maison Mistral, accueil"><span class="brand-sun">✳</span><span class="brand-text">MAISON<br><b>MISTRAL</b></span></a>' +
    '<nav class="main-nav" id="main-nav" aria-label="Navigation principale"><a href="/boutique.html">La boutique</a><a href="/boutique.html?category=Meubles">Meubles de cuisine</a><a href="/boutique.html?category=Accessoires">Petits objets</a><a href="/maison.html">Notre maison</a></nav>' +
    '<div class="header-tools"><form class="header-search" id="search-form"><input id="search-input" type="search" aria-label="Rechercher" placeholder="Je cherche…"><button aria-label="Lancer la recherche" type="submit">⌕</button></form><a class="bag-link" href="/panier.html" aria-label="Voir le panier">Panier <span id="cart-count">' + count + '</span></a></div></header>';
  document.querySelector('#site-footer').innerHTML =
    '<footer class="site-footer"><div class="footer-main"><div><a class="brand footer-brand" href="/index.html"><span class="brand-sun">✳</span><span class="brand-text">MAISON<br><b>MISTRAL</b></span></a><p>Le goût des choses simples,<br>et des tablées qui durent.</p></div><div><span class="footer-label">À découvrir</span><a href="/boutique.html">Toute la boutique</a><a href="/boutique.html?category=Meubles">Meubles</a><a href="/boutique.html?category=Accessoires">Objets de cuisine</a></div><div><span class="footer-label">La maison</span><a href="/maison.html">Notre histoire</a><a href="/maison.html#matieres">Nos matières</a><a href="mailto:bonjour@maisonmistral.example">Nous écrire</a></div><div class="footer-note"><span>✳</span><p>Une maison à vivre,<br>pas à mettre sous cloche.</p></div></div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' Maison Mistral</span><span>Créé avec soin dans le Sud de la France</span><span>Boutique de démonstration</span></div></footer>' +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  document.querySelector('#menu-toggle').addEventListener('click', () => document.querySelector('#main-nav').classList.toggle('mobile-open'));
  document.querySelector('#main-nav').addEventListener('click', event => {
    if (event.target.closest('a')) document.querySelector('#main-nav').classList.remove('mobile-open');
  });
  document.querySelector('#search-form').addEventListener('submit', event => {
    event.preventDefault();
    const query = document.querySelector('#search-input').value.trim();
    window.location.href = '/boutique.html' + (query ? '?q=' + encodeURIComponent(query) : '');
  });
}

function showToast(text) {
  const toast = document.querySelector('#toast');
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function subtotal() {
  return [...cart.values()].reduce((sum, row) => sum + row.product.price * row.quantity, 0);
}

function persistCart() {
  writeJson(localStorage, cartKey, [...cart.values()].map(row => ({ id: row.product.id, quantity: row.quantity })));
  const count = [...cart.values()].reduce((sum, row) => sum + row.quantity, 0);
  const badge = document.querySelector('#cart-count');
  if (badge) badge.textContent = String(count);
}

function addToCart(id, quantity = 1) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const existing = cart.get(id);
  cart.set(id, { product, quantity: (existing?.quantity || 0) + quantity });
  persistCart();
  showToast(product.name + ' a rejoint votre panier.');
  if (page === 'panier') renderBag();
}

function productCard(product, index = 0) {
  const saved = favorites.has(product.id);
  return '<article class="product-card" style="--card-index:' + index + '"><div class="product-photo"><a href="/piece.html?id=' + encodeURIComponent(product.id) + '" aria-label="Découvrir ' + escapeHtml(product.name) + '"><img src="' + imageUrl(product.image, 760) + '" alt="' + escapeHtml(product.name) + '" loading="lazy"></a>' +
    (product.badge ? '<span class="product-tag">' + escapeHtml(product.badge) + '</span>' : '') +
    '<button class="favorite-button ' + (saved ? 'is-saved' : '') + '" data-favorite="' + product.id + '" aria-label="' + (saved ? 'Retirer des favoris' : 'Ajouter aux favoris') + '">' + (saved ? '♥' : '♡') + '</button><button class="quick-add" data-add="' + product.id + '" aria-label="Ajouter ' + escapeHtml(product.name) + ' au panier">＋</button></div>' +
    '<div class="product-card-info"><div><span>' + escapeHtml(product.category) + '</span><h3><a href="/piece.html?id=' + encodeURIComponent(product.id) + '">' + escapeHtml(product.name) + '</a></h3></div><strong>' + money(product.price) + '</strong></div><p class="product-caption">' + escapeHtml(product.type) + '</p></article>';
}

function setTitle(title) {
  document.title = title + ' — Maison Mistral';
}

function renderHome() {
  setTitle('La cuisine est une histoire de cœur');
  main.innerHTML =
    '<section class="hero"><div class="hero-copy"><p class="eyebrow"><span>✳</span> LE GOÛT DES BELLES CHOSES</p><h1>La cuisine est une <em>histoire</em> de cœur.</h1><p class="hero-lead">Des meubles et des objets choisis pour les repas qui s’allongent, les mains dans la farine et les petits matins ensoleillés.</p><div class="hero-actions"><a class="button button-cream" href="/boutique.html">Entrer dans la boutique <span>↗</span></a><a class="underlined-link" href="/maison.html">Découvrir la maison</a></div><div class="hero-stamp"><span>✳</span><b>Fabriqué<br>avec cœur</b></div></div><div class="hero-image"><img src="' + imageUrl('photo-1600607687939-ce8a6c25118c', 1500) + '" alt="Cuisine lumineuse en bois et matières naturelles"><div class="image-caption"><span>La table est toujours ouverte</span><b>43° 17′ N · 5° 22′ E</b></div><div class="hero-bubble">Les beaux<br>jours<br><i>s’invitent.</i></div></div><div class="hero-bottomline"><span>MAISON MISTRAL · OBJETS DE CUISINE ET DE VIE</span><span>FAITS POUR SE TRANSMETTRE <b>↓</b></span></div></section>' +
    '<section class="category-band"><div class="section-kicker"><span>01 / NOS FAMILLES</span><span>À chacun son coin préféré</span></div><div class="category-links"><a href="/boutique.html?category=Meubles"><span class="category-glyph">▱</span><b>Meubles</b><small>La pièce maîtresse ↗</small></a><a href="/boutique.html?category=Assises"><span class="category-glyph">⌑</span><b>Assises</b><small>Prendre son temps ↗</small></a><a href="/boutique.html?category=Luminaires"><span class="category-glyph">◉</span><b>Luminaires</b><small>La bonne lumière ↗</small></a><a href="/boutique.html?category=Accessoires"><span class="category-glyph">✳</span><b>Petits objets</b><small>Les détails aimés ↗</small></a></div></section>' +
    '<section class="home-collection"><div class="section-kicker"><span>02 / LA SÉLECTION DU MOMENT</span><a href="/boutique.html">Voir toute la collection ↗</a></div><div class="section-title-row"><h2>La vie se passe <em>ici.</em></h2><p>Nos pièces préférées sont celles qui finissent par porter un peu de votre histoire.</p></div><div class="product-grid">' + products.slice(0, 4).map(productCard).join('') + '</div></section>' +
    '<section class="quote-panel"><div class="quote-decoration">❋</div><p class="eyebrow">LA PHILOSOPHIE MISTRAL</p><blockquote>« La meilleure place dans la maison, c’est toujours celle où quelqu’un prépare à manger. »</blockquote><a class="underlined-link" href="/maison.html">En savoir plus sur notre maison ↗</a></section>' +
    '<section class="home-story"><div class="story-photo"><img src="' + imageUrl('photo-1600210492486-724fe5c67fb0', 1200) + '" alt="Intérieur en bois naturel, baigné de lumière" loading="lazy"><span>NOTRE CARNET · N° 04</span></div><div class="story-copy"><p class="eyebrow">DEPUIS LE PREMIER CAFÉ</p><h2>On ne cuisine jamais <em>seul.</em></h2><p>Depuis 1987, nous cherchons des matières franches, des formes accueillantes et des artisans qui aiment leur travail. Pour que chaque objet trouve sa place autour de la table.</p><a class="button button-navy" href="/maison.html">Notre histoire <span>↗</span></a></div></section>' +
    '<section class="newsletter"><span class="newsletter-symbol">✳</span><div><p class="eyebrow">LE COURRIER DU SUD</p><h2>Un petit mot, de temps en temps.</h2><p>Nos nouveautés, nos belles trouvailles et quelques recettes à partager.</p></div><form id="newsletter-form"><label class="sr-only" for="newsletter-email">Votre adresse e-mail</label><input id="newsletter-email" type="email" required placeholder="Votre adresse e-mail"><button type="submit" aria-label="S’inscrire à la lettre">↗</button><small id="newsletter-message">Pas de bruit, promis.</small></form></section>';
  document.querySelector('#newsletter-form').addEventListener('submit', event => {
    event.preventDefault();
    document.querySelector('#newsletter-message').textContent = 'Merci, votre inscription de démonstration est notée ici.';
    document.querySelector('#newsletter-email').value = '';
  });
}

function renderShop() {
  setTitle('La boutique');
  const params = new URLSearchParams(window.location.search);
  const state = { category: params.get('category') || 'Tout', query: params.get('q') || '', sort: 'selection' };
  const categories = ['Tout', 'Meubles', 'Assises', 'Luminaires', 'Accessoires'];
  if (!categories.includes(state.category)) state.category = 'Tout';
  document.querySelector('#search-input').value = state.query;
  main.innerHTML =
    '<section class="shop-page"><div class="shop-banner"><p class="eyebrow">LA BOUTIQUE · OBJETS À VIVRE</p><h1>La belle <em>vie</em><br>de cuisine.</h1><div><p>Des pièces sincères, des matières qui se patinent et le plaisir de les retrouver chaque jour.</p><span>08 PIÈCES À DÉCOUVRIR ↘</span></div></div><div class="shop-toolbar"><div class="category-tabs" role="group" aria-label="Filtrer par famille">' + categories.map(category => '<button class="category-tab ' + (state.category === category ? 'active' : '') + '" data-category="' + category + '">' + (category === 'Tout' ? 'Tout voir' : category) + '</button>').join('') + '</div><label class="sort-control">Trier <select id="sort-select" aria-label="Trier les produits"><option value="selection">Notre sélection</option><option value="price-low">Prix croissant</option><option value="price-high">Prix décroissant</option><option value="name">Nom</option></select></label></div><p class="shop-result" id="shop-result"></p><div class="product-grid shop-grid" id="shop-grid"></div><p class="empty-state" id="empty-state" hidden>Aucune pièce trouvée. Essayez une autre recherche.</p></section>';
  function paint() {
    let list = products.filter(product => (state.category === 'Tout' || product.category === state.category) && (product.name + ' ' + product.category + ' ' + product.type + ' ' + product.color).toLowerCase().includes(state.query.toLowerCase()));
    if (state.sort === 'price-low') list = list.sort((a, b) => a.price - b.price);
    if (state.sort === 'price-high') list = list.sort((a, b) => b.price - a.price);
    if (state.sort === 'name') list = list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    document.querySelector('#shop-grid').innerHTML = list.map(productCard).join('');
    document.querySelector('#empty-state').hidden = list.length > 0;
    document.querySelector('#shop-result').textContent = list.length + (list.length > 1 ? ' pièces dans la collection' : ' pièce dans la collection') + (state.query ? ' · recherche « ' + state.query + ' »' : '');
    document.querySelectorAll('[data-category]').forEach(button => button.classList.toggle('active', button.dataset.category === state.category));
  }
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    state.category = button.dataset.category;
    paint();
  }));
  document.querySelector('#sort-select').addEventListener('change', event => { state.sort = event.target.value; paint(); });
  paint();
}

function renderProduct() {
  setTitle('Une pièce');
  const product = products.find(item => item.id === new URLSearchParams(window.location.search).get('id'));
  if (!product) {
    main.innerHTML = '<section class="not-found"><p class="eyebrow">OUPS, CETTE PIÈCE N’EST PLUS LÀ</p><h1>On a dû la ranger ailleurs.</h1><a class="button button-navy" href="/boutique.html">Retourner à la boutique <span>↗</span></a></section>';
    return;
  }
  const related = products.filter(item => item.category === product.category && item.id !== product.id).slice(0, 3);
  main.innerHTML =
    '<section class="detail-page"><p class="breadcrumbs"><a href="/index.html">Accueil</a><span>›</span><a href="/boutique.html">Boutique</a><span>›</span>' + escapeHtml(product.name) + '</p><div class="detail-layout"><div class="detail-image"><img src="' + imageUrl(product.image, 1500) + '" alt="' + escapeHtml(product.name) + '"><span class="detail-image-label">UNE PIÈCE À VIVRE · N° ' + String(products.indexOf(product) + 1).padStart(2, '0') + '</span></div><div class="detail-copy"><p class="eyebrow">' + escapeHtml(product.category) + ' · ' + escapeHtml(product.color) + '</p><h1>' + escapeHtml(product.name) + '</h1><p class="detail-type">' + escapeHtml(product.type) + '</p><p class="detail-price">' + money(product.price) + '</p><p class="detail-description">' + escapeHtml(product.description) + '</p><div class="detail-controls"><label for="product-quantity">Quantité</label><div class="quantity-control"><button type="button" data-product-qty="-1" aria-label="Retirer une unité">−</button><input id="product-quantity" value="1" inputmode="numeric" aria-label="Quantité" readonly><button type="button" data-product-qty="1" aria-label="Ajouter une unité">＋</button></div></div><button class="button button-navy add-detail">Ajouter au panier <span>↗</span></button><p class="delivery-note">✳ Livraison offerte dès 150 € d’achat · Retour sous 30 jours</p><div class="detail-extra"><details open><summary>La pièce et ses matières <span>＋</span></summary><p>' + escapeHtml(product.description) + '</p></details><details><summary>Livraison & retours <span>＋</span></summary><p>Les frais sont estimés dans le panier. Le parcours de commande présenté ici est une démonstration et n’organise pas de livraison réelle.</p></details></div></div></div><div class="detail-story"><p class="eyebrow">À RETROUVER AUTOUR DE LA TABLE</p><h2>Les pièces qui vont <em>ensemble.</em></h2><div class="product-grid">' + related.map(productCard).join('') + '</div></div></section>';
  document.querySelectorAll('[data-product-qty]').forEach(button => button.addEventListener('click', () => {
    const input = document.querySelector('#product-quantity');
    input.value = Math.max(1, Number(input.value) + Number(button.dataset.productQty));
  }));
  document.querySelector('.add-detail').addEventListener('click', () => addToCart(product.id, Number(document.querySelector('#product-quantity').value)));
}

function renderAbout() {
  setTitle('Notre maison');
  main.innerHTML =
    '<section class="about-page"><div class="about-hero"><div><p class="eyebrow">LA MAISON, CÔTÉ SOLEIL</p><h1>Vivre la cuisine <em>en grand.</em></h1><p>Nous croyons aux maisons habitées, aux tablées généreuses et aux objets qui vieillissent joliment.</p></div><img src="' + imageUrl('photo-1600210492486-724fe5c67fb0', 1500) + '" alt="Maison chaleureuse aux matières naturelles"></div><div class="about-intro"><span class="about-number">01 / 03</span><div><p class="eyebrow">UNE HISTOIRE DE MAISON</p><h2>1987, un marché, <em>une idée.</em></h2><p>Un matin de printemps, notre fondatrice a acheté trois chaises à un artisan du village voisin. Elle les a posées dans la cuisine, autour d’une grande table de ferme. Les amis sont arrivés, puis les amis des amis. Maison Mistral est née de cette cuisine ouverte.</p></div></div><div class="about-values"><article><span>✳ 01</span><h3>Des matières franches</h3><p>Du bois qui garde son grain, du lin qui prend la lumière et de la céramique qui ne se ressemble jamais tout à fait.</p></article><article><span>✳ 02</span><h3>Des gestes patients</h3><p>Nous travaillons avec de petits ateliers où l’on connaît les prénoms, les outils et la façon de finir une arête.</p></article><article><span>✳ 03</span><h3>Des objets habités</h3><p>Une pièce n’est pas faite pour rester intacte. Elle est là pour servir, se patiner, déménager et revenir autour de la table.</p></article></div><section class="materials" id="matieres"><div class="materials-photo"><img src="' + imageUrl('photo-1600607687939-ce8a6c25118c', 1200) + '" alt="Bois et matières naturelles dans une cuisine" loading="lazy"></div><div><p class="eyebrow">02 / LES MATIÈRES</p><h2>Le beau se patine <em>avec nous.</em></h2><p>Nous préférons les matériaux que l’on peut réparer et les finitions qui s’améliorent avec le temps. Le chêne, le frêne, la laine, le lin et l’argile sont choisis pour leur présence autant que pour leur usage.</p><a class="underlined-link" href="/boutique.html">Voir les pièces ↗</a></div></section><div class="about-signoff"><span>✳</span><p>La porte est ouverte.<br><em>La table aussi.</em></p><a class="button button-cream" href="/boutique.html">Découvrir la boutique <span>↗</span></a></div></section>';
}

function shippingCost(method = checkoutData().delivery) {
  if (method === 'room') return 79;
  return subtotal() >= 150 ? 0 : 14;
}

function cartRows() {
  if (!cart.size) return '<div class="empty-cart"><span>✳</span><h2>Il manque quelque chose à la table.</h2><p>Votre panier est encore vide.</p><a class="button button-navy" href="/boutique.html">Découvrir nos pièces <span>↗</span></a></div>';
  return [...cart.values()].map(row =>
    '<article class="cart-line"><a href="/piece.html?id=' + encodeURIComponent(row.product.id) + '"><img src="' + imageUrl(row.product.image, 400) + '" alt="' + escapeHtml(row.product.name) + '"></a><div class="cart-line-copy"><span>' + escapeHtml(row.product.category) + ' · ' + escapeHtml(row.product.color) + '</span><h2><a href="/piece.html?id=' + encodeURIComponent(row.product.id) + '">' + escapeHtml(row.product.name) + '</a></h2><p>' + escapeHtml(row.product.type) + '</p><div class="quantity-control"><button data-qty="' + row.product.id + '" data-change="-1" aria-label="Retirer une unité">−</button><span>' + row.quantity + '</span><button data-qty="' + row.product.id + '" data-change="1" aria-label="Ajouter une unité">＋</button></div></div><strong class="line-price">' + money(row.product.price * row.quantity) + '</strong><button class="remove-item" data-remove="' + row.product.id + '" aria-label="Supprimer ' + escapeHtml(row.product.name) + '">×</button></article>'
  ).join('');
}

function summaryBox(buttonUrl, buttonText, buttonClass = 'button button-navy') {
  const total = subtotal();
  const delivery = page === 'panier' ? (total >= 150 ? 0 : 14) : shippingCost();
  const deliveryLabel = delivery ? money(delivery) : 'Offerte';
  return '<aside class="order-summary"><p class="eyebrow">LE PETIT RÉCAP</p><h2>Ça prend forme.</h2><div class="summary-row"><span>Sous-total</span><strong>' + money(total) + '</strong></div><div class="summary-row"><span>Livraison estimée</span><strong>' + deliveryLabel + '</strong></div><p class="summary-note">Les montants sont indicatifs pour cette démonstration.</p><div class="summary-row summary-total"><span>Total estimé</span><strong>' + money(total + delivery) + '</strong></div>' + (buttonUrl && cart.size ? '<a class="' + buttonClass + ' summary-cta" href="' + buttonUrl + '">' + buttonText + ' <span>↗</span></a>' : '') + '<a class="summary-back" href="/boutique.html">Continuer mes emplettes ↗</a></aside>';
}

function renderBag() {
  setTitle('Votre panier');
  main.innerHTML = '<section class="cart-page"><div class="page-heading"><div><p class="eyebrow">AVANT DE PASSER À TABLE</p><h1>Votre <em>panier.</em></h1></div><span class="page-index">PANIER · ' + [...cart.values()].reduce((sum, row) => sum + row.quantity, 0) + '</span></div><div class="cart-layout"><div class="cart-lines" id="cart-lines">' + cartRows() + '</div>' + (cart.size ? summaryBox('/adresse.html', 'Passer à la commande') : '') + '</div></section>';
}

function checkoutSteps() {
  const order = ['adresse', 'livraison', 'paiement', 'recapitulatif'];
  const labels = ['Coordonnées', 'Livraison', 'Paiement', 'Récapitulatif'];
  const current = order.indexOf(page);
  return '<ol class="checkout-steps">' + labels.map((label, index) => '<li class="' + (index === current ? 'active' : index < current ? 'complete' : '') + '"><span>' + (index < current ? '✓' : index + 1) + '</span>' + label + '</li>').join('') + '</ol>';
}

function emptyCheckout() {
  main.innerHTML = '<section class="cart-page empty-checkout"><p class="eyebrow">VOTRE COMMANDE</p><h1>Votre panier est <em>vide.</em></h1><a class="button button-navy" href="/boutique.html">Retour à la boutique <span>↗</span></a></section>';
}

function checkoutFrame(title, subtitle, content) {
  main.innerHTML = '<section class="checkout-page"><div class="page-heading"><div><p class="eyebrow">LA SUITE, TOUT SIMPLEMENT</p><h1>' + title + '</h1><p class="checkout-subtitle">' + subtitle + '</p></div><a class="checkout-exit" href="/panier.html">← Revenir au panier</a></div>' + checkoutSteps() + '<div class="checkout-layout"><section class="checkout-panel">' + content + '</section>' + summaryBox(null, null) + '</div><p class="checkout-disclaimer">Prototype front-end : aucune donnée n’est transmise. Aucun paiement ni achat réel ne sera effectué.</p></section>';
}

function renderAddress() {
  if (!cart.size) return emptyCheckout();
  setTitle('Vos coordonnées');
  const data = checkoutData();
  checkoutFrame('On vous connaît ?', 'Indiquez une adresse pour préparer votre récapitulatif de démonstration.', '<h2>Vos coordonnées</h2><form id="address-form" class="checkout-form"><label>Prénom et nom<input name="name" autocomplete="name" required value="' + escapeHtml(data.name) + '"></label><label>Adresse e-mail<input name="email" type="email" autocomplete="email" required value="' + escapeHtml(data.email) + '"></label><label>Téléphone <span>(facultatif)</span><input name="phone" type="tel" autocomplete="tel" value="' + escapeHtml(data.phone) + '"></label><label>Adresse<input name="address" autocomplete="street-address" required value="' + escapeHtml(data.address) + '"></label><label>Ville<input name="city" autocomplete="address-level2" required value="' + escapeHtml(data.city) + '"></label><label>Code postal<input name="postal" autocomplete="postal-code" required value="' + escapeHtml(data.postal) + '"></label><label class="field-wide">Pays<select name="country" autocomplete="country-name">' + ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada'].map(country => '<option ' + (data.country === country ? 'selected' : '') + '>' + country + '</option>').join('') + '</select></label><div class="checkout-actions"><a class="text-link" href="/panier.html">← Retour au panier</a><button class="button button-navy" type="submit">Choisir la livraison <span>↗</span></button></div></form>');
  document.querySelector('#address-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveCheckout({ ...data, name: form.get('name'), email: form.get('email'), phone: form.get('phone'), address: form.get('address'), city: form.get('city'), postal: form.get('postal'), country: form.get('country') });
    window.location.href = '/livraison.html';
  });
}

function renderDelivery() {
  if (!cart.size) return emptyCheckout();
  setTitle('Livraison');
  const data = checkoutData();
  checkoutFrame('Comment vous livrer ?', 'Choisissez l’option qui vous convient. Le tarif reste indicatif.', '<h2>Le bon chemin jusqu’à chez vous.</h2><div class="choice-list"><label class="choice-card"><input type="radio" name="delivery" value="standard" ' + (data.delivery === 'standard' ? 'checked' : '') + '><span><strong>Livraison classique</strong><small>Au pied de l’immeuble · 5 à 7 jours ouvrés · ' + (subtotal() >= 150 ? 'offerte' : money(14)) + '</small></span><b>' + (subtotal() >= 150 ? 'Offerte' : money(14)) + '</b></label><label class="choice-card"><input type="radio" name="delivery" value="room" ' + (data.delivery === 'room' ? 'checked' : '') + '><span><strong>Jusque dans votre pièce</strong><small>Livraison avec installation · estimation seulement</small></span><b>' + money(79) + '</b></label></div><div class="checkout-actions"><a class="text-link" href="/adresse.html">← Modifier mes coordonnées</a><a class="button button-navy" href="/paiement.html" id="delivery-next">Choisir un moyen de paiement <span>↗</span></a></div>');
  document.querySelectorAll('input[name="delivery"]').forEach(input => input.addEventListener('change', () => {
    saveCheckout({ ...checkoutData(), delivery: input.value });
    renderDelivery();
  }));
}

function renderPayment() {
  if (!cart.size) return emptyCheckout();
  setTitle('Paiement fictif');
  const data = checkoutData();
  checkoutFrame('Le paiement, en version démo.', 'Aucune carte bancaire ne sera demandée ni débitée.', '<h2>Choisissez un moyen fictif.</h2><div class="demo-banner"><span>ⓘ</span><p><strong>Mode démonstration</strong><br>Ce site n’est relié à aucun prestataire de paiement. N’entrez aucune information bancaire.</p></div><div class="choice-list"><label class="choice-card"><input type="radio" name="payment" value="carte-demo" ' + (data.payment === 'carte-demo' ? 'checked' : '') + '><span><strong>Carte bancaire · simulation</strong><small>Aucune information de carte ne sera demandée</small></span><b>◎</b></label><label class="choice-card"><input type="radio" name="payment" value="livraison-demo" ' + (data.payment === 'livraison-demo' ? 'checked' : '') + '><span><strong>Règlement à la livraison · simulation</strong><small>Le choix est conservé uniquement pour le récapitulatif</small></span><b>↗</b></label></div><div class="checkout-actions"><a class="text-link" href="/livraison.html">← Changer la livraison</a><a class="button button-navy" href="/recapitulatif.html">Continuer au récapitulatif <span>↗</span></a></div>');
  document.querySelectorAll('input[name="payment"]').forEach(input => input.addEventListener('change', () => {
    saveCheckout({ ...checkoutData(), payment: input.value });
    renderPayment();
  }));
}

function renderReview() {
  if (!cart.size) return emptyCheckout();
  setTitle('Récapitulatif');
  const data = checkoutData();
  const delivery = data.delivery === 'room' ? 'Jusque dans votre pièce' : 'Livraison classique';
  const payment = data.payment === 'livraison-demo' ? 'À la livraison · simulation' : 'Carte bancaire · simulation';
  const lines = [...cart.values()].map(row => '<li><span>' + escapeHtml(row.product.name) + ' × ' + row.quantity + '</span><strong>' + money(row.product.price * row.quantity) + '</strong></li>').join('');
  const addressCard = '<div class="review-info"><span>COORDONNÉES</span><p><strong>' + escapeHtml(data.name) + '</strong><br>' + escapeHtml(data.email) + '<br>' + escapeHtml(data.address) + '<br>' + escapeHtml(data.postal) + ' ' + escapeHtml(data.city) + '<br>' + escapeHtml(data.country) + '</p><a href="/adresse.html">Modifier</a></div>';
  const shippingCard = '<div class="review-info"><span>LIVRAISON</span><p>' + delivery + '<br>' + (data.delivery === 'room' ? money(79) : subtotal() >= 150 ? 'Offerte' : money(14)) + '</p><a href="/livraison.html">Modifier</a></div>';
  const paymentCard = '<div class="review-info"><span>PAIEMENT FICTIF</span><p>' + payment + '<br><small>Aucun paiement réel ne sera effectué.</small></p><a href="/paiement.html">Modifier</a></div>';
  checkoutFrame('On vérifie ensemble ?', 'Un dernier regard avant la confirmation de démonstration.', '<h2>Tout est bien à sa place.</h2>' + addressCard + shippingCard + paymentCard + '<div class="review-products"><p class="eyebrow">DANS LE PANIER</p><ul>' + lines + '</ul><div class="summary-row"><span>Sous-total</span><strong>' + money(subtotal()) + '</strong></div><div class="summary-row"><span>Livraison estimée</span><strong>' + (shippingCost() ? money(shippingCost()) : 'Offerte') + '</strong></div><div class="summary-row summary-total"><span>Total estimé</span><strong>' + money(subtotal() + shippingCost()) + '</strong></div></div><div class="demo-banner review-warning"><span>✳</span><p><strong>Commande fictive uniquement.</strong><br>Le bouton suivant crée une confirmation locale, sans paiement, envoi d’e-mail ni commande réelle.</p></div><div class="checkout-actions"><a class="text-link" href="/paiement.html">← Retour au paiement</a><button class="button button-orange" id="place-demo-order" type="button">Confirmer la démo <span>↗</span></button></div>');
  document.querySelector('#place-demo-order').addEventListener('click', () => {
    const reference = 'MM-' + Date.now().toString(36).toUpperCase();
    const receipt = { reference, name: data.name, email: data.email, items: [...cart.values()].map(row => ({ name: row.product.name, quantity: row.quantity, price: row.product.price })), subtotal: subtotal(), delivery: shippingCost(), total: subtotal() + shippingCost() };
    writeJson(sessionStorage, receiptKey, receipt);
    cart.clear();
    persistCart();
    window.location.href = '/confirmation.html?ref=' + encodeURIComponent(reference);
  });
}

function renderConfirmation() {
  setTitle('Confirmation de démonstration');
  const expected = new URLSearchParams(window.location.search).get('ref');
  const receipt = readJson(sessionStorage, receiptKey, null);
  if (!receipt || receipt.reference !== expected) {
    main.innerHTML = '<section class="confirmation-page"><span class="confirmation-star">✳</span><p class="eyebrow">CONFIRMATION INTROUVABLE</p><h1>Pas de commande à afficher.</h1><p>Le récapitulatif est conservé temporairement dans cette session de démonstration.</p><a class="button button-navy" href="/boutique.html">Revenir à la boutique <span>↗</span></a></section>';
    return;
  }
  main.innerHTML = '<section class="confirmation-page"><span class="confirmation-star">✳</span><p class="eyebrow">MERCI ' + escapeHtml(receipt.name.split(' ')[0]).toUpperCase() + ' · COMMANDE FICTIVE</p><h1>La table est <em>dressée.</em></h1><p>Votre confirmation de démonstration est prête. Aucun paiement n’a été effectué et aucune commande réelle n’a été transmise.</p><div class="receipt"><div><span>RÉFÉRENCE DE DÉMO</span><strong>' + escapeHtml(receipt.reference) + '</strong></div><ul>' + receipt.items.map(item => '<li><span>' + escapeHtml(item.name) + ' × ' + item.quantity + '</span><strong>' + money(item.price * item.quantity) + '</strong></li>').join('') + '</ul><div class="summary-row"><span>Sous-total</span><strong>' + money(receipt.subtotal) + '</strong></div><div class="summary-row"><span>Livraison estimée</span><strong>' + (receipt.delivery ? money(receipt.delivery) : 'Offerte') + '</strong></div><div class="summary-row summary-total"><span>Total fictif</span><strong>' + money(receipt.total) + '</strong></div></div><a class="button button-navy" href="/boutique.html">Continuer la visite <span>↗</span></a></section>';
}

main.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  const favorite = event.target.closest('[data-favorite]');
  const quantity = event.target.closest('[data-qty]');
  const remove = event.target.closest('[data-remove]');
  if (add) addToCart(add.dataset.add);
  if (favorite) {
    const id = favorite.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    writeJson(localStorage, favoriteKey, [...favorites]);
    favorite.textContent = favorites.has(id) ? '♥' : '♡';
    favorite.classList.toggle('is-saved', favorites.has(id));
    showToast(favorites.has(id) ? 'Cette pièce est dans vos favoris.' : 'Pièce retirée des favoris.');
  }
  if (quantity) {
    const row = cart.get(quantity.dataset.qty);
    if (!row) return;
    const next = row.quantity + Number(quantity.dataset.change);
    next > 0 ? cart.set(quantity.dataset.qty, { ...row, quantity: next }) : cart.delete(quantity.dataset.qty);
    persistCart();
    renderBag();
  }
  if (remove) {
    cart.delete(remove.dataset.remove);
    persistCart();
    renderBag();
  }
});

renderChrome();
if (page === 'accueil') renderHome();
if (page === 'boutique') renderShop();
if (page === 'piece') renderProduct();
if (page === 'maison') renderAbout();
if (page === 'panier') renderBag();
if (page === 'adresse') renderAddress();
if (page === 'livraison') renderDelivery();
if (page === 'paiement') renderPayment();
if (page === 'recapitulatif') renderReview();
if (page === 'confirmation') renderConfirmation();
