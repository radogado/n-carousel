import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCarousel,
  getActiveSlideIndex,
  mockCarouselLayout,
} from "./utils.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Horizontal controls and index synchronization", () => {
  let container;
  let style;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    style = document.createElement("style");
    style.textContent = `
      .n-carousel { width: 500px; height: 300px; overflow: hidden; }
      .n-carousel__content {
        display: flex; width: 500px; height: 300px;
        overflow-x: auto; scroll-snap-type: x mandatory;
      }
      .n-carousel__content > li {
        flex: 0 0 500px; width: 500px; height: 300px;
        scroll-snap-align: center;
      }
    `;
    document.head.appendChild(style);
    if (!window.matchMedia) {
      window.matchMedia = () => ({
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      });
    }
  });

  afterEach(() => {
    container
      .querySelectorAll(".n-carousel__content")
      .forEach((content) => clearTimeout(content._testScrollEndTimer));
    container.remove();
    style.remove();
  });

  const initCarousel = async () => {
    const carousel = createCarousel({ slides: 3 });
    container.appendChild(carousel);
    const content = carousel.querySelector(".n-carousel__content");
    mockCarouselLayout(content);
    window.nCarouselInit(document);
    await wait(300);
    expect(carousel.dataset.ready).toBe("true");
    return { carousel, content };
  };

  const installScrollingScrollTo = (content, snapBack = false) => {
    const emitScroll = () => {
      content.dispatchEvent(new Event("scroll"));
      clearTimeout(content._testScrollEndTimer);
      content._testScrollEndTimer = setTimeout(
        () => content.dispatchEvent(new Event("scrollend")),
        50
      );
    };
    content.scrollTo = (options) => {
      content.scrollLeft = options.left ?? content.scrollLeft;
      content.scrollTop = options.top ?? content.scrollTop;
      emitScroll();
      if (snapBack && content.scrollLeft > 0) {
        setTimeout(() => {
          content.scrollLeft = 0;
          emitScroll();
        }, 20);
      }
    };
  };

  it("updates slide and index state after Next, then keeps manual scroll synchronized", async () => {
    const { carousel, content } = await initCarousel();
    installScrollingScrollTo(content);

    carousel.querySelector(".n-carousel__next button").click();
    await wait(250);

    expect(getActiveSlideIndex(carousel)).toBe(1);
    expect(
      [...carousel.querySelectorAll(".n-carousel__index button")].findIndex(
        (button) => button.hasAttribute("aria-current")
      )
    ).toBe(1);

    content.scrollLeft = 1000;
    content.dispatchEvent(new Event("scroll"));
    content.dispatchEvent(new Event("scrollend"));
    await wait(250);

    expect(getActiveSlideIndex(carousel)).toBe(2);
    expect(
      [...carousel.querySelectorAll(".n-carousel__index button")].findIndex(
        (button) => button.hasAttribute("aria-current")
      )
    ).toBe(2);
  });

  it("restores the first index when snapping back after an index click", async () => {
    const { carousel, content } = await initCarousel();
    installScrollingScrollTo(content, true);

    carousel.querySelectorAll(".n-carousel__index button")[2].click();
    await wait(300);

    expect(content.scrollLeft).toBe(0);
    expect(getActiveSlideIndex(carousel)).toBe(0);
    expect(
      [...carousel.querySelectorAll(".n-carousel__index button")].findIndex(
        (button) => button.hasAttribute("aria-current")
      )
    ).toBe(0);
  });

  it("blocks overlapping controls during smooth scrolling", async () => {
    const { carousel, content } = await initCarousel();
    installScrollingScrollTo(content);
    const controls = carousel.querySelectorAll(".n-carousel__index button");

    controls[1].click();
    await wait(40);
    controls[2].click();
    await wait(300);

    expect(getActiveSlideIndex(carousel)).toBe(1);
    expect(
      [...controls].findIndex((button) =>
        button.hasAttribute("aria-current")
      )
    ).toBe(1);
    expect(content._ncProgrammaticScrollUnbind).toBeNull();
    expect(content._ncProgrammaticScrollTimer).toBeNull();
  });

  it("recovers observers when smooth scrolling emits no completion event", async () => {
    const { carousel, content } = await initCarousel();
    content.scrollTo = (options) => {
      content.scrollLeft = options.left ?? content.scrollLeft;
      content.scrollTop = options.top ?? content.scrollTop;
    };

    carousel.querySelector(".n-carousel__next button").click();
    await wait(800);

    expect(getActiveSlideIndex(carousel)).toBe(1);
    expect(
      [...carousel.querySelectorAll(".n-carousel__index button")].findIndex(
        (button) => button.hasAttribute("aria-current")
      )
    ).toBe(1);
    expect(content._ncProgrammaticScrollUnbind).toBeNull();
    expect(content._ncProgrammaticScrollTimer).toBeNull();
    expect(typeof content._ncScrollEndUnbind).toBe("function");
  });
});
