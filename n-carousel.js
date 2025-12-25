import "./scrollyfills.module.js"; // scrollend event polyfill
(function () {
  const ceilingWidth = (el) =>
    Math.ceil(parseFloat(getComputedStyle(el).width));
  const ceilingHeight = (el) =>
    Math.ceil(parseFloat(getComputedStyle(el).height));
  const focusableElements =
    'button, [href], input, select, textarea, details, summary, video, [tabindex]:not([tabindex="-1"])';
  function isElementInViewport(el) {
    let rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight ||
          document.documentElement.offsetHeight) /* or $(window).height() */ &&
      rect.right <=
        (window.innerWidth ||
          document.documentElement.offsetWidth) /* or $(window).width() */
    );
  }
  const default_duration = 500;
  const default_interval = 4000;
  const SCROLL_END_TIMEOUT = 10;
  const MAX_HEIGHT_FALLBACK = 99999;
  const isSafari =
    navigator.userAgent.match(/Safari/) && !navigator.userAgent.match("Chrome");
  const isEndless = (el) =>
    el.children.length > 2 &&
    el.parentElement.classList.contains("n-carousel--endless");
  const isFullScreen = () => {
    return !!(document.webkitFullscreenElement || document.fullscreenElement);
  };
  const isModal = (el) => {
    return el.closest(".n-carousel").classList.contains("n-carousel--overlay");
  };
  const isVertical = (el) =>
    el.closest(".n-carousel").matches(".n-carousel--vertical");
  const isAutoHeight = (el) =>
    el.closest(".n-carousel").matches(".n-carousel--auto-height");
  const indexControls = (index) => {
    let controls_by_class = index.querySelectorAll(".n-carousel__control");
    return controls_by_class.length > 0
      ? controls_by_class
      : index.querySelectorAll("a, button");
  };
  const scrollEndAction = (carousel) => {
    carousel = carousel.target || carousel;
    const carouselStyle = getComputedStyle(carousel);
    let index = Math.abs(
      Math.round(
        isVertical(carousel)
          ? carousel.scrollTop /
              (carousel.offsetHeight -
                parseFloat(carouselStyle.paddingBlockStart) -
                parseFloat(carouselStyle.paddingBlockEnd))
          : carousel.scrollLeft /
              (carousel.offsetWidth -
                parseFloat(carouselStyle.paddingInlineStart) -
                parseFloat(carouselStyle.paddingInlineEnd)),
        2
      )
    );
    let slide = carousel.children[index];
    if (
      !!carousel.parentNode.sliding ||
      (carousel.dataset.next &&
        parseInt(carousel.dataset.next) !==
          Array.prototype.indexOf.call(carousel.children, slide))
    ) {
      return;
    }
    carousel.parentNode.dataset.sliding = true;
    delete carousel.dataset.next;
    observersOff(carousel);
    let x = carousel.scrollLeft;
    let y = carousel.scrollTop;
    let timeout_function = () => {
      let index = Array.prototype.indexOf.call(carousel.children, slide);
      if (isAutoHeight(carousel)) {
        let old_height = parseFloat(getComputedStyle(carousel).height);
        let new_height;
        let offset_y = 0;
        let lastScrollX = carousel.scrollLeft;
        let lastScrollY = carousel.scrollTop;
        if (isVertical(carousel)) {
          let scroll_offset = carousel.scrollTop;
          slide.style.height = "auto";
          let computed_max_height = getComputedStyle(carousel).maxHeight;
          let max_height = computed_max_height.match(/px/)
            ? Math.ceil(parseFloat(computed_max_height))
            : MAX_HEIGHT_FALLBACK;
          new_height = Math.min(
            Math.ceil(parseFloat(getComputedStyle(slide).height)),
            max_height
          );
          if (isModal(carousel) || isFullScreen()) {
            old_height = new_height = carousel.offsetHeight;
          }
          slide.style.height = "";
          carousel.scrollTop = scroll_offset;
          offset_y = index * new_height - carousel.scrollTop;
        } else {
          new_height = nextSlideHeight(slide);
          if (!!lastScrollX) {
            // Because RTL auto height landing on first slide creates an infinite intersection observer loop
            scrollTo(carousel, lastScrollX, lastScrollY);
          }
        }
        if (old_height === new_height) {
          new_height = false;
        }
        window.requestAnimationFrame(() => {
          scrollAnimate(carousel, 0, offset_y, new_height, old_height).then(
            () => {}
          );
        });
      } else {
        window.requestAnimationFrame(() => {
          updateCarousel(carousel);
        });
      }
    };
    setTimeout(timeout_function, SCROLL_END_TIMEOUT);
  };
  const hashNavigation = (e) => {
    // Hash navigation support
    if (!!location.hash) {
      let el = document.querySelector(location.hash);
      let carousel = el?.parentNode;
      if (
        !!carousel &&
        carousel.classList.contains("n-carousel__content") &&
        !carousel.parentNode.closest(".n-carousel__content")
      ) {
        let modal_carousel = document.querySelector(
          ".n-carousel--overlay > .n-carousel__content"
        );
        if (modal_carousel && modal_carousel !== carousel) {
          closeModal(modal_carousel);
        }
        if (carousel.parentNode.classList.contains("n-carousel--inline")) {
          closeModal(carousel);
        }
        if (isSafari) {
          // Safari has already scrolled and needs to rewind it scroll position in order to animate it
          scrollTo(
            carousel,
            carousel.offsetWidth * carousel.dataset.x,
            carousel.offsetHeight * carousel.dataset.y
          );
        }
        slideTo(carousel, Array.prototype.indexOf.call(carousel.children, el));
        window.nCarouselNav = [carousel, location.hash];
      }
    } else {
      if (window.nCarouselNav) {
        // Previously navigated to a slide
        let carousel = window.nCarouselNav[0];
        delete window.nCarouselNav;
        if (isSafari) {
          // Safari has already scrolled and needs to rewind it scroll position in order to animate it
          scrollTo(
            carousel,
            carousel.offsetWidth * carousel.dataset.x,
            carousel.offsetHeight * carousel.dataset.y
          );
        }
        slideTo(
          carousel,
          Array.prototype.indexOf.call(
            carousel.children,
            carousel.querySelector(":scope > :not([id])")
          )
        );
      }
    }
  };
  const nextSlideHeight = (el) => {
    el.style.height = 0;
    el.style.overflow = "auto";
    const height = el.scrollHeight; // Ceiling when subpixel
    el.style.height = el.style.overflow = "";
    return height;
  };
  const getIndex = (el) => 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
  const getIndexReal = (el) => {
    let active_slide = el.querySelector(":scope > [aria-current]");
    if (active_slide) {
      return [...el.children].indexOf(active_slide);
    } else {
      let hash_slide = null;
      if (location.hash && location.hash.length > 1) {
        try {
          hash_slide = el.querySelector(`:scope > ${location.hash}`);
        } catch (e) {
          // Invalid selector, ignore
        }
      }
      let hash_slide_index = hash_slide
        ? Array.prototype.indexOf.call(el.children, hash_slide)
        : -1;
      return hash_slide_index > -1 ? hash_slide_index : 0;
    }
  };
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
    while (
      a &&
      typeof a.scrollLeft !== "undefined" &&
      (a.scrollTop !== 0 || a.scrollLeft !== 0)
    ) {
      arr.push(a);
      a = scrolledAncestor(a);
    }
    return arr;
  };
  const isRTL = (el) => getComputedStyle(el).direction === "rtl";
  const toggleFullScreen = (el) => {
    el = el.closest(".n-carousel");
    let carousel = el.querySelector(":scope > .n-carousel__content");
    const restoreScroll = () => {
      if (!isFullScreen()) {
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
    carousel.togglingFullScreen = true;
    if (isFullScreen()) {
      // Exit full screen
      !!document.exitFullscreen
        ? document.exitFullscreen()
        : document.webkitExitFullscreen();
      if (isSafari) {
        // When exit finishes, update the carousel because on Safari 14, position is wrong or the slide is invisible
        setTimeout(() => {
          el.style.display = "none";
          window.requestAnimationFrame(() => {
            el.style.display = "";
          });
        }, 0);
      }
      if (isVertical(el) && isAutoHeight(el)) {
        let updateExitFullScreen = (e) => {
          setTimeout(() => {
            let carousel = el.querySelector(":scope > .n-carousel__content");
            slideTo(carousel, parseInt(carousel.dataset.y));
          }, 100);
          el.removeEventListener("fullscreenchange", updateExitFullScreen);
        };
        el.addEventListener("fullscreenchange", updateExitFullScreen);
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
      }
      !!el.requestFullscreen
        ? el.requestFullscreen()
        : el.webkitRequestFullscreen();
    }
  };
  const scrollStartX = (el) => el.scrollLeft; // Get correct start scroll position for LTR and RTL
  const scrollTo = (el, x, y) => {
    el.scrollTo(isRTL(el) ? -1 * Math.abs(x) : x, y); // Scroll to correct scroll position for LTR and RTL
  };
  const getScroll = (el) =>
    el === window
      ? {
          x: el.scrollX,
          y: el.scrollY,
        }
      : {
          x: scrollStartX(el),
          y: el.scrollTop,
        };
  let firstFocusableElement = null;
  let focusableContent = null;
  let lastFocusableElement = null;
  const focusHandler = (e) => {
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
  };
  const trapFocus = (modal, off = false) => {
    // FROM: https://uxdesign.cc/how-to-trap-focus-inside-modal-to-make-it-ada-compliant-6a50f9a70700
    // add all the elements inside modal which you want to make focusable
    firstFocusableElement = modal.querySelectorAll(focusableElements)[0]; // get first element to be focused inside modal
    focusableContent = modal.querySelectorAll(focusableElements);
    lastFocusableElement = focusableContent[focusableContent.length - 1]; // get last element to be focused inside modal
    if (off) {
      modal.removeEventListener("keydown", focusHandler);
    } else {
      modal.addEventListener("keydown", focusHandler);
      firstFocusableElement.focus();
    }
  };
  const inOutSine = (n) => (1 - Math.cos(Math.PI * n)) / 2;
  const paddingX = (el) =>
    parseInt(getComputedStyle(el).paddingInlineStart) * 2;
  const paddingY = (el) => parseInt(getComputedStyle(el).paddingBlockStart) * 2;
  const getControl = (carousel, control) => {
    let detached_control = document.querySelector(
      `${control}[data-for="${carousel.id}"]`
    );
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
  const closestCarousel = (el) => {
    var related_by_id = el.closest('[class*="n-carousel"]').dataset.for;
    if (!!related_by_id) {
      return document
        .getElementById(related_by_id)
        .querySelector(".n-carousel__content");
    } else {
      return el.closest(".n-carousel").querySelector(".n-carousel__content");
    }
  };
  const scrollAnimate = (
    el,
    distanceX,
    distanceY,
    new_height,
    old_height = false
  ) =>
    new Promise((resolve) => {
      // Thanks https://stackoverflow.com/posts/46604409/revisions
      let wrapper = el.closest(".n-carousel");
      if (
        !!wrapper.nextSlideInstant ||
        !wrapper.dataset.ready ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        wrapper.matches(".n-carousel--instant")
      ) {
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
        if (isVertical(el) && isAutoHeight(el)) {
          el.style.setProperty("--subpixel-compensation", 0);
        }
      } else {
        if (!isVertical(el)) {
          el.style.height = "";
        }
      }
      var startx = getScroll(el).x;
      var starty = getScroll(el).y;
      var starth = parseInt(el.style.height);
      var distanceH = new_height - starth;
      var duration =
        parseFloat(el.parentNode.dataset.duration) * 1000 || default_duration;
      var start = null;
      var end = null;
      let startAnim = (timeStamp) => {
        start = timeStamp;
        end = start + duration;
        draw(timeStamp);
      };
      let draw = (now) => {
        if (now - start >= duration) {
          // sliding ends
          window.requestAnimationFrame(() => {
            scrollTo(el, startx + distanceX, starty + distanceY);
            if (new_height) {
              el.style.height = `${new_height}px`;
            }
            updateCarousel(el);
          });
          resolve(el);
          return;
        }
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
  const updateCarousel = (el, forced = false) => {
    // Forced means never skip unnecessary update
    // Called on init and scroll end
    if (el.togglingFullScreen) {
      return;
    }
    observersOff(el);
    let saved_x = el.dataset.x; // On displaced slides and no change
    let saved_y = el.dataset.y;
    el.dataset.x = Math.abs(
      Math.round(scrollStartX(el) / ceilingWidth(el.firstElementChild))
    );
    el.dataset.y = Math.abs(
      Math.round(el.scrollTop / ceilingHeight(el.firstElementChild))
    );
    // When inline
    if (el.dataset.x === "NaN") {
      el.dataset.x = 0;
    }
    if (el.dataset.y === "NaN") {
      el.dataset.y = 0;
    }
    let active_index = getIndex(el);
    if (active_index >= el.children.length) {
      active_index = el.children.length - 1;
    }
    let old_active_slide = el.querySelector(":scope > [aria-current]");
    let wrapper = el.parentElement;
    if (!isAutoHeight(wrapper)) {
      // Dynamic change from auto height to normal
      el.style.height = "";
    }
    let active_slide = el.children[active_index];
    if (old_active_slide && !forced) {
      if (active_slide === old_active_slide) {
        // Scroll snapping back to the same slide. Nothing to do here.
        el.dataset.x = saved_x;
        el.dataset.y = saved_y;
        observersOn(el);
        return;
      }
      old_active_slide.removeAttribute("aria-current");
      old_active_slide.style.height = "";
      if (!isVertical(el)) {
        el.style.height = "";
      }
    }
    // active_slide.ariaCurrent = true; // Unsupported by FF
    active_slide.setAttribute("aria-current", true);
    var active_index_real = (el.dataset.x = el.dataset.y = getIndexReal(el));
    // Endless carousel
    const restoreDisplacedSlides = (el) => {
      el.querySelectorAll(":scope > [data-first]").forEach((el2) => {
        el.append(el.firstElementChild);
        delete el2.dataset.first;
        active_index--;
      });
      el.querySelectorAll(":scope > [data-last]").forEach((el2) => {
        el.prepend(el.lastElementChild);
        delete el2.dataset.last;
        active_index++;
      });
    };
    wrapper.dataset.sliding = true;
    if (isEndless(el) && !forced) {
      if (active_index === 0) {
        if (!active_slide.dataset.first) {
          // Move the last one to the front as [data-first]
          if (el.lastElementChild.dataset.last) {
            delete el.lastElementChild.dataset.last;
            active_index_real = 1;
          } else {
            el.lastElementChild.dataset.first = true;
          }
          el.prepend(el.lastElementChild);
          active_index = 1;
        } else {
          // Landed on fake first slide. Move it to the back, remove its [data-first] and move the first one to the back as [data-last]
          delete el.firstElementChild.dataset.first;
          el.append(el.firstElementChild);
          el.firstElementChild.dataset.last = true;
          el.append(el.firstElementChild);
          active_index_real = el.children.length - 1;
          active_index = el.children.length - 2;
        }
      } else {
        if (active_index === el.children.length - 1) {
          if (!active_slide.dataset.last) {
            // Move the first one to the back as [data-last]
            if (el.firstElementChild.dataset.first) {
              delete el.firstElementChild.dataset.first;
              active_index_real = el.children.length - 2;
            } else {
              el.firstElementChild.dataset.last = true;
            }
            el.append(el.firstElementChild);
            active_index = el.children.length - 2;
          } else {
            // Landed on fake last slide. Move it to the front, remove its [data-last] and move the last one to the front as [data-first]
            delete el.lastElementChild.dataset.last;
            el.prepend(el.lastElementChild);
            el.lastElementChild.dataset.first = true;
            el.prepend(el.lastElementChild);
            active_index_real = 0;
            active_index = 1;
          }
        } else {
          // Middle slide
          restoreDisplacedSlides(el);
          let activeSlide = el.querySelector(":scope > [aria-current]");
          active_index_real = activeSlide
            ? Math.max(
                0,
                Array.prototype.indexOf.call(el.children, activeSlide)
              )
            : 0; // Fixes position when sliding to/from first slide; max because of FF returning -1
        }
      }
      const updateScroll = () => {
        el.dataset.x = el.dataset.y = active_index_real;
        let scroll_x = ceilingWidth(el.firstElementChild) * active_index;
        let scroll_y = ceilingHeight(el.firstElementChild) * active_index;
        el.scroll_x = scroll_x;
        el.scroll_y = scroll_y;
        scrollTo(el, scroll_x, scroll_y); // First element size, because when Peeking, it differs from carousel size
        delete el.scroll_x;
        delete el.scroll_y;
      };
      if (isVertical(el) && isAutoHeight(el)) {
        window.requestAnimationFrame(() => {
          // Causes blinking, but needed for vertical auto height endless
          updateScroll();
        });
      } else {
        updateScroll();
      }
    } else {
      // Check and restore dynamically disabled endless option
      restoreDisplacedSlides(el);
      let activeSlide = el.querySelector(":scope > [aria-current]");
      active_index_real = activeSlide
        ? Math.max(0, Array.prototype.indexOf.call(el.children, activeSlide))
        : 0; // Fixes position when sliding to/from first slide; max because of FF returning -1
    }
    active_slide.style.height = "";
    wrapper.style.setProperty(
      "--height",
      `${
        isAutoHeight(el)
          ? nextSlideHeight(active_slide)
          : active_slide.scrollHeight
      }px`
    );
    window.requestAnimationFrame(() => {
      if (!el.parentNode.dataset.ready && isAutoHeight(el) && isVertical(el)) {
        el.style.height = `${
          parseFloat(getComputedStyle(el).height) - paddingY(el)
        }px`;
      }
    });
    // Sliding to a slide with a hash? Update the URI
    if (getComputedStyle(el).visibility !== "hidden") {
      let previously_active = document.activeElement;
      let hash = active_slide.id;
      if (
        !!el.parentNode.dataset.ready &&
        !!hash &&
        !el.parentNode.closest(".n-carousel__content")
      ) {
        // Hash works only with top-level carousel
        location.hash = `#${hash}`;
      }
      if (
        !!el.parentNode.dataset.ready &&
        !hash &&
        !el.parentNode.closest(".n-carousel__content") &&
        window.nCarouselNav
      ) {
        // Hash works only with top-level carousel
        location.hash = "";
      }
      previously_active.focus();
    }
    // Fix buttons
    let index = getControl(el.closest(".n-carousel"), ".n-carousel__index");
    if (!!index) {
      index.querySelector("[aria-current]")?.removeAttribute("aria-current");
      // index.children[active_index_real].ariaCurrent = true; // Unsupported by FF
      indexControls(index)[active_index_real].setAttribute(
        "aria-current",
        true
      );
    }
    // Disable focus on children of non-active slides
    // Active slides of nested carousels should also have disabled focus
    [...el.children].forEach((el) => {
      // Native "inert" attribute to replace the below "focusDisabled" loops from June 2022.
      el.inert = el === active_slide ? false : true;
      if (isSafari && el.querySelector(".n-carousel:-webkit-full-screen")) {
        // Safari full screen bug: parent scroll resets to 0, first slide becomes active and the full screen child lightbox is inside an inert parent
        let current = el.parentNode.querySelector(
          ':scope > [aria-current="true"]'
        );
        current.inert = true;
        current.removeAttribute("aria-current");
        el.inert = false;
        el.setAttribute("aria-current", true);
      }
    });
    if (/--vertical.*--auto-height/.test(wrapper.classList)) {
      // Undo jump to wrong slide when sliding to the last one
      el.scrollTop = el.offsetHeight * active_index_real;
    }
    window.requestAnimationFrame(() => {
      observersOn(el);
    });
  };
  const slide = (el, offsetX = 0, offsetY = 0, index) => {
    clearTimeout(el.nCarouselTimeout);
    if (!el.parentNode.dataset.sliding) {
      el.parentNode.dataset.sliding = true;
      let old_height = el.children[getIndexReal(el)].offsetHeight;
      let new_height = old_height;
      if (isAutoHeight(el)) {
        let old_scroll_left = scrollStartX(el);
        let old_scroll_top = el.scrollTop;
        let slide = el.children[index];
        if (isVertical(el)) {
          slide.style.height = "auto";
          let computed_max_height = getComputedStyle(el).maxHeight;
          let max_height = computed_max_height.match(/px/)
            ? Math.ceil(parseFloat(computed_max_height))
            : MAX_HEIGHT_FALLBACK;
          new_height = Math.min(
            Math.ceil(parseFloat(getComputedStyle(slide).height)),
            max_height
          );
          slide.style.height = "";
        } else {
          new_height = nextSlideHeight(slide);
          let old_height =
            getIndexReal(el) === index
              ? new_height
              : nextSlideHeight(el.children[getIndexReal(el)]);
          el.parentNode.style.setProperty("--height", `${old_height}px`);
        }
        scrollTo(el, old_scroll_left + paddingX(el) / 2, old_scroll_top); // iPad bug
        scrollTo(el, old_scroll_left, old_scroll_top);
      }
      if (isVertical(el)) {
        if ((isModal(el) || isFullScreen()) && isAutoHeight(el)) {
          old_height = new_height = el.offsetHeight;
        }
        offsetY = offsetY - index * old_height + index * new_height;
      }
      window.requestAnimationFrame(() => {
        if (!el.parentNode.dataset.duration && !isAutoHeight(el)) {
          // Unspecified duration, no height change – using native smooth scroll
          delete el.parentNode.dataset.sliding;
          el.dataset.next = index;
          el.scrollTo({
            top: el.scrollTop + offsetY,
            left: el.scrollLeft + offsetX,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
          });
        } else {
          scrollAnimate(
            el,
            offsetX,
            offsetY,
            new_height === old_height ? false : new_height,
            old_height
          ); // Vertical version will need ceiling value
        }
      });
    }
  };
  const slideNext = (el) => {
    let index = getIndexReal(el);
    slideTo(el, index >= el.children.length - 1 ? 0 : index + 1);
  };
  const slidePrevious = (el) => {
    let index = getIndexReal(el);
    slideTo(el, index === 0 ? el.children.length - 1 : index - 1);
  };
  const slideTo = (el, index) => {
    if (isVertical(el)) {
      slide(
        el,
        0,
        ceilingHeight(el.children[index]) * index - el.scrollTop,
        index
      );
    } else {
      let width = Math.ceil(
        parseFloat(getComputedStyle(el.children[index]).width)
      );
      let new_offset = isRTL(el)
        ? Math.abs(scrollStartX(el)) - width * index
        : width * index - scrollStartX(el);
      slide(el, new_offset, 0, index);
    }
  };
  const carouselKeys = (e) => {
    let keys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
    ];
    let el = e.target
      .closest(".n-carousel")
      .querySelector(":scope > .n-carousel__content");
    if (keys.includes(e.key)) {
      // Capture relevant keys
      // e.preventDefault();
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
  const slidePreviousEvent = (e) =>
    slidePrevious(closestCarousel(e.target.closest('[class*="n-carousel"]')));
  const slideNextEvent = (e) =>
    slideNext(closestCarousel(e.target.closest('[class*="n-carousel"]')));
  const slideIndexEvent = (e) => {
    let el = e.target.closest("a, button");
    if (el && !(el.href && (e.ctrlKey || e.metaKey))) {
      const wrapper =
        document.querySelector(`.n-carousel#${el.parentNode.dataset.for}`) ||
        el.closest(".n-carousel");
      const carousel = wrapper.querySelector(":scope > .n-carousel__content");
      let new_index = Array.prototype.indexOf.call(
        indexControls(el.parentNode),
        el
      );
      if (isEndless(carousel)) {
        var old_index = getIndex(carousel);
        if (old_index === 0) {
          if (new_index === carousel.children.length - 1) {
            new_index = 0;
          } else {
            new_index++;
          }
        }
        if (old_index === carousel.children.length - 1) {
          if (new_index === 0) {
            new_index = carousel.children.length - 1;
          } else {
            new_index--;
          }
        }
      }
      if (
        wrapper.classList.contains("n-carousel--inline") &&
        !isModal(carousel)
      ) {
        // Opening an inline carousel
        wrapper.nextSlideInstant = true;
        openModal(carousel);
        // Set new x, y
        window.requestAnimationFrame(() => {
          carousel.dataset.x = carousel.dataset.y = new_index;
          scrollTo(
            carousel,
            carousel.offsetWidth * carousel.dataset.x,
            carousel.offsetHeight * carousel.dataset.y
          );
          document.body.dataset.frozen = document.body.scrollTop;
          updateCarousel(carousel);
        });
      } else {
        window.requestAnimationFrame(() => {
          slideTo(carousel, new_index);
        });
      }
      return false;
    }
  };
  const closeModalOnBodyClick = (e) => {
    let overlay = document.querySelector(".n-carousel--overlay");
    if (overlay && e.key === "Escape") {
      closeModal(overlay);
    }
  };
  const closeModal = (el) => {
    if (isFullScreen()) {
      !!document.exitFullscreen
        ? document.exitFullscreen()
        : document.webkitExitFullscreen();
    }
    let carousel = closestCarousel(el);
    if (carousel) {
      carousel.parentNode.toggleModal = true; // skip mutation observer
      carousel.closest(".n-carousel").classList.remove("n-carousel--overlay");
      trapFocus(carousel.closest(".n-carousel"), true); // Disable focus trap
      delete document.body.dataset.frozen;
    }
    document.body.removeEventListener("keyup", closeModalOnBodyClick);
  };
  const openModal = (el) => {
    let carousel = closestCarousel(el);
    if (carousel) {
      carousel.parentNode.toggleModal = true; // skip mutation observer
      carousel.closest(".n-carousel").classList.add("n-carousel--overlay");
      trapFocus(carousel.closest(".n-carousel"));
      setTimeout(() => {
        document.body.addEventListener("keyup", closeModalOnBodyClick);
      }, 100);
    }
  };
  const autoHeightObserver = new ResizeObserver((entries) => {
    window.requestAnimationFrame(() => {
      entries.forEach((e) => {
        let slide = e.target.querySelector(":scope > [aria-current]");
        let el = slide.closest(".n-carousel__content");
        let carousel = el.closest(".n-carousel");
        // Skip auto-height updates in fullscreen/overlay mode
        if (isModal(carousel) || isFullScreen()) {
          return;
        }
        if (!el.parentElement.dataset.sliding) {
          el.parentNode.style.removeProperty("--height");
          if (isVertical(el)) {
            slide.style.height = "auto";
            el.style.height = `${slide.scrollHeight}px`;
            slide.style.height = "";
            updateCarousel(el);
          } else {
            el.style.height = "";
            el.style.height = `${slide.scrollHeight}px`;
            updateCarousel(el, true);
          }
        }
      });
    });
  });
  const updateSubpixels = (el) => {
    if (!el.parentNode.dataset.sliding) {
      // Round down the padding, because sub pixel padding + scrolling is a problem
      let carousel = el;
      carousel.style.padding = ""; // Subpixel peeking fix
      carousel.style.removeProperty("--peek-int");
      carousel.style.padding = isVertical(carousel)
        ? `${parseInt(getComputedStyle(carousel).paddingBlockStart)}px 0`
        : `0 ${parseInt(getComputedStyle(carousel).paddingInlineStart)}px`;
      if (carousel.style.padding === "0px") {
        carousel.style.padding = "";
      } else {
        // For Safari, which doesn't support inline end padding in a scrollable container
        carousel.style.setProperty(
          "--peek-int",
          isVertical(carousel)
            ? `${parseInt(
                getComputedStyle(carousel).paddingBlockStart
              )}px 0 0 0`
            : `0 ${parseInt(
                getComputedStyle(carousel).paddingInlineStart
              )}px 0 0`
        );
      }
      window.requestAnimationFrame(() => {
        if (isVertical(el)) {
          carousel.style.setProperty(
            "--subpixel-compensation",
            Math.ceil(carousel.getBoundingClientRect().height) -
              carousel.getBoundingClientRect().height
          );
        } else {
          carousel.style.setProperty(
            "--subpixel-compensation",
            Math.ceil(carousel.getBoundingClientRect().width) -
              carousel.getBoundingClientRect().width
          );
        }
        let offset = getIndexReal(carousel);
        if (carousel.firstElementChild) {
          scrollTo(
            carousel,
            offset * ceilingWidth(carousel.firstElementChild),
            offset * ceilingHeight(carousel.firstElementChild)
          );
        }
      });
    }
  };
  const observersOn = (el) => {
    window.requestAnimationFrame(() => {
      if (el.scroll_x && el.scroll_y) {
        scrollTo(el, el.scroll_x, el.scroll_y);
      }
      // Skip auto-height observer setup in fullscreen/overlay mode
      if (!isModal(el.parentNode) && !isFullScreen()) {
        if (
          el.parentNode.matches(
            ".n-carousel--vertical.n-carousel--controls-outside.n-carousel--auto-height"
          )
        ) {
          height_minus_index.observe(el.parentNode);
        } else {
          height_minus_index.unobserve(el.parentNode);
        }
      }
      subpixel_observer.observe(el);
      mutation_observer.observe(el.parentNode, {
        attributes: true,
        attributeFilter: ["class"],
      });
      el.addEventListener("scrollend", scrollEndAction);
      // setTimeout(() => {
      delete el.parentNode.dataset.sliding;
      // }, 50); // Because intersection observer fires again
      if (!("onscrollend" in window) && isEndless(el)) {
        // Fix for browsers without scrollend event (Safari) losing parts of the edge slide
        scrollTo(
          el,
          el.offsetWidth * getIndexReal(el),
          el.offsetHeight * getIndexReal(el)
        );
      }
    });
  };
  const observersOff = (el) => {
    height_minus_index.unobserve(el.parentNode);
    subpixel_observer.unobserve(el);
    el.observerStarted = true;
    el.removeEventListener("scrollend", scrollEndAction);
  };
  const updateObserver = (el) => {
    observersOff(el);
    const doUpdate = (el) => {
      updateSubpixels(el);
      window.requestAnimationFrame(() => {
        let current_height =
          el.querySelector(":scope > [aria-current]").scrollHeight + "px";
        let previous_height = getComputedStyle(el).getPropertyValue("--height");
        if (current_height !== previous_height) {
          el.parentNode.style.setProperty("--height", current_height);
        }
        observersOn(el);
      });
    };
    doUpdate(el);
    el.querySelectorAll(".n-carousel__content").forEach((el) => doUpdate(el));
  };
  const subpixel_observer = new ResizeObserver((entries) => {
    window.requestAnimationFrame(() => {
      entries.forEach((e) => {
        let el = e.target;
        if (!!el.observerStarted) {
          el.observerStarted = false;
          return;
        }
        updateObserver(el);
      });
    });
  });
  const mutation_observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (
        mutation.target &&
        !mutation.target.nextSlideInstant &&
        !mutation.target.toggleModal
      ) {
        let carousel = mutation.target.querySelector(
          ":scope > .n-carousel__content"
        );
        updateObserver(carousel);
        updateCarousel(carousel, true);
        delete mutation.target.toggleModal;
      }
    }
  });
  const setIndexWidth = (el) => {
    let index = el.querySelector(":scope > .n-carousel__index");
    if (index && !el.dataset.sliding) {
      el.style.removeProperty("--height-minus-index");
      index.style.position = "absolute";
      el.style.setProperty("--height-minus-index", `${el.offsetHeight}px`);
      el.style.setProperty(
        "--index-width",
        getComputedStyle(el.querySelector(":scope > .n-carousel__index")).width
      );
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
      const content = el.querySelector(":scope > .n-carousel__content");
      if (!content) {
        return;
      }
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
        close_modal.onclick = (e) => {
          if (
            e.target
              .closest(".n-carousel")
              .classList.contains("n-carousel--overlay")
          ) {
            closeModal(e.target);
          } else {
            openModal(e.target);
          }
        };
      }
      if (!!full_screen) {
        full_screen.onclick = (e) => {
          let carousel = e.target
            .closest(".n-carousel")
            .querySelector(":scope > .n-carousel__content");
          carousel.dataset.xx = carousel.dataset.x;
          carousel.dataset.yy = carousel.dataset.y;
          toggleFullScreen(e.target);
        };
        const fullScreenEvent = (e) => {
          let carousel = e.target.querySelector(
            ":scope > .n-carousel__content"
          );
          window.requestAnimationFrame(() => {
            carousel.dataset.x = carousel.dataset.xx;
            carousel.dataset.y = carousel.dataset.yy;
            delete carousel.dataset.xx;
            delete carousel.dataset.yy;
            if (
              carousel.dataset.x !== "undefined" &&
              carousel.dataset.y !== "undefined"
            ) {
              scrollTo(
                carousel,
                getIndexReal(carousel) *
                  ceilingWidth(carousel.children[getIndexReal(carousel)]),
                getIndexReal(carousel) *
                  ceilingHeight(carousel.children[getIndexReal(carousel)])
              );
            }
            delete carousel.togglingFullScreen;
            updateCarousel(carousel);
          });
        };
        if (isSafari) {
          el.onwebkitfullscreenchange = fullScreenEvent;
        } else {
          el.onfullscreenchange = fullScreenEvent;
        }
      }
      el.addEventListener("keydown", carouselKeys);
      el.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
          let el = e.target;
          if (!el.closest(".n-carousel--overlay")) {
            el = document.querySelector(".n-carousel--overlay");
          }
          if (el) {
            closeModal(el);
          }
        }
      });
      updateSubpixels(content);
      content.observerStarted = true;
      let hashed_slide = false;
      if (location.hash && location.hash.length > 1) {
        try {
          hashed_slide = content.querySelector(":scope > " + location.hash);
        } catch (e) {
          // Invalid selector, ignore
        }
      }
      if (hashed_slide) {
        if (el.classList.contains("n-carousel--inline")) {
          openModal(content);
        }
        let index = Array.prototype.indexOf.call(
          hashed_slide.parentNode.children,
          hashed_slide
        );
        if (isVertical(content)) {
          content.dataset.y = index;
        } else {
          content.dataset.x = index;
        }
        // slideTo(content, index); // This slides to the wrong slide
        window.nCarouselNav = [content, location.hash];
      }
      // Skip auto-height setup in fullscreen/overlay mode
      if (!isModal(el) && !isFullScreen()) {
        if (el.matches(".n-carousel--vertical.n-carousel--auto-height")) {
          content.style.height = "";
          content.style.height = getComputedStyle(content).height;
          el.dataset.ready = true;
          content.scrollTop = 0; // Should be a different value if the initial active slide is other than the first one (unless updateCarousel() takes care of it)
        }
        if (isAutoHeight(el)) {
          // Auto has a specified height which needs update on resize
          autoHeightObserver.observe(content);
        }
      }
      window.requestAnimationFrame(() => {
        observersOn(content);
        if (
          el.parentNode.matches(
            ".n-carousel--vertical.n-carousel--controls-outside.n-carousel--auto-height"
          )
        ) {
          setIndexWidth(el);
        }
        updateCarousel(content);
        el.dataset.ready = true;
        if (el.matches(".n-carousel--auto-slide")) {
          let auto_delay =
            (parseFloat(el.dataset.interval) * 1000 || default_interval) +
            (parseFloat(el.dataset.duration) * 1000 || default_duration);
          let carouselTimeout = () => {
            if (isElementInViewport(content)) {
              slideNext(content);
            }
            content.nCarouselTimeout = setTimeout(carouselTimeout, auto_delay);
          };
          content.nCarouselTimeout = setTimeout(
            carouselTimeout,
            parseFloat(el.dataset.interval) * 1000 || default_interval
          );
          content.addEventListener("pointerenter", (e) =>
            clearTimeout(e.target.nCarouselTimeout)
          );
        }
        el.dataset.platform = navigator.platform; // iPhone doesn't support full screen, Windows scroll works differently
      });
      content.nCarouselUpdate = updateCarousel;
      if (el.matches(".n-carousel--lightbox")) {
        let loaded = (img) => {
          img.closest("picture").dataset.loaded = true;
        };
        content.querySelectorAll("picture img").forEach((el) => {
          if (el.complete) {
            loaded(el);
          } else {
            el.addEventListener("load", (e) => {
              loaded(e.target);
            });
          }
        });
      }
    });
  };
  window.nCarouselInit = init;
  window.addEventListener("popstate", hashNavigation);
  const doInit = () => {
    typeof nui !== "undefined" && typeof nui.registerComponent === "function"
      ? nui.registerComponent("n-carousel", init)
      : init();
  };
  if (document.readyState !== "loading") {
    doInit();
  } else {
    document.addEventListener("DOMContentLoaded", doInit);
  }
})();
