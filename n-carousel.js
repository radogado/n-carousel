let getScroll = el => { return el === window ? {x: el.scrollX, y: el.scrollY} : {x: el.scrollLeft, y: el.scrollTop} };

let observersOn = el => {
	
	el.addEventListener('scroll', scrollStopped);

	if (typeof ResizeObserver === 'function') {
	
		carouselResizeObserver.observe(el);
		
	} else {

		window.addEventListener('resize', resizeObserverFallback);

	}
	delete el.dataset.sliding;
	console.log('Observers On');	

}

let observersOff = el => {
	
	el.removeEventListener('scroll', scrollStopped);

	if (typeof ResizeObserver === 'function') {
	
		carouselResizeObserver.unobserve(el);
		
	} else {

		window.removeEventListener('resize', resizeObserverFallback);

	}

	console.log('Observers Off');	

}

let scrollBy = (el, distanceX, distanceY, duration = 300) => {

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
				
				if (!navigator.userAgent.match('Firefox')) { // Safari bug fix, which breaks Firefox
				
// 					el.scrollTo(x, y);
				
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

let updateCarousel = el => { // Called on init and scroll end

	console.log('updateCarousel', el, el.scrollLeft);

	let transition = false;
	
	observersOff(el);
	
	el.dataset.x = Math.round(el.scrollLeft / (el.offsetWidth - paddingX(el)));
	el.dataset.y = Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)));
	
	let current_active = el.querySelector(':scope > [data-active]');
	
	if (current_active) {

		delete current_active.dataset.active;
	
	}
	
	let active = el.classList.contains('n-carousel__vertical') ? el.dataset.y : el.dataset.x;
	
	if (active >= el.children.length) {
		
		active = el.children.length - 1;

	}

	if (!el.parentNode.dataset.ready && el.classList.contains('n-carousel__auto')) {
		
		el.style.height = `${el.offsetHeight - paddingY(el)}px`;
	
	}

	if (!!el.parentNode.dataset.ready && el.classList.contains('n-carousel__auto')) {
	
		let old_height = el.children[active].scrollHeight;
		let new_height = 0;

		if (el.classList.contains('n-carousel__vertical')) {
			
			el.children[active].style.height = 'auto';
			new_height = el.children[active].scrollHeight;
			el.style.setProperty('--height', `${new_height}px`);
			el.children[active].style.height = `${old_height}px`;
			
		} else {
			
			new_height = el.children[active].scrollHeight;
			
		}

		el.style.height = `${new_height}px`;
		
		if (getComputedStyle(el).transition.match('none') || el.offsetHeight === new_height) { // Reduced motion or no change in height
			
			observersOn(el);
			
		}
		
	} else {
		
		observersOn(el);
		
	}

	el.children[active].dataset.active = true;

	// Fix buttons.
	let wrapper = el.closest('.n-carousel')
	let index = getControl(wrapper, '.n-carousel--index');
	if (index.querySelector('[disabled]')) {
		
		index.querySelector('[disabled]').disabled = false;
		
	}
	index.children[active].disabled = true;
	
	getControl(wrapper, '.n-carousel--previous').disabled = active === '0' ? true : false;
	getControl(wrapper, '.n-carousel--next').disabled = (active >= el.children.length-1) ? true : false;

	delete el.dataset.sliding;
	
};

// Setup isScrolling variable
var isScrolling;
var lastScrollX;
var lastScrollY;
var isResizing;

let scrollStopped = e => {
return;
	let el = e.target;
	
	if (!!el.dataset.sliding) {
		
		return;

	}

	// Clear our timeout throughout the scroll
	clearTimeout( isScrolling );
	lastScrollX = el.scrollLeft;
	lastScrollY = el.scrollTop;

	// Set a timeout to run after scrolling ends
	isScrolling = setTimeout(function() {
		
		if (lastScrollX === el.scrollLeft && lastScrollY === el.scrollTop) {
		
			// Run end code here when sliding by swipe/scroll Run end code at slide() when sliding by keyboard/butons. 

			console.log( 'Scrolling has stopped.', el, el.scrollLeft, lastScrollX, el.scrollTop, lastScrollY);
			updateCarousel(el);
			// Run the callback
		
		}

	}, 200); // 66 was too low and got double results, confusing the auto resizing on scroll end.

};

let slide = (el, offsetX, offsetY) => {
	
	observersOff(el);
	
	if (!el.dataset.sliding) {
		
/*
		getComputedStyle(el);
		el.style.scrollSnapType = 'none';
		[...el.children].forEach(el => {
			
			el.style.scrollSnapAlign = 'none';
			
		});
		getComputedStyle(el);
*/
		
		scrollBy(el, offsetX, offsetY).then(response => {
			
			// Run end code here when sliding by keyboard/butons. Run end code at scrollStopped when sliding by swipe/scroll
			
			delete el.dataset.sliding;
/*
		getComputedStyle(el);
		el.style.scrollSnapType = '';
		[...el.children].forEach(el => {
			
			el.style.scrollSnapAlign = '';
			
		});
		getComputedStyle(el);
*/
			updateCarousel(el);
	
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
return;	
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
/*
			console.log('Resized', el, e.contentRect.width, e.contentRect.height);
			el.scrollTo(el.offsetWidth*el.dataset.x, el.offsetHeight*el.dataset.y);
*/
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
		
		getControl(el, '[data-active]').style.height = '';
		setTimeout(() => { observersOn(el); }, 200);
		
	});

	el.dataset.ready = true;
	el.addEventListener('scroll', scrollStopped);

});
