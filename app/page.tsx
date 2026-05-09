import { brand } from "@/config/brand";

export default function HomePage() {
  return (
    <main className="siteShell">
      <header className="siteHeader" aria-label="Accueil JobMada">
        <a className="brand" href="/" aria-label="JobMada accueil">
          <img src={brand.logoPath} alt="" width="56" height="56" />
          <span>{brand.name}</span>
        </a>
      </header>

      <section className="hero" aria-labelledby="home-title">
        <h1 id="home-title">L'emploi qui vous correspond</h1>
        <p>La nouvelle marketplace emploi JobMada arrive en full-stack.</p>
      </section>
    </main>
  );
}
