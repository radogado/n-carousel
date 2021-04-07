(function () {
  const ceilingWidth = (el) => Math.ceil(parseFloat(getComputedStyle(el).width));
  const ceilingHeight = (el) => Math.ceil(parseFloat(getComputedStyle(el).height));

  function isElementInViewport(el) {
    let rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) /* or $(window).height() */ &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
    );
  }
  const default_duration = 1000;
  const default_interval = 4000;

  const isChrome = !!navigator.userAgent.match("Chrome");
  const isSafari = navigator.userAgent.match(/Safari/) && !isChrome;

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
      !!document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen();
    } else {
      if (isSafari) {
        el.nuiAncestors = scrolledAncestors(el);
        el.nuiAncestors.forEach((el) => {
          el.nuiScrollX = el.scrollLeft;
          el.nuiScrollY = el.scrollTop;
        });
        el.addEventListener("webkitfullscreenchange", restoreScroll, false);
      }
      !!el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen();
    }

    // updateCarousel(carousel);
  };

  const scrollStartX = (el) => el.scrollLeft; // Get correct start scroll position for LTR and RTL

  const scrollTo = (el, x, y) => {
    el.scrollTo(isRTL(el) ? -1 * Math.abs(x) : x, y); // Scroll to correct scroll position for LTR and RTL
  };

  const getScroll = (el) => (el === window ? { x: el.scrollX, y: el.scrollY } : { x: scrollStartX(el), y: el.scrollTop });

  const isVertical = (el) => el.closest(".n-carousel").matches(".n-carousel--vertical");

  const isAuto = (el) => el.parentNode.matches(".n-carousel--auto-height");

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

  const observersOn = (el) => {
    delete el.parentNode.dataset.sliding;
    window.requestAnimationFrame(() => {
      if (el.parentNode.matches(".n-carousel--vertical.n-carousel--controls-outside.n-carousel--auto-height")) {
        height_minus_index.observe(el.parentNode);
      }

      el.addEventListener("scroll", scrollStop, { passive: true });
    });
  };

  const observersOff = (el) => {
    el.removeEventListener("scroll", scrollStop);
    height_minus_index.unobserve(el.parentNode);
    // el.removeEventListener("mousewheel", detectTrackPad);
    // el.removeEventListener("DOMMouseScroll", detectTrackPad);
  };

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

  const scrollAnimate = (el, distanceX, distanceY, new_height, old_height = false) =>
    new Promise((resolve, reject) => {
      // Thanks https://stackoverflow.com/posts/46604409/revisions

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || el.closest(".n-carousel").matches(".n-carousel--instant")) {
        scrollTo(el, getScroll(el).x + distanceX, getScroll(el).y + distanceY);
        el.style.height = `${new_height}px`;
        resolve(el);
        return;
      }

      subpixel.unobserve(el.parentNode);

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
          subpixel.observe(el.parentNode);
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

    let container_height = getComputedStyle(el).height;

    observersOff(el);

    el.dataset.x = Math.abs(Math.round(scrollStartX(el) / ceilingWidth(el.children[0])));
    el.dataset.y = Math.abs(Math.round(el.scrollTop / ceilingHeight(el.children[0])));

    let active = isVertical(el) ? el.dataset.y : el.dataset.x;

    if (active >= el.children.length) {
      active = el.children.length - 1;
    }

    let current_active = el.querySelector(":scope > [data-active]");

    if (current_active) {
      if (el.children[active] === current_active) {
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

    el.children[active].dataset.active = true;
    el.children[active].style.height = "";
    el.style.setProperty("--height", container_height);

    window.requestAnimationFrame(() => {
      if (!el.parentNode.dataset.ready && isAuto(el) && isVertical(el)) {
        el.style.height = `${parseFloat(getComputedStyle(el).height) - paddingY(el)}px`;
      }
    });

    // Fix buttons
    let index = getControl(el.closest(".n-carousel"), ".n-carousel__index");
    if (!!index) {
      if (index.querySelector("[disabled]")) {
        index.querySelector("[disabled]").disabled = false;
      }
      index.children[active].disabled = true;
    }

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
    // console.log("scroll stopped", e);
    let el = e.target;

    let mod_x = scrollStartX(el) % ceilingWidth(el.children[0]);
    let mod_y = el.scrollTop % ceilingHeight(el.children[0]);

    // console.log("while scrolling", mod_x, mod_y);

    const afterScrollTimeout = () => {
      let mod_x = scrollStartX(el) % ceilingWidth(el.children[0]);
      let mod_y = el.scrollTop % ceilingHeight(el.children[0]);

      // console.log("after timeout", mod_x, mod_y);

      // console.log("scrollStop check", mod_x, mod_y);

      let new_x = Math.abs(Math.round(scrollStartX(el) / ceilingWidth(el.children[0])));
      let new_y = Math.abs(Math.round(el.scrollTop / ceilingHeight(el.children[0])));
      if (mod_x !== 0 || mod_y !== 0) {
        // Stuck bc of Chrome bug when you scroll in both directions during snapping

        // console.log("stuck", new_x, new_y);
        slideTo(el, isVertical(el) ? new_y : new_x);
        return;
      }

      if (lastScrollX === scrollStartX(el) && lastScrollY === el.scrollTop && mod_x === 0 && mod_y === 0) {
        // Snapped to position, not stuck

        observersOff(el);

        if (isAuto(el)) {
          let old_height = parseFloat(getComputedStyle(el).height);
          let new_height;
          let offset_y = 0;

          if (isVertical(el)) {
            // let new_index = Math.abs(Math.round(el.scrollTop / (el.offsetHeight - paddingY(el))));
            el.children[new_y].style.height = "auto";
            new_height = el.children[new_y].scrollHeight;
            el.children[new_y].style.height = "";
            offset_y = new_y * new_height - el.scrollTop;
          } else {
            // let new_index = Math.abs(Math.round(scrollStartX(el) / (ceilingWidth(el) - paddingX(el))));
            new_height = parseFloat(getComputedStyle(el.children[new_x].children[0]).height); // but shouldn't be lower than blank carousel height. worked around by min height of 9em which surpasses the blank carousel height

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

    if (typeof window.ontouchstart !== "undefined" && (mod_x > 1 || mod_y > 1 || !!el.parentNode.dataset.sliding || !el.matches(".n-carousel__content"))) {
      // It should also set up the timeout in case we're stuck after a while
      return; // return only on touch Safari. What about iPad Safari with trackpad?
    }

    clearTimeout(isScrolling);

    lastScrollX = scrollStartX(el);
    lastScrollY = el.scrollTop;

    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout(afterScrollTimeout, 133);
  };

  const slide = (el, offsetX, offsetY, index) => {
    clearTimeout(el.nCarouselTimeout);

    observersOff(el);

    if (!el.parentNode.dataset.sliding) {
      el.parentNode.dataset.sliding = true;

      let old_height = el.children[isVertical(el) ? el.dataset.y : el.dataset.x].clientHeight;
      let new_height = old_height;
      let scroll_to_y = 0;

      if (isAuto(el)) {
        let old_scroll_left = scrollStartX(el);
        let old_scroll_top = el.scrollTop;

        if (isVertical(el)) {
          el.children[index].style.height = "auto";
          new_height = el.children[index].scrollHeight;
        } else {
          new_height = parseFloat(getComputedStyle(el.children[index].children[0]).height);
          let old_height = parseInt(el.dataset.x) === index ? new_height : parseFloat(getComputedStyle(el.children[el.dataset.x].children[0]).height);

          el.style.setProperty("--height", `${old_height}px`);
          // console.log("old index", el.dataset.x, "new index", index, "--height (old height):", old_height, "new height", new_height); // old height is wrong
        }
        el.children[index].style.width = el.children[index].style.height = "";

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
    let index = 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
    slideTo(el, index >= el.children.length - 1 ? 0 : index + 1);
  };

  const slidePrevious = (el) => {
    let index = 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
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
    if (el) slideTo(closestCarousel(el), [...el.parentNode.children].indexOf(el));
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

  const subpixel = new ResizeObserver((entries) => {
    window.requestAnimationFrame(() => {
      entries.forEach((e) => {
        let el = e.target;

        if (el.matches(".n-carousel--auto-height") && !!el.parentNode.dataset.sliding) {
          return;
        }

        // Round down the padding, because sub pixel padding + scrolling is a problem
        let carousel = el.querySelector(":scope > .n-carousel__content");
        carousel.style.setProperty("--subpixel-compensation-peeking", 0);
        carousel.style.setProperty("--subpixel-compensation", 0);
        if (isVertical(el)) {
          let peeking_compensation = carousel.firstElementChild.getBoundingClientRect().y - carousel.getBoundingClientRect().y;
          carousel.style.setProperty("--subpixel-compensation-peeking", Math.ceil(peeking_compensation) - peeking_compensation);
          carousel.style.setProperty("--subpixel-compensation", ceilingHeight(carousel.firstElementChild) - parseFloat(getComputedStyle(carousel.firstElementChild).height));
        } else {
          let peeking_compensation = carousel.firstElementChild.getBoundingClientRect().x - carousel.getBoundingClientRect().x;
          carousel.style.setProperty("--subpixel-compensation-peeking", Math.ceil(peeking_compensation) - peeking_compensation);
          carousel.style.setProperty("--subpixel-compensation", ceilingWidth(carousel.firstElementChild) - parseFloat(getComputedStyle(carousel.firstElementChild).width));
        }
        // console.log(carousel.children[carousel.dataset.x], carousel.children[carousel.dataset.y]);
        scrollTo(carousel, carousel.dataset.x * ceilingWidth(carousel.firstElementChild), carousel.dataset.y * ceilingHeight(carousel.firstElementChild));
      });
    });
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
    window.requestAnimationFrame(() => {
      // Observing the carousel wrapper
      entries.forEach((e) => {
        let el = e.target;

        setIndexWidth(el);
      });
    });
  });

  const init = (host) => {
    host.querySelectorAll(".n-carousel:not([data-ready])").forEach((el) => {
      let previous = getControl(el, ".n-carousel__previous");
      let next = getControl(el, ".n-carousel__next");
      let index = getControl(el, ".n-carousel__index");

      if (!!previous) {
        previous.onclick = slidePreviousEvent;
      }

      if (!!next) {
        next.onclick = slideNextEvent;
      }

      if (!!index) {
        index.onclick = slideIndexEvent;
      }

      el.querySelector(".n-carousel__content").onkeydown = carouselKeys;

      let content = el.querySelector(":scope > .n-carousel__content");
      content.tabIndex = 0;
      if (el.matches(".n-carousel--vertical.n-carousel--auto-height")) {
        content.style.height = getComputedStyle(content).height;
        el.dataset.ready = true;
        content.scrollTop = 0; // Should be a different value if the initial active slide is other than the first one (unless updateCarousel() takes care of it)
      }

      if (el.matches(".n-carousel--vertical.n-carousel--auto-height")) {
        // Vertical auto has a specified height which needs update on resize
        content.querySelectorAll(":scope > * > *").forEach((el) => verticalAutoObserver.observe(el));
      }

      const full_screen = el.querySelector(":scope > .n-carousel__full-screen button");
      if (full_screen) {
        full_screen.onclick = (e) => {
          let carousel = e.target.closest(".n-carousel").querySelector(":scope > .n-carousel__content");
          carousel.dataset.xx = carousel.dataset.x;
          carousel.dataset.yy = carousel.dataset.y;
          // let x = carousel.dataset.x;
          // let y = carousel.dataset.y;
          // console.log(x, carousel.scrollLeft);

          toggleFullScreen(e.target);
        };
        el.onfullscreenchange = (e) => {
          // Chrome: Keep and update the real scroll here
          let carousel = e.target.querySelector(":scope > .n-carousel__content");
          // let x = carousel.dataset.x;
          // let y = carousel.dataset.y;
          // console.log(x, carousel.scrollLeft);

          // $0.scrollTo($0.dataset.xx * Math.ceil(parseFloat(getComputedStyle($0.firstElementChild).width)), 0); delete $0.dataset.xx;

          // console.log(carousel.dataset.xx, carousel.dataset.xx * ceilingWidth(carousel.children[carousel.dataset.xx]));

          window.requestAnimationFrame(() => {
            carousel.dataset.x = carousel.dataset.xx;
            carousel.dataset.y = carousel.dataset.yy;
            delete carousel.dataset.xx;
            delete carousel.dataset.yy;

            scrollTo(carousel, carousel.dataset.x * ceilingWidth(carousel.children[carousel.dataset.x]), carousel.dataset.y * ceilingHeight(carousel.children[carousel.dataset.y]));
          });
        };
      }

      window.requestAnimationFrame(() => {
        subpixel.observe(el);
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
    });
  };

  typeof registerComponent === "function" ? registerComponent("n-select", init) : init(document);
})();
