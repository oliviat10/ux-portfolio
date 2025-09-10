/*
	Phantom by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ '361px',   '480px'  ],
			xxsmall:  [ null,      '360px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Touch?
		if (browser.mobile)
			$body.addClass('is-touch');

	// Forms.
		var $form = $('form');

		// Auto-resizing textareas.
			$form.find('textarea').each(function() {

				var $this = $(this),
					$wrapper = $('<div class="textarea-wrapper"></div>'),
					$submits = $this.find('input[type="submit"]');

				$this
					.wrap($wrapper)
					.attr('rows', 1)
					.css('overflow', 'hidden')
					.css('resize', 'none')
					.on('keydown', function(event) {

						if (event.keyCode == 13
						&&	event.ctrlKey) {

							event.preventDefault();
							event.stopPropagation();

							$(this).blur();

						}

					})
					.on('blur focus', function() {
						$this.val($.trim($this.val()));
					})
					.on('input blur focus --init', function() {

						$wrapper
							.css('height', $this.height());

						$this
							.css('height', 'auto')
							.css('height', $this.prop('scrollHeight') + 'px');

					})
					.on('keyup', function(event) {

						if (event.keyCode == 9)
							$this
								.select();

					})
					.triggerHandler('--init');

				// Fix.
					if (browser.name == 'ie'
					||	browser.mobile)
						$this
							.css('max-height', '10em')
							.css('overflow-y', 'auto');

			});


	// Menu.
		var $menu = $('#menu');

		$menu.wrapInner('<div class="inner"></div>');

		$menu._locked = false;

		$menu._lock = function() {

			if ($menu._locked)
				return false;

			$menu._locked = true;

			window.setTimeout(function() {
				$menu._locked = false;
			}, 350);

			return true;

		};

		$menu._show = function() {

			if ($menu._lock())
				$body.addClass('is-menu-visible');

		};

		$menu._hide = function() {

			if ($menu._lock())
				$body.removeClass('is-menu-visible');

		};

		$menu._toggle = function() {

			if ($menu._lock())
				$body.toggleClass('is-menu-visible');

		};

		$menu
			.appendTo($body)
			.on('click', function(event) {
				event.stopPropagation();
			})
			.on('click', 'a', function(event) {

				var href = $(this).attr('href');

				event.preventDefault();
				event.stopPropagation();

				// Hide.
					$menu._hide();

				// Redirect.
					if (href == '#menu')
						return;

					window.setTimeout(function() {
						window.location.href = href;
					}, 350);

			})
			.append('<a class="close" href="#menu">Close</a>');

		$body
			.on('click', 'a[href="#menu"]', function(event) {

				event.stopPropagation();
				event.preventDefault();

				// Toggle.
					$menu._toggle();

			})
			.on('click', function(event) {

				// Hide.
					$menu._hide();

			})
			.on('keydown', function(event) {

				// Hide on escape.
					if (event.keyCode == 27)
						$menu._hide();

			});

})(jQuery);

window.addEventListener('load', () => {
    const faders = document.querySelectorAll('.fade-in-up');

    const reveal = (el, delay) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, delay);
    };

    const observer = new IntersectionObserver((entries) => {
      let delay = 0;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target, delay);
          delay += 150;
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
    });

    // Wait until layout/render is complete
    window.requestAnimationFrame(() => {
      let loadDelay = 0;
      faders.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight;
        if (isVisible) {
          reveal(el, loadDelay);
          loadDelay += 150;
        } else {
          observer.observe(el);
        }
      });
    });

	

  });


 // main.js — first click freezes + brings the exact clicked card (no IDs used)
(() => {
  'use strict';

  // Init after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const containers = Array.from(document.querySelectorAll('.card-container'));
    containers.forEach(setupDeck);
  }

  function setupDeck(container) {
    const cards = Array.from(container.querySelectorAll('.card'));
    if (cards.length === 0) return;

    // State
    let manual = false;
    let frontIdx = Math.min(2, cards.length - 1); // third card starts front-most in auto mode

    // Helpers
    const mod = (n, m) => ((n % m) + m) % m;

    function applyPositions() {
      cards.forEach(c => c.classList.remove('left', 'front', 'right'));
      const leftIdx  = mod(frontIdx - 1, cards.length);
      const rightIdx = mod(frontIdx + 1, cards.length);
      cards[leftIdx].classList.add('left');
      cards[frontIdx].classList.add('front');
      cards[rightIdx].classList.add('right');
    }

    function enterManualMode() {
      if (manual) return;
      manual = true;
      container.classList.add('manual-mode'); // CSS should stop animation
    }

    function setFrontByIndex(i) {
      frontIdx = mod(i, cards.length);
      applyPositions();
    }

    function setFrontByElement(el) {
      if (!el) return;
      const idx = cards.indexOf(el);
      if (idx !== -1) setFrontByIndex(idx);
    }

    // Topmost .card under the pointer (robust even when elements overlap)
    function cardFromPoint(x, y) {
      const els = document.elementsFromPoint(x, y);
      for (const el of els) {
        if (el.classList && el.classList.contains('card')) return el;
      }
      return null;
    }

    // ---- First click: freeze + promote the exact clicked card ----
    container.addEventListener('click', (e) => {
      if (manual) return; // only on first click

      enterManualMode();

      // Find the visible card under the pointer
      const targetCard = cardFromPoint(e.clientX, e.clientY) || e.target.closest('.card');
      if (targetCard) {
        setFrontByElement(targetCard);
      } else {
        // Fallback: keep current front poses
        applyPositions();
      }
    }, { once: true });

    // ---- After manual mode: clicking any visible card brings THAT card to front ----
    container.addEventListener('click', (e) => {
      if (!manual) return;
      const targetCard = cardFromPoint(e.clientX, e.clientY) || e.target.closest('.card');
      if (!targetCard) return;
      setFrontByElement(targetCard);
    });

    // keyboard navigation in manual mode
    window.addEventListener('keydown', (e) => {
      if (!manual) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setFrontByIndex(frontIdx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFrontByIndex(frontIdx + 1); }
    });

    // swipe navigation in manual mode
    let touchStartX = null;
    container.addEventListener('touchstart', (e) => {
      if (!manual) return;
      touchStartX = e.changedTouches?.[0]?.clientX ?? null;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!manual) return;
      if (touchStartX == null) return;
      const x = e.changedTouches?.[0]?.clientX ?? touchStartX;
      const dx = x - touchStartX;
      const threshold = 40;
      if (dx > threshold) setFrontByIndex(frontIdx - 1);
      else if (dx < -threshold) setFrontByIndex(frontIdx + 1);
      touchStartX = null;
    }, { passive: true });
  }
})();