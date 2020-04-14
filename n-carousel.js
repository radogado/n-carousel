(function (){ 

	let resize_observer_support = typeof ResizeObserver === 'function';
	
	let scrollStart = el => getComputedStyle(el).direction === 'rtl' ? el.scrollWidth - el.scrollLeft - el.offsetWidth : el.scrollLeft; // Get correct start scroll position for LTR and RTL
	
	let scrollToAuto = (el, x, y) => el.scrollTo(getComputedStyle(el).direction === 'rtl' ? el.scrollWidth - x - el.offsetWidth : x, y);    // Scroll to correct scroll position for LTR and RTL
	
	let getScroll = el => el === window ? {x: el.scrollX, y: el.scrollY} : {x: scrollStart(el), y: el.scrollTop}
	
	let isVertical = el => {
	
		return el.closest('.n-carousel').classList.contains('n-carousel__vertical');
		
	};
	
	let observersOn = el => {
	
	/*
		if (!isVertical(el)) {
		
			if (resize_observer_support) {
			
				carouselResizeObserver.observe(el);
				
			} else {
		
				window.addEventListener('resize', resizeObserverFallback);
		
			}
			
		}
	*/
	
	// 	console.log('observersOn', scrollStart(el), el.scrollTop);
	/*
		let left = scrollStart(el);
		let top = el.scrollTop;
	*/
		
	
	// 	scrollToAuto(el, left, top); // Because Safari reverts to 0 scroll upon activating Scroll Snap Points 
		setTimeout(() => {
			delete el.dataset.sliding;
			el.addEventListener('scroll', scrollStopped);
		}, 1);
	// 	scrollToAuto(el, left, top);
	// 	console.log('Observers On');	
	
	}
	
	let observersOff = el => {
		
	/*
		if (resize_observer_support) {
		
			carouselResizeObserver.unobserve(el);
			
		} else {
	
			window.removeEventListener('resize', resizeObserverFallback);
	
		}
	*/
	
		el.removeEventListener('scroll', scrollStopped);
	
	// 	console.log('Observers Off');	
	
	}
	
	let inOutSine = n => (1 - Math.cos(Math.PI * n))/2;
	
	let scrollBy = (el, distanceX, distanceY, new_height) => new Promise((resolve, reject) => { // Thanks https://stackoverflow.com/posts/46604409/revisions
	
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			
			scrollToAuto(el, getScroll(el).x + distanceX, getScroll(el).y + distanceY);
			el.style.height = `${new_height}px`;
			resolve(el);
			return;
	
		}
	
	    var stop = false;
	
	    var startx = getScroll(el).x;
	    var starty = getScroll(el).y;
	    var starth = parseInt(el.style.height);
	    var distanceH = new_height - starth;
	    var duration = 500;
	    var start = null;
	    var end = null;
	
	    let startAnim = timeStamp => {
	
	        start = timeStamp;
	        end = start + duration;
	        draw(timeStamp);
	
	    };
	
	    let draw = now => {
	
	        if (stop) { resolve(el); return; }
	        if (now - start >= duration) stop = true;
	        var p = (now - start) / duration;
	        var val = inOutSine(p);
	        var x = startx + distanceX * val;
	        var y = starty + distanceY * val;
	        scrollToAuto(el, x, y);
	
	        if (new_height) {
		        
		        window.requestAnimationFrame(() => {
			        
			        el.style.height = `${starth + distanceH * val}px`;
			    
			    }); // Timeout because Safari can't do scroll and height at once
		    
		    }
	
	        requestAnimationFrame(draw);
	
	    };
	
	    requestAnimationFrame(startAnim);
	
	});
	
	let paddingX = el => parseInt(getComputedStyle(el).paddingInlineStart)*2;
	
	let paddingY = el => parseInt(getComputedStyle(el).paddingBlockStart)*2;
	
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
	
	let updateCarousel = el => { // Called on init and scroll end
	
		observersOff(el);
		
	// 	el.dataset.sliding = true;
	// 	getComputedStyle(el);
		
		
		el.dataset.x = Math.round(scrollStart(el) / (el.offsetWidth - paddingX(el)));
		el.dataset.y = Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)));
		
	// 	console.log('updateCarousel', scrollStart(el));
		
		let active = isVertical(el) ? el.dataset.y : el.dataset.x;
		
		if (active >= el.children.length) {
			
			active = el.children.length - 1;
	
		}
		
		console.log('updateCarousel', scrollStart(el), 'active', active)
	
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
			
			window.requestAnimationFrame(() => {
	
				el.style.height = `${el.offsetHeight - paddingY(el)}px`;
				
			});
		
		}
	
		el.children[active].dataset.active = true;
		el.children[active].style.height = '';
		
		// If auto height and active height !== carousel height, change (animate) carousel height to active height (.scrollHeight)
	
		// Fix buttons.
		let wrapper = el.closest('.n-carousel')
		let index = getControl(wrapper, '.n-carousel--index');
		if (index.querySelector('[disabled]')) {
			
			index.querySelector('[disabled]').disabled = false;
			
		}
		index.children[active].disabled = true;
		
		getControl(wrapper, '.n-carousel--previous button').disabled = active === '0' ? true : false;
		getControl(wrapper, '.n-carousel--next button').disabled = (active >= el.children.length-1) ? true : false;
	
	/* 	setTimeout(() =>  */
		observersOn(el);
	/* 	, 66); */
	
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
		
		lastScrollX = scrollStart(el);
		lastScrollY = el.scrollTop;
	
		// Set a timeout to run after scrolling ends
		isScrolling = setTimeout(function() {
			
			if (lastScrollX === scrollStart(el) && lastScrollY === el.scrollTop && scrollStart(el) % (el.offsetWidth - paddingX(el)) === 0 && el.scrollTop % (el.offsetHeight - paddingY(el)) === 0) { // Also if scroll is in snap position
	// 			console.log(lastScrollX, scrollStart(el));
				console.log( 'Scrolling has stopped.', el, scrollStart(e.target), lastScrollX, el.scrollTop, lastScrollY);
	// 			updateCarousel(el);
				
				el.dataset.sliding = true;
				observersOff(el);
				
				if (el.classList.contains('n-carousel__auto')) {
					
					el.dataset.sliding = true;
					
					if (isVertical(el)) {
					
						let new_index = Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)));
						el.children[new_index].style.height = 'auto';
						var new_height = el.children[new_index].scrollHeight;
						el.children[new_index].style.height = '';
						var offset_y = new_index * new_height - el.scrollTop;
						
					} else {
						
						let new_index = Math.round(scrollStart(el) / (el.offsetWidth - paddingX(el)));
						el.children[new_index].style.height = 'auto';
						el.children[new_index].style.position = 'absolute';
						var new_height = el.children[new_index].scrollHeight;
						el.children[new_index].style.position = el.children[new_index].style.height = '';
						scrollToAuto(el, lastScrollX, lastScrollY);
						var offset_y = 0;
						
					}
					
					scrollBy(el, 0, offset_y, new_height).then(response => { // Scroll by old height * index, last param is new height - old height?
						
						updateCarousel(el);
						setTimeout(() => { 
							
							delete el.dataset.sliding;
							
						}, 66);
				
					});
					
				} else {
					
					updateCarousel(el);
					setTimeout(() => { 
						
						delete el.dataset.sliding;
						
					}, 66);
				
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
			
				let old_scroll_left = scrollStart(el);
				let old_scroll_top = el.scrollTop;
	
				if (isVertical(el)) {
		
					el.children[index].style.height = 'auto';
					
				} else {
					
					el.children[index].style.position = 'absolute';
					el.children[index].style.width = `${el.offsetWidth - paddingX(el)}px`;
		
				}
				new_height = el.children[index].scrollHeight;
				el.children[index].style.position = el.children[index].style.width = el.children[index].style.height = '';
		
				scrollToAuto(el, old_scroll_left + paddingX(el)/2, old_scroll_top); // iPad bug
				scrollToAuto(el, old_scroll_left , old_scroll_top);
			
			}
			
			let scroll_to_y = -1*(el.dataset.y*old_height - index*new_height);
			
			scrollBy(el, offsetX, scroll_to_y, new_height === old_height ? false : new_height).then(response => {
	
				updateCarousel(el); // Handled by scroll end
		
			});
		
		}
		
	};
	
	let slideNext = (el) => {
	
		let index = 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
		slideTo(el, index >= el.children.length-1 ? 0 : index + 1);
	
	};
	
	let slidePrevious = (el) => {
	
		let index = 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
		slideTo(el, index === 0 ? el.children.length-1 : index - 1);
	
	};
	
	let slideTo = (el, index) => {
	
		if (isVertical(el)) {
	
			slide(el, 0, (el.offsetHeight - paddingY(el)) * index - el.scrollTop, index);
		
		} else {
			
			slide(el, (el.offsetWidth - paddingX(el)) * index - scrollStart(el), 0, index);
			
		}
		
	};
	
	let resizeObserverFallback = e => {
		
		document.querySelectorAll('.n-carousel--content').forEach(el => {
				
				// Clear our timeout throughout the scroll
				clearTimeout( isResizing );
			
				// Set a timeout to run after scrolling ends
				isResizing = setTimeout(function() {
					
					scrollToAuto(el, el.offsetWidth*el.dataset.x - paddingX(el), el.offsetHeight*el.dataset.y + paddingY(el));
	/*
					el.style.height = `${el.children[el.dataset.x].scrollHeight}px`;
				
	*/
					// Run the callback
	// 				console.log( 'Resizing has stopped.', e.target);
			
				}, 66);
	
			});
	
	};
	
	/*
	if (resize_observer_support) {
	
		var carouselResizeObserver = new ResizeObserver(entries => {
	
			entries.forEach(e => {
	// 			return;
				let el = e.target;
				
				if (!!el.dataset.sliding) {
					
					return;
	
				}
				
				console.log('Resized', el, e.contentRect.width, e.contentRect.height);
				
				el.dataset.sliding = true;
				
				el.removeEventListener('scroll', scrollStopped);
	
				scrollToAuto(el, el.offsetWidth*el.dataset.x, el.offsetHeight*el.dataset.y); // To do: Fix Safari glitch
							
				if (el.classList.contains('n-carousel__auto')) {
				
					if (isVertical(el)) {
		
						el.style.height = `${el.children[el.dataset.y].scrollHeight}px`;
						
					} else {
						
						el.style.height = `${el.children[el.dataset.x].scrollHeight}px`;
						
					}
				
				}
				
				setTimeout(() => el.addEventListener('scroll', scrollStopped), 66);
	
			});
		
		});
	
	}
	*/
		
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
	
	let closestCarousel = el => el.closest('.n-carousel').querySelector('.n-carousel--content');
	
	let slidePreviousEvent = e => slidePrevious(closestCarousel(e.target));
			
	let slideNextEvent = e => slideNext(closestCarousel(e.target));
	
	let slideIndexEvent = e => {
	
		let el = e.target;
		if (el.tagName === 'BUTTON') {
	
			slideTo(closestCarousel(el), [...el.parentNode.children].indexOf(el));
	
		}
	
	};
			
	document.querySelectorAll('.n-carousel:not([data-ready])').forEach(el => {
	
		getControl(el, '.n-carousel--previous button').onclick = slidePreviousEvent;
	
		getControl(el, '.n-carousel--next button').onclick = slideNextEvent;
	
		getControl(el, '.n-carousel--index').onclick = slideIndexEvent;
	
		el.querySelector('.n-carousel--content').onkeydown = carouselKeys;
				
		let content = el.querySelector(':scope > .n-carousel--content');
		content.tabIndex = 0;
	
		updateCarousel(content);
	
		window.requestAnimationFrame(() => {
	
			el.dataset.ready = true;
			observersOn(content);
	
		});
	
		if (content.classList.contains('n-carousel--auto-slide')) {
			
			let carouselTimeout = () => {
					
				slideNext(content); 
				content.nCarouselTimeout = setTimeout(carouselTimeout, 2000);
				
			}
			
			content.nCarouselTimeout = setTimeout(carouselTimeout, 2000);
			
			content.addEventListener('pointerenter', e => clearTimeout(e.target.nCarouselTimeout));
		
		}
	
	});

})();
