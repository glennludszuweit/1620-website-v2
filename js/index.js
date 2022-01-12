{
  // Helper functions
  const MathUtils = {
    lineEq: (y2, y1, x2, x1, currentVal) => {
      // y = mx + b
      var m = (y2 - y1) / (x2 - x1),
        b = y1 - m * x1;
      return m * currentVal + b;
    },
    lerp: (a, b, n) => (1 - n) * a + n * b,
    getRandomFloat: (min, max) =>
      (Math.random() * (max - min) + min).toFixed(2),
  };

  // Gets the mouse position
  const getMousePos = (e) => {
    let posx = 0;
    let posy = 0;
    if (!e) e = window.event;
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX + body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + body.scrollTop + document.documentElement.scrollTop;
    }
    return { x: posx, y: posy };
  };

  function scrollIt(destination, duration = 200, easing = "linear", callback) {
    const easings = {
      linear(t) {
        return t;
      },
      easeOutQuad(t) {
        return t * (2 - t);
      },
    };

    const start = window.pageYOffset;
    const startTime =
      "now" in window.performance ? performance.now() : new Date().getTime();

    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const windowHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.getElementsByTagName("body")[0].clientHeight;
    const destinationOffset =
      typeof destination === "number" ? destination : destination.offsetTop;
    const destinationOffsetToScroll = Math.round(
      documentHeight - destinationOffset < windowHeight
        ? documentHeight - windowHeight
        : destinationOffset
    );

    if ("requestAnimationFrame" in window === false) {
      window.scroll(0, destinationOffsetToScroll);
      if (callback) {
        callback();
      }
      return;
    }

    function scroll() {
      const now =
        "now" in window.performance ? performance.now() : new Date().getTime();
      const time = Math.min(1, (now - startTime) / duration);
      const timeFunction = easings[easing](time);
      window.scroll(
        0,
        Math.abs(
          Math.ceil(timeFunction * (destinationOffsetToScroll - start) + start)
        )
      );
      if (window.pageYOffset === destinationOffsetToScroll) {
        if (callback) {
          callback();
        }
        return;
      }

      requestAnimationFrame(scroll);
    }

    scroll();
  }

  // Calculate the viewport size
  let winsize;
  const calcWinsize = () =>
    (winsize = { width: window.innerWidth, height: window.innerHeight });
  calcWinsize();
  window.addEventListener("resize", calcWinsize);

  // Track the mouse position
  let mousepos = { x: winsize.width / 2, y: winsize.height / 2 };
  window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

  // Custom cursor
  class Cursor {
    constructor(el) {
      this.DOM = { el: el };
      this.DOM.circle = this.DOM.el.querySelector(".cursor__inner--circle");
      this.DOM.arrows = {
        right: this.DOM.el.querySelector(".cursor__side--right"),
        left: this.DOM.el.querySelector(".cursor__side--left"),
      };
      this.bounds = this.DOM.circle.getBoundingClientRect();

      this.renderedStyles = {
        tx: { previous: 0, current: 0, amt: 0.2 },
        ty: { previous: 0, current: 0, amt: 0.2 },
        scale: { previous: 1, current: 1, amt: 0.2 },
      };
      requestAnimationFrame(() => this.render());
    }
    render() {
      this.renderedStyles["tx"].current = mousepos.x - this.bounds.width / 2;
      this.renderedStyles["ty"].current = mousepos.y - this.bounds.height / 2;

      for (const key in this.renderedStyles) {
        this.renderedStyles[key].previous = MathUtils.lerp(
          this.renderedStyles[key].previous,
          this.renderedStyles[key].current,
          this.renderedStyles[key].amt
        );
      }

      this.DOM.circle.style.transform = `translateX(${this.renderedStyles["tx"].previous}px) translateY(${this.renderedStyles["ty"].previous}px) scale(${this.renderedStyles["scale"].previous})`;
      requestAnimationFrame(() => this.render());
    }
    enter() {
      this.renderedStyles["scale"].current = 1.9;
    }
    leave() {
      this.renderedStyles["scale"].current = 1;
    }
    click() {
      this.renderedStyles["scale"].previous = 0.4;
    }
    showArrows() {
      TweenMax.to(
        Object.values(this.DOM.arrows),
        ANIMATION_SETTINGS.cursor.duration,
        {
          ease: ANIMATION_SETTINGS.cursor.ease,
          startAt: { x: (i) => (i ? 10 : -10) },
          opacity: 1,
          x: 0,
        }
      );
    }
    hideArrows() {
      TweenMax.to(
        Object.values(this.DOM.arrows),
        ANIMATION_SETTINGS.cursor.duration,
        {
          ease: ANIMATION_SETTINGS.cursor.ease,
          x: (i) => (i ? 10 : -10),
          opacity: 0,
        }
      );
    }
  }

  // A menu item
  class MenuItem {
    constructor(el) {
      // The main wrapper
      this.DOM = { el: el };
      // The inner link (.menu__item-link)
      this.DOM.link = this.DOM.el.querySelector(".menu__item-link");
      // The explore link
      this.DOM.explore = this.DOM.el.querySelector(".menu__item-explore");
      // We will need the size and position for the calculations needed to drag/translate the menu
      this.rect = this.DOM.el.getBoundingClientRect();

      // Need to recalculate size and position on window resize
      window.addEventListener(
        "resize",
        () => (this.rect = this.DOM.el.getBoundingClientRect())
      );
    }
    setCurrent() {
      this.DOM.el.classList.add("menu__item--current");
      return this;
    }
    unsetCurrent() {
      this.DOM.el.classList.remove("menu__item--current");
    }
    isCurrent() {
      return this.DOM.el.classList.contains("menu__item--current");
    }
  }

  // The menu
  class Menu {
    constructor(el) {
      // The menu wrap (.menu-wrap)
      this.DOM = { el: el };
      // The menu element
      this.DOM.menu = this.DOM.el.querySelector(".menu");
      // The draggable container
      this.DOM.draggable = this.DOM.el.querySelector(".menu-draggable");

      // MenuItem instances
      this.menuItems = [];
      [...this.DOM.menu.querySelectorAll(".menu__item")].forEach(
        (item, position) => this.menuItems.push(new MenuItem(item))
      );
      // Total number of menu items
      this.menuItemsTotal = this.menuItems.length;
      // Index of the current menuItem
      this.current = 0;
      // Set the first menu item to current and show its explore link
      this.menuItems[this.current].setCurrent();
      // Initialize the Draggabilly (on the x axis)
      this.draggie = new Draggabilly(this.DOM.draggable, { axis: "x" });
      // The current amount (in pixels) th=at was dragged
      this.dragPosition =
        winsize.width - this.menuItems[this.current].rect.width * 2;
      // Minimum amount to drag in order to navigate to the next/previous menu item
      this.minDrag = winsize.width * 0.04;
      // Set the menu initial position
      this.layout();
      // The following are the values that need to be updated inside the render (rAF) function:
      // - the menu translation value
      // The "current" and the "previous" hold the values to interpolate ("current" being the one we want to get to) and the "amt" is the amount to interpolate
      this.renderedStyles = {
        menuTranslation: {
          previous: this.dragPosition - this.initTx,
          current: this.dragPosition + this.initTx,
          amt: 0,
        },
      };
      // Start the rAF loop to render the menu
      this.renderId = requestAnimationFrame(() => this.render());
      // Initialize/Bind some events
      this.initEvents();
    }
    layout() {
      // Set the menu position/translation so that the first menu item is the current one thus positioned at the center
      // We need to save these values for later calculations when translating the menu
      this.initTx = this.currentPosition =
        winsize.width / 2 - this.menuItems[this.current].rect.width / 2;
      TweenMax.set(this.DOM.menu, { x: this.initTx });
    }
    // Window resize
    resize() {
      this.minDrag = winsize.width * 0.04;
      // Update position
      this.currentPosition =
        winsize.width / 2 -
        this.menuItems[this.current].DOM.el.offsetLeft -
        this.menuItems[this.current].rect.width / 2;
      this.renderedStyles.menuTranslation.current =
        this.renderedStyles.menuTranslation.previous = this.currentPosition;
    }
    isDragging() {
      // dragDirection is only set when we drag the menu, so this can be used to checked if we are currently dragging
      return this.dragDirection != undefined && this.dragDirection != "";
    }
    render() {
      this.renderId = undefined;

      // Apply the lerp function to the updated values
      for (const key in this.renderedStyles) {
        this.renderedStyles[key].previous = MathUtils.lerp(
          this.renderedStyles[key].previous,
          this.renderedStyles[key].current,
          this.renderedStyles[key].amt
        );
      }

      // Translate the menu
      TweenMax.set(this.DOM.menu, {
        x: this.renderedStyles.menuTranslation.previous,
      });

      if (!this.renderId) {
        this.renderId = requestAnimationFrame(() => this.render());
      }
    }
    initEvents() {
      this.onPointerDown = () => {
        // Scale up the cursor
        cursor.renderedStyles["scale"].current = 1.5;
        // And show the "drag mode" arrows
        cursor.showArrows();
      };

      this.onDragStart = () => {
        if (this.isAnimating) return;
        // Reset the drag direction value
        this.dragDirection = "";
      };

      // Save the previous moveVector obj that Draggability provides for every drag move
      // We need this to track the current direction of dragging in order to compare it later with the initial intended direction
      // Like so we know if the menu should navigate to the next/previous item or if the navigation needs to be cancelled
      this.cachedVectorMovement = { x: 0, y: 0 };
      this.onDragMove = (event, pointer, moveVector) => {
        // Update the mouse position
        mousepos = getMousePos(event);

        // Return if theres an active animation
        if (this.isAnimating) return;

        // Track the current direction of the drag
        if (moveVector.x != this.cachedVectorMovement.x) {
          this.currentDirection =
            moveVector.x > this.cachedVectorMovement.x ? "right" : "left";
          this.cachedVectorMovement = moveVector;
        }

        if (this.dragDirection === "") {
          // Hide the explorer link
          this.menuItems[this.current];

          // The initial intended direction
          this.dragDirection = moveVector.x > 1 ? "right" : "left";

          // We need to calculate the amount to move the menu as we drag from one point of the screen to another.
          // If we are switching between two menu items then this value is the distance from the center of the current menu item to the center of the next or previous menuItem (depending on the dragging direction)
          // otherwise it will be the same as this.minDrag so that when we stop dragging the navigation gets cancelled

          // Boundary cases
          if (
            (this.dragDirection === "right" && this.current === 0) ||
            (this.dragDirection === "left" &&
              this.current === this.menuItemsTotal - 1)
          ) {
            this.amountToMove = this.minDrag;
          }
          // else move to the next/previous menuItem
          else {
            this.upcomingIdx =
              this.dragDirection === "left"
                ? this.current + 1
                : this.current - 1;
            this.currentItem = this.menuItems[this.current];
            this.upcomingItem = this.menuItems[this.upcomingIdx];
            this.amountToMove = Math.abs(
              this.currentItem.rect.left +
                this.currentItem.rect.width / 2 -
                (this.upcomingItem.rect.left + this.upcomingItem.rect.width / 2)
            );
          }
        }
        // Update the dragPosition:
        // We need to map the draggable movement ([0,winsize.width]) to the menu movement ([0,amountToMove])
        this.dragPosition = MathUtils.lineEq(
          this.amountToMove,
          0,
          winsize.width,
          0,
          this.draggie.position.x
        );
        // Finally update both the menu translation
        this.renderedStyles.menuTranslation.current =
          this.dragPosition + this.currentPosition;
      };

      this.onPointerUp = () => {
        // Scale down the cursor (reset)
        cursor.renderedStyles["scale"].current = 1;
        // And hide the "drag mode" arrows
        cursor.hideArrows();
      };

      this.onDragEnd = () => {
        if (!this.isAnimating) {
          this.isAnimating = true;

          // Cancel the render function (rAF)
          if (this.renderId) {
            window.cancelAnimationFrame(this.renderId);
            this.renderId = undefined;
          }

          // Cancel the navigation:
          // Either it didn´t drag enough (<= minDrag) or the drag direction changed to the opposite one, meaning the user stepped back from navigating
          if (
            Math.abs(this.dragPosition) <= this.minDrag ||
            this.dragDirection !== this.currentDirection
          ) {
            // Show the explore link
            this.menuItems[this.current];

            // Reset the rAF updated values
            this.renderedStyles.menuTranslation.current =
              this.renderedStyles.menuTranslation.previous =
                this.currentPosition;

            const tl = new TimelineMax({
              onComplete: () => {
                // Restart the rAF loop
                this.renderId = requestAnimationFrame(() => this.render());
                // Reset values..
                this.currentItem = undefined;
                this.upcomingItem = undefined;
                // Able to drag and animate again
                this.isAnimating = false;
              },
            })
              // Animate the menu back to the previous position
              .to(
                this.DOM.menu,
                ANIMATION_SETTINGS.menu.duration,
                {
                  ease: ANIMATION_SETTINGS.menu.ease,
                  x: this.currentPosition,
                },
                0
              );
          }
          // Move to the next/previous menu item
          else {
            // Set the updated menu translation value
            this.currentPosition =
              this.renderedStyles.menuTranslation.current =
              this.renderedStyles.menuTranslation.previous =
                this.dragDirection === "left"
                  ? this.currentPosition - this.amountToMove
                  : this.currentPosition + this.amountToMove;

            const tl = new TimelineMax({
              onComplete: () => {
                // Restart the rAF loop
                this.renderId = requestAnimationFrame(() => this.render());
                // Update the menu item current state
                this.currentItem.unsetCurrent();
                this.upcomingItem.setCurrent();
                // Update the current item index value
                this.current = this.upcomingIdx;
                // Reset values..
                this.currentItem = undefined;
                this.upcomingItem = undefined;
                // Able to drag and animate again
                this.isAnimating = false;
              },
            })
              // Animate the menu translation
              .to(
                this.DOM.menu,
                ANIMATION_SETTINGS.menu.duration,
                {
                  ease: ANIMATION_SETTINGS.menu.ease,
                  x: this.currentPosition,
                },
                0
              );
          }
        }

        // Reset the drag position value
        this.dragPosition = 0;
        this.draggie.setPosition(this.dragPosition, this.draggie.position.y);

        // Reset the drag direction value
        this.dragDirection = "";
      };

      // Draggabily events
      this.draggie.on("pointerDown", this.onPointerDown);
      this.draggie.on("dragStart", this.onDragStart);
      this.draggie.on("dragMove", this.onDragMove);
      this.draggie.on("pointerUp", this.onPointerUp);
      this.draggie.on("dragEnd", this.onDragEnd);

      // Resize window: update menu position
      window.addEventListener("resize", () => this.resize());
    }
  }

  const ANIMATION_SETTINGS = {
    menu: { duration: 0.8, ease: Cubic.easeOut },
    cursor: { duration: 1, ease: Expo.easeOut },
  };

  // Custom mouse cursor
  const cursor = new Cursor(document.querySelector(".cursor"));

  // Preload fonts
  const preloadFonts = () => {
    return new Promise((resolve, reject) => {
      WebFont.load({
        typekit: {
          id: "crf4rue",
        },
        active: resolve,
      });
    });
  };

  Promise.all([preloadFonts()]).then(() => {
    // the Menu
    const menu = new Menu(document.querySelector(".menu-wrap"));
    document.body.classList.remove("loading");
  });
}
