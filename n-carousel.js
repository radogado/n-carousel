let getScroll = el => { return el === window ? {x: el.scrollX, y: el.scrollY} : {x: el.scrollLeft, y: el.scrollTop} };

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
				el.scrollTo(x, y); // Safari bug fix
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
	
}

let fixControls = el => {

	el.dataset.x = Math.round(el.scrollLeft / (el.offsetWidth - paddingX(el)));
	el.dataset.y = Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)));

	el.style.height = `${el.children[el.dataset.x].scrollHeight}px`;

	if (el.querySelector('[data-active]')) {

		delete el.querySelector('[data-active]').dataset.active;
	
	}
	el.children[el.dataset.x].dataset.active = true;

	// Fix buttons.
	let wrapper = el.closest('.n-carousel')
	let index = getControl(wrapper, '.n-carousel--index');
	if (index.querySelector('[disabled]')) {
		
		index.querySelector('[disabled]').disabled = false;
		
	}
	index.children[el.dataset.x].disabled = true;
	
	// To do: get the buttons properly, minding embedded carousels
	getControl(wrapper, '.n-carousel--previous').disabled = !el.scrollLeft ? true : false;;
	getControl(wrapper, '.n-carousel--next').disabled = (el.scrollWidth - el.offsetWidth - el.scrollLeft < el.offsetWidth - paddingX(el)) ? true : false;
	
};

// Setup isScrolling variable
var isScrolling;
var lastScroll;
var isResizing;

let scrollStopped = e => {

	// Clear our timeout throughout the scroll
	clearTimeout( isScrolling );
	lastScroll = e.target.scrollLeft;

	// Set a timeout to run after scrolling ends
	isScrolling = setTimeout(function() {
		
		if (lastScroll === e.target.scrollLeft) {
		
			console.log( 'Scrolling has stopped.', e.target, e.target.scrollLeft, lastScroll);
			fixControls(e.target);
			// Run the callback
		
		}

	}, 200); // 66 was too low and got double results, confusing the auto resizing on scroll end.

};

let slide = (el, offset) => {
	
	if (!el.dataset.sliding) {
		
		scrollBy(el, offset, 0).then(response => {
			
// 			fixControls(el);
	
		});
	
	}
	
};

let slideNext = (el) => {

	slide(el, el.offsetWidth - paddingX(el));

};

let slidePrevious = (el) => {

	slide(el, -1*(el.offsetWidth - paddingX(el)));

};

let slideTo = (el, index) => {

	slide(el, (el.offsetWidth - paddingX(el)) * index - el.scrollLeft);
	
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
		
	el.querySelector('.n-carousel--content').onkeydown = e => {
		
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

	}
		
	let content = el.querySelector('.n-carousel--content');
	content.tabIndex = 0;
	// Listen for scroll events
	content.addEventListener('scroll', scrollStopped, false);
	fixControls(content);

	if (typeof ResizeObserver === 'function') {
	
		let ro = new ResizeObserver(entries => {
			
			entries.forEach(e => {
				
				let el = e.target;
				console.log('Resized', el, e.contentRect.width, e.contentRect.height);
				el.scrollTo(el.offsetWidth*el.dataset.x, el.offsetWidth*el.dataset.y);
// 				el.style.height = `${el.children[el.dataset.x].scrollHeight}px`;
				
			});
		
		});
	
		ro.observe(content);

	} else { // Fallback
		
		window.addEventListener('resize', e => {
			
			document.querySelectorAll('.n-carousel--content').forEach(el => {
				
				// Clear our timeout throughout the scroll
				clearTimeout( isResizing );
			
				// Set a timeout to run after scrolling ends
				isResizing = setTimeout(function() {
					
					el.scrollTo(el.offsetWidth*el.dataset.x - paddingX(el), el.offsetWidth*el.dataset.y + paddingY(el));
/*
					el.style.height = `${el.children[el.dataset.x].scrollHeight}px`;
				
*/
					// Run the callback
					console.log( 'Resizing has stopped.', e.target);
			
				}, 66);

			});
						
		});
				
	}
	
	el.dataset.ready = true;
	
});
