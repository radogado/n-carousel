let getScroll = el => {
	
	return el === window ? {x: el.scrollX, y: el.scrollY} : {x: el.scrollLeft, y: el.scrollTop}

};

let observersOn = el => {

	if (typeof ResizeObserver === 'function') {
	
		carouselResizeObserver.observe(el);
		
	} else {

		window.addEventListener('resize', resizeObserverFallback);

	}

// 	console.log('observersOn', el.scrollLeft, el.scrollTop);
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

	el.removeEventListener('scroll', scrollStopped);

// 	console.log('Observers Off');	

}

let scrollBy = (el, distanceX, distanceY, new_height) => {

// console.log('Srolling by', distanceY, ' from ', el.scrollTop);

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
	        var normalizedTime = (performance.now() - startTime) / 200;
	        if (normalizedTime > 1) normalizedTime = 1;
// console.log(baseX + differenceX * Math.cos(normalizedTime * Math.PI), baseY + differenceY * Math.cos(normalizedTime * Math.PI));
	        el.scrollTo(baseX + differenceX * Math.cos(normalizedTime * Math.PI), baseY + differenceY * Math.cos(normalizedTime * Math.PI));
	        
	        if (new_height) {
		        
		        window.requestAnimationFrame(() => {
			        
			        el.style.height = `${baseH + differenceH * Math.cos(normalizedTime * Math.PI)}px`; // Setting both breaks Safari
			    
			    }); // Timeout because Safari can't do scroll and height at once
		    
		    }

	        if (normalizedTime < 1) {
		        
		        window.requestAnimationFrame(step);
		        
		    } else {
				
// 				console.log('Height after animation:', el.style.height);
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

	observersOff(el);
	
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


	el.children[active].dataset.active = true;
// 	el.style.setProperty('--height', el.children[active].style.height);
	el.children[active].style.height = '';
	
	// If auto height and active height !== carousel height, change (animate) carousel height to active height (.scrollHeight)

	// Fix buttons.
	let wrapper = el.closest('.n-carousel')
	let index = getControl(wrapper, '.n-carousel--index');
	if (index.querySelector('[disabled]')) {
		
		index.querySelector('[disabled]').disabled = false;
		
	}
	index.children[active].disabled = true;
	
	getControl(wrapper, '.n-carousel--previous').disabled = active === '0' ? true : false;
	getControl(wrapper, '.n-carousel--next').disabled = (active >= el.children.length-1) ? true : false;

	setTimeout(() => { 

		observersOn(el); 
		
	}, 66); // Why is this necessary, why is scroll firing without scrolling?

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

	clearTimeout(isScrolling);
// 	clearTimeout(el.nCarouselTimeout);
	
	lastScrollX = el.scrollLeft;
	lastScrollY = el.scrollTop;

	// Set a timeout to run after scrolling ends
	isScrolling = setTimeout(function() {
		
		if (lastScrollX === el.scrollLeft && lastScrollY === el.scrollTop && el.scrollLeft % (el.offsetWidth - paddingX(el)) === 0 && el.scrollTop % (el.offsetHeight - paddingY(el)) === 0) { // Also if scroll is in snap position
// 			console.log(lastScrollX, el.scrollLeft);
// 			console.log( 'Scrolling has stopped.', el, e.target.scrollLeft, lastScrollX, el.scrollTop, lastScrollY);
// 			updateCarousel(el);
			
			observersOff(el);
			
			if (el.classList.contains('n-carousel__auto')) {
				
				el.dataset.sliding = true;
				
				if (el.classList.contains('n-carousel__vertical')) {
				
					let new_index = Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)));
					el.children[new_index].style.height = 'auto';
					var new_height = el.children[new_index].scrollHeight;
					el.children[new_index].style.height = '';
					var offset_y = new_index * new_height - el.scrollTop;
					
				} else {
					
					let new_index = Math.round(el.scrollLeft / (el.offsetWidth - paddingX(el)));
					el.children[new_index].style.height = 'auto';
					el.children[new_index].style.position = 'absolute';
					var new_height = el.children[new_index].scrollHeight;
					el.children[new_index].style.position = el.children[new_index].style.height = '';
					el.scrollTo(lastScrollX, lastScrollY);
					var offset_y = 0;
					
				}
				
				scrollBy(el, 0, offset_y, new_height).then(response => { // Scroll by old height * index, last param is new height - old height?
					
					setTimeout(() => { 
						
						updateCarousel(el);
						delete el.dataset.sliding;
						
					}, 66);
			
				});
				
			} else {
				
				updateCarousel(el);

			}
		
		}

	}, 66);

};

let slide = (el, offsetX, offsetY, index) => {
	
	clearTimeout(el.nCarouselTimeout);
	
	observersOff(el);
	
	if (!el.dataset.sliding) {

		el.removeEventListener('scroll', scrollStopped);
		el.dataset.sliding = true;

		let old_height = el.children[el.dataset.y].clientHeight;
		
		let new_height = old_height;
		
		if (el.classList.contains('n-carousel__auto')) {
		
			let old_scroll_left = el.scrollLeft;
			let old_scroll_top = el.scrollTop;

			if (el.classList.contains('n-carousel__vertical')) {
	
				el.children[index].style.height = 'auto';
				
			} else {
				
				el.children[index].style.position = 'absolute';
				el.children[index].style.width = `${el.offsetWidth - paddingX(el)}px`;
	
			}
			new_height = el.children[index].scrollHeight;
			el.children[index].style.position = el.children[index].style.width = el.children[index].style.height = '';
	
			el.scrollTo(old_scroll_left + paddingX(el)/2, old_scroll_top); // iPad bug
			el.scrollTo(old_scroll_left , old_scroll_top);
		
		}
		
		let scroll_to_y = -1*(el.dataset.y*old_height - index*new_height);
		
		scrollBy(el, offsetX, scroll_to_y, new_height === old_height ? false : new_height).then(response => {

			updateCarousel(el); // Handled by scroll end
	
		});
	
	}
	
};

let slideNext = (el) => {

	if (el.classList.contains('n-carousel__vertical')) {

		slide(el, 0, el.offsetHeight - paddingY(el), el.dataset.y >= el.children.length-1 ? 0 : parseInt(el.dataset.y) + 1);
	
	} else {
		
		console.log('slide next');

		if (el.dataset.x >= el.children.length-1) {
			
			slide(el, el.offsetWidth - paddingX(el) - (el.scrollWidth - paddingX(el)), 0, el.dataset.x >= el.children.length-1 ? 0 : parseInt(el.dataset.x) + 1);
			
		} else {

			slide(el, el.offsetWidth - paddingX(el), 0, el.dataset.x >= el.children.length-1 ? 0 : parseInt(el.dataset.x) + 1);
		
		}
		
	}

};

let slidePrevious = (el) => {

	if (el.classList.contains('n-carousel__vertical')) {

		slide(el, 0, -1*(el.offsetHeight - paddingY(el)), parseInt(el.dataset.y) === 0 ? el.children.length-1 : parseInt(el.dataset.y) - 1);
	
	} else {
		
		slide(el, -1*(el.offsetWidth - paddingX(el)), 0, parseInt(el.dataset.x) === 0 ? el.children.length-1 : parseInt(el.dataset.x) - 1);
		
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
// 				console.log( 'Resizing has stopped.', e.target);
		
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
		
document.querySelectorAll('.n-carousel:not([data-ready])').forEach(el => {

	// To do: get the buttons properly, minding embedded carousels

	getControl(el, '.n-carousel--previous').onclick = slidePreviousEvent;

	getControl(el, '.n-carousel--next').onclick = slideNextEvent;

	getControl(el, '.n-carousel--index').onclick = slideIndexEvent;

	el.querySelector('.n-carousel--content').onkeydown = carouselKeys;
			
	let content = el.querySelector(':scope > .n-carousel--content');
	content.tabIndex = 0;

	updateCarousel(content);

	el.dataset.ready = true;
	observersOn(content);
	content.addEventListener('scroll', scrollStopped);
	
	if (content.classList.contains('n-carousel--auto-slide')) {
		
		let carouselTimeout = () => {
				
			slideNext(content); 
			content.nCarouselTimeout = setTimeout(carouselTimeout, 2000);
			
		}
		
		content.nCarouselTimeout = setTimeout(carouselTimeout, 2000);
	
	}

});
