(function () {
  function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight ||
          document.documentElement.clientHeight) /* or $(window).height() */ &&
      rect.right <=
        (window.innerWidth ||
          document.documentElement.clientWidth) /* or $(window).width() */
    );
  }
  const default_duration = 1000;
  const default_interval = 4000;

  const isChrome = !!navigator.userAgent.match("Chrome");
  const isSafari = navigator.userAgent.match(/Safari/) && !isChrome;

  const getScrollableAncestor = (el) => {
    el = el.parentNode;
    while (el) {
      if (el.scrollHeight > el.offsetHeight) {
        return el;
      } else {
        el = el.parentNode;
      }
    }
    return false;
  };

  let isRTL = (el) => getComputedStyle(el).direction === "rtl";

  let resize_observer_support = typeof ResizeObserver === "function";

  // 	let scrollStartX = el => isRTL(el) && isChrome ? el.scrollLeft : (isRTL(el) && !isChrome ? -1 : 1) * el.scrollLeft; // Get correct start scroll position for LTR and RTL

  let scrollStartX = (el) => el.scrollLeft; // Get correct start scroll position for LTR and RTL

  let scrollToAuto = (el, x, y) => {
    // console.log('scroll to auto: ', isRTL(el) ? -1 * Math.abs(x) : x, y);
    el.scrollTo(isRTL(el) ? -1 * Math.abs(x) : x, y); // Scroll to correct scroll position for LTR and RTL
  };

  let getScroll = (el) =>
    el === window
      ? { x: el.scrollX, y: el.scrollY }
      : { x: scrollStartX(el), y: el.scrollTop };

  let isVertical = (el) =>
    el.closest(".n-carousel").matches(".n-carousel--vertical");

  let isAuto = (el) => el.parentNode.matches(".n-carousel--auto-height");

  let observersOn = (el) => {
    setTimeout(() => {
      el.addEventListener("scroll", scrollStopped);
      delete el.parentNode.dataset.sliding;
      if (
        el.parentNode.matches(
          ".n-carousel--vertical.n-carousel--controls-outside"
        )
      ) {
        height_minus_index.observe(el.parentNode);
      }
    }, 66);
  };

  let observersOff = (el) => {
    el.removeEventListener("scroll", scrollStopped);

    if (
      el.parentNode.matches(
        ".n-carousel--vertical.n-carousel--controls-outside"
      )
    ) {
      height_minus_index.unobserve(el.parentNode);
    }
  };

  let inOutSine = (n) => (1 - Math.cos(Math.PI * n)) / 2;

  let scrollBy = (el, distanceX, distanceY, new_height) =>
    new Promise((resolve, reject) => {
      // Thanks https://stackoverflow.com/posts/46604409/revisions

      console.log(
        "scrolling by: x ",
        distanceX,
        " y ",
        distanceY,
        " height ",
        new_height
      );
      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        el.closest(".n-carousel").matches(".n-carousel--instant")
      ) {
        scrollToAuto(
          el,
          getScroll(el).x + distanceX,
          getScroll(el).y + distanceY
        );
        el.style.height = `${new_height}px`;
        resolve(el);
        return;
      }

      let scroll_changing = true;

      if (distanceX === 0 && distanceY === 0) {
        scroll_changing = false;
      }

      if (!!new_height) {
        el.style.height = getComputedStyle(el).height;
        // if (
        //   el.parentNode.matches(
        //     ".n-carousel--vertical.n-carousel--controls-outside"
        //   )
        // ) {
        //   el.parentNode.style.setProperty(
        //     "--height-minus-index",
        //     `${new_height}px`
        //   );
        // }
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
        if (stop) {
          scrollToAuto(el, startx + distanceX, starty + distanceY);
          if (new_height) {
            el.style.height = `${Math.ceil(new_height)}px`;
          }
          resolve(el);
          subpixel.observe(el.parentNode);
          return;
        }
        if (now - start >= duration) stop = true;
        var p = (now - start) / duration;
        var val = inOutSine(p);
        var x = startx + distanceX * val;
        var y = starty + distanceY * val;

        if (scroll_changing) {
          scrollToAuto(el, x, y);
        }

        if (new_height) {
          window.requestAnimationFrame(() => {
            el.style.height = `${starth + distanceH * val}px`;
          }); // Timeout because Safari can't do scroll and height at once
        }

        requestAnimationFrame(draw);
      };

      subpixel.unobserve(el.parentNode);
      requestAnimationFrame(startAnim);
    });

  let paddingX = (el) => parseInt(getComputedStyle(el).paddingInlineStart) * 2;

  let paddingY = (el) => parseInt(getComputedStyle(el).paddingBlockStart) * 2;

  let getControl = (carousel, control) => {
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

  let updateCarousel = (el) => {
    // Called on init and scroll end

    observersOff(el);
    delete el.dataset.touchend;
    el.dataset.x = Math.abs(
      Math.round(scrollStartX(el) / (el.offsetWidth - paddingX(el)))
    );
    el.dataset.y = Math.abs(
      Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)))
    );

    console.log("updateCarousel", el.scrollTop, el.offsetHeight);

    let active = isVertical(el) ? el.dataset.y : el.dataset.x;

    if (active >= el.children.length) {
      active = el.children.length - 1;
    }

    console.log("updateCarousel", scrollStartX(el), "active", active);

    let current_active = el.querySelector(":scope > [data-active]");

    if (current_active) {
      if (el.children[active] === current_active) {
        // Scroll snapping back to the same slide. Nothing to do here.

        // el.style = '';
        observersOn(el);
        return;
      }

      delete current_active.dataset.active;
      current_active.style.height = "";
      if (!isVertical(el)) {
        el.style.height = "";
      }
    }

    if (!el.parentNode.dataset.ready && isAuto(el) && isVertical(el)) {
      window.requestAnimationFrame(() => {
        el.style.height = `${el.offsetHeight - paddingY(el)}px`;
      });
    }

    el.children[active].dataset.active = true;
    el.children[active].style.height = "";

    // Fix buttons.
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

  let scrollStopped = (e) => {
    // console.log("scroll ", e);
    // return;
    // Clear our timeout throughout the scroll
    let el = e.target;
    if (!!el.parentNode.dataset.sliding) {
      // e.preventDefault();
      return;
    }

    let mod_x = scrollStartX(el) % (el.offsetWidth - paddingX(el));
    let mod_y = el.scrollTop % (el.offsetHeight - paddingY(el));

    if (mod_x !== 0 || mod_y !== 0) {
      return;
    }

    clearTimeout(isScrolling);

    lastScrollX = scrollStartX(el);
    lastScrollY = el.scrollTop;

    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout(function () {
      let mod_x = scrollStartX(el) % (el.offsetWidth - paddingX(el));
      let mod_y = el.scrollTop % (el.offsetHeight - paddingY(el));

      console.log("scrollStopped check", mod_x, mod_y);

      if (/* isChrome && */ mod_x !== 0 || mod_y !== 0) {
        // Stuck bc of Chrome bug when you scroll in both directions during snapping

        let new_x = Math.abs(
          Math.round(scrollStartX(el) / (el.offsetWidth - paddingX(el)))
        );
        let new_y = Math.abs(
          Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)))
        );
        console.log("stuck", new_x, new_y);
        slideTo(el, isVertical(el) ? new_y : new_x);
        return;
      }

      if (
        lastScrollX === scrollStartX(el) &&
        lastScrollY === el.scrollTop &&
        mod_x === 0 &&
        mod_y === 0
      ) {
        // Also if scroll is in snap position
        // 			console.log(lastScrollX, scrollStartX(el));
        console.log(
          "Scrolling has stopped.",
          el,
          scrollStartX(e.target),
          lastScrollX,
          el.scrollTop,
          lastScrollY
        );
        // 			updateCarousel(el);

        observersOff(el);

        if (isAuto(el)) {
          let old_height = el.offsetHeight;
          let new_height;

          if (isVertical(el)) {
            let new_index = Math.abs(
              Math.round(el.scrollTop / (el.offsetHeight - paddingY(el)))
            );
            el.children[new_index].style.height = "auto";
            new_height = el.children[new_index].scrollHeight;
            el.children[new_index].style.height = "";
            var offset_y = new_index * new_height - el.scrollTop;
          } else {
            el.style.height = "";
            let new_index = Math.abs(
              Math.round(scrollStartX(el) / (el.offsetWidth - paddingX(el)))
            );
            el.children[new_index].style.height = "auto";

            el.classList.add("n-measure");

            new_height = Math.max(
              el.children[new_index].scrollHeight,
              el.scrollHeight
            );

            el.classList.remove("n-measure");

            el.children[new_index].style.height = "";
            scrollToAuto(el, lastScrollX, lastScrollY);
            var offset_y = 0;
          }

          if (old_height === new_height) {
            new_height = false;
          }
          console.log("scroll end new height", new_height);

          el.parentNode.dataset.sliding = true;

          scrollBy(el, 0, offset_y, new_height).then((response) => {
            // Scroll by old height * index, last param is new height - old height?

            updateCarousel(el);
            setTimeout(() => {
              delete el.parentNode.dataset.sliding;
            }, 166);
          });
        } else {
          updateCarousel(el);
          setTimeout(() => {
            delete el.parentNode.dataset.sliding;
          }, 166);
        }
      }
    }, 133);
  };

  let slide = (el, offsetX, offsetY, index) => {
    clearTimeout(el.nCarouselTimeout);

    observersOff(el);

    if (!el.parentNode.dataset.sliding) {
      el.removeEventListener("scroll", scrollStopped);

      el.parentNode.dataset.sliding = true;

      let old_height = el.children[el.dataset.y].clientHeight;

      let new_height = old_height;

      if (isAuto(el)) {
        let old_scroll_left = scrollStartX(el);
        let old_scroll_top = el.scrollTop;

        if (isVertical(el)) {
          el.children[index].style.height = "auto";
          new_height = el.children[index].scrollHeight;
        } else {
          el.children[index].style.width = `${el.offsetWidth - paddingX(el)}px`;

          el.classList.add("n-measure");

          new_height = Math.max(
            el.children[index].scrollHeight,
            el.scrollHeight
          );

          el.classList.remove("n-measure");
        }
        el.children[index].style.width = el.children[index].style.height = "";

        scrollToAuto(el, old_scroll_left + paddingX(el) / 2, old_scroll_top); // iPad bug
        scrollToAuto(el, old_scroll_left, old_scroll_top);
      }

      let scroll_to_y = isVertical(el)
        ? offsetY - index * old_height + index * new_height
        : 0;

      scrollBy(
        el,
        offsetX,
        scroll_to_y,
        new_height === old_height ? false : Math.ceil(new_height)
      ).then((response) => {
        updateCarousel(el); // Handled by scroll end
      });
    }
  };

  let slideNext = (el) => {
    let index = 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
    slideTo(el, index >= el.children.length - 1 ? 0 : index + 1);
  };

  let slidePrevious = (el) => {
    let index = 1 * (isVertical(el) ? el.dataset.y : el.dataset.x);
    slideTo(el, index === 0 ? el.children.length - 1 : index - 1);
  };

  let slideTo = (el, index) => {
    if (isVertical(el)) {
      slide(
        el,
        0,
        (el.offsetHeight - paddingY(el)) * index - el.scrollTop,
        index
      );
    } else {
      let new_offset = isRTL(el)
        ? Math.abs(scrollStartX(el)) - (el.offsetWidth - paddingX(el)) * index
        : (el.offsetWidth - paddingX(el)) * index - scrollStartX(el);

      slide(el, new_offset, 0, index);
    }
  };

  let resizeObserverFallback = (e) => {
    document.querySelectorAll(".n-carousel__content").forEach((el) => {
      // Clear our timeout throughout the scroll
      clearTimeout(isResizing);

      // Set a timeout to run after scrolling ends
      isResizing = setTimeout(function () {
        scrollToAuto(
          el,
          el.offsetWidth * el.dataset.x - paddingX(el),
          el.offsetHeight * el.dataset.y + paddingY(el)
        );
      }, 66);
    });
  };

  let carouselKeys = (e) => {
    let keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    // let keys_vertical = ["ArrowUp", "ArrowDown", "Home", "End"];
    // let keys_2d = [
    //   "ArrowLeft",
    //   "ArrowRight",
    //   "ArrowUp",
    //   "ArrowDown",
    //   "Home",
    //   "End",
    // ];

    // 	console.log(e);
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

        case "ArrowUp": {
          slidePrevious(el);
          break;
        }

        case "ArrowDown": {
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

  let closestCarousel = (el) =>
    (
      document.getElementById(
        el.closest('[class*="n-carousel"]').dataset.for
      ) || el.closest(".n-carousel")
    ).querySelector(".n-carousel__content");

  let slidePreviousEvent = (e) =>
    slidePrevious(closestCarousel(e.target.closest('[class*="n-carousel"]')));

  let slideNextEvent = (e) =>
    slideNext(closestCarousel(e.target.closest('[class*="n-carousel"]')));

  let slideIndexEvent = (e) => {
    let el = e.target.closest("button");
    if (el)
      slideTo(closestCarousel(el), [...el.parentNode.children].indexOf(el));
  };

  let verticalAutoObserver = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      console.log("resized: ", e.target);
      let slide = e.target;
      let el = slide.closest(".n-carousel__content");

      if (!!slide.parentNode.dataset.active && !el.parentNode.dataset.sliding) {
        el.style.height = `${slide.scrollHeight}px`;
      }
    });
  });

  let subpixel = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      let el = e.target;

      if (
        el.matches(".n-carousel--auto-height") &&
        !!el.parentNode.dataset.sliding
      ) {
        return;
      }

      // el.style.removeProperty("--subpixel-compensation");

      // Round down the padding, because sub pixel padding + scrolling is a problem
      let carousel = el.querySelector(":scope > .n-carousel__content");

      carousel.style.width = "";

      let padding_horizontal = parseInt(getComputedStyle(carousel).paddingLeft);
      let padding_vertical = parseInt(getComputedStyle(carousel).paddingTop);

      carousel.style.padding = isVertical(el)
        ? `${padding_vertical}px 0`
        : `0 ${padding_horizontal}px`;

      if (!isVertical(el)) {
        carousel.style.width = `${parseInt(
          getComputedStyle(carousel).width
        )}px`;
      }
    });
  });

  let height_minus_index = new ResizeObserver((entries) => {
    // Observing the carousel wrapper
    entries.forEach((e) => {
      let el = e.target;
      let index = el.querySelector(":scope > .n-carousel__index");
      if (index && !el.dataset.sliding) {
        el.style.removeProperty("--height-minus-index");
        index.style.position = "absolute";
        el.style.setProperty(
          "--height-minus-index",
          `${el.querySelector(":scope > .n-carousel__content").offsetHeight}px`
        );
        el.style.setProperty(
          "--index-width",
          `${el.querySelector(":scope > .n-carousel__index").offsetWidth}px`
        );
        index.style.position = "";
      }
    });
  });

  document.querySelectorAll(".n-carousel:not([data-ready])").forEach((el) => {
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

    window.requestAnimationFrame(() => {
      subpixel.observe(el);
      el.dataset.ready = true;

      updateCarousel(content);
      if (el.matches(".n-carousel--vertical.n-carousel--auto-height")) {
        // Vertical auto has a specified height which needs update on resize
        content
          .querySelectorAll(":scope > * > *")
          .forEach((el) => verticalAutoObserver.observe(el));
      }
    });

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

    content.addEventListener("focusin", (e) => {
      // console.log(e.target);
      let el = e.target.closest(".n-carousel__content > *");
      if (el) {
        let index = [...el.parentNode.children].indexOf(el);
        let carousel = el.closest(".n-carousel__content");
        let current_index = parseInt(
          isVertical(carousel) ? carousel.dataset.y : carousel.dataset.x
        );
        if (current_index !== index) {
          slideTo(carousel, index);
        }
      }
    });

    // Fix snapping with mouse wheel. Thanks https://stackoverflow.com/a/62415754/3278539

    function detectTrackPad(e) {
      var isTrackpad = false;
      if (e.wheelDeltaY) {
        if (e.wheelDeltaY === e.deltaY * -3) {
          isTrackpad = true;
        }
      } else if (e.deltaMode === 0) {
        isTrackpad = true;
      }
      console.log(e);
      console.log(isTrackpad ? "Trackpad detected" : "Mousewheel detected");

      if (!isTrackpad) {
        // Also check if the slide can scroll in the requested direction and let it wheel scroll inside if yes
        let el = e.target.closest(".n-carousel__content");
        let scrollable_ancestor = getScrollableAncestor(e.target);

        // If scrolled carousel is currently sliding, its scrollable parent will scroll. Should cancel instead.

        if (e.deltaY < 0) {
          if (
            !scrollable_ancestor ||
            scrollable_ancestor.matches(".n-carousel__content") ||
            scrollable_ancestor.scrollTop === 0
          ) {
            e.preventDefault();
            slidePrevious(el);
          }
        } else {
          if (
            !scrollable_ancestor ||
            scrollable_ancestor.matches(".n-carousel__content") ||
            scrollable_ancestor.scrollTop + scrollable_ancestor.offsetHeight ===
              scrollable_ancestor.scrollHeight
          ) {
            e.preventDefault();
            slideNext(el);
          }
        }
      }
    }

    content.addEventListener("mousewheel", detectTrackPad, false);
    content.addEventListener("DOMMouseScroll", detectTrackPad, false);
  });
})();
