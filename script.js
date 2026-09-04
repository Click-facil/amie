(() => {
// header solidifica ao rolar
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

// parallax discreto no fundo do hero
const hero = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let parallaxFrame = null;
function updateHeroParallax(){
  parallaxFrame = null;
  if (reduceMotion || !hero) return;
  const progress = Math.max(-1, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight));
  hero.style.setProperty('--hero-shift', `${progress * 34}px`);
}
window.addEventListener('scroll', () => {
  if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateHeroParallax);
}, { passive:true });
updateHeroParallax();

// menu mobile
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
menuBtn.addEventListener('click', () => mobileNav.classList.toggle('open'));
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));

// hint mobile: abre e fecha o primeiro card automaticamente
(function(){
  if (window.innerWidth > 840) return;
  if (sessionStorage.getItem('amie-hint')) return;
  const firstCard = document.querySelector('.peca-card');
  if (!firstCard) return;
  setTimeout(() => {
    firstCard.classList.add('is-open');
    setTimeout(() => {
      firstCard.classList.remove('is-open');
      sessionStorage.setItem('amie-hint', '1');
    }, 1500);
  }, 1000);
})();

// fade-in ao entrar na tela
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// slide mobile hero
(function(){
  const track = document.getElementById('heroTrack');
  const dots = document.querySelectorAll('#heroDots span');
  const firstSlide = track?.firstElementChild;
  const totalSlides = dots.length;
  let cur = 0;
  let timer;

  if (!track || !firstSlide || totalSlides === 0) return;

  track.appendChild(firstSlide.cloneNode(true));

  function isMobile(){ return window.innerWidth <= 840; }
  function go(n){
    cur = n;
    if(isMobile()) track.style.transform = 'translateX(-'+(100/(totalSlides + 1)*n)+'%)';
    dots.forEach((d,i) => d.classList.toggle('active', i === (n % totalSlides)));
  }

  function restartTimer(){
    clearInterval(timer);
    timer = setInterval(() => go(cur + 1), 3500);
  }

  track.addEventListener('transitionend', event => {
    if (event.propertyName !== 'transform' || cur !== totalSlides) return;
    track.style.transition = 'none';
    cur = 0;
    track.style.transform = 'translateX(0)';
    dots.forEach((dot,index) => dot.classList.toggle('active', index === 0));
    track.offsetHeight;
    track.style.transition = '';
  });

  dots.forEach((dot,index) => dot.addEventListener('click', () => {
    clearInterval(timer);
    track.style.transition = '';
    go(index);
    restartTimer();
  }));

  window.addEventListener('resize', () => {
    if(!isMobile()){
      track.style.transition = 'none';
      track.style.transform = '';
      cur = 0;
      track.offsetHeight;
      track.style.transition = '';
    }
  });

  restartTimer();
})();

// grid de peças
const productCards = Array.from(document.querySelectorAll('.peca-card'));
const togglePiecesBtn = document.getElementById('togglePieces');
let showingAllCards = false;

function getCardsHiddenByDefault() {
  return window.innerWidth <= 840 ? 6 : 8;
}

function renderDots(card) {
  const dotsWrap = card.querySelector('.peca-dots');
  const photos = (card.dataset.photos || '').split(',').map(item => item.trim()).filter(Boolean);

  if (!dotsWrap || photos.length <= 1) {
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
    }
    return;
  }

  const img = card.querySelector('img');
  let currentIndex = card._photoIndex || 0;

  function showPhoto(index) {
    currentIndex = (index + photos.length) % photos.length;
    img.src = photos[currentIndex];
    img.alt = `${card.dataset.name || 'Peça'} - foto ${currentIndex + 1}`;
  }

  const previousButton = document.createElement('button');
  previousButton.type = 'button';
  previousButton.className = 'peca-photo-arrow peca-photo-prev';
  previousButton.setAttribute('aria-label', 'Ver foto anterior');
  previousButton.innerHTML = '&#8249;';
  previousButton.addEventListener('click', (event) => {
    event.stopPropagation();
    showPhoto(currentIndex - 1);
  });

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'peca-photo-arrow peca-photo-next';
  nextButton.setAttribute('aria-label', 'Ver próxima foto');
  nextButton.innerHTML = '&#8250;';
  nextButton.addEventListener('click', (event) => {
    event.stopPropagation();
    showPhoto(currentIndex + 1);
  });

  dotsWrap.innerHTML = '';
  dotsWrap.appendChild(previousButton);
  dotsWrap.appendChild(nextButton);
}

function renderColorOptions(card) {
  const colorButtons = card.querySelectorAll('.peca-color');
  const colorGroups = (card.dataset.colors || '').split('|').reduce((groups, item) => {
    const separatorIndex = item.indexOf(':');
    if (separatorIndex === -1) return groups;

    const name = item.slice(0, separatorIndex);
    const photos = item.slice(separatorIndex + 1).split(',').map(photo => photo.trim()).filter(Boolean);
    groups[name] = photos;
    return groups;
  }, {});

  colorButtons.forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const photos = colorGroups[button.dataset.color];
      if (!photos || photos.length === 0) return;

      card.dataset.photos = photos.join(',');
      card._photoIndex = 0;
      card.querySelector('img').src = photos[0];
      card.querySelector('img').alt = `${card.dataset.name || 'Peça'} - ${button.textContent}`;
      colorButtons.forEach(item => item.classList.toggle('is-active', item === button));
      renderDots(card);
    });
  });
}

function syncProductCards() {
  const cardsHiddenByDefault = getCardsHiddenByDefault();

  productCards.forEach((card, index) => {
    const shouldHide = !showingAllCards && index >= cardsHiddenByDefault;
    card.classList.toggle('is-hidden', shouldHide);
  });

  if (togglePiecesBtn) {
    togglePiecesBtn.textContent = showingAllCards ? 'Ver menos' : 'Ver todas';
  }
}

productCards.forEach(card => {
  renderDots(card);
  renderColorOptions(card);
  card.addEventListener('click', (event) => {
    if (window.innerWidth > 840) return;
    if (event.target.closest('button')) return;

    event.stopPropagation();

    const wasOpen = card.classList.contains('is-open');
    productCards.forEach(item => {
      if (item !== card) item.classList.remove('is-open');
    });

    card.classList.toggle('is-open', !wasOpen);
  });
});

document.addEventListener('click', (event) => {
  if (window.innerWidth > 840) return;

  if (!event.target.closest('.peca-card')) {
    productCards.forEach(card => card.classList.remove('is-open'));
  }
});

if (togglePiecesBtn) {
  togglePiecesBtn.addEventListener('click', () => {
    showingAllCards = !showingAllCards;
    syncProductCards();
  });
}

syncProductCards();
window.addEventListener('resize', () => {
  if (!showingAllCards) syncProductCards();
});

})();