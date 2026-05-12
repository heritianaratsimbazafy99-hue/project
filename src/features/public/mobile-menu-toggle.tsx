"use client";

import { useEffect, useState } from "react";

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isOpen);

    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [isOpen]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <button
      className="hamburger"
      type="button"
      aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      aria-expanded={isOpen}
      onClick={() => setIsOpen((current) => !current)}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
