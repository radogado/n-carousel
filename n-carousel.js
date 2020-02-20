let getScroll = el => { return el === window ? {x: el.scrollX, y: el.scrollY} : {x: el.scrollLeft, y: el.scrollTop} };

let observersOn = el => {
	
	if (typeof ResizeObserver === 'function') {
	
		carouselResizeObserver.observe(el);
		
	} else {

		window.addEventListener('resize', resizeObserverFallback);

	}
	el.addEventListener('scroll', scrollStopped);
	
}

let observersOff = el => {
	
	if (typeof ResizeObserver === 'function') {
	
		carouselResizeObserver.unobserve(el);
		
	} else {

		window.removeEventListener('resize', resizeObserverFallback);

	}
	el.removeEventListener('scroll', scrollStopped);

}

let scrollBy = (el, distanceX, distanceY, duration = 500) => {

	return new Promise(function(resolve, reject) {
	
		if (!!el.dataset.sliding) {
			
			resolve('Already animating'); // Already animating
			
		}
	
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			
			el.scrollTo(getScroll(el).x + distanceX, getScroll(el).y + distanceY)
			return;

		}

		el.dataset.sliding = true;
	
	    var initialX = getScroll(el).x;
	    var initialY = getScroll(el).y;
	    var x = initialX + distanceX;
	    var y = initialY + distanceY;
	    var baseX = (initialX + x) * 0.5;
	    var baseY = (initialY + y) * 0.5;
	    var differenceX = initialX - baseX;
	    var differenceY = initialY - baseY;
	    var startTime = performance.now();
	
	    function step() {
	        var normalizedTime = (performance.now() - startTime) / duration;
	        if (normalizedTime > 1) normalizedTime = 1;
	
	        el.scrollTo(baseX + differenceX * Math.cos(normalizedTime * Math.PI), baseY + differenceY * Math.cos(normalizedTime * Math.PI));
	        if (normalizedTime < 1) {
		        
		        window.requestAnimationFrame(step);
		        
		    } else {
			    
				delete el.dataset.sliding;
				
				if (!navigator.userAgent.match('Firefox')) { // Safari bug fix, which breaks Firefox
				
					el.scrollTo(x, y);
				
				}

				resolve(el);
						    
		    }
	    }
	    window.requestAnimationFrame(step);
	
	});

};

let paddingX = el => {
	
	return parseInt(getComputedStyle(el).paddingInlineStart)*2;

}

let paddingY = el => {

	return parseInt(getComputedStyle(el).paddingBlockStart)*2;

}

let getControl = (carousel, control) => {
	
	for (let el of carousel.children) {
		
		if (el.matches(control)) {
			
			return el;

		}
		
		if (!el.matches('.n-carousel--content') && el.querySelector(control)) {
			
			return el.querySelector(control);
			
		}
		
	}
	
	return false;
	
}

let updateCarousel = el => {

	console.log('updateCarousel', el);

	let transition = false;
	
	observersOff(el);
	
	el.dataset.x = Math.round(el.scrollLeft / (el.offsetWidth - paddingX(el)));
	el.dataset.y = Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)));
	
	let active = el.classList.contains('n-carousel__vertical') ? el.dataset.y : el.dataset.x;

	if (!el.parentNode.dataset.ready && el.classList.contains('n-carousel__auto')) {
		
		el.style.height = `${el.offsetHeight - paddingY(el)}px`;
	
	}

	if (!!el.parentNode.dataset.ready && el.classList.contains('n-carousel__auto')) {
	
		if (el.classList.contains('n-carousel__vertical')) {
			
/*
			el.children[active].style.height = `auto`;
			el.style.setProperty('--height', `${el.children[active].scrollHeight}px`);
			el.children[active].style.height = ``;
			el.style.scrollSnapType = 'none';
			el.scrollTo(0, el.children[active].scrollHeight * active);
			el.style.scrollSnapType = '';
*/
			el.children[active].style.height = 'auto';
			el.style.setProperty('--height', `${el.children[active].scrollHeight}px`);
			el.children[active].style.height = '';
			el.scrollTo(0, el.children[active].scrollHeight * active);
			
	/* 		el.scrollTo(0, 320); */
			
/* 			if (!!el.parentNode.dataset.ready) { // Scroll by the real  */
			
				
/* 			} */
			
		}

		if (getComputedStyle(el).transition.match('none') || el.offsetHeight === el.children[active].scrollHeight) { // Reduced motion or no change in height
			
			observersOn(el);
			
		}
		
		el.style.height = `${el.children[active].scrollHeight}px`;
		
	} else {
		
		observersOn(el);
		
	}

	if (getControl(el, '[data-active]')) {

		delete getControl(el, '[data-active]').dataset.active;
	
	}
	
	el.children[active].dataset.active = true;

	// Fix buttons.
	let wrapper = el.closest('.n-carousel')
	let index = getControl(wrapper, '.n-carousel--index');
	if (index.querySelector('[disabled]')) {
		
		index.querySelector('[disabled]').disabled = false;
		
	}
	index.children[active].disabled = true;
	
	if (!el.classList.contains('n-carousel__vertical')) {
		
		getControl(wrapper, '.n-carousel--previous').disabled = !el.scrollLeft ? true : false;;
		getControl(wrapper, '.n-carousel--next').disabled = (el.scrollWidth - el.offsetWidth - el.scrollLeft < el.offsetWidth - paddingX(el)) ? true : false;
	
	} else {
		
		getControl(wrapper, '.n-carousel--previous').disabled = !el.scrollTop ? true : false;;
		getControl(wrapper, '.n-carousel--next').disabled = (el.scrollHeight - el.offsetHeight - el.scrollTop < el.offsetHeight - paddingY(el)) ? true : false;
	
	}
	
};

// Setup isScrolling variable
var isScrolling;
var lastScrollX;
var lastScrollY;
var isResizing;

let scrollStopped = e => {

	// Clear our timeout throughout the scroll
	clearTimeout( isScrolling );
	lastScrollX = e.target.scrollLeft;
	lastScrollY = e.target.scrollTop;

	// Set a timeout to run after scrolling ends
	isScrolling = setTimeout(function() {
		
		if (lastScrollX === e.target.scrollLeft && lastScrollY === e.target.scrollTop) {
		
			console.log( 'Scrolling has stopped.', e.target, e.target.scrollLeft, lastScrollX, e.target.scrollTop, lastScrollY);
			updateCarousel(e.target);
			// Run the callback
		
		}

	}, 200); // 66 was too low and got double results, confusing the auto resizing on scroll end.

};

let slide = (el, offsetX, offsetY) => {
	
	if (!el.dataset.sliding) {
		
		scrollBy(el, offsetX, offsetY).then(response => {
			
// 			updateCarousel(el); // Handled by scroll end
	
		});
	
	}
	
};

let slideNext = (el) => {

	slide(el, el.offsetWidth - paddingX(el), 0);

};

let slidePrevious = (el) => {

	slide(el, -1*(el.offsetWidth - paddingX(el)), 0);

};

let slideTo = (el, index) => {

	if (!el.classList.contains('n-carousel__vertical')) {

		slide(el, (el.offsetWidth - paddingX(el)) * index - el.scrollLeft, 0);
	
	} else {
		
		slide(el, 0, (el.offsetHeight - paddingY(el)) * index - el.scrollTop);
		
	}
	
};

let resizeObserverFallback = e => {
	
	document.querySelectorAll('.n-carousel--content').forEach(el => {
			
			// Clear our timeout throughout the scroll
			clearTimeout( isResizing );
		
			// Set a timeout to run after scrolling ends
			isResizing = setTimeout(function() {
				
				el.scrollTo(el.offsetWidth*el.dataset.x - paddingX(el), el.offsetHeight*el.dataset.y + paddingY(el));
/*
				el.style.height = `${el.children[el.dataset.x].scrollHeight}px`;
			
*/
				// Run the callback
				console.log( 'Resizing has stopped.', e.target);
		
			}, 66);

		});

};

if (typeof ResizeObserver === 'function') {

	var carouselResizeObserver = new ResizeObserver(entries => {

		entries.forEach(e => {
			
			let el = e.target;
			console.log('Resized', el, e.contentRect.width, e.contentRect.height);
			el.scrollTo(el.offsetWidth*el.dataset.x, el.offsetHeight*el.dataset.y);
// 				el.style.height = `${el.children[el.dataset.x].scrollHeight}px`;
			
		});
	
	});

}
	
let carouselKeys = e => {
	
	let keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
	let keys_vertical = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
	let keys_2d = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
	
	console.log(e);
	let el = e.target;
	if (el.classList.contains('n-carousel--content') && keys.includes(e.key)) { // Capture relevant keys
		
		e.preventDefault();
		switch (e.key) {
			
			case 'ArrowLeft': {
				
				slidePrevious(el);
				break;
			
			}; 

			case 'ArrowRight': {
				
				slideNext(el);
				break;
			
			}; 
			
			case 'ArrowUp': {
				
				slidePrevious(el);
				break;
			
			}; 

			case 'ArrowDown': {
				
				slideNext(el);
				break;
			
			}; 
			
			case 'Home': {
				
				slideTo(el, 0);
				break;
			
			}; 
			
			case 'End': {
			
				slideTo(el, el.children.length-1);
				break;
			
			}; 
			
		}
		
	}

};
		
document.querySelectorAll('.n-carousel:not([data-ready])').forEach(el => {

	// To do: get the buttons properly, minding embedded carousels

	getControl(el, '.n-carousel--previous').onclick = e => {
		
		slidePrevious(e.target.closest('.n-carousel').querySelector('.n-carousel--content'));
	
	};

	getControl(el, '.n-carousel--next').onclick = e => {
		
		slideNext(e.target.closest('.n-carousel').querySelector('.n-carousel--content'));
	
	};

	getControl(el, '.n-carousel--index').onclick = e => {
		
		let el = e.target;
		if (el.tagName === 'BUTTON') {
	
			slideTo(el.closest('.n-carousel').querySelector('.n-carousel--content'), [...el.parentNode.children].indexOf(el));

		}

	};

	el.querySelector('.n-carousel--content').onkeydown = carouselKeys;
			
	let content = el.querySelector(':scope > .n-carousel--content');
	content.tabIndex = 0;

	updateCarousel(content);

	content.addEventListener('transitionend', e => {
		
		console.log(e);
		let el = e.target;
		
		observersOn(el);
		
	});

	el.dataset.ready = true;

});
