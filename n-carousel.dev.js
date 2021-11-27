(function() {
  const ceilingWidth = (el) => Math.ceil(parseFloat(getComputedStyle(el).width));
  const ceilingHeight = (el) => Math.ceil(parseFloat(getComputedStyle(el).height));
  const focusableElements = 'button, [href], input, select, textarea, details, summary, video, [tabindex]:not([tabindex="-1"])';

  function isElementInViewport(el) {
    let rect = el.getBoundingClientRect();
    return (rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) /* or $(window).height() */ && rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */ );
  }
  const default_duration = 500;
  const default_interval = 4000;
  const isChrome = !!navigator.userAgent.match("Chrome");
  const isSafari = navigator.userAgent.match(/Safari/) && !isChrome;
  const nextSlideHeight = (el) => {
    el.style.height = 0;
    el.style.overflow = "auto";
    const height = el.scrollHeight; // Ceiling when subpixel
    el.style.height = el.style.overflow = "";
    return height;
  };
  // const scrollableAncestor = (el) => {
  // 	el = el.parentNode;
  // 	while (el) {
  // 		if (el.scrollHeight > el.offsetHeight || el.scrollWidth > el.offsetWidth) {
  // 			return el;
  // 		} else {
  // 			el = el.parentNode;
  // 		}
  // 	}
  // 	return false;
  // };
  const getIndex = (el) => 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
  const scrolledAncestor = (el) => {
    el = el.parentNode;
    while (el) {
      if (el.scrollTop !== 0 || el.scrollLeft !== 0) {
        return el;
      } else {
        el = el.parentNode;
      }
    }
    return false;
  };
  const scrolledAncestors = (el) => {
    let arr = [];
    let a = scrolledAncestor(el);
    while (a && typeof a.scrollLeft !== "undefined" && (a.scrollTop !== 0 || a.scrollLeft !== 0)) {
      arr.push(a);
      a = scrolledAncestor(a);
    }
    return arr;
  };
  const isRTL = (el) => getComputedStyle(el).direction === "rtl";
  const resize_observer_support = typeof ResizeObserver === "function";
  const toggleFullScreen = (el) => {
    el = el.closest(".n-carousel");
    let carousel = el.querySelector(":scope > .n-carousel__content");
    const restoreScroll = () => {
      if (!document.webkitIsFullScreen) {
        el.nuiAncestors.forEach((el) => {
          window.requestAnimationFrame(() => {
            el.scrollLeft = el.nuiScrollX;
            el.scrollTop = el.nuiScrollY;
            delete el.nuiScrollX;
            delete el.nuiScrollY;
          });
        });
        delete el.nuiAncestors;
        el.removeEventListener("webkitfullscreenchange", restoreScroll);
      }
    };
    if (document.fullscreen || document.webkitIsFullScreen) {
      // Exit full screen
      !!document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen();
      if (isSafari) {
        // When exit finishes, update the carousel because on Safari 14, position is wrong or the slide is invisible
        setTimeout(() => {
          // console.log('updating', el);
          // updateCarousel(el);
          el.style.display = "none";
          window.requestAnimationFrame(() => {
            el.style.display = "";
          });
        }, 0);
      }
    } else {
      // Enter full screen
      if (isSafari) {
        el.nuiAncestors = scrolledAncestors(el);
        el.nuiAncestors.forEach((el) => {
          el.nuiScrollX = el.scrollLeft;
          el.nuiScrollY = el.scrollTop;
        });
        el.addEventListener("webkitfullscreenchange", restoreScroll, false);
      }!!el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen();
    }
    // updateCarousel(carousel);
  };
  const scrollStartX = (el) => el.scrollLeft; // Get correct start scroll position for LTR and RTL
  const scrollTo = (el, x, y) => {
    el.scrollTo(isRTL(el) ? -1 * Math.abs(x) : x, y); // Scroll to correct scroll position for LTR and RTL
  };
  const getScroll = (el) => (el === window ? {
    x: el.scrollX,
    y: el.scrollY
  } : {
    x: scrollStartX(el),
    y: el.scrollTop
  });
  const isVertical = (el) => el.closest(".n-carousel").matches(".n-carousel--vertical");
  const isAuto = (el) => el.parentNode.matches(".n-carousel--auto-height");
  const trapFocus = (modal) => {
    // FROM: https://uxdesign.cc/how-to-trap-focus-inside-modal-to-make-it-ada-compliant-6a50f9a70700
    // add all the elements inside modal which you want to make focusable
    const firstFocusableElement = modal.querySelectorAll(focusableElements)[0]; // get first element to be focused inside modal
    const focusableContent = modal.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1]; // get last element to be focused inside modal
    document.addEventListener("keydown", function(e) {
      let isTabPressed = e.key === "Tab" || e.keyCode === 9;
      if (!isTabPressed) {
        return;
      }
      if (e.shiftKey) {
        // if shift key pressed for shift + tab combination
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus(); // add focus for the last focusable element
          e.preventDefault();
        }
      } else {
        // if tab key is pressed
        if (document.activeElement === lastFocusableElement) {
          // if focused has reached to last focusable element then focus first focusable element after pressing tab
          firstFocusableElement.focus(); // add focus for the first focusable element
          e.preventDefault();
        }
      }
    });
    firstFocusableElement.focus();
  };
  // Fix snapping with mouse wheel. Thanks https://stackoverflow.com/a/62415754/3278539
  //   const detectTrackPad = (e) => {
  //     // console.log(e);
  //     let el = e.target;
  //
  //     // if (!el.matches(".n-carousel__content")) {
  //     //   return;
  //     // }
  //
  //     var isTrackpad = false;
  //     if (e.wheelDeltaY) {
  //       if (e.wheelDeltaY === e.deltaY * -3) {
  //         isTrackpad = true;
  //       }
  //     } else if (e.deltaMode === 0) {
  //       isTrackpad = true;
  //     }
  //
  //     console.log(isTrackpad ? "Trackpad detected" : "Mousewheel detected");
  //     // if (!isTrackpad || !!navigator.platform.match(/Win/)) {
  //     // Trackpad doesn't work properly in Windows, so assume it's mouse wheel
  //     // Also check if the slide can scroll in the requested direction and let it wheel scroll inside if yes
  //     observersOff(el);
  //
  //     let scrollable_ancestor = scrollableAncestor(e.target);
  //
  //     // If scrolled carousel is currently sliding, its scrollable parent will scroll. Should cancel instead.
  //
  //     if (e.deltaY < 0) {
  //       if (
  //         !scrollable_ancestor ||
  //         scrollable_ancestor.matches(".n-carousel__content") ||
  //         scrollable_ancestor.scrollTop === 0
  //       ) {
  //         e.preventDefault();
  //         slidePrevious(el);
  //       }
  //     } else {
  //       if (
  //         !scrollable_ancestor ||
  //         scrollable_ancestor.matches(".n-carousel__content") ||
  //         scrollable_ancestor.scrollTop + scrollable_ancestor.offsetHeight ===
  //           scrollable_ancestor.scrollHeight
  //       ) {
  //         e.preventDefault();
  //         slideNext(el);
  //       }
  //     }
  //     // }
  //   };
  const inOutSine = (n) => (1 - Math.cos(Math.PI * n)) / 2;
  const paddingX = (el) => parseInt(getComputedStyle(el).paddingInlineStart) * 2;
  const paddingY = (el) => parseInt(getComputedStyle(el).paddingBlockStart) * 2;
  const getControl = (carousel, control) => {
    let detached_control = document.querySelector(`${control}[data-for="${carousel.id}"]`);
    if (detached_control) {
      return detached_control;
    }
    for (let el of carousel.children) {
      if (el.matches(control)) {
        return el;
      }
      if (!el.matches(".n-carousel__content") && el.querySelector(control)) {
        return el.querySelector(control);
      }
    }
  };
  const closestCarousel = (el) => (document.getElementById(el.closest('[class*="n-carousel"]').dataset.for) || el.closest(".n-carousel")).querySelector(".n-carousel__content");
  const scrollAnimate = (el, distanceX, distanceY, new_height, old_height = false) => new Promise((resolve, reject) => {
    // Thanks https://stackoverflow.com/posts/46604409/revisions
    let wrapper = el.closest(".n-carousel");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || wrapper.matches(".n-carousel--instant") || !!wrapper.nextSlideInstant) {
      scrollTo(el, getScroll(el).x + distanceX, getScroll(el).y + distanceY);
      el.style.height = `${new_height}px`;
      delete wrapper.nextSlideInstant;
      updateCarousel(el);
      resolve(el);
      return;
    }
    observersOff(el);
    let scroll_changing = true;
    if (distanceX === 0 && distanceY === 0) {
      scroll_changing = false;
    }
    if (!!new_height) {
      el.style.height = `${old_height}px`;
    } else {
      if (!isVertical(el)) {
        el.style.height = "";
      }
    }
    var stop = false;
    var startx = getScroll(el).x;
    var starty = getScroll(el).y;
    var starth = parseInt(el.style.height);
    var distanceH = new_height - starth;
    var duration = parseFloat(el.parentNode.dataset.duration) * 1000 || default_duration;
    var start = null;
    var end = null;
    let startAnim = (timeStamp) => {
      start = timeStamp;
      end = start + duration;
      draw(timeStamp);
    };
    let draw = (now) => {
      if (stop) {
        scrollTo(el, startx + distanceX, starty + distanceY);
        if (new_height) {
          el.style.height = `${new_height}px`;
        }
        observersOn(el);
        window.requestAnimationFrame(() => {
          updateCarousel(el);
          resolve(el);
        });
        return;
      }
      if (now - start >= duration) stop = true;
      var p = (now - start) / duration;
      var val = inOutSine(p);
      var x = startx + distanceX * val;
      var y = starty + distanceY * val;
      if (scroll_changing) {
        scrollTo(el, x, y);
      }
      if (new_height) {
        window.requestAnimationFrame(() => {
          el.style.height = `${starth + distanceH * val}px`;
        }); // Timeout because Safari can't do scroll and height at once
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(startAnim);
  });
  const updateCarousel = (el) => {
    // Called on init and scroll end
    observersOff(el);
    el.dataset.x = Math.abs(Math.round(scrollStartX(el) / ceilingWidth(el.firstElementChild)));
    el.dataset.y = Math.abs(Math.round(el.scrollTop / ceilingHeight(el.firstElementChild)));
    // When inline
    if (el.dataset.x === "NaN") {
      el.dataset.x = 0;
    }
    if (el.dataset.y === "NaN") {
      el.dataset.y = 0;
    }
    let active = getIndex(el);
    if (active >= el.children.length) {
      active = el.children.length - 1;
    }
    let current_active = el.querySelector(":scope > [data-active]");
    if (!el.parentElement.classList.contains("n-carousel--auto-height")) {
      // Dynamic change from auto height to normal
      el.style.height = "";
    }
    let active_slide = el.children[active];
    if (el.querySelector(":scope > [data-first]")) {
      el.dataset.x--;
      el.dataset.y--;
    }
    if (el.querySelector(":scope > [data-last]")) {
      el.dataset.x++;
      el.dataset.y++;
    }
    // Endless carousel
    // To do: on initial load, scroll to second one
    // To do: fix index
    // To do: scroll end by timeout detection, when snapping to next slide, glitches
    if (el.children.length > 2 && el.parentElement.classList.contains("n-carousel--endless")) {
      if (active === 0) {
        if (!active_slide.dataset.first) {
          // Move the last one to the front as [data-first]
          el.lastElementChild.dataset.first = true;
          el.prepend(el.lastElementChild);
        } else {
          // Landed on fake first slide. Move it to the back, remove its [data-first] and move the first one to the back as [data-last]
          delete el.firstElementChild.dataset.first;
          el.append(el.firstElementChild);
          el.firstElementChild.dataset.last = true;
          el.append(el.firstElementChild);
        }
      } else {
        if (active === el.children.length - 1) {
          if (!active_slide.dataset.last) {
            // Move the first one to the back as [data-last]
            el.firstElementChild.dataset.last = true;
            el.append(el.firstElementChild);
          } else {
            // Landed on fake last slide. Move it to the front, remove its [data-last] and move the last one to the front as [data-first]
            delete el.lastElementChild.dataset.last;
            el.prepend(el.lastElementChild);
            el.lastElementChild.dataset.first = true;
            el.prepend(el.lastElementChild);
          }
        } else {
          // Middle slide
          let leftover = el.querySelector(":scope > [data-first][data-last]");
          if (leftover) {
            delete leftover.dataset.first;
            delete leftover.dataset.last;
          }
        }
      }
    }
    // el.scrollTo(active * active_slide.scrollWidth, active * active_slide.scrollHeight);
    if (current_active) {
      // console.log("updateCarousel bailing on unchanged slide");
      if (active_slide === current_active) {
        // Scroll snapping back to the same slide. Nothing to do here.
        observersOn(el);
        return;
      }
      delete current_active.dataset.active;
      current_active.style.height = "";
      if (!isVertical(el)) {
        el.style.height = "";
      }
    }
    // console.log("updateCarousel working");
    active_slide.dataset.active = true;
    active_slide.style.height = "";
    el.style.setProperty("--height", `${el.parentNode.classList.contains("n-carousel--auto-height") ? nextSlideHeight(active_slide) : active_slide.scrollHeight}px`);
    window.requestAnimationFrame(() => {
      if (!el.parentNode.dataset.ready && isAuto(el) && isVertical(el)) {
        el.style.height = `${parseFloat(getComputedStyle(el).height) - paddingY(el)}px`;
      }
    });
    // Fix buttons
    let index = getControl(el.closest(".n-carousel"), ".n-carousel__index");
    if (!!index && !el.parentNode.classList.contains("n-carousel--inline")) {
      if (index.querySelector("[disabled]")) {
        index.querySelector("[disabled]").disabled = false;
      }
      index.children[active].disabled = true;
    }
    // Sliding to a slide with a hash? Update the URI
    let hash = active_slide.id;
    // console.log(hash);
    if (!!hash) {
      // console.log(hash);
      location.hash = `#${hash}`; // Doesn't work with soft reload. To do: scroll to relevant slide
    }
    // Disable focus on children of non-active slides
    // Active slides of nested carousels should also have disabled focus
    // Restore previous tabindex without taking into account the tabindex just added by the script
    [...el.children].forEach((slide) => {
      if (slide !== active_slide) {
        slide.querySelectorAll(focusableElements).forEach((el2) => {
          if (el2.closest(".n-carousel__content > :not([data-active])")) {
            if (el2.getAttribute("tabindex") && !el2.dataset.focusDisabled) {
              el2.dataset.oldTabIndex = el2.tabIndex;
            }
            el2.dataset.focusDisabled = true;
            el2.tabIndex = -1;
          }
        });
        // slide.dataset.disabledChildrenFocus = true;
      }
    });
    // console.log(active_slide);
    active_slide.querySelectorAll("[data-focus-disabled]").forEach((el2) => {
      if (!el2.closest(".n-carousel__content > :not([data-active])")) {
        el2.removeAttribute("tabindex");
        delete el2.dataset.focusDisabled;
        if (!!el2.dataset.oldTabIndex) {
          el2.tabIndex = el2.dataset.oldTabIndex;
          delete el2.dataset.oldTabIndex;
        }
      }
    });
    // delete active_slide.dataset.disabledChildrenFocus;
    observersOn(el);
  };
  // Setup isScrolling variable
  var isScrolling;
  var lastScrollX;
  var lastScrollY;
  var isResizing;
  const scrollStop = (e) => {
    // return;
    //     if (!!navigator.platform.match(/Win/)) {
    //       // Scrolling is broken on Windows
    //       // console.log("scroll Windows", e);
    //
    //       e.stopPropagation();
    //       e.preventDefault();
    //       return;
    //     }
    // return;
    // Clear our timeout throughout the scroll
    // console.log("scrolling", e, e.target.scrollLeft);
    let el = e.target;
    let mod_x = scrollStartX(el) % ceilingWidth(el.firstElementChild);
    let mod_y = el.scrollTop % ceilingHeight(el.firstElementChild);
    // console.log("mod while scrolling", mod_x, mod_y);
    // console.log("scroll while scrolling", scrollStartX(el));
    const afterScrollTimeout = () => {
      let mod_x = scrollStartX(el) % ceilingWidth(el.firstElementChild);
      let mod_y = el.scrollTop % ceilingHeight(el.firstElementChild);
      // console.log("mod after timeout", mod_x, mod_y);
      // console.log("scroll after timeout", scrollStartX(el));
      // console.log("scrollStop check", mod_x, mod_y);
      let new_x = Math.abs(Math.round(scrollStartX(el) / ceilingWidth(el.firstElementChild)));
      let new_y = Math.abs(Math.round(el.scrollTop / ceilingHeight(el.firstElementChild)));
      if (!("ontouchstart" in window) && (mod_x !== 0 || mod_y !== 0)) {
        // Stuck bc of Chrome/Safari bug when you scroll in both directions during snapping. Not needed on touch and glitchy there.
        // console.log("stuck", new_x, new_y, el);
        updateCarousel(el);
        // console.log("unstucking to ", new_y);
        let tabbing = false;
        if (!isSafari || !!el.tabbing) {
          slideTo(el, isVertical(el) ? new_y : new_x);
        }
        return;
      }
      if ("ontouchstart" in window && scrollStartX(el) === el.scrollWidth - el.offsetWidth && mod_x === el.firstElementChild.offsetWidth - 1) {
        // iPad last slide bug. Set mod_x to 0 so the next check can update the carousel
        mod_x = 0;
      }
      if (lastScrollX === scrollStartX(el) && lastScrollY === el.scrollTop && mod_x === 0 && mod_y === 0) {
        // Snapped to position, not stuck
        if (isAuto(el)) {
          observersOff(el);
          let old_height = parseFloat(getComputedStyle(el).height);
          let new_height;
          let offset_y = 0;
          if (isVertical(el)) {
            // let new_index = Math.abs(Math.round(el.scrollTop / (el.offsetHeight - paddingY(el))));
            // el.children[new_y].style.height = "auto";
            new_height = el.children[new_y].firstElementChild.scrollHeight; // To do: support multiple children and drop the requirement for a wrapper inside the slide
            // el.children[new_y].style.height = "";
            offset_y = new_y * new_height - el.scrollTop;
          } else {
            // let new_index = Math.abs(Math.round(scrollStartX(el) / (ceilingWidth(el) - paddingX(el))));
            // new_height = parseFloat(getComputedStyle(el.children[new_x].children[0]).height); // but shouldn't be lower than blank carousel height. worked around by min height of 9em which surpasses the blank carousel height
            new_height = nextSlideHeight(el.children[new_x]);
            scrollTo(el, lastScrollX, lastScrollY);
          }
          if (old_height === new_height) {
            new_height = false;
          }
          // console.log("scroll end new height", new_height);
          el.parentNode.dataset.sliding = true;
          window.requestAnimationFrame(() => {
            scrollAnimate(el, 0, offset_y, new_height, old_height);
          });
        } else {
          updateCarousel(el);
        }
      }
    };
    // if ("ontouchstart" in window && (mod_x > 1 || mod_y > 1 || !!el.parentNode.dataset.sliding || !el.matches(".n-carousel__content"))) {
    //   // It should also set up the timeout in case we're stuck after a while
    //   // return; // return only on touch Safari. What about iPad Safari with trackpad?
    // }
    clearTimeout(isScrolling);
    lastScrollX = scrollStartX(el);
    lastScrollY = el.scrollTop;
    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout(afterScrollTimeout, 166);
  };
  const slide = (el, offsetX, offsetY, index) => {
    clearTimeout(el.nCarouselTimeout);
    observersOff(el);
    if (!el.parentNode.dataset.sliding) {
      el.parentNode.dataset.sliding = true;
      let old_height = el.children[getIndex(el)].clientHeight;
      let new_height = old_height;
      let scroll_to_y = 0;
      if (isAuto(el)) {
        let old_scroll_left = scrollStartX(el);
        let old_scroll_top = el.scrollTop;
        if (isVertical(el)) {
          // el.children[index].style.height = "auto";
          new_height = el.children[index].firstElementChild.scrollHeight;
        } else {
          // new_height = parseFloat(getComputedStyle(el.children[index].children[0]).height);
          new_height = nextSlideHeight(el.children[index]);
          // let old_height = parseInt(el.dataset.x) === index ? new_height : parseFloat(getComputedStyle(el.children[el.dataset.x].children[0]).height);
          let old_height = parseInt(el.dataset.x) === index ? new_height : nextSlideHeight(el.children[el.dataset.x]);
          el.style.setProperty("--height", `${old_height}px`);
          // console.log("old index", el.dataset.x, "new index", index, "--height (old height):", old_height, "new height", new_height); // old height is wrong
        }
        // el.children[index].style.width = el.children[index].style.height = "";
        scrollTo(el, old_scroll_left + paddingX(el) / 2, old_scroll_top); // iPad bug
        scrollTo(el, old_scroll_left, old_scroll_top);
      }
      if (isVertical(el)) {
        scroll_to_y = offsetY - index * old_height + index * new_height;
      }
      window.requestAnimationFrame(() => {
        scrollAnimate(el, offsetX, scroll_to_y, new_height === old_height ? false : new_height, old_height); // Vertical version will need ceiling value
      });
    }
  };
  const slideNext = (el) => {
    let index = getIndex(el);
    slideTo(el, index >= el.children.length - 1 ? 0 : index + 1);
  };
  const slidePrevious = (el) => {
    let index = getIndex(el);
    slideTo(el, index === 0 ? el.children.length - 1 : index - 1);
  };
  const slideTo = (el, index) => {
    if (isVertical(el)) {
      slide(el, 0, ceilingHeight(el.children[index]) * index - el.scrollTop, index);
    } else {
      let width = Math.ceil(parseFloat(getComputedStyle(el.children[index]).width));
      let new_offset = isRTL(el) ? Math.abs(scrollStartX(el)) - width * index : width * index - scrollStartX(el);
      slide(el, new_offset, 0, index);
    }
  };
  const carouselKeys = (e) => {
    let keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
    let el = e.target;
    if (e.key === "Tab") {
      let carousel = el.closest(".n-carousel__content");
      carousel.tabbing = true;
      // setTimeout(e => { delete carousel.tabbing }, 100);
    }
    if (el.matches(".n-carousel__content") && keys.includes(e.key)) {
      // Capture relevant keys
      e.preventDefault();
      switch (e.key) {
        case "ArrowLeft": {
          isRTL(el) ? slideNext(el) : slidePrevious(el);
          break;
        }
        case "ArrowRight": {
          isRTL(el) ? slidePrevious(el) : slideNext(el);
          break;
        }
        case "ArrowUp":
        case "PageUp": {
          slidePrevious(el);
          break;
        }
        case "ArrowDown":
        case "PageDown": {
          slideNext(el);
          break;
        }
        case "Home": {
          slideTo(el, 0);
          break;
        }
        case "End": {
          slideTo(el, el.children.length - 1);
          break;
        }
      }
    }
  };
  const slidePreviousEvent = (e) => slidePrevious(closestCarousel(e.target.closest('[class*="n-carousel"]')));
  const slideNextEvent = (e) => slideNext(closestCarousel(e.target.closest('[class*="n-carousel"]')));
  const slideIndexEvent = (e) => {
    let el = e.target.closest("button");
    if (el) {
      const carousel = el.closest(".n-carousel");
      if (carousel.classList.contains("n-carousel--inline") && !carousel.classList.contains("n-carousel--overlay")) {
        carousel.classList.add("n-carousel--overlay"); // Should trigger mutation and auto update?
        // updateCarousel(carousel);
        // console.log("open modal");
        document.body.dataset.frozen = document.body.scrollTop;
        // carousel.animate([{ transform: "translateY(-100%)" }, { transform: "none" }], { duration: 200, fill: "forwards" });
        trapFocus(carousel);
        // carousel.nextSlideInstant = true;
      }
      window.requestAnimationFrame(() => {
        slideTo(closestCarousel(el), [...el.parentNode.children].indexOf(el));
      });
    }
  };
  const closeModal = (e) => {
    if (document.fullscreen || document.webkitIsFullScreen) {
      !!document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen();
    }
    let carousel = e.target.closest(".n-carousel");
    if (carousel) {
      carousel.classList.remove("n-carousel--overlay");
      delete document.body.dataset.frozen;
    }
  };
  const verticalAutoObserver = new ResizeObserver((entries) => {
    window.requestAnimationFrame(() => {
      entries.forEach((e) => {
        let slide = e.target;
        let el = slide.closest(".n-carousel__content");
        if (!!slide.parentNode.dataset.active && !el.parentNode.dataset.sliding) {
          el.style.height = `${slide.scrollHeight}px`;
        }
      });
    });
  });
  const updateSubpixels = (el) => {
    if (!el.parentNode.dataset.sliding) {
      // Round down the padding, because sub pixel padding + scrolling is a problem
      let carousel = el;
      // console.log(carousel);
      carousel.style.removeProperty("--subpixel-compensation-peeking_original");
      carousel.style.removeProperty("--subpixel-compensation-peeking");
      carousel.style.removeProperty("--subpixel-compensation");
      // if (el.parentNode.classList.contains("n-carousel--inline") && !el.parentNode.classList.contains("n-carousel--overlay")) {
      //   return;
      // }
      window.requestAnimationFrame(() => {
        if (isVertical(el)) {
          var subpixel_compensation = ceilingHeight(carousel) - carousel.getBoundingClientRect().height;
          var peeking_compensation = carousel.firstElementChild.getBoundingClientRect().y - carousel.getBoundingClientRect().y;
        } else {
          var subpixel_compensation = ceilingWidth(carousel) - carousel.getBoundingClientRect().width;
          var peeking_compensation = carousel.firstElementChild.getBoundingClientRect().x - carousel.getBoundingClientRect().x;
        }
        let subpixel_compensation_peeking_original = Math.ceil(peeking_compensation) - peeking_compensation;
        let subpixel_compensation_peeking = 2 * subpixel_compensation_peeking_original;
        if (subpixel_compensation_peeking !== 0) {
          subpixel_compensation_peeking -= subpixel_compensation;
        }
        carousel.style.setProperty("--subpixel-compensation", subpixel_compensation);
        carousel.style.setProperty("--subpixel-compensation-peeking", subpixel_compensation_peeking);
        carousel.style.setProperty("--subpixel-compensation-peeking-original", subpixel_compensation_peeking_original);
        // console.log(carousel.children[carousel.dataset.x], carousel.children[carousel.dataset.y]);
        let offset = [...carousel.children].indexOf(carousel.querySelector(":scope > [data-active]")); // Real offset including displaced first/last slides
        scrollTo(carousel, offset * ceilingWidth(carousel), offset * ceilingHeight(carousel));
      });
    }
  };
  const observersOn = (el) => {
    delete el.parentNode.dataset.sliding;
    window.requestAnimationFrame(() => {
      if (el.parentNode.matches(".n-carousel--vertical.n-carousel--controls-outside.n-carousel--auto-height")) {
        height_minus_index.observe(el.parentNode);
      }
      el.addEventListener("scroll", scrollStop, {
        passive: true
      });
      subpixel_observer.observe(el);
      mutation_observer.observe(el.parentNode, {
        attributes: true,
        attributeFilter: ["class"],
      });
    });
  };
  const observersOff = (el) => {
    el.removeEventListener("scroll", scrollStop);
    height_minus_index.unobserve(el.parentNode);
    subpixel_observer.unobserve(el);
    mutation_observer.disconnect();
    el.observerStarted = true;
    // el.removeEventListener("mousewheel", detectTrackPad);
    // el.removeEventListener("DOMMouseScroll", detectTrackPad);
  };
  const updateObserver = (el) => {
    console.log('observer fired at ', el, el.observerStarted);
    // el = el.querySelector(":scope > .n-carousel__content");
    observersOff(el);
    const doUpdate = el => {
      updateSubpixels(el);
      window.requestAnimationFrame(() => {
        // console.log("resized", el);
        // let current_height = getComputedStyle(el.querySelector(":scope > [data-active] > *")).height;
        let current_height = el.querySelector(":scope > [data-active]").scrollHeight + "px";
        let previous_height = getComputedStyle(el).getPropertyValue("--height");
        if (current_height !== previous_height) {
          el.style.setProperty("--height", current_height);
        }
        observersOn(el);
      });
    };
    doUpdate(el);
    el.querySelectorAll('.n-carousel__content').forEach(el => doUpdate(el));
  };
  const subpixel_observer = new ResizeObserver((entries) => {
    // return;
    window.requestAnimationFrame(() => {
      entries.forEach((e) => {
        let el = e.target;
        if (!!el.observerStarted) {
          el.observerStarted = false;
          console.log("observers already started", el);
          return;
        }
        updateObserver(el);
        // console.log(e.target);
      });
    });
  });
  const mutation_observer = new MutationObserver((mutations) => {
    // return;
    // console.log("mutations", mutations);
    for (let mutation of mutations) {
      // console.log("mutated ", mutation.target);
      if (mutation.target) {
        updateObserver(mutation.target.querySelector(":scope > .n-carousel__content"));
      }
    }
  });
  const setIndexWidth = (el) => {
    let index = el.querySelector(":scope > .n-carousel__index");
    if (index && !el.dataset.sliding) {
      el.style.removeProperty("--height-minus-index");
      index.style.position = "absolute";
      el.style.setProperty("--height-minus-index", `${el.offsetHeight}px`);
      el.style.setProperty("--index-width", getComputedStyle(el.querySelector(":scope > .n-carousel__index")).width);
      index.style.position = "";
    }
  };
  const height_minus_index = new ResizeObserver((entries) => {
    // Limit outside index height to carousel height
    window.requestAnimationFrame(() => {
      // Observing the carousel wrapper
      entries.forEach((e) => {
        let el = e.target;
        setIndexWidth(el);
      });
    });
  });
  const init = (host = document) => {
    host.querySelectorAll(".n-carousel:not([data-ready])").forEach((el) => {
      const previous = getControl(el, ".n-carousel__previous");
      const next = getControl(el, ".n-carousel__next");
      const index = getControl(el, ".n-carousel__index");
      const close_modal = getControl(el, ".n-carousel__close");
      const full_screen = getControl(el, ".n-carousel__full-screen");
      if (!!previous) {
        previous.onclick = slidePreviousEvent;
      }
      if (!!next) {
        next.onclick = slideNextEvent;
      }
      if (!!index) {
        index.onclick = slideIndexEvent;
      }
      if (!!close_modal) {
        close_modal.onclick = closeModal;
      }
      if (!!full_screen) {
        full_screen.onclick = (e) => {
          let carousel = e.target.closest(".n-carousel").querySelector(":scope > .n-carousel__content");
          carousel.dataset.xx = carousel.dataset.x;
          carousel.dataset.yy = carousel.dataset.y;
          // let x = carousel.dataset.x;
          // let y = carousel.dataset.y;
          // console.log(x, carousel.scrollLeft);
          toggleFullScreen(e.target);
        };
        const fullScreenEvent = (e) => {
          // Chrome: Keep and update the real scroll here
          let carousel = e.target.querySelector(":scope > .n-carousel__content");
          // let x = carousel.dataset.x;
          // let y = carousel.dataset.y;
          // console.log('full screen change', x, carousel.scrollLeft);
          // $0.scrollTo($0.dataset.xx * Math.ceil(parseFloat(getComputedStyle($0.firstElementChild).width)), 0); delete $0.dataset.xx;
          // console.log(carousel.dataset.xx, carousel.dataset.xx * ceilingWidth(carousel.children[carousel.dataset.xx]));
          window.requestAnimationFrame(() => {
            // console.log("full screen toggle ", carousel);
            updateCarousel(carousel);
            carousel.dataset.x = carousel.dataset.xx;
            carousel.dataset.y = carousel.dataset.yy;
            delete carousel.dataset.xx;
            delete carousel.dataset.yy;
            if (carousel.dataset.x !== "undefined" && carousel.dataset.y !== "undefined") {
              scrollTo(carousel, carousel.dataset.x * ceilingWidth(carousel.children[carousel.dataset.x]), carousel.dataset.y * ceilingHeight(carousel.children[carousel.dataset.y]));
            }
          });
        };
        if (isSafari) {
          el.onwebkitfullscreenchange = fullScreenEvent;
        } else {
          el.onfullscreenchange = fullScreenEvent;
        }
      }
      el.querySelector(".n-carousel__content").onkeydown = carouselKeys;
      el.parentNode.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
          closeModal(e);
        }
      });
      let content = el.querySelector(":scope > .n-carousel__content");
      updateSubpixels(content);
      content.observerStarted = true;
      // content.tabIndex = 0;
      let hashed_slide = !!location.hash ? content.querySelector(":scope > " + location.hash) : false;
      if (hashed_slide) {
        // console.log(hashed_slide);
        let index = [...hashed_slide.parentNode.children].indexOf(hashed_slide);
        if (isVertical(content)) {
          content.dataset.y = index;
        } else {
          content.dataset.x = index;
        }
        slideTo(content, index);
      }
      if (el.matches(".n-carousel--vertical.n-carousel--auto-height")) {
        content.style.height = getComputedStyle(content).height;
        el.dataset.ready = true;
        content.scrollTop = 0; // Should be a different value if the initial active slide is other than the first one (unless updateCarousel() takes care of it)
      }
      if (el.matches(".n-carousel--vertical.n-carousel--auto-height")) {
        // Vertical auto has a specified height which needs update on resize
        content.querySelectorAll(":scope > * > *").forEach((el) => verticalAutoObserver.observe(el));
      }
      window.requestAnimationFrame(() => {
        // console.log('observing ', content);
        observersOn(content);
        el.dataset.ready = true;
        if (el.parentNode.matches(".n-carousel--vertical.n-carousel--controls-outside.n-carousel--auto-height")) {
          setIndexWidth(el);
        }
        updateCarousel(content);
        if (el.matches(".n-carousel--auto-slide")) {
          let auto_delay = (parseFloat(el.dataset.interval) * 1000 || default_interval) + (parseFloat(el.dataset.duration) * 1000 || default_duration);
          let carouselTimeout = () => {
            if (isElementInViewport(content)) {
              slideNext(content);
            }
            content.nCarouselTimeout = setTimeout(carouselTimeout, auto_delay);
          };
          content.nCarouselTimeout = setTimeout(carouselTimeout, parseFloat(el.dataset.interval) * 1000 || default_interval);
          content.addEventListener("pointerenter", (e) => clearTimeout(e.target.nCarouselTimeout));
        }
        el.dataset.platform = navigator.platform;
      });
      content.nCarouselUpdate = updateCarousel;
    });
  };
  window.nCarouselInit = init;
  typeof registerComponent === "function" ? registerComponent("n-carousel", init) : init();
})();