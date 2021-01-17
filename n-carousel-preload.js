(() => {

  const isVertical = (el) => el.matches(".n-carousel--vertical");

  let observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let el of mutation.addedNodes) {
        // We're iterating through _all_ the elements as the parser parses them,
        // deciding if they're the one we're looking for.
        if (!!el.matches && el.matches(".n-carousel")) {

          let carousel = el.querySelector(":scope > .n-carousel__content");

          let padding_horizontal = parseInt(getComputedStyle(carousel).paddingLeft);
          let padding_vertical = parseInt(getComputedStyle(carousel).paddingTop);

          carousel.style.padding = isVertical(el) ? `${padding_vertical}px 0` : `0 ${padding_horizontal}px`;

          if (!isVertical(el)) {
            carousel.style.width = "";
            carousel.style.width = `${parseInt(getComputedStyle(carousel).width)}px`;
          }

          // We found our element, we're done:
          observer.disconnect();
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
