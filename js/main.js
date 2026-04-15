const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".site-header__toggle");
const navLinks = Array.from(document.querySelectorAll('.site-header__nav a[href^="#"]'));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const mediaMobile = window.matchMedia("(max-width: 760px)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector(".lightbox__image");
const lightboxCaption = lightbox?.querySelector(".lightbox__caption");
const lightboxCloseButtons = Array.from(document.querySelectorAll("[data-lightbox-close]"));
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const lightboxTriggers = Array.from(document.querySelectorAll(".js-lightbox-trigger"));

const sectionMap = new Map(
    navLinks
        .map((link) => {
            const target = document.querySelector(link.getAttribute("href"));
            return target ? [target.id, link] : null;
        })
        .filter(Boolean),
);

const lightboxItems = lightboxTriggers.map((trigger) => ({
    src: trigger.dataset.lightboxSrc || trigger.querySelector("img")?.getAttribute("src") || "",
    alt: trigger.dataset.lightboxAlt || trigger.querySelector("img")?.getAttribute("alt") || "",
    caption: trigger.dataset.lightboxCaption || trigger.querySelector("img")?.getAttribute("alt") || "",
}));

let activeLightboxIndex = 0;
let lastFocusedElement = null;

function syncBodyLock() {
    const menuOpen = header?.classList.contains("is-open");
    const lightboxOpen = lightbox && !lightbox.hidden;
    document.body.classList.toggle("is-locked", Boolean(menuOpen || lightboxOpen));
}

function updateHeaderState() {
    if (!header) {
        return;
    }

    header.classList.toggle("is-scrolled", window.scrollY > 16);
}

function closeMenu() {
    if (!header || !menuToggle) {
        return;
    }

    header.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    syncBodyLock();
}

function toggleMenu() {
    if (!header || !menuToggle) {
        return;
    }

    const isOpen = header.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    syncBodyLock();
}

function setActiveNavLink(sectionId) {
    navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${sectionId}`;
        link.classList.toggle("is-active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "true");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function setupScrollSpy() {
    const sections = Array.from(sectionMap.keys())
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        setActiveNavLink(sections[0].id);
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntries = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (!visibleEntries.length) {
                return;
            }

            setActiveNavLink(visibleEntries[0].target.id);
        },
        {
            threshold: [0.25, 0.45, 0.7],
            rootMargin: "-18% 0px -48% 0px",
        },
    );

    sections.forEach((section) => observer.observe(section));
}

function setupRevealAnimations() {
    if (!revealItems.length) {
        return;
    }

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            });
        },
        {
            threshold: 0.16,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    revealItems.forEach((item) => observer.observe(item));
}

function updateLightboxContent(index) {
    if (!lightbox || !lightboxImage || !lightboxCaption || !lightboxItems.length) {
        return;
    }

    activeLightboxIndex = (index + lightboxItems.length) % lightboxItems.length;

    const currentItem = lightboxItems[activeLightboxIndex];
    lightboxImage.src = currentItem.src;
    lightboxImage.alt = currentItem.alt;
    lightboxCaption.textContent = currentItem.caption;

    const multipleItems = lightboxItems.length > 1;

    if (lightboxPrev) {
        lightboxPrev.hidden = !multipleItems;
    }

    if (lightboxNext) {
        lightboxNext.hidden = !multipleItems;
    }
}

function openLightbox(index) {
    if (!lightbox || !lightboxItems.length) {
        return;
    }

    lastFocusedElement = document.activeElement;
    updateLightboxContent(index);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    syncBodyLock();
    lightbox.querySelector(".lightbox__close")?.focus();
}

function closeLightbox() {
    if (!lightbox || lightbox.hidden) {
        return;
    }

    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    syncBodyLock();

    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

function setupLightbox() {
    if (!lightbox || !lightboxTriggers.length) {
        return;
    }

    lightboxTriggers.forEach((trigger, index) => {
        trigger.addEventListener("click", () => openLightbox(index));
    });

    lightboxCloseButtons.forEach((button) => {
        button.addEventListener("click", closeLightbox);
    });

    lightboxPrev?.addEventListener("click", () => updateLightboxContent(activeLightboxIndex - 1));
    lightboxNext?.addEventListener("click", () => updateLightboxContent(activeLightboxIndex + 1));
}

function setupEvents() {
    menuToggle?.addEventListener("click", toggleMenu);

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (mediaMobile.matches) {
                closeMenu();
            }
        });
    });

    mediaMobile.addEventListener("change", () => {
        if (!mediaMobile.matches) {
            closeMenu();
        }
    });

    window.addEventListener("scroll", updateHeaderState, { passive: true });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
            closeLightbox();
        }

        if (!lightbox || lightbox.hidden) {
            return;
        }

        if (event.key === "ArrowLeft") {
            updateLightboxContent(activeLightboxIndex - 1);
        }

        if (event.key === "ArrowRight") {
            updateLightboxContent(activeLightboxIndex + 1);
        }
    });
}

updateHeaderState();
setupRevealAnimations();
setupScrollSpy();
setupLightbox();
setupEvents();
