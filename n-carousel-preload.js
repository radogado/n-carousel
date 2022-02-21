(() => {
  if (!!location.hash) {
    // Height adjustment during DOM population
    let observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        for (let el of mutation.addedNodes) {
          // We're iterating through _all_ the elements as the parser parses them,
          // deciding if they're the one we're looking for.
          if (!!el.matches && el.matches('.n-carousel__content > *') && !el.parentNode.parentNode.closest('.n-carousel__content') && el.matches(location.hash)) {
            el.scrollIntoView();
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const unobserve = () => {
      observer.disconnect();
    }

    if (document.readyState !== "loading") {
      unobserve();
    } else {
      document.addEventListener("DOMContentLoaded", unobserve);
    }

  }
})();
