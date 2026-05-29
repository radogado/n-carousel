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
  const isFirefox = /Firefox\//.test(navigator.userAgent);
  const isEndless = (el) =>
    el.children.length > 2 &&
    el.parentElement.classList.contains("n-carousel--endless");
  const isFullScreen = () => {
    return !!(document.webkitFullscreenElement || document.fullscreenElement);
  };
  const fullscreenWrapper = () =>
    document.fullscreenElement || document.webkitFullscreenElement;
  const exitFullscreen = () => {
    !!document.exitFullscreen
      ? document.exitFullscreen()
      : document.webkitExitFullscreen();
  };
  const getCarousel = (el) => el.closest(".n-carousel");
  const hasFullscreenDescendant = (wrapper) => {
    const fsEl = fullscreenWrapper();
    return !!(wrapper && fsEl && wrapper !== fsEl && wrapper.contains(fsEl));
  };
  const slidingDurationMs = (wrapper) => {
    // data-duration is in seconds. Fallback to default_duration (ms).
    const s =
      wrapper && wrapper.dataset ? parseFloat(wrapper.dataset.duration) : NaN;
    const ms = Number.isFinite(s) ? s * 1000 : default_duration;
    // Small buffer: scrollend timing / resize during transitions can lag slightly.
    return ms + 200;
  };
  const setSliding = (wrapper) => {
    if (!wrapper || !wrapper.dataset) return;
    // If this carousel contains a fullscreen child, never disable pointer events on it.
    if (hasFullscreenDescendant(wrapper)) {
      clearSliding(wrapper);
      return;
    }
    wrapper.dataset.sliding = true;
    if (wrapper._slidingTimeout) {
      clearTimeout(wrapper._slidingTimeout);
    }
    wrapper._slidingTimeout = setTimeout(() => {
      if (wrapper && wrapper.dataset) {
        clearSliding(wrapper);
      }
    }, slidingDurationMs(wrapper));
  };
  const clearSliding = (wrapper) => {
    if (!wrapper) return;
    if (wrapper.dataset && wrapper.dataset.sliding !== undefined) {
      delete wrapper.dataset.sliding;
    }
    // Defensive: some code paths (or external code) may set the attribute directly.
    // Ensure it's gone even if dataset semantics differ.
    if (wrapper.removeAttribute && wrapper.hasAttribute && wrapper.hasAttribute("data-sliding")) {
      wrapper.removeAttribute("data-sliding");
    }
    if (wrapper.sliding !== undefined) {
      delete wrapper.sliding;
    }
    if (wrapper._slidingTimeout) {
      clearTimeout(wrapper._slidingTimeout);
      wrapper._slidingTimeout = null;
    }
  };
  const isModal = (el) => {
    return getCarousel(el)?.classList.contains("n-carousel--overlay");
  };
  const isVertical = (el) =>
    getCarousel(el)?.matches(".n-carousel--vertical");
  const isAutoHeight = (el) => {
    const carousel = getCarousel(el);
    if (!carousel) return false;
    // Disable auto-height in fullscreen/overlay mode - it should use available height.
    if (isFullScreen() || carousel.classList.contains("n-carousel--overlay")) {
      return false;
    }
    return carousel.matches(".n-carousel--auto-height");
  };
  const indexControls = (index) => {
    let controls_by_class = index.querySelectorAll(".n-carousel__control");
    return controls_by_class.length > 0
      ? controls_by_class
      : index.querySelectorAll("a, button");
  };
  // Endless mode reorders slides in the DOM - keep a stable logical index per slide (JS-only).
  const stampOriginalSlideIndices = (carouselContent) => {
    if (!carouselContent) return;
    [...carouselContent.children].forEach((slide, i) => {
      if (!slide) return;
      // Internal-only index; avoid data-* since it's not meant for CSS/DOM APIs.
      if (slide._ncIndex === undefined) slide._ncIndex = i;
    });
  };
  const clearSlidingLocks = (node) => {
    let cur = node;
    while (cur) {
      clearSliding(cur);
      cur = cur.parentNode;
    }
  };
  const hasOverlayDescendant = (el) =>
    !!(el && el.querySelector(":scope .n-carousel--overlay") !== null);
  const scrollEndAction = (carousel) => {
    carousel = carousel.target || carousel;
    const carouselStyle = getComputedStyle(carousel);
    // Calculate which slide we're on
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
                parseFloat(carouselStyle.paddingInlineEnd))
      )
    );
    if (index >= carousel.children.length) {
      index = carousel.children.length - 1;
    }
    let slide = carousel.children[index];
    if (
      !!carousel.parentNode.sliding ||
      (carousel.dataset.next &&
        parseInt(carousel.dataset.next) !==
          Array.prototype.indexOf.call(carousel.children, slide))
    ) {
      return;
    }
    const wrapper = carousel.parentNode;
    // Also never set data-sliding on an overlay carousel that is currently fullscreen (it must stay clickable).
    const isOverlayInFullscreen =
      wrapper &&
      wrapper.classList &&
      wrapper.classList.contains("n-carousel--overlay") &&
      (wrapper === document.fullscreenElement ||
        wrapper === document.webkitFullscreenElement);
    if (!isOverlayInFullscreen) {
      setSliding(wrapper);
    }
    delete carousel.dataset.next;
    observersOff(carousel);
    let x = carousel.scrollLeft;
    let y = carousel.scrollTop;
    let timeout_function = () => {
      let index = Array.prototype.indexOf.call(carousel.children, slide);
      const el = carousel; // Alias for clarity
      if (isAutoHeight(carousel)) {
        const now = performance.now();
        if (carousel._autoHeightLockUntil && now < carousel._autoHeightLockUntil) {
          observersOn(carousel);
          clearSliding(wrapper);
          return;
        }
        let old_height = Math.round(parseFloat(getComputedStyle(carousel).height));
        let new_height;
        let offset_x = 0;
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
          new_height = Math.round(new_height);
          if (isModal(carousel) || isFullScreen()) {
            old_height = new_height = carousel.offsetHeight;
          }
          slide.style.height = "";
          carousel.scrollTop = scroll_offset;
          offset_y = index * new_height - carousel.scrollTop;
        } else {
          new_height = Math.round(nextSlideHeight(slide));
          // For horizontal auto-height with peeking, use updateCarousel instead of manual animation
          // because scroll snap and variable slide widths make manual calculation unreliable
          const hasPeeking = parseFloat(carouselStyle.paddingInlineStart) > 0;
          if (hasPeeking) {
            if (old_height !== new_height) {
              carousel.parentNode.style.setProperty("--height", `${new_height}px`);
            }
            carousel._autoHeightLockUntil = now + AUTO_HEIGHT_STABLE_MS;
            setTimeout(() => updateCarousel(carousel, true), SCROLL_END_TIMEOUT + 200);
            return;
          }
          // Without peeking, use the original manual animation approach
          if (!!lastScrollX) {
            // Because RTL auto height landing on first slide creates an infinite intersection observer loop
            scrollTo(carousel, lastScrollX, lastScrollY);
          }
          // Calculate the correct horizontal offset to reach the target slide
          let width = Math.ceil(parseFloat(getComputedStyle(slide).width));
          offset_x = isRTL(carousel)
            ? Math.abs(scrollStartX(carousel)) - width * index
            : width * index - scrollStartX(carousel);
        }
        const heightChanged = old_height !== new_height;
        const targetHeight = heightChanged ? new_height : false;
        carousel._autoHeightLockUntil = now + AUTO_HEIGHT_STABLE_MS;
        window.requestAnimationFrame(() => {
          scrollAnimate(carousel, offset_x, offset_y, targetHeight, old_height);
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
    if (!el) return 0;
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
    el = getCarousel(el);
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
    if (isFullScreen()) {
      // Exit full screen
      exitFullscreen();
      if (isSafari) {
        setTimeout(() => {
          el.style.display = "none";
          window.requestAnimationFrame(() => {
            el.style.display = "";
          });
        }, 0);
      }
    } else {
      snapToProp(carousel, "_fsSnapLogical");
      if (el.classList.contains("n-carousel--overlay")) {
        // Ensure overlays and any ancestor carousels remain interactive.
        clearSlidingLocks(el);
      }
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
  // Shared mode-transition helpers (fullscreen + overlay):
  // Save a stable "logical" slide index (works for endless because slides get re-ordered).
  const snapLogicalIndex = (content) => {
    if (!content) return null;
    stampOriginalSlideIndices(content);
    const active = content.querySelector(":scope > [aria-current]");
    const logical =
      active && Number.isFinite(active._ncIndex) ? active._ncIndex : getIndexReal(content);
    return Number.isFinite(logical) ? logical : null;
  };
  const snapToProp = (content, prop) => {
    if (!content) return null;
    const snap = snapLogicalIndex(content);
    if (Number.isFinite(snap)) content[prop] = snap;
    return snap;
  };
  const restoreLogicalAfterLayout = (content, logicalIndex, clearProp) => {
    if (!content || !Number.isFinite(logicalIndex)) return;
    // Fullscreen/overlay toggles can change sizes mid-frame. Wait for layout to settle.
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        // Restore any endless-mode displaced slides FIRST so offsetLeft is computed against
        // the final stable DOM. This prevents an off-by-one when the active slide was at an
        // edge (e.g. last slide) and slide 0 was displaced as a data-last clone — if we
        // scrolled to that displaced offset Safari's snap engine would latch onto the wrong
        // slide via observersOn's no-scrollend polyfill path.
        content.querySelectorAll(":scope > [data-first]").forEach((el2) => {
          content.append(content.firstElementChild);
          delete el2.dataset.first;
        });
        content.querySelectorAll(":scope > [data-last]").forEach((el2) => {
          content.prepend(content.lastElementChild);
          delete el2.dataset.last;
        });
        stampOriginalSlideIndices(content);
        const target =
          [...content.children].find(
            (s) => s && Number.isFinite(s._ncIndex) && s._ncIndex === logicalIndex
          ) || content.children[logicalIndex];
        if (!target) return;
        // x is now a valid snap point in the restored DOM — no need to disable scroll-snap.
        content.scrollLeft = target.offsetLeft || 0;
        content.scrollTop = target.offsetTop || 0;
        // forced=true: bypasses the early-return guard (same aria-current slide) and skips
        // the endless-mode scrollTo since displacement is already resolved above.
        updateCarousel(content, true);
        const w = getCarousel(content);
        if (
          w &&
          (w.classList.contains("n-carousel--overlay") ||
            w === document.fullscreenElement)
        ) {
          clearSlidingLocks(w);
        }
        if (clearProp) delete content[clearProp];
      })
    );
  };
  const restoreFromPropAfterLayout = (content, prop, clearOnRestore = false) => {
    if (!content) return;
    const logicalIndex = Number.isFinite(content[prop]) ? content[prop] : snapLogicalIndex(content);
    if (!Number.isFinite(logicalIndex)) return;
    restoreLogicalAfterLayout(content, logicalIndex, clearOnRestore ? prop : null);
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
    let isTabPressed = e.key === "Tab";
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
    if (!el) return null;
    const wrapper = el.closest('[class*="n-carousel"]');
    if (!wrapper) return null;
    const related_by_id = wrapper.dataset.for;
    if (related_by_id) {
      return document.getElementById(related_by_id)?.querySelector(".n-carousel__content") ?? null;
    }
    return el.closest(".n-carousel")?.querySelector(".n-carousel__content") ?? null;
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
      let wrapper = getCarousel(el);
      if (
        !!wrapper.nextSlideInstant ||
        !wrapper.dataset.ready ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        wrapper.matches(".n-carousel--instant")
      ) {
        scrollTo(el, getScroll(el).x + distanceX, getScroll(el).y + distanceY);
        if (new_height !== false && new_height !== null && new_height !== undefined) {
          el.style.height = `${new_height}px`;
        }
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
    const shouldAdjustHeight =
      new_height !== false && new_height !== null && new_height !== undefined;
    if (shouldAdjustHeight) {
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
      if (!Number.isFinite(starth)) starth = 0;
      var distanceH = shouldAdjustHeight ? new_height - starth : 0;
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
        if (shouldAdjustHeight) {
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
      if (shouldAdjustHeight) {
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
    // Skip update entirely if there's ANY overlay carousel descendant
    // Overlay carousels need to remain interactive and shouldn't be managed by parent
    // But if forced, allow update (e.g., when overlay is being closed and we need to refresh parent)
    const overlayDescendant = hasOverlayDescendant(el);
    if (overlayDescendant && !forced) {
      // Don't update parent carousel when an overlay descendant exists anywhere
      // This prevents parent from setting inert on overlay carousels
      // But allow forced updates (e.g., when closing overlay)
      return;
    }
    // Skip update if explicitly marked to skip (e.g., during brief fullscreen toggle moment)
    // But only skip scroll position calculations, not inert attribute updates
    const shouldSkipScrollCalc = el.dataset.skipUpdate === "true" && !forced;
    observersOff(el);
    const wrapper = el.parentElement;
    const fsEl = fullscreenWrapper();
    const isWrapperFullscreen = !!(wrapper && fsEl && wrapper === fsEl);
    const isWrapperOverlay = !!(
      wrapper &&
      wrapper.classList &&
      wrapper.classList.contains("n-carousel--overlay")
    );
    const firstChild = el.firstElementChild;
    if (!firstChild) {
      // Nothing to compute (empty carousel content). Keep observers consistent and bail.
      observersOn(el);
      return;
    }
    const cw = ceilingWidth(firstChild);
    const ch = ceilingHeight(firstChild);
    // If we should skip scroll calculations (during fullscreen toggle), use saved values
    let saved_x = el.dataset.x; // On displaced slides and no change
    let saved_y = el.dataset.y;
    if (shouldSkipScrollCalc) {
      // Keep existing values, don't recalculate scroll positions
      // This prevents parent disruption during overlay fullscreen toggle
    } else {
      el.dataset.x = Math.abs(
        Math.round(scrollStartX(el) / cw)
      );
      el.dataset.y = Math.abs(
        Math.round(el.scrollTop / ch)
      );
    }
    // When inline
    if (el.dataset.x === "NaN") {
      el.dataset.x = 0;
    }
    if (el.dataset.y === "NaN") {
      el.dataset.y = 0;
    }
    let active_index;
    let active_slide;
    let old_active_slide = el.querySelector(":scope > [aria-current]");
    if (shouldSkipScrollCalc) {
      // During fullscreen toggle, use the current active slide without recalculating
      // This prevents parent disruption but still allows inert updates
      active_slide = old_active_slide || el.children[0];
      active_index = active_slide ? Array.prototype.indexOf.call(el.children, active_slide) : 0;
      if (active_index < 0) active_index = 0;
      if (active_index >= el.children.length) active_index = el.children.length - 1;
    } else {
      active_index = getIndex(el);
      if (active_index >= el.children.length) {
        active_index = el.children.length - 1;
      }
      if (!isAutoHeight(wrapper)) {
        // Dynamic change from auto height to normal
        el.style.height = "";
      }
      active_slide = el.children[active_index];
    }
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
    // Forced updates are used during mode transitions (overlay/fullscreen) and can temporarily leave
    // multiple slides marked as aria-current. Normalize to exactly one so getIndexReal() and index UI
    // don't latch onto the first stale match.
    if (forced) {
      el.querySelectorAll(":scope > [aria-current]").forEach((n) => {
        if (n !== active_slide) n.removeAttribute("aria-current");
      });
    }
    stampOriginalSlideIndices(el);
    // While fullscreen is active, keep the restore snapshot aligned with the *current* slide.
    // Without this, entering fullscreen on slide N, navigating to M, then exiting would restore N.
    if (
      active_slide && Number.isFinite(active_slide._ncIndex) &&
      isWrapperFullscreen
    ) {
      el._fsSnapLogical = active_slide._ncIndex;
    }
    // While overlay is active, keep a snapshot aligned with the *current* slide.
    // This lets overlay close restore the currently viewed slide (same principle as fullscreen).
    if (
      active_slide && Number.isFinite(active_slide._ncIndex) &&
      isWrapperOverlay
    ) {
      el._ovSnapLogical = active_slide._ncIndex;
    }
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
    // Only set data-sliding if we're actually changing slides or forced update
    // This prevents flashing when updateCarousel is called multiple times for the same slide
    // Never set data-sliding on overlay carousels that are in fullscreen (they need to be clickable)
    const isOverlayInFullscreen = isWrapperOverlay && isWrapperFullscreen;
    const isSlideChange = active_slide !== old_active_slide;
    if (isAutoHeight(wrapper) && isSlideChange) {
      clearAutoHeightLock(el);
      lockAutoHeight(el, active_slide);
    }
    if (isSlideChange && !isOverlayInFullscreen) {
      setSliding(wrapper);
    } else if (isOverlayInFullscreen || hasFullscreenDescendant(wrapper)) {
      // Ensure data-sliding is cleared for overlay in fullscreen
      clearSliding(wrapper);
    }
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
        let scroll_x = cw * active_index;
        let scroll_y = ch * active_index;
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
    let index = getControl(getCarousel(el), ".n-carousel__index");
    if (!!index) {
      index.querySelector("[aria-current]")?.removeAttribute("aria-current");
      // index.children[active_index_real].ariaCurrent = true; // Unsupported by FF
      const controls = indexControls(index);
      const rawIdx = Number.isFinite(active_index_real) ? active_index_real : 0;
      const safeIdx =
        controls.length > 0
          ? Math.max(0, Math.min(controls.length - 1, rawIdx))
          : 0;
      controls[safeIdx]?.setAttribute("aria-current", true);
    }
    // Disable focus on children of non-active slides
    // Active slides of nested carousels should also have disabled focus
    [...el.children].forEach((el) => {
      // Native "inert" attribute to replace the below "focusDisabled" loops from June 2022.
      // NEVER set inert on:
      // 1. Fullscreen elements (they need to be interactive)
      // 2. Slides inside overlay carousels (they need to be interactive)
      // 3. Slides containing overlay carousel descendants
      // 4. Slides inside a fullscreen carousel wrapper
      // 5. Slides containing an overlay carousel that is currently in fullscreen
      const isFullscreen = el === document.fullscreenElement || el === document.webkitFullscreenElement;
      const wrapperIsFullscreen = isWrapperFullscreen;
      const wrapperIsOverlay = isWrapperOverlay;
      const hasOverlayDescendant = el.querySelector && el.querySelector(".n-carousel--overlay") !== null;
      // Check if this slide contains an overlay carousel that is currently in fullscreen
      // The fullscreen element is the wrapper (.n-carousel), not the content
      let overlayInFullscreen = false;
      if (hasOverlayDescendant) {
        const overlayWrapper = el.querySelector(".n-carousel--overlay");
        if (overlayWrapper && (overlayWrapper === document.fullscreenElement || overlayWrapper === document.webkitFullscreenElement)) {
          overlayInFullscreen = true;
        }
      }
      if (isFullscreen || wrapperIsFullscreen || wrapperIsOverlay || hasOverlayDescendant || overlayInFullscreen) {
        // These should never be inert - always remove it
        el.inert = false;
        el.removeAttribute('inert');
      } else {
        // Normal slide - set inert based on whether it's active
        el.inert = el === active_slide ? false : true;
      }
      if (isSafari && fsEl && el.querySelector(".n-carousel:-webkit-full-screen")) {
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
      // Note: In fullscreen/overlay mode, isAutoHeight returns false, so this won't execute
      el.scrollTop = el.offsetHeight * active_index_real;
    }
    window.requestAnimationFrame(() => {
      observersOn(el);
    });
  };
  const slide = (el, offsetX = 0, offsetY = 0, index) => {
    clearTimeout(el.nCarouselTimeout);
    if (!el.parentNode.dataset.sliding) {
      setSliding(el.parentNode);
      const curIndex = getIndexReal(el);
      let old_height = el.children[curIndex].offsetHeight;
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
            curIndex === index
              ? new_height
              : nextSlideHeight(el.children[curIndex]);
          el.parentNode.style.setProperty("--height", `${old_height}px`);
        }
        scrollTo(el, old_scroll_left + paddingX(el) / 2, old_scroll_top); // iPad bug
        scrollTo(el, old_scroll_left, old_scroll_top);
      }
      if (isVertical(el)) {
        offsetY = offsetY - index * old_height + index * new_height;
      }
      window.requestAnimationFrame(() => {
        if (!el.parentNode.dataset.duration && !isAutoHeight(el)) {
          // Unspecified duration, no height change – using native smooth scroll
          clearSliding(el.parentNode);
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
    let el = getCarousel(e.target)
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
      // Thumbnails may be wrapped (e.g. per-item divs); indexControls(el.parentNode) would
      // then only see one control and logical_index would always be 0.
      const indexParent = el.closest(".n-carousel__index");
      if (!indexParent) return;
      // Gallery thumbs are often <a href="…">; block navigation once we know this is index UI.
      e.preventDefault();
      const wrapper =
        (indexParent.dataset.for &&
          document.querySelector(`.n-carousel#${indexParent.dataset.for}`)) ||
        el.closest(".n-carousel");
      if (!wrapper) return;
      const carousel = wrapper.querySelector(":scope > .n-carousel__content");
      if (!carousel) return;
      const logical_index = Array.prototype.indexOf.call(
        indexControls(indexParent),
        el
      );
      if (logical_index < 0) return;
      let new_index = logical_index;
      if (isEndless(carousel)) {
        // Map logical index button -> current DOM index of that original slide.
        // This avoids off-by-one errors near the edges when slides are displaced.
        stampOriginalSlideIndices(carousel);
        const targetSlide = [...carousel.children].find(
          (s) => s && Number.isFinite(s._ncIndex) && s._ncIndex === logical_index
        );
        if (targetSlide) {
          new_index = Array.prototype.indexOf.call(carousel.children, targetSlide);
        }
      }
      if (
        wrapper.classList.contains("n-carousel--inline") &&
        !isModal(carousel)
      ) {
        // Opening an inline carousel
        wrapper.nextSlideInstant = true;
        // We intentionally open to a *new* index below, so skip the overlay restore here.
        openModal(carousel, true, logical_index);
      } else {
        window.requestAnimationFrame(() => {
          slideTo(carousel, new_index);
        });
      }
      return false;
    }
  };
  const enableLightboxClickToOpen = (wrapper, content, hasOverlayToggle) => {
    if (!wrapper || !content) return;
    if (!wrapper.classList.contains("n-carousel--lightbox")) return;
    // Only enable "click image to open overlay" when there is an explicit overlay toggle button.
    // Otherwise opening a modal via image click can be confusing/less accessible to close.
    if (!hasOverlayToggle) return;

    let down = null;
    const isInteractive = (el) =>
      !!(el && el.closest && el.closest("a, button, input, select, textarea, label"));
    const toDirectChild = (el, parent) => {
      let cur = el;
      while (cur && cur !== parent && cur.parentNode !== parent) cur = cur.parentNode;
      return cur && cur.parentNode === parent ? cur : null;
    };
    content.addEventListener(
      "pointerdown",
      (e) => {
        const t = e.target;
        if (!t) return;
        const img =
          (t.matches && t.matches("img") && t) ||
          (t.closest && t.closest("picture") && t.closest("picture").querySelector("img")) ||
          null;
        if (!img) return;
        if (isInteractive(img)) return;
        down = { x: e.clientX, y: e.clientY };
      },
      { passive: true }
    );

    content.addEventListener("click", (e) => {
      if (wrapper.classList.contains("n-carousel--overlay")) return;
      const t = e.target;
      if (!t) return;

      // Only on images (or picture -> img).
      const img =
        (t.matches && t.matches("img") && t) ||
        (t.closest && t.closest("picture") && t.closest("picture").querySelector("img")) ||
        null;
      if (!img) return;

      // Don't hijack clicks on interactive content.
      if (isInteractive(img)) return;

      // Ignore drag/swipe.
      if (down) {
        const dx = Math.abs((down.x || 0) - e.clientX);
        const dy = Math.abs((down.y || 0) - e.clientY);
        down = null;
        if (dx > 6 || dy > 6) return;
      }

      const slideEl = toDirectChild(img, content);
      // Endless reorders slides in the DOM, so prefer stable logical index when available.
      stampOriginalSlideIndices(content);
      const idxDom = slideEl
        ? Array.prototype.indexOf.call(content.children, slideEl)
        : getIndexReal(content);
      const idxLogical =
        slideEl && Number.isFinite(slideEl._ncIndex) ? slideEl._ncIndex : idxDom;
      // Open overlay to the clicked/active slide.
      openModal(content, true, idxLogical);
    });
  };
  const enableLightboxCrossAxisClose = (wrapper, content) => {
    if (!wrapper || !content) return;
    if (!wrapper.classList.contains("n-carousel--lightbox")) return;
    if (!wrapper.classList.contains("n-carousel--overlay")) return;
    if (wrapper._ncCrossAxisCloseCleanup) return;

    const CROSS_AXIS_THRESHOLD = 120; // px
    const INTENT_RATIO = 2; // cross-axis must dominate main-axis by this ratio

    const isScrollableY = (el) => {
      if (!el || el === document.documentElement || el === document.body) return false;
      const cs = getComputedStyle(el);
      const oy = cs.overflowY;
      return (
        (oy === "auto" || oy === "scroll") &&
        el.scrollHeight > el.clientHeight + 1
      );
    };
    const isScrollableX = (el) => {
      if (!el || el === document.documentElement || el === document.body) return false;
      const cs = getComputedStyle(el);
      const ox = cs.overflowX;
      return (
        (ox === "auto" || ox === "scroll") &&
        el.scrollWidth > el.clientWidth + 1
      );
    };
    const closestScrollable = (start, axis) => {
      let cur = start && start.nodeType === 1 ? start : null;
      while (cur && cur !== wrapper) {
        if (axis === "y" ? isScrollableY(cur) : isScrollableX(cur)) return cur;
        cur = cur.parentElement;
      }
      return null;
    };
    const atEdge = (el, axis, delta) => {
      if (!el) return true;
      if (axis === "y") {
        const top = el.scrollTop;
        const max = el.scrollHeight - el.clientHeight;
        return delta < 0 ? top <= 0 : top >= max - 1;
      }
      const left = el.scrollLeft;
      const max = el.scrollWidth - el.clientWidth;
      return delta < 0 ? left <= 0 : left >= max - 1;
    };

    let wheelAcc = 0;
    let wheelTimer = null;
    const resetWheel = () => {
      wheelAcc = 0;
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = null;
    };
    const allowCrossAxisClose = (target, axis, cross, main) => {
      if (!Number.isFinite(cross) || !Number.isFinite(main)) return false;
      // Require clear cross-axis intent.
      if (Math.abs(cross) < INTENT_RATIO * Math.abs(main)) return false;
      // If there's a scrollable element in the cross axis, only close on "overscroll" at its edge.
      const sc = closestScrollable(target, axis);
      if (sc && !atEdge(sc, axis, cross)) return false;
      return true;
    };

    const wheel = (e) => {
      if (!wrapper.classList.contains("n-carousel--overlay")) return resetWheel();
      // Don't close overlay via cross-axis gesture while the overlay is fullscreen.
      if (fullscreenWrapper && fullscreenWrapper() === wrapper) return resetWheel();
      // Only for overlays; ignore if fullscreen restore / sliding lock window is active.
      if (prefersReducedMotion()) return;
      const vertical = isVertical(content);
      const cross = vertical ? e.deltaX : e.deltaY;
      const main = vertical ? e.deltaY : e.deltaX;
      const axis = vertical ? "x" : "y";
      if (!allowCrossAxisClose(e.target, axis, cross, main)) return resetWheel();

      wheelAcc += cross;
      if (!wheelTimer) wheelTimer = setTimeout(resetWheel, 250);

      if (Math.abs(wheelAcc) >= CROSS_AXIS_THRESHOLD) {
        resetWheel();
        closeModal(content);
      }
    };

    // Touch swipe (mobile).
    let touchStart = null;
    const touchstart = (e) => {
      if (!wrapper.classList.contains("n-carousel--overlay")) return;
      // Don't close overlay via cross-axis gesture while the overlay is fullscreen.
      if (fullscreenWrapper && fullscreenWrapper() === wrapper) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      touchStart = { x: t.clientX, y: t.clientY, target: e.target };
    };
    const touchmove = (e) => {
      if (!touchStart) return;
      if (!wrapper.classList.contains("n-carousel--overlay")) {
        touchStart = null;
        return;
      }
      if (fullscreenWrapper && fullscreenWrapper() === wrapper) {
        touchStart = null;
        return;
      }
      const t = e.touches && e.touches[0];
      if (!t) return;
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      const vertical = isVertical(content);
      const cross = vertical ? dx : dy;
      const main = vertical ? dy : dx;
      const axis = vertical ? "x" : "y";
      if (!allowCrossAxisClose(touchStart.target, axis, cross, main)) return;

      if (Math.abs(cross) >= CROSS_AXIS_THRESHOLD) {
        touchStart = null;
        closeModal(content);
      }
    };
    const touchend = () => {
      touchStart = null;
    };

    wrapper.addEventListener("wheel", wheel, { passive: true });
    wrapper.addEventListener("touchstart", touchstart, { passive: true });
    wrapper.addEventListener("touchmove", touchmove, { passive: true });
    wrapper.addEventListener("touchend", touchend, { passive: true });
    wrapper.addEventListener("touchcancel", touchend, { passive: true });

    wrapper._ncCrossAxisCloseCleanup = () => {
      resetWheel();
      wrapper.removeEventListener("wheel", wheel);
      wrapper.removeEventListener("touchstart", touchstart);
      wrapper.removeEventListener("touchmove", touchmove);
      wrapper.removeEventListener("touchend", touchend);
      wrapper.removeEventListener("touchcancel", touchend);
      delete wrapper._ncCrossAxisCloseCleanup;
    };
  };
  const closeModalOnBodyClick = (e) => {
    let overlay = document.querySelector(".n-carousel--overlay");
    if (overlay && e.key === "Escape") {
      // Avoid double-close when the overlay itself already handled Escape (bubbling).
      if (e.__nCarouselHandledEscape) {
        return;
      }
      // If fullscreen was just exited via Escape, don't also close the overlay.
      if (
        Number.isFinite(overlay._suppressOverlayEscapeUntil) &&
        performance.now() < overlay._suppressOverlayEscapeUntil
      ) {
        return;
      }
      closeModal(overlay);
    }
  };
  function prefersReducedMotion() {
    return (
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
  function activeSlideImage(carousel) {
    if (!carousel) return null;
    const active =
      carousel.querySelector(":scope > [aria-current]") || carousel.children[0];
    return active ? active.querySelector("img") : null;
  }
  function withOverlayViewTransition(wrapper, carousel, mutate, isClosing = false) {
    if (!wrapper || !carousel || typeof mutate !== "function") return mutate();
    if (prefersReducedMotion()) return mutate();
    // Firefox has buggy shared-element transitions for our overlays (open/close can drift).
    // Disable view transitions on Firefox for now.
    if (isFirefox) return mutate();
    if (typeof document.startViewTransition !== "function") return mutate();

    // Shared element for the transition:
    // - Lightbox: prefer image.
    // - Non-lightbox: prefer the entire active slide so complex layouts (image + text columns)
    //   move smoothly instead of only cross-fading.
    const active =
      carousel.querySelector(":scope > [aria-current]") || carousel.children[0];
    const shared =
      wrapper.classList.contains("n-carousel--lightbox") &&
      active &&
      active.querySelector
        ? active.querySelector("img") || active
        : active;
    if (!shared) return mutate();

    // Unique name per carousel instance to avoid conflicts across the document.
    const id =
      wrapper.id ||
      (wrapper._vtId ||
        (wrapper._vtId =
          (window.__nCarouselVTId = (window.__nCarouselVTId || 0) + 1)));
    shared.style.viewTransitionName = `n-carousel-overlay-${id}`;
    const vt = document.startViewTransition(() => mutate());
    // Cleanup.
    (vt.finished || Promise.resolve()).finally(() => {
      shared.style.viewTransitionName = "";
    });
  }
  const closeModal = (el) => {
    let carousel = closestCarousel(el);
    let wrapper = carousel ? getCarousel(carousel) : null;
    const closeNow = () => {
      // For inline carousels, if we're in fullscreen, just exit fullscreen and keep overlay
      if (wrapper && wrapper.classList.contains("n-carousel--inline") && wrapper.classList.contains("n-carousel--overlay") && isFullScreen()) {
        exitFullscreen();
        return; // Don't remove overlay class - keep it in overlay state
      }
      if (isFullScreen()) {
        exitFullscreen();
      }
      if (carousel) {
        // Snapshot the logical slide before the overlay state changes.
        snapToProp(carousel, "_ovSnapLogical");
        carousel.parentNode.toggleModal = true; // skip mutation observer
        wrapper.classList.remove("n-carousel--overlay");
        if (wrapper && wrapper._ncCrossAxisCloseCleanup) {
          wrapper._ncCrossAxisCloseCleanup();
        }
        trapFocus(wrapper, true); // Disable focus trap
        delete document.body.dataset.frozen;
        // If this overlay was a slide in a parent carousel, clear data-sliding on parent
        // This ensures the parent carousel is clickable after overlay closes
        let parentContent = wrapper.closest(".n-carousel__content");
        if (parentContent) {
          let parentCarousel = getCarousel(parentContent);
          if (parentCarousel) {
            clearSliding(parentCarousel);
            // Update the parent carousel to refresh active slide state
            // Use forced=true to ensure update happens even if overlay descendant check would skip it
            updateCarousel(parentContent, true);
          }
        }
        // Restore the current logical slide after layout settles (scrollbar/body lock changes can shift snap points).
        restoreFromPropAfterLayout(carousel, "_ovSnapLogical", true);
        if (isAutoHeight(carousel)) {
          // Overlay close can leave a stale auto-height; re-lock after layout settles.
          window.requestAnimationFrame(() =>
            window.requestAnimationFrame(() => {
              const active =
                carousel.querySelector(":scope > [aria-current]") || carousel.children[0];
              clearAutoHeightLock(carousel);
              lockAutoHeight(carousel, active);
              updateCarousel(carousel, true);
            })
          );
        }
      }
      // Only attached in non-dialog mode.
      document.body.removeEventListener("keyup", closeModalOnBodyClick);
    };
    withOverlayViewTransition(wrapper, carousel, closeNow, true);
  };
  const openModal = (el, skipRestore = false, openIndex = null) => {
    let carousel = closestCarousel(el);
    if (carousel) {
      let wrapper = getCarousel(carousel);
      // Snapshot the logical slide before the overlay state changes.
      const snap = snapLogicalIndex(carousel);
      const openNow = () => {
        carousel.parentNode.toggleModal = true; // skip mutation observer
        wrapper.classList.add("n-carousel--overlay");
        enableLightboxCrossAxisClose(wrapper, carousel);
        trapFocus(wrapper);
        setTimeout(() => {
          document.body.addEventListener("keyup", closeModalOnBodyClick);
        }, 100);
        // Inline lightbox: open to a requested slide (avoid timing/rAF races that can land on slide 0).
        if (Number.isFinite(openIndex) && carousel.children && carousel.children.length) {
          // Treat openIndex as a logical index (especially important for endless mode where DOM reorders).
          // Use the shared "restore after layout" helper (double rAF) to avoid first-open Safari races.
          carousel._ovSnapLogical = openIndex;
          document.body.dataset.frozen = document.body.scrollTop;
          restoreFromPropAfterLayout(carousel, "_ovSnapLogical", false);
          return;
        }
        if (!skipRestore && Number.isFinite(snap)) {
          carousel._ovSnapLogical = snap;
          restoreFromPropAfterLayout(carousel, "_ovSnapLogical", false);
        }
      };
      // Overlay: prefer native shared-element transitions when available.
      withOverlayViewTransition(wrapper, carousel, openNow, false);
    }
  };
  const AUTO_HEIGHT_EPSILON = 2;
  const AUTO_HEIGHT_STABLE_MS = 200;
  const getAutoHeightTarget = (content, slide) => {
    if (!content || !slide) return null;
    if (isVertical(content)) {
      slide.style.height = "auto";
      const computed_max_height = getComputedStyle(content).maxHeight;
      const max_height = computed_max_height.match(/px/)
        ? Math.ceil(parseFloat(computed_max_height))
        : MAX_HEIGHT_FALLBACK;
      const measured = Math.ceil(parseFloat(getComputedStyle(slide).height));
      slide.style.height = "";
      return Math.min(measured, max_height);
    }
    return Math.round(nextSlideHeight(slide));
  };
  const lockAutoHeight = (content, slide) => {
    if (!content || !slide) return;
    const target = getAutoHeightTarget(content, slide);
    if (!Number.isFinite(target)) return;
    content.style.height = `${target}px`;
    content._autoHeightLocked = true;
    content._autoHeightLockedSlide = slide;
    content._autoHeightLockedHeight = target;
    content._autoHeightLockUntil = performance.now() + AUTO_HEIGHT_STABLE_MS;
  };
  const clearAutoHeightLock = (content) => {
    if (!content) return;
    delete content._autoHeightLocked;
    delete content._autoHeightLockedSlide;
    delete content._autoHeightLockedHeight;
    delete content._autoHeightLockUntil;
  };
  const autoHeightObserver = new ResizeObserver((entries) => {
    window.requestAnimationFrame(() => {
      entries.forEach((e) => {
        let slide = e.target.querySelector(":scope > [aria-current]");
        if (!slide) return;
        let el = slide.closest(".n-carousel__content");
        if (!el) return;
        // If media in the active slide isn't ready, wait for it to load.
        if (!isSlideMediaReady(slide, el)) {
          return;
        }
        // Skip if there's any overlay descendant
        if (hasOverlayDescendant(el)) {
          return;
        }
        // Skip if already sliding to prevent update loops
        if (el.parentElement.dataset.sliding) {
          return;
        }
        const now = performance.now();
        if (
          (el._autoHeightLocked && el._autoHeightLockedSlide === slide) ||
          (el._autoHeightLockUntil && now < el._autoHeightLockUntil)
        ) {
          return;
        }
        // Prevent infinite loops by checking if height actually changed
        let currentHeight = parseFloat(getComputedStyle(el).height);
        let newHeight;
        if (isVertical(el)) {
          slide.style.height = "auto";
          newHeight = slide.scrollHeight;
          slide.style.height = "";
        } else {
          newHeight = nextSlideHeight(slide);
        }
        const roundedCurrent = Math.round(currentHeight);
        const roundedNew = Math.round(newHeight);
        if (
          Number.isFinite(el._autoHeightLast) &&
          Math.abs(roundedNew - el._autoHeightLast) <= AUTO_HEIGHT_EPSILON &&
          now - el._autoHeightLastAt < AUTO_HEIGHT_STABLE_MS
        ) {
          return;
        }
        // Only update if height actually changed (with small tolerance for subpixel differences)
        if (Math.abs(roundedCurrent - roundedNew) > AUTO_HEIGHT_EPSILON) {
          el._autoHeightLast = roundedNew;
          el._autoHeightLastAt = now;
          el._autoHeightLockUntil = now + AUTO_HEIGHT_STABLE_MS;
          el.parentNode.style.removeProperty("--height");
          if (isVertical(el)) {
            el.style.height = `${roundedNew}px`;
            updateCarousel(el);
          } else {
            el.style.height = "";
            el.style.height = `${roundedNew}px`;
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
  const isSlideMediaReady = (slide, content) => {
    if (!slide) return true;
    const imgs = slide.querySelectorAll("img");
    for (const img of imgs) {
      if (!img.complete || !img.naturalWidth) {
        watchMedia(img, content);
        return false;
      }
    }
    const videos = slide.querySelectorAll("video");
    for (const video of videos) {
      if (video.readyState < 1) {
        watchMedia(video, content, "loadedmetadata");
        return false;
      }
    }
    const iframes = slide.querySelectorAll("iframe");
    for (const frame of iframes) {
      if (!frame.dataset.nuiLoaded) {
        watchMedia(frame, content);
        return false;
      }
    }
    return true;
  };
  const watchMedia = (media, content, eventName = "load") => {
    if (!media || media.dataset?.nuiWatch) return;
    if (media.dataset) media.dataset.nuiWatch = "true";
    const onReady = () => {
      if (media.dataset) media.dataset.nuiWatch = "";
      if (media.tagName === "IFRAME") {
        media.dataset.nuiLoaded = "true";
      }
      if (content) {
        clearAutoHeightLock(content);
        content._autoHeightLockUntil = performance.now() + AUTO_HEIGHT_STABLE_MS;
        updateCarousel(content, true);
      }
    };
    media.addEventListener(eventName, onReady, { once: true });
  };
  const observersOn = (el) => {
    window.requestAnimationFrame(() => {
      // Always clear sliding lock when (re)enabling observers.
      // Important: we may early-return below when an overlay descendant exists, but we must still
      // clear data-sliding; otherwise the carousel can remain unclickable (pointer-events: none).
      clearSliding(el.parentNode);
      // Don't enable observers on parent carousel if there's ANY overlay carousel descendant
      // Overlay carousels need to remain interactive
      const overlayDescendant = hasOverlayDescendant(el);
      if (overlayDescendant) {
        // Skip observer setup for parent when overlay descendant exists anywhere
        return;
      }
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
    // Skip if there's any overlay descendant
    if (hasOverlayDescendant(el)) {
      return;
    }
    observersOff(el);
    const doUpdate = (el) => {
      updateSubpixels(el);
      window.requestAnimationFrame(() => {
        const active = el.querySelector(":scope > [aria-current]");
        if (!active) {
          observersOn(el);
          return;
        }
        const now = performance.now();
        if (isAutoHeight(el)) {
          observersOn(el);
          return;
        }
        const currentHeight = active.scrollHeight;
        const previousHeight = parseFloat(
          getComputedStyle(el).getPropertyValue("--height")
        );
        if (
          !Number.isFinite(previousHeight) ||
          Math.abs(currentHeight - previousHeight) > AUTO_HEIGHT_EPSILON
        ) {
          el.parentNode.style.setProperty("--height", `${currentHeight}px`);
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
        // Skip if there's any overlay descendant
        if (carousel && !hasOverlayDescendant(carousel)) {
          updateObserver(carousel);
          updateCarousel(carousel, true);
        }
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
      // Stamp original indices before any endless-mode DOM shuffling can occur.
      stampOriginalSlideIndices(content);
      if (!!previous) {
        previous.onclick = slidePreviousEvent;
      }
      if (!!next) {
        next.onclick = slideNextEvent;
      }
      if (!!index) {
        index.onclick = slideIndexEvent;
      }
      enableLightboxClickToOpen(el, content, !!close_modal);
      if (!!close_modal) {
        close_modal.onclick = (e) => {
          let wrapper = getCarousel(e.target);
          if (
            wrapper.classList.contains("n-carousel--overlay")
          ) {
            closeModal(e.target);
          } else {
            openModal(e.target);
          }
        };
      }
      // Safari fires fullscreen events on `document` inconsistently.
      // Install a single global handler, independent of presence of a fullscreen button.
      if (!window.__nCarouselFsHandler) {
        window.__nCarouselFsLast = null;
        window.__nCarouselFsHandler = () => {
          const enteringFullscreen = isFullScreen();
          const fsEl = fullscreenWrapper();
          const wrapper = (enteringFullscreen ? fsEl : window.__nCarouselFsLast) || fsEl;
          if (enteringFullscreen) window.__nCarouselFsLast = wrapper;
          if (!wrapper || !wrapper.classList || !wrapper.classList.contains("n-carousel")) {
            if (!enteringFullscreen) window.__nCarouselFsLast = null;
            return;
          }
          const carousel = wrapper.querySelector(":scope > .n-carousel__content");
          if (!carousel) {
            if (!enteringFullscreen) window.__nCarouselFsLast = null;
            return;
          }
          // Fullscreen wrappers must stay clickable - clear any sliding locks immediately.
          // (This also keeps tests deterministic when they force data-sliding.)
          clearSlidingLocks(wrapper);
          // Avoid the common "Esc exits fullscreen then also closes overlay" double-action.
          if (wrapper.classList.contains("n-carousel--overlay") && !enteringFullscreen) {
            wrapper._suppressOverlayEscapeUntil = performance.now() + 250;
          }
          // Restore using the current snapshot; wait for layout settle.
          if (enteringFullscreen && carousel._fsSnapLogical === undefined) {
            snapToProp(carousel, "_fsSnapLogical");
          }
          restoreFromPropAfterLayout(carousel, "_fsSnapLogical", !enteringFullscreen);
          if (!enteringFullscreen) window.__nCarouselFsLast = null;
        };
        // Use capture so we also receive events dispatched on wrappers (tests / Safari quirks).
        document.addEventListener("fullscreenchange", window.__nCarouselFsHandler, true);
        document.addEventListener("webkitfullscreenchange", window.__nCarouselFsHandler, true);
      }
      // Also listen on the wrapper itself: our test fullscreen stub dispatches fullscreenchange on the
      // element, and some browsers can differ in where they dispatch it.
      if (!el._ncFsListener) {
        el._ncFsListener = true;
        el.addEventListener("fullscreenchange", window.__nCarouselFsHandler);
        el.addEventListener("webkitfullscreenchange", window.__nCarouselFsHandler);
      }
      if (!!full_screen) {
        full_screen.onclick = (e) => {
          toggleFullScreen(e.target);
        };
      }
      el.addEventListener("keydown", carouselKeys);
      el.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
          let el = e.target;
          if (!el.closest(".n-carousel--overlay")) {
            let overlay = document.querySelector(".n-carousel--overlay");
            if (overlay) {
              let overlayContent = overlay.querySelector(":scope > .n-carousel__content");
              if (overlayContent) {
                e.__nCarouselHandledEscape = true;
                e.stopPropagation();
                closeModal(overlayContent);
              }
            }
            return;
          }
          if (el) {
            e.__nCarouselHandledEscape = true;
            e.stopPropagation();
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
          // This open is followed by an explicit jump to the hashed slide below.
          openModal(content, true);
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
          content.addEventListener("pointerenter", () =>
            clearTimeout(content.nCarouselTimeout)
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
  if (!window.__nuiAutoHeightResize) {
    window.__nuiAutoHeightResize = true;
    window.addEventListener("resize", () => {
      document
        .querySelectorAll(".n-carousel--auto-height > .n-carousel__content")
        .forEach((content) => {
          clearAutoHeightLock(content);
          updateCarousel(content, true);
        });
    });
  }
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

