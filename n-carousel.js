let getScroll = el => { return el === window ? {x: el.scrollX, y: el.scrollY} : {x: el.scrollLeft, y: el.scrollTop} };

let observersOn = el => {

	if (typeof ResizeObserver === 'function') {
	
		carouselResizeObserver.observe(el);
		
	} else {

		window.addEventListener('resize', resizeObserverFallback);

	}

	console.log('observersOn', el.scrollLeft, el.scrollTop);
	let left = el.scrollLeft;
	let top = el.scrollTop;
	

// 	el.scrollTo(left, top); // Because Safari reverts to 0 scroll upon activating Scroll Snap Points 
	delete el.dataset.sliding;
	el.addEventListener('scroll', scrollStopped);
// 	el.scrollTo(left, top);
// 	console.log('Observers On');	

}

let observersOff = el => {
	
	if (typeof ResizeObserver === 'function') {
	
		carouselResizeObserver.unobserve(el);
		
	} else {

		window.removeEventListener('resize', resizeObserverFallback);

	}

// 	console.log('Observers Off');	

}

let scrollBy = (el, distanceX, distanceY, new_height, new_slide) => {

console.log('Srolling by', distanceY, ' from ', el.scrollTop);

	return new Promise(function(resolve, reject) {
	
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			
			el.scrollTo(getScroll(el).x + distanceX, getScroll(el).y + distanceY);
			el.style.height = `${new_height}px`;
			return;

		}

	    var initialX = getScroll(el).x;
	    var initialY = getScroll(el).y;
	    var initialH = parseInt(el.style.height);
	    var x = initialX + distanceX;
	    var y = initialY + distanceY;
	    var h = new_height;
	    var baseX = (initialX + x) * 0.5;
	    var baseY = (initialY + y) * 0.5;
	    var baseH = (initialH + h) * 0.5;
	    var differenceX = initialX - baseX;
	    var differenceY = initialY - baseY;
	    var differenceH = initialH - baseH;
	    var startTime = performance.now();
	
	    function step() {
	        var normalizedTime = (performance.now() - startTime) / 2000;
	        if (normalizedTime > 1) normalizedTime = 1;

	        el.scrollTo(baseX + differenceX * Math.cos(normalizedTime * Math.PI), baseY + differenceY * Math.cos(normalizedTime * Math.PI));
	        el.style.height = new_slide.style.height = `${baseH + differenceH * Math.cos(normalizedTime * Math.PI)}px`;
	        if (normalizedTime < 1) {
		        
		        window.requestAnimationFrame(step);
		        
		    } else {
				
				if (!navigator.userAgent.match('Firefox')) { // Safari bug fix, which breaks Firefox
				
					el.scrollTo(x, y);
				
				}
				
				console.log('Height after animation:', el.style.height);
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

// 	console.log('updateCarousel', el);

// 	observersOff(el);
	
// 	el.dataset.sliding = true;
// 	getComputedStyle(el);
	
	
	el.dataset.x = Math.round(el.scrollLeft / (el.offsetWidth - paddingX(el)));
	el.dataset.y = Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)));
	
// 	console.log('updateCarousel', el.scrollLeft);
	
	let active = el.classList.contains('n-carousel__vertical') ? el.dataset.y : el.dataset.x;
	
	if (active >= el.children.length) {
		
		active = el.children.length - 1;

	}
	
	let current_active = el.querySelector(':scope > [data-active]');
	
	if (current_active) {

		if (el.children[active] === current_active) { // Scroll snapping back to the same slide. Nothing to do here.
			
			observersOn(el);
			return;
			
		}

		delete current_active.dataset.active;
		current_active.style.height = '';
	
	}
	
	if (!el.parentNode.dataset.ready && el.classList.contains('n-carousel__auto')) {
		
		el.style.height = `${el.offsetHeight - paddingY(el)}px`;
	
	}

/*
	if (!!el.parentNode.dataset.ready && el.classList.contains('n-carousel__auto')) {
	
		let old_height = current_active.scrollHeight;
		let new_height = 0;

		if (el.classList.contains('n-carousel__vertical')) {
			
			el.children[active].style.height = 'auto';
			new_height = el.children[active].scrollHeight;
			el.style.setProperty('--height', `${new_height}px`);
			el.children[active].style.height = `${old_height}px`;
// 			console.log(new_height * active);
	
			el.scrollTo(0, new_height * active);
			
		} else {
			
			new_height = el.children[active].scrollHeight;
			
		}

		if (getComputedStyle(el).transition.match('none') || el.offsetHeight === new_height) { // Reduced motion or no change in height
			
			observersOn(el);
			
		} else {
			
			el.dataset.sliding = true;
	
		}
		
		el.style.height = `${new_height}px`;
		
	} else {
		
		observersOn(el);
		
	}
*/

	el.children[active].dataset.active = true;
	el.style.setProperty('--height', el.children[active].style.height);
	el.children[active].style.height = '';

	// Fix buttons.
	let wrapper = el.closest('.n-carousel')
	let index = getControl(wrapper, '.n-carousel--index');
	if (index.querySelector('[disabled]')) {
		
		index.querySelector('[disabled]').disabled = false;
		
	}
	index.children[active].disabled = true;
	
	getControl(wrapper, '.n-carousel--previous').disabled = active === '0' ? true : false;
	getControl(wrapper, '.n-carousel--next').disabled = (active >= el.children.length-1) ? true : false;
	
	observersOn(el);

};

// Setup isScrolling variable
var isScrolling;
var lastScrollX;
var lastScrollY;
var isResizing;

let scrollStopped = e => {
// return;
	// Clear our timeout throughout the scroll
	let el = e.target;
	if (!!el.dataset.sliding) {
		
		return;

	}
	clearTimeout( isScrolling );
	lastScrollX = el.scrollLeft;
	lastScrollY = el.scrollTop;

	// Set a timeout to run after scrolling ends
	isScrolling = setTimeout(function() {
		
		if (lastScrollX === el.scrollLeft && lastScrollY === el.scrollTop && el.scrollLeft % (el.offsetWidth - paddingX(el)) === 0 && el.scrollTop % (el.offsetHeight - paddingY(el)) === 0) { // Also if scroll is in snap position
// 			console.log(lastScrollX, el.scrollLeft);
			console.log( 'Scrolling has stopped.', el, e.target.scrollLeft, lastScrollX, el.scrollTop, lastScrollY);
			updateCarousel(el);
			// Run the callback
		
		}

	}, 66); // 66 was too low and got double results, confusing the auto resizing on scroll end.

};

let slide = (el, offsetX, offsetY, index) => {
	
	observersOff(el);
	
	if (!el.dataset.sliding) {

		el.removeEventListener('scroll', scrollStopped);
		el.dataset.sliding = true;

		let old_height = el.children[el.dataset.y].scrollHeight;
		el.children[index].style.height = 'auto';
		let new_height = el.children[index].scrollHeight;
		el.children[index].style.height = '';
		
		el.style.removeProperty('--height');

		el.scrollTo(0, el.dataset.y*old_height);
		
		scrollBy(el, offsetX, -1*(el.dataset.y*old_height - index*new_height), new_height, el.children[index]).then(response => {

// 			observersOn(el);
			updateCarousel(el); // Handled by scroll end
	
		});
	
	}
	
};

let slideNext = (el) => {

	if (el.classList.contains('n-carousel__vertical')) {

		slide(el, 0, el.offsetHeight - paddingY(el));
	
	} else {
		
		slide(el, el.offsetWidth - paddingX(el), 0);
		
	}

};

let slidePrevious = (el) => {

	if (el.classList.contains('n-carousel__vertical')) {

		slide(el, 0, -1*(el.offsetHeight - paddingY(el)));
	
	} else {
		
		slide(el, -1*(el.offsetWidth - paddingX(el)), 0);
		
	}

};

let slideTo = (el, index) => {

	if (el.classList.contains('n-carousel__vertical')) {

		slide(el, 0, (el.offsetHeight - paddingY(el)) * index - el.scrollTop, index);
	
	} else {
		
		slide(el, (el.offsetWidth - paddingX(el)) * index - el.scrollLeft, 0, index);
		
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
	
// 	console.log(e);
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

let closestCarousel = el => {
	
	return el.closest('.n-carousel').querySelector('.n-carousel--content');
	
};

let slidePreviousEvent = e => {
	
	slidePrevious(closestCarousel(e.target));
	
};
		
let slideNextEvent = e => {
	
	slideNext(closestCarousel(e.target));

};

let slideIndexEvent = e => {

	let el = e.target;
	if (el.tagName === 'BUTTON') {

		slideTo(closestCarousel(el), [...el.parentNode.children].indexOf(el));

	}

};

let carouselTransition = e => {

// 	console.log(e);
	let el = e.target;
	
	getControl(el, '[data-active]').style.height = '';
	getComputedStyle(el);
    window.requestAnimationFrame(() => {
		setTimeout(() => { 
			observersOn(el); 
			
		}, 100); // Why is this necessary, why is scroll firing without scrolling?
    });
	
}
		
document.querySelectorAll('.n-carousel:not([data-ready])').forEach(el => {

	// To do: get the buttons properly, minding embedded carousels

	getControl(el, '.n-carousel--previous').onclick = slidePreviousEvent;

	getControl(el, '.n-carousel--next').onclick = slideNextEvent;

	getControl(el, '.n-carousel--index').onclick = slideIndexEvent;

	el.querySelector('.n-carousel--content').onkeydown = carouselKeys;
			
	let content = el.querySelector(':scope > .n-carousel--content');
	content.tabIndex = 0;
	content.style.setProperty('--height', `${content.children[0].offsetHeight}px`);

	updateCarousel(content);

	content.addEventListener('transitionend', carouselTransition);

	el.dataset.ready = true;
	observersOn(el);
	el.querySelector('.n-carousel--content').addEventListener('scroll', scrollStopped);

});
