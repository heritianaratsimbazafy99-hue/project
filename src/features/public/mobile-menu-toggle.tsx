"use client";

import { useEffect, useRef, useState } from "react";

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const drawer = document.getElementById("public-mobile-drawer");

    document.body.classList.toggle("menu-open", isOpen);

    if (drawer) {
      drawer.hidden = !isOpen;
      drawer.inert = !isOpen;
    }

    return () => {
      document.body.classList.remove("menu-open");
      if (drawer) {
        drawer.hidden = true;
        drawer.inert = true;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <button
      ref={buttonRef}
      className="hamburger"
      type="button"
      aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      aria-controls="public-mobile-drawer"
      aria-expanded={isOpen}
      onClick={() => setIsOpen((current) => !current)}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
