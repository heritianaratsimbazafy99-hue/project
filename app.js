const routes = {
  home: "#/",
  jobs: "#/emploi",
  pricing: "#/tarifs",
  companies: "#/entreprises",
};

const sectors = [
  ["Centres d'appels & BPO", 34],
  ["Informatique & Digital", 31],
  ["Commerce & Vente", 21],
  ["Banque, Finance & Comptabilité", 19],
  ["Marketing, Communication & Médias", 18],
  ["Logistique, Transport & Supply Chain", 10],
  ["Gestion, Administration & Secrétariat", 8],
  ["BTP, Construction & Immobilier", 6],
  ["Hôtellerie, Restauration & Tourisme", 5],
  ["Ressources humaines", 5],
  ["Sécurité & Gardiennage", 3],
  ["Enseignement & Formation", 2],
  ["Industrie & Production", 2],
  ["Associatif, ONG & Humanitaire", 1],
  ["Énergie, Mines & Environnement", 1],
  ["Juridique", 1],
];

const companies = [
  { name: "Terra Group", initials: "Terra", sector: "Agriculture & Agroalimentaire", city: "Antananarivo", jobs: 4 },
  { name: "MATERAUTO", initials: "MA", sector: "Commerce & Vente", city: "Antananarivo", jobs: 3 },
  { name: "LINKEO MADA", initials: "Linkeo", sector: "Informatique & Digital", city: "Antananarivo", jobs: 5 },
  { name: "Assistant Ventures Network", initials: "AV", sector: "Ressources humaines", city: "Antananarivo", jobs: 9 },
  { name: "MADIXY", initials: "MX", sector: "Marketing, Communication & Médias", city: "Antananarivo", jobs: 2 },
  { name: "DIGITALK", initials: "DK", sector: "Centres d'appels & BPO", city: "Antananarivo", jobs: 7 },
  { name: "ABL OUTSOURCING", initials: "ABL", sector: "Centres d'appels & BPO", city: "Antananarivo", jobs: 11 },
  { name: "Onja", initials: "onja", sector: "Informatique & Digital", city: "Toamasina", jobs: 2 },
  { name: "Novaly Services", initials: "NS", sector: "Gestion, Administration & Secrétariat", city: "Antsirabe", jobs: 3 },
];

const jobs = [
  {
    slug: "designer-uiux-973g-d570373e",
    title: "Designer UI/UX",
    company: "Media Click",
    initials: "MC",
    city: "Antananarivo",
    sector: "Informatique & Digital",
    contract: "CDI",
    time: "il y a 2h",
    sponsored: false,
    urgent: false,
    deadline: "Expire dans 5j",
    salary: "Selon profil",
  },
  {
    slug: "televendeurs-en-mutuelle-sante-99cbc98f",
    title: "Télévendeurs en Mutuelle Santé",
    company: "DIGITALK",
    initials: "DK",
    city: "Antananarivo",
    sector: "Centres d'appels & BPO",
    contract: "CDI",
    time: "il y a 4h",
    sponsored: true,
    urgent: false,
    deadline: "Expire dans 7j",
    salary: "Fixe + primes",
  },
  {
    slug: "gestionnaire-paie-internalisee-zi75-9e985356",
    title: "Gestionnaire paie internalisée",
    company: "Assistant Ventures Network",
    initials: "AV",
    city: "Antananarivo",
    sector: "Ressources humaines",
    contract: "CDI",
    time: "il y a 5h",
    sponsored: true,
    urgent: false,
    deadline: "Expire demain",
    salary: "Confidentiel",
  },
  {
    slug: "expert-en-comptabilite-francaise-e2a052a4",
    title: "Expert en comptabilité française",
    company: "Assistant Ventures Network",
    initials: "AV",
    city: "Antananarivo",
    sector: "Banque, Finance & Comptabilité",
    contract: "CDI",
    time: "il y a 6h",
    sponsored: true,
    urgent: false,
    deadline: "Expire dans 4j",
    salary: "2 500 000 Ar",
  },
  {
    slug: "health-nutrition-community-engagement-manager-2e77a767",
    title: "Health, nutrition & community engagement manager",
    company: "ONG MEDAIR",
    initials: "MEDAIR",
    city: "Fianarantsoa",
    sector: "Associatif, ONG & Humanitaire",
    contract: "CDD",
    time: "il y a 7h",
    sponsored: true,
    urgent: false,
    deadline: "Expire dans 3j",
    salary: "Selon grille",
  },
  {
    slug: "sdr-prospection-prise-de-rendez-vous-b2b-32ee7bce",
    title: "SDR - Prospection & Prise de rendez-vous B2B",
    company: "TARAM Group",
    initials: "TG",
    city: "Antananarivo",
    sector: "Centres d'appels & BPO",
    contract: "CDI",
    time: "il y a 7h",
    sponsored: false,
    urgent: false,
    deadline: "Expire dans 6j",
    salary: "Fixe + commission",
  },
  {
    slug: "conseiller-client-francophone-experimente-b1a452cc",
    title: "Conseiller client francophone expérimenté",
    company: "ABL OUTSOURCING",
    initials: "ABL",
    city: "Antananarivo",
    sector: "Centres d'appels & BPO",
    contract: "CDI",
    time: "il y a 7h",
    sponsored: false,
    urgent: false,
    deadline: "Expire dans 2j",
    salary: "Motivant",
  },
  {
    slug: "sustainability-lead-c4b38a87",
    title: "Sustainability Lead",
    company: "AQUARELLE",
    initials: "AQ",
    city: "Antananarivo",
    sector: "Textile, Mode & Confection",
    contract: "CDI",
    time: "il y a 8h",
    sponsored: false,
    urgent: false,
    deadline: "Expire dans 8j",
    salary: "Selon expérience",
  },
  {
    slug: "developpeur-d-applications-web-f494aa33",
    title: "Développeur d'applications web",
    company: "ABL OUTSOURCING",
    initials: "ABL",
    city: "Antananarivo",
    sector: "Informatique & Digital",
    contract: "CDI",
    time: "il y a 8h",
    sponsored: false,
    urgent: false,
    deadline: "Expire dans 9j",
    salary: "À négocier",
  },
  {
    slug: "responsable-marketing-digital-ed135685",
    title: "Responsable marketing digital",
    company: "La compta",
    initials: "LA",
    city: "Antananarivo",
    sector: "Marketing, Communication & Médias",
    contract: "CDI",
    time: "il y a 9h",
    sponsored: false,
    urgent: false,
    deadline: "Expire dans 5j",
    salary: "Selon profil",
  },
  {
    slug: "referent-e-qualiopi-montage-final-des-dossiers-et-accompagnement-audit-0c6a7637",
    title: "Référent(e) Qualiopi - Montage final des dossiers",
    company: "Docteur Certif",
    initials: "DC",
    city: "Télétravail",
    sector: "Gestion, Administration & Secrétariat",
    contract: "Freelance",
    time: "il y a 10h",
    sponsored: false,
    urgent: true,
    deadline: "Expire dans 6h",
    salary: "Mission",
  },
  {
    slug: "administrateur-trice-des-ventes-10173",
    title: "Administrateur(trice) des ventes",
    company: "TEKNETGROUP",
    initials: "TK",
    city: "Antananarivo",
    sector: "Commerce & Vente",
    contract: "CDD",
    time: "il y a 12h",
    sponsored: false,
    urgent: true,
    deadline: "Expire demain",
    salary: "Selon profil",
  },
];

const recruiterOffers = [
  { title: "Développeur Frontend", status: "Publiée", candidates: 18, views: 412, expires: "6 jours" },
  { title: "Assistant Administratif", status: "Brouillon", candidates: 0, views: 0, expires: "Non publiée" },
  { title: "Commercial Terrain", status: "En revue", candidates: 7, views: 156, expires: "12 jours" },
];

const candidates = [
  { name: "Profil Marketing Senior", role: "Marketing digital", city: "Antananarivo", match: 94, exp: "6 ans", skills: ["SEO", "Ads", "CRM"], status: "Nouveau" },
  { name: "Candidat Frontend A", role: "React / UI", city: "Antsirabe", match: 91, exp: "4 ans", skills: ["React", "Figma", "CSS"], status: "En cours" },
  { name: "Profil Finance B", role: "Comptabilité", city: "Toamasina", match: 87, exp: "8 ans", skills: ["Paie", "Sage", "Audit"], status: "Entretien" },
  { name: "Candidat Support C", role: "Relation client", city: "Antananarivo", match: 82, exp: "3 ans", skills: ["Français", "CRM", "BPO"], status: "Nouveau" },
  { name: "Profil RH D", role: "Recrutement", city: "Mahajanga", match: 78, exp: "5 ans", skills: ["Sourcing", "Entretien", "Paie"], status: "Sélection" },
  { name: "Candidat Logistique E", role: "Supply chain", city: "Antananarivo", match: 74, exp: "7 ans", skills: ["Stock", "Excel", "Transport"], status: "En cours" },
];

const plans = [
  {
    name: "Gratuit",
    audience: "Startups et micro-entreprises",
    monthly: 0,
    color: "#8D8BA8",
    features: ["2 offres/mois, visibles 7 jours", "Indexation Google Jobs", "IA limitée", "Page entreprise"],
  },
  {
    name: "Starter",
    audience: "PME locales avec besoins réguliers",
    monthly: 80000,
    color: "#A78BCD",
    features: ["10 offres/mois, visibles 14 jours", "3 boosts simples", "10 crédits IA", "Support email"],
  },
  {
    name: "Booster",
    audience: "Recrutements fréquents",
    monthly: 180000,
    color: "#F2537B",
    featured: true,
    features: ["Offres illimitées", "CVthèque 40 000+ profils", "Matching IA avancé", "Boost vedette inclus"],
  },
  {
    name: "Agence",
    audience: "Cabinets et BPO",
    monthly: 350000,
    color: "#474476",
    features: ["Multi-utilisateurs", "Pipelines par client", "Exports candidats", "Support prioritaire"],
  },
];

const app = document.querySelector("#app");

const logoPositions = [
  ["0%", "0%"],
  ["33.333%", "0%"],
  ["66.667%", "0%"],
  ["100%", "0%"],
  ["0%", "33.333%"],
  ["33.333%", "33.333%"],
  ["66.667%", "33.333%"],
  ["100%", "33.333%"],
  ["0%", "66.667%"],
  ["33.333%", "66.667%"],
  ["66.667%", "66.667%"],
  ["100%", "66.667%"],
  ["0%", "100%"],
  ["33.333%", "100%"],
  ["66.667%", "100%"],
  ["100%", "100%"],
];

const companyLogoMap = {
  "Media Click": 4,
  DIGITALK: 1,
  "Assistant Ventures Network": 9,
  "ONG MEDAIR": 5,
  "TARAM Group": 14,
  "ABL OUTSOURCING": 8,
  AQUARELLE: 7,
  "La compta": 6,
  "Docteur Certif": 12,
  TEKNETGROUP: 11,
  "Terra Group": 2,
  MATERAUTO: 3,
  "LINKEO MADA": 11,
  MADIXY: 7,
  Onja: 0,
  "Novaly Services": 15,
};

function companyLogo(name, className = "logo-mark", style = "") {
  const position = logoPositions[getLogoIndex(name)];
  return `<span class="${className} mock-logo" style="--logo-x:${position[0]};--logo-y:${position[1]};${style}" role="img" aria-label="Logo mock ${escapeAttr(name)}"></span>`;
}

function getLogoIndex(name) {
  if (Object.prototype.hasOwnProperty.call(companyLogoMap, name)) return companyLogoMap[name];
  return [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % logoPositions.length;
}

function icon(name) {
  const paths = {
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.86L18.18 21 12 17.77 5.82 21 7 14.13l-5-4.86 6.91-1.01z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    zap: '<path d="M13 2 3 14h8l-1 8 11-13h-8l0-7Z"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/>',
  };
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.briefcase}</svg>`;
}

function brand() {
  return `<a class="brand" href="#/" aria-label="Asako accueil"><span class="brand-text">asako</span><span class="brand-dot">.</span><span class="brand-mg">mg</span></a>`;
}

function publicHeader() {
  const nav = [
    ["Offres d'emploi", "#/emploi"],
    ["Emploi CDD", "#/cdd"],
    ["Freelance", "#/freelance"],
    ["Offre de stage", "#/stages"],
    ["Offres urgentes", "#/offres-urgentes"],
  ];
  const hash = location.hash || "#/";
  return `
    <header class="site-header">
      <div class="container header-inner">
        ${brand()}
        <nav class="top-nav" aria-label="Navigation principale">
          ${nav.map(([label, href]) => `<a class="${hash === href ? "active" : ""}" href="${href}">${label}</a>`).join("")}
        </nav>
        <a class="account-pill" href="#/recruteur/dashboard"><span>HR</span><span>Mon compte</span>${icon("chevron")}</a>
        <button class="hamburger" data-menu aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>
      </div>
      <nav class="mobile-drawer" aria-label="Navigation mobile">
        ${nav.map(([label, href]) => `<a class="side-link" href="${href}">${label}</a>`).join("")}
        <a class="btn btn-primary" href="#/recruteur/dashboard">Mon compte</a>
      </nav>
    </header>
  `;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>${brand()}<p><em>Mon travail, mon avenir.</em></p></div>
          <div><h3>Candidats</h3><a href="#/emploi">Offres d'emploi</a><a href="#/inscription/candidat">Créer mon profil</a><a href="#/candidat/dashboard">Mon Asako</a><a href="#/blog">Blog</a></div>
          <div><h3>Recruteurs</h3><a href="#/recruteur/offres/nouvelle">Publier une offre</a><a href="#/inscription/recruteur">Asako Recruteur</a><a href="#/tarifs">Tarifs</a><a href="#/entreprises">Annuaire entreprises</a></div>
          <div><h3>Ressources</h3><a href="#/apropos">À propos</a><a href="#/contact">Contact</a><a href="#/guides">Nos guides</a></div>
          <div><h3>Légal</h3><a href="#/mentions-legales">Mentions légales</a><a href="#/conditions-utilisation">CGU</a><a href="#/politique-confidentialite">Politique de confidentialité</a></div>
        </div>
        <div class="footer-bottom">© 2026 Asako.mg — Le premier site d'emploi de Madagascar</div>
      </div>
    </footer>
  `;
}

function pageShell(content, header = true) {
  return `${header ? publicHeader() : ""}<main>${content}</main>${header ? footer() : ""}`;
}

function jobCard(job) {
  return `
    <a class="job-card" href="#/annonces/${job.slug}" data-job-card data-title="${escapeAttr(job.title)}" data-company="${escapeAttr(job.company)}" data-contract="${job.contract}" data-city="${job.city}" data-sector="${escapeAttr(job.sector)}">
      ${companyLogo(job.company)}
      <div class="job-main">
        <strong>${job.title}</strong>
        <span>${job.company}</span>
        <div class="job-meta">
          <span>${icon("pin")} ${job.city}</span>
          <span>${icon("layers")} ${job.sector}</span>
          <span class="pill mauve">${job.contract}</span>
          ${job.sponsored ? `<span class="pill rose">SPONSORISÉ</span>` : ""}
        </div>
      </div>
      <div class="job-time">${job.time}</div>
    </a>
  `;
}

function miniJob(job) {
  return `
    <a class="mini-job" href="#/annonces/${job.slug}">
      ${companyLogo(job.company)}
      <div><strong>${job.title}</strong><span>${job.company}</span></div>
      <span class="pill">${job.contract}</span>
    </a>
  `;
}

function homePage() {
  const featured = jobs.slice(0, 3);
  return pageShell(`
    <section class="hero-band">
      <div class="container hero-grid">
        <div class="hero-card">
          <span class="eyebrow">Emploi à Madagascar</span>
          <h1 class="hero-title">L'emploi qui vous <span class="underline">correspond</span></h1>
          <p class="hero-copy">Le jobboard moderne qui comprend Madagascar.</p>
          <form class="search-shell" data-home-search>
            <span>${icon("search")}</span>
            <input name="q" placeholder="Poste, métier, entreprise..." />
            <button class="btn btn-primary" type="submit">Rechercher</button>
          </form>
          <div class="trends">Tendances : <a href="#/emploi?search=comptable">Comptable</a> · <a href="#/emploi?search=commercial">Commercial</a> · <a href="#/emploi?search=téléprospecteur">Téléprospecteur</a></div>
        </div>
        <aside class="hero-side">
          <div class="stat-grid">
            <div class="stat-card">${icon("briefcase")}<strong>874+</strong><span>offres actives</span></div>
            <div class="stat-card rose">${icon("users")}<strong>1392+</strong><span>recruteurs actifs</span></div>
          </div>
          <div class="featured-card">
            <h2>${icon("star")} Offres à la une</h2>
            ${featured.map(miniJob).join("")}
          </div>
        </aside>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="section-title" style="justify-content:center"><span class="icon-tile">${icon("briefcase")}</span>Entreprises qui <strong>recrutent</strong></h2>
        <div class="companies-row" style="margin-top:28px">${companies.slice(0, 8).map((c) => `<a class="company-logo-card" href="#/profil-entreprise/${slugify(c.name)}" aria-label="${escapeAttr(c.name)}">${companyLogo(c.name)}</a>`).join("")}</div>
      </div>
    </section>

    <section class="section alt" style="padding:28px 0">
      <div class="container">
        <div class="pro-banner">
          <p><span class="pill">SPONSORISÉ</span> Recrutez plus vite avec <em>Asako Pro</em> — CVthèque, boost vedette, matching IA</p>
          <a class="btn btn-primary" href="#/tarifs">Découvrir →</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container jobs-layout">
        <div>
          <div class="section-head">
            <h2 class="section-title"><span class="icon-tile">${icon("briefcase")}</span>Les dernières <strong>offres d'emploi</strong> à Madagascar</h2>
          </div>
          <div class="tabs" data-contract-tabs>
            ${["Toutes", "CDI", "CDD", "Stage", "Freelance"].map((t, i) => `<button class="tab-btn ${i === 0 ? "active" : ""}" data-contract="${t}">${t}</button>`).join("")}
          </div>
          <div class="job-list" id="homeJobs">${jobs.slice(1).map(jobCard).join("")}</div>
          <p style="text-align:center;margin-top:28px"><a href="#/emploi">Voir toutes les offres →</a></p>
        </div>
        <aside class="side-stack">
          <div class="side-card">
            <h3>${icon("clock")} Derniers jours pour postuler</h3>
            ${jobs.filter((j) => j.urgent).map((j) => `<a class="urgent-card" href="#/annonces/${j.slug}">${companyLogo(j.company)}<div><strong>${j.title}</strong><span>${j.company}</span><br><span class="pill rose">${j.deadline}</span></div></a>`).join("")}
          </div>
          <div class="side-card dark">
            <h3>${icon("zap")} Asako Pro</h3>
            <p>Offres illimitées, CVthèque complète et matching IA. Trouvez votre perle rare, simplement.</p>
            <a class="btn btn-primary" style="width:100%" href="#/tarifs">Découvrir →</a>
          </div>
        </aside>
      </div>
    </section>

    ${classifiedSection()}
    ${candidatePrepSection()}
    ${howItWorksSection()}
    ${ctaSection()}
    ${aboutSection()}
  `);
}

function classifiedSection() {
  return `
    <section class="section alt">
      <div class="container">
        <h2 class="section-title" style="justify-content:center"><span class="icon-tile">${icon("layers")}</span>On a classé <strong>tous nos jobs !</strong></h2>
        <div class="filter-pills" style="justify-content:center;margin:22px 0 26px"><button class="filter-btn active">Secteurs</button><button class="filter-btn">Villes</button><button class="filter-btn">Métiers</button></div>
        <div class="category-grid">${sectors.map(([name, count]) => `<a class="category-card" href="#/emploi?sector=${encodeURIComponent(name)}"><span class="icon-tile">${icon("layers")}</span><span><strong>${name}</strong><span>${count} offres</span></span></a>`).join("")}</div>
      </div>
    </section>
  `;
}

function candidatePrepSection() {
  return `
    <section class="section">
      <div class="container">
        <h2 class="section-title" style="justify-content:center"><span class="icon-tile" style="background:var(--green-soft);color:var(--green)">${icon("user")}</span>Préparez-vous à <strong>décrocher votre job !</strong></h2>
        <div class="prepare-grid" style="margin-top:28px">
          <div class="prepare-card"><strong>40 000+</strong><p>CVs dans la base,<br>soyez le prochain à être vu !</p></div>
          <div class="prepare-card"><h3>Soyez visible auprès des recruteurs</h3><p><a class="btn btn-navy" href="#/inscription/candidat">Déposer mon CV</a></p></div>
          <div class="prepare-card"><strong>874+</strong><p>offres actives,<br>on vous envoie celles qui collent ?</p></div>
          <div class="prepare-card"><h3>Soyez alerté rapidement</h3><p><a class="btn btn-navy" href="#/emploi">Créer mon alerte</a></p></div>
        </div>
      </div>
    </section>
  `;
}

function howItWorksSection() {
  const steps = [
    ["Créez votre profil", "Inscription gratuite en 30 secondes. Uploadez votre CV, on fait le reste."],
    ["Postulez en 1 clic", "Votre CV est transmis directement au recruteur. Pas de formulaire à rallonge."],
    ["Suivez vos candidatures", "Notification quand le recruteur consulte votre CV. Transparence totale."],
  ];
  return `
    <section class="section alt">
      <div class="container">
        <h2 class="section-title" style="justify-content:center"><span class="icon-tile">${icon("star")}</span>Comment <strong>ça marche ?</strong></h2>
        <div class="timeline" style="margin-top:34px">${steps.map((s, i) => `<div><div class="step-number">${String(i + 1).padStart(2, "0")}</div><span class="icon-tile" style="margin:0 auto 18px">${icon(i === 0 ? "users" : i === 1 ? "zap" : "eye")}</span><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join("")}</div>
      </div>
    </section>
  `;
}

function ctaSection() {
  return `
    <section class="section">
      <div class="container cta-grid">
        <div class="cta-panel"><span class="eyebrow">Candidats</span><h2>Votre prochain emploi commence ici</h2><p>Créez votre profil gratuitement, uploadez votre CV et postulez aux offres qui vous correspondent.</p><a class="btn btn-primary" href="#/inscription/candidat">Créer mon profil gratuitement →</a></div>
        <div class="cta-panel dark"><span class="pill">Recruteurs</span><h2>Trouvez votre perle rare avec <span style="color:var(--rose)">Asako</span></h2><p>Publiez vos offres et accédez à 40 000+ CVs qualifiés.</p><a class="btn btn-primary" href="#/recruteur/offres/nouvelle">Publier une offre →</a></div>
      </div>
    </section>
  `;
}

function aboutSection() {
  return `
    <section class="section">
      <div class="container about-grid">
        <div class="logo-orbit">${brand()}<span class="badge one">40k+<br><small>CVs qualifiés</small></span><span class="badge two">250+<br><small>offres actives</small></span></div>
        <div><h2 class="section-title"><span class="icon-tile">${icon("eye")}</span>L'emploi à Madagascar, <strong>simplement</strong></h2><p>Asako.mg est né d'une conviction simple : chaque Malgache mérite un chemin clair vers l'emploi qui lui correspond. Que vous cherchiez un CDI, un CDD, un stage ou une mission freelance, Asako connecte candidats et recruteurs dans tous les secteurs.</p>${["Des offres fraîches chaque jour", "Postulez en un clic", "Transparence totale"].map((t, i) => `<div class="feature-line"><span class="icon-tile">${icon(i === 0 ? "zap" : i === 1 ? "file" : "eye")}</span><div><strong>${t}</strong><p>${i === 0 ? "Mises à jour quotidiennes, indexées pour être trouvées rapidement." : i === 1 ? "Votre profil est transmis directement au recruteur." : "Suivez vos candidatures et les consultations de votre CV."}</p></div></div>`).join("")}</div>
      </div>
    </section>
  `;
}

function jobsPage(mode = "Toutes") {
  const params = new URLSearchParams((location.hash.split("?")[1] || ""));
  const initialSearch = params.get("search") || "";
  const initialSector = params.get("sector") || "";
  const pageTitle = mode === "Toutes" ? "Toutes les offres d'emploi à Madagascar" : mode;
  return pageShell(`
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Offres d'emploi</span>
        <h1>${pageTitle}</h1>
        <p>Recherchez, filtrez et postulez aux offres qui correspondent à votre profil.</p>
      </div>
    </section>
    <section class="section">
      <div class="container jobs-layout">
        <aside class="filter-panel">
          <div class="form-field"><label>Recherche</label><input class="input" id="jobSearch" value="${escapeAttr(initialSearch)}" placeholder="Poste, entreprise..." /></div>
          <div><h3>Contrat</h3><div class="check-list">${["CDI", "CDD", "Stage", "Freelance"].map((c) => `<label class="check-row"><input type="checkbox" data-job-filter="contract" value="${c}" ${mode.includes(c) ? "checked" : ""}> ${c}</label>`).join("")}</div></div>
          <div><h3>Ville</h3><div class="check-list">${["Antananarivo", "Fianarantsoa", "Toamasina", "Télétravail"].map((c) => `<label class="check-row"><input type="checkbox" data-job-filter="city" value="${c}"> ${c}</label>`).join("")}</div></div>
          <div><h3>Secteur</h3><select class="select" id="sectorFilter"><option value="">Tous les secteurs</option>${sectors.map(([name]) => `<option ${name === initialSector ? "selected" : ""}>${name}</option>`).join("")}</select></div>
          <button class="btn btn-soft" data-clear-jobs>Réinitialiser</button>
        </aside>
        <div>
          <div class="section-head"><h2 class="section-title"><strong id="jobCount">${jobs.length}</strong> offres trouvées</h2><a class="btn btn-primary" href="#/inscription/candidat">Créer une alerte</a></div>
          <div class="job-list" id="jobsList">${jobs.map(jobCard).join("")}</div>
          <div class="empty-state" id="jobEmpty" hidden><h3>Aucune offre trouvée</h3><p>Essayez une autre recherche ou retirez un filtre.</p></div>
        </div>
      </div>
    </section>
  `);
}

function jobDetailPage(slug) {
  const job = jobs.find((j) => j.slug === slug) || jobs[0];
  return pageShell(`
    <section class="section alt">
      <div class="container detail-layout">
        <div>
          <div class="detail-title-card">
            <div class="detail-title-row">
              ${companyLogo(job.company, "logo-mark", "width:74px;height:74px")}
              <div>
                <p><a href="#/emploi">Offres d'emploi</a> / ${job.sector}</p>
                <h1>${job.title}</h1>
                <div class="job-meta"><span>${job.company}</span><span>${icon("pin")} ${job.city}</span><span class="pill mauve">${job.contract}</span>${job.sponsored ? `<span class="pill rose">SPONSORISÉ</span>` : ""}</div>
              </div>
            </div>
          </div>
          ${["Votre mission", "Profil recherché", "Pourquoi rejoindre cette entreprise ?"].map((title, idx) => `<section class="content-section"><h2>${title}</h2><p>${idx === 0 ? "Vous rejoignez une équipe dynamique pour contribuer à des projets concrets, suivre les priorités métier et livrer une expérience utilisateur claire." : idx === 1 ? "Vous avez une bonne capacité d'analyse, un sens de l'organisation et une communication professionnelle. Une expérience dans un environnement exigeant est appréciée." : "Une culture orientée résultats, une équipe locale ambitieuse et un cadre de travail structuré pour progresser rapidement."}</p><ul><li>Collaboration avec les équipes opérationnelles.</li><li>Suivi des indicateurs et reporting simple.</li><li>Participation à l'amélioration continue des processus.</li></ul></section>`).join("")}
        </div>
        <aside class="side-stack">
          <div class="side-card"><h3>Résumé de l'offre</h3><p><strong>Contrat</strong><br>${job.contract}</p><p><strong>Localisation</strong><br>${job.city}</p><p><strong>Salaire</strong><br>${job.salary}</p><p><strong>Deadline</strong><br>${job.deadline}</p><a class="btn btn-primary" style="width:100%" href="#/inscription/candidat">Postuler maintenant</a></div>
          <div class="side-card"><h3>Entreprise</h3><div class="company-card-head">${companyLogo(job.company)}<div><strong>${job.company}</strong><br><span>${job.sector}</span></div></div><p style="margin-top:14px">Entreprise active sur Asako avec des opportunités mises à jour régulièrement.</p><a href="#/profil-entreprise/${slugify(job.company)}">Voir le profil →</a></div>
        </aside>
      </div>
    </section>
  `);
}

function companiesPage() {
  return pageShell(`
    <section class="page-hero"><div class="container"><span class="eyebrow">Annuaire entreprises</span><h1>Entreprises qui recrutent à Madagascar</h1><p>Explorez les recruteurs actifs et leurs offres ouvertes.</p></div></section>
    <section class="section"><div class="container company-grid">${companies.map((c) => `<a class="company-card" href="#/profil-entreprise/${slugify(c.name)}"><div class="company-card-head">${companyLogo(c.name)}<div><h3>${c.name}</h3><p>${c.city}</p></div></div><p>${c.sector}</p><span class="pill">${c.jobs} offres</span></a>`).join("")}</div></section>
  `);
}

function companyProfilePage(slug) {
  const company = companies.find((c) => slugify(c.name) === slug) || companies[0];
  const companyJobs = jobs.filter((j) => j.company === company.name).concat(jobs.slice(0, 2));
  return pageShell(`
    <section class="page-hero"><div class="container">${companyLogo(company.name, "logo-mark", "width:86px;height:86px;margin:0 auto 18px")}<h1>${company.name}</h1><p>${company.sector} · ${company.city}</p></div></section>
    <section class="section"><div class="container detail-layout"><div><section class="content-section"><h2>À propos</h2><p>${company.name} est une entreprise active à Madagascar, engagée dans le recrutement de profils motivés et qualifiés. Ce profil est une reproduction démo avec des informations fictives.</p></section><section class="content-section"><h2>Offres ouvertes</h2><div class="job-list">${companyJobs.map(jobCard).join("")}</div></section></div><aside class="side-card"><h3>Informations</h3><p><strong>Secteur</strong><br>${company.sector}</p><p><strong>Ville</strong><br>${company.city}</p><p><strong>Offres</strong><br>${company.jobs}</p></aside></div></section>
  `);
}

function pricingPage() {
  return pageShell(`
    <section class="page-hero"><div class="container"><span class="eyebrow">Tarifs recruteurs</span><h1>Recrutez <span class="underline">sans compter</span>, payez selon vos besoins</h1><p>De la startup qui embauche son premier collaborateur au BPO qui recrute chaque semaine.</p><div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:18px"><span>✓ 2 offres gratuites/mois</span><span>✓ Sans engagement</span><span>✓ Annulez à tout moment</span></div></div></section>
    <section class="section"><div class="container" style="text-align:center"><div class="billing-toggle" data-billing><button class="active" data-cycle="monthly">Mensuel</button><button data-cycle="quarterly">Trimestriel <span style="color:var(--rose)">-15%</span></button></div><div class="pricing-grid">${plans.map(priceCard).join("")}</div></div></section>
    <section class="section alt"><div class="container"><h2 class="section-title" style="justify-content:center">Questions <strong>fréquentes</strong></h2><div class="company-grid" style="margin-top:28px">${[
      ["C'est vraiment gratuit ?", "Oui. 2 offres/mois, sans carte bancaire. Suffisant pour tester et recevoir vos premières candidatures."],
      ["Y a-t-il un engagement ?", "Non. Tous les plans sont mensuels. Vous pouvez changer ou revenir au gratuit quand vous voulez."],
      ["Comment payer ?", "MVola ou carte bancaire. Le prototype simule uniquement l'interface de paiement."],
      ["C'est quoi la CVthèque ?", "Un espace de recherche parmi des profils candidats qualifiés, ici représentés par des mocks fictifs."],
    ].map(([q, a]) => `<div class="company-card"><h3>${q}</h3><p>${a}</p></div>`).join("")}</div></div></section>
  `);
}

function priceCard(plan) {
  return `
    <article class="price-card ${plan.featured ? "featured" : ""}">
      ${plan.featured ? `<span class="pill rose" style="position:absolute;right:18px;top:18px">POPULAIRE</span>` : ""}
      <span class="icon-tile" style="background:${plan.color}20;color:${plan.color}">${icon(plan.featured ? "zap" : "layers")}</span>
      <h3>${plan.name}</h3>
      <p>${plan.audience}</p>
      <div class="price" data-price="${plan.monthly}">${formatPrice(plan.monthly)}</div>
      <ul class="feature-list">${plan.features.map((f) => `<li>${f}</li>`).join("")}</ul>
      <a class="btn ${plan.featured ? "btn-primary" : "btn-outline"}" style="margin-top:auto" href="#/inscription/recruteur">${plan.monthly === 0 ? "Commencer gratuitement" : "Choisir ce plan"}</a>
    </article>
  `;
}

function authPage(type) {
  const isRecruiter = type === "recruteur";
  return pageShell(`
    <section class="auth-shell">
      <div class="auth-art">${brand()}<h1>${isRecruiter ? "Publiez votre première offre en 2 minutes." : "Votre prochain emploi commence ici."}</h1><p>${isRecruiter ? "Créez votre espace recruteur, gérez vos offres et trouvez des profils qualifiés." : "Créez votre profil, déposez votre CV et postulez en un clic."}</p></div>
      <div class="auth-card"><span class="eyebrow">${isRecruiter ? "Asako Recruteur" : "Espace candidat"}</span><h1>${isRecruiter ? "Créer un compte recruteur" : "Créer mon profil"}</h1><form data-save-form><input class="input" placeholder="${isRecruiter ? "Nom de l'entreprise" : "Nom complet"}"><input class="input" placeholder="Email"><input class="input" placeholder="Mot de passe" type="password"><select class="select"><option>${isRecruiter ? "Secteur d'activité" : "Métier recherché"}</option>${sectors.slice(0, 8).map(([s]) => `<option>${s}</option>`).join("")}</select><button class="btn btn-primary" type="submit">${isRecruiter ? "Commencer gratuitement" : "Créer mon profil gratuitement"}</button></form></div>
    </section>
  `);
}

function simplePage(title, copy = "Cette page est reproduite sous forme de prototype local avec les composants principaux de la plateforme.") {
  return pageShell(`<section class="page-hero"><div class="container"><span class="eyebrow">Asako.mg</span><h1>${title}</h1><p>${copy}</p></div></section><section class="section"><div class="container"><div class="empty-state"><h2>Prototype disponible</h2><p>Les liens, styles, formulaires et états principaux sont inclus dans cette version locale.</p><a class="btn btn-primary" href="#/emploi">Explorer les offres</a></div></div></section>`);
}

function recruiterLayout(page, content) {
  const groups = [
    ["RECRUTEMENT", [["Dashboard", "dashboard", "layers"], ["Mes offres", "offres", "briefcase"], ["Candidatures", "candidatures", "users"]]],
    ["SOURCING", [["CVthèque", "cvtheque", "file"], ["Ma sélection", "ma-selection", "star"]]],
    ["ENTREPRISE", [["Mon entreprise", "entreprise", "briefcase"], ["Mon abonnement", "abonnement", "layers"]]],
    ["MON COMPTE", [["Mon profil", "profil", "user"], ["Déconnexion", "logout", "chevron"]]],
  ];
  return `
    <div class="recruiter-app">
      <div class="recruiter-shell">
        <aside class="recruiter-sidebar">
          <div class="recruiter-account">${companyLogo("Novaly Services", "avatar")}<div><strong>Novaly Services</strong><span>Admin Recruteur</span></div><a class="btn btn-soft" style="min-height:38px;padding:0;width:38px" href="#/">${icon("eye")}</a></div>
          <div class="side-groups">${groups.map(([title, links]) => `<div class="side-group"><p class="side-group-title">${title}</p>${links.map(([label, key, ic]) => `<a class="side-link ${page === key ? "active" : ""}" href="#/recruteur/${key === "dashboard" ? "dashboard" : key}">${icon(ic)} ${label}</a>`).join("")}</div>`).join("")}</div>
          <div class="side-cta"><a class="btn btn-primary" style="width:100%" href="#/recruteur/offres/nouvelle">${icon("plus")} Publier une offre</a></div>
          <div class="plan-mini"><strong>Plan Gratuit <span class="pill" style="float:right">0 Ar</span></strong><div class="quota-bar" style="margin:16px 0 10px"><span></span></div><p style="color:#e58200;font-size:12px">Plus que 2 offres disponibles</p><a class="btn btn-outline" style="width:100%;min-height:36px" href="#/recruteur/abonnement">Changer de plan →</a></div>
        </aside>
        <main class="recruiter-main">${content}</main>
      </div>
    </div>
  `;
}

function recruiterTop(title, subtitle, actions = "") {
  return `<div class="recruiter-top"><div style="display:flex;align-items:center;gap:16px"><div class="progress-ring">0%</div><div><h1 style="margin:0;font-size:22px">${title}</h1><p style="margin:2px 0 0;color:var(--rose)">${subtitle}</p></div></div><div>${actions}</div></div>`;
}

function recruiterPage(page) {
  const renderers = {
    dashboard: recruiterDashboard,
    offres: recruiterOffersPage,
    "offres/nouvelle": newOfferPage,
    candidatures: applicationsPage,
    cvtheque: cvthequePage,
    "ma-selection": selectionPage,
    entreprise: companyFormPage,
    abonnement: subscriptionPage,
    profil: profilePage,
  };
  const renderer = renderers[page] || renderers.dashboard;
  return recruiterLayout(page.split("/")[0] === "offres" && page.includes("nouvelle") ? "offres" : page, renderer());
}

function recruiterDashboard() {
  return `
    ${recruiterTop("Dashboard recruteur", "Suivez vos recrutements en un coup d'œil", `<a class="btn btn-primary" href="#/recruteur/offres/nouvelle">${icon("plus")} Publier une offre</a>`)}
    <div class="dashboard-grid">
      ${[["Offres actives", "3", "briefcase"], ["Candidatures", "42", "users"], ["À traiter", "11", "clock"], ["CV sauvegardés", "8", "star"]].map(([l, v, ic]) => `<div class="metric-card"><span class="icon-tile">${icon(ic)}</span><strong>${v}</strong><span>${l}</span></div>`).join("")}
    </div>
    <div class="recruiter-two">
      <section class="panel"><h2>Offres à surveiller</h2><div class="table-list">${recruiterOffers.map((o) => `<div class="table-row"><div><strong>${o.title}</strong><p>${o.views} vues · ${o.candidates} candidatures</p></div><span class="pill ${o.status === "Publiée" ? "mauve" : "rose"}">${o.status}</span><a class="btn btn-soft" href="#/recruteur/offres">Gérer</a></div>`).join("")}</div></section>
      <aside class="panel"><h2>Recommandations IA</h2><p>Votre profil entreprise est incomplet. Ajoutez une description et vos liens sociaux pour attirer plus de candidats.</p><a class="btn btn-primary" href="#/recruteur/entreprise">Compléter mon entreprise</a></aside>
    </div>
  `;
}

function recruiterOffersPage() {
  return `
    ${recruiterTop("Mes offres", "Gérez vos annonces et leur performance", `<a class="btn btn-primary" href="#/recruteur/offres/nouvelle">${icon("plus")} Nouvelle offre</a>`)}
    <section class="panel"><div class="toolbar"><input class="input" data-table-search placeholder="Rechercher une offre..."><select class="select"><option>Tous les statuts</option><option>Publiée</option><option>Brouillon</option></select></div><div class="table-list">${recruiterOffers.map((o) => `<div class="table-row" data-search-row><div><strong>${o.title}</strong><p>${o.views} vues · ${o.candidates} candidatures · expire: ${o.expires}</p></div><span class="pill">${o.status}</span><button class="btn btn-soft" data-toast="Action simulée">Modifier</button></div>`).join("")}</div></section>
  `;
}

function newOfferPage() {
  return `
    ${recruiterTop("Publier une offre", "Rédigez une annonce claire et attractive", `<button class="btn btn-soft" data-toast="Aperçu généré">Aperçu</button>`)}
    <form data-save-form>
      <section class="form-section"><div class="form-section-head"><div class="form-section-title"><span class="icon-tile">${icon("briefcase")}</span>Informations principales</div><span class="status-badge">À compléter</span></div><div class="form-body form-grid">
        <div class="form-field"><label>Titre du poste*</label><input class="input" placeholder="Ex : Développeur Frontend"></div>
        <div class="form-field"><label>Type de contrat*</label><select class="select"><option>CDI</option><option>CDD</option><option>Stage</option><option>Freelance</option></select></div>
        <div class="form-field"><label>Ville*</label><input class="input" placeholder="Ex : Antananarivo"></div>
        <div class="form-field"><label>Secteur*</label><select class="select">${sectors.map(([s]) => `<option>${s}</option>`).join("")}</select></div>
        <div class="form-field full"><label>Résumé court</label><input class="input" maxlength="180" placeholder="Une phrase qui donne envie de postuler"></div>
      </div></section>
      <section class="form-section"><div class="form-section-head"><div class="form-section-title"><span class="icon-tile">${icon("file")}</span>Description</div><span class="status-badge">À compléter</span></div><div class="form-body form-grid">
        <div class="form-field full"><label>Missions*</label><textarea class="textarea" placeholder="Listez les responsabilités principales..."></textarea></div>
        <div class="form-field full"><label>Profil recherché*</label><textarea class="textarea" placeholder="Compétences, expérience, qualités..."></textarea></div>
      </div></section>
      <section class="form-section"><div class="form-section-head"><div class="form-section-title"><span class="icon-tile">${icon("zap")}</span>Boost</div><span class="status-badge ok">Optionnel</span></div><div class="form-body"><label class="check-row"><input type="checkbox"> Mettre cette offre en vedette pendant 7 jours</label><label class="check-row"><input type="checkbox"> Activer le matching IA avec la CVthèque</label></div></section>
      <div class="sticky-actions"><a class="btn btn-soft" href="#/recruteur/offres">Annuler</a><button class="btn btn-primary" type="submit">${icon("save")} Enregistrer l'offre</button></div>
    </form>
  `;
}

function applicationsPage() {
  const statuses = ["Nouveau", "En cours", "Entretien", "Sélection"];
  return `
    ${recruiterTop("Candidatures", "Triez les profils et avancez votre pipeline")}
    <div class="kanban">${statuses.map((status) => `<section class="kanban-col"><h2>${status}</h2>${candidates.filter((c) => c.status === status).map(candidateCard).join("") || `<div class="empty-state">Aucun profil</div>`}</section>`).join("")}</div>
  `;
}

function candidateCard(c) {
  return `<article class="candidate-card"><strong>${c.name}</strong><p>${c.role} · ${c.city}</p><span class="pill rose">${c.match}% match</span><div class="skill-tags">${c.skills.map((s) => `<span>${s}</span>`).join("")}</div><button class="btn btn-soft" data-toast="Statut mis à jour">Déplacer</button></article>`;
}

function cvthequePage() {
  return `
    ${recruiterTop("CVthèque", "Recherchez parmi les profils qualifiés", `<a class="btn btn-primary" href="#/recruteur/ma-selection">Ma sélection</a>`)}
    <section class="panel"><div class="toolbar"><input class="input" id="cvSearch" placeholder="Compétence, ville, métier..."><select class="select" id="cvCity"><option value="">Toutes les villes</option><option>Antananarivo</option><option>Antsirabe</option><option>Toamasina</option><option>Mahajanga</option></select></div><div class="cv-grid" id="cvGrid">${candidates.map(cvCard).join("")}</div><div class="empty-state" id="cvEmpty" hidden>Aucun profil trouvé</div></section>
  `;
}

function cvCard(c) {
  return `<article class="cv-card" data-cv-card data-city="${c.city}" data-text="${escapeAttr(`${c.name} ${c.role} ${c.skills.join(" ")} ${c.city}`)}"><div style="display:flex;align-items:center;gap:12px"><div class="avatar">${c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div><div><strong>${c.name}</strong><p>${c.role} · ${c.exp}</p></div></div><div class="skill-tags">${c.skills.map((s) => `<span>${s}</span>`).join("")}</div><p>${c.city} · Disponible sous 15 jours</p><button class="btn btn-outline" data-save-candidate>Ajouter à ma sélection</button></article>`;
}

function selectionPage() {
  return `
    ${recruiterTop("Ma sélection", "Profils sauvegardés pour vos prochains échanges")}
    <section class="panel"><div class="cv-grid">${candidates.slice(0, 3).map(cvCard).join("")}</div></section>
  `;
}

function companyFormPage() {
  return `
    ${recruiterTop("Profil de l'entreprise", "Complétez votre profil pour attirer 3x plus de candidats", `<a class="btn btn-outline" href="#/profil-entreprise/novaly-services">${icon("eye")} Voir ma page</a>`)}
    <form data-save-form>
      <section class="form-section"><div class="form-section-head"><div class="form-section-title"><span class="icon-tile">${icon("briefcase")}</span>Identité</div><span class="status-badge">À compléter</span></div><div class="form-body form-grid">
        <div class="form-field full"><label>Logo de l'entreprise</label><div class="upload-box">${companyLogo("Novaly Services", "upload-placeholder")}<div><strong>Format JPG ou PNG, max 2 Mo</strong><br><button class="btn btn-primary" type="button" data-toast="Upload simulé">Télécharger un logo</button></div></div></div>
        <div class="form-field"><label>Nom de l'entreprise — verrouillé</label><input class="input" value="Novaly Services" disabled></div>
        <div class="form-field"><label>Secteur d'activité*</label><select class="select"><option>Sélectionner un secteur</option>${sectors.map(([s]) => `<option>${s}</option>`).join("")}</select></div>
        <div class="form-field"><label>Taille de l'entreprise</label><select class="select"><option>Sélectionner la taille</option><option>1 à 10 employés</option><option>11 à 50 employés</option><option>51 à 200 employés</option><option>Plus de 500 employés</option></select></div>
        <div class="form-field"><label>Ville / Siège</label><input class="input" placeholder="Ex : Antananarivo"></div>
        <div class="form-field full"><label>Slogan / Accroche</label><input class="input" maxlength="255" placeholder="Ex : Leader des télécommunications à Madagascar"><small>0/255</small></div>
      </div></section>
      <section class="form-section"><div class="form-section-head"><div class="form-section-title"><span class="icon-tile">${icon("file")}</span>Présentation</div><span class="status-badge">À compléter</span></div><div class="form-body"><div class="form-field"><label>Description de l'entreprise*</label><textarea class="textarea" maxlength="2000" placeholder="Parlez de vos activités, votre culture, vos valeurs"></textarea><small>Astuce : mentionnez ce qui rend votre entreprise unique · 0/2000</small></div></div></section>
      <section class="form-section"><div class="form-section-head"><div class="form-section-title"><span class="icon-tile" style="background:var(--green-soft);color:var(--green)">${icon("globe")}</span>Présence en ligne</div><span class="status-badge">À compléter</span></div><div class="form-body form-grid"><div class="form-field full"><label>Site web</label><input class="input" placeholder="https://www.votre-entreprise.mg"></div><div class="form-field"><label>Facebook</label><input class="input" placeholder="https://facebook.com/votre-page"></div><div class="form-field"><label>LinkedIn</label><input class="input" placeholder="https://linkedin.com/company/votre-page"></div></div></section>
      <section class="form-section"><div class="form-section-head"><div class="form-section-title"><span class="icon-tile">${icon("file")}</span>Informations de facturation</div><span class="status-badge ok">Démo</span></div><div class="form-body form-grid"><div class="form-field"><label>NIF</label><input class="input" placeholder="0000000000"></div><div class="form-field"><label>STAT</label><input class="input" placeholder="00000 00 0000 0 00000"></div></div></section>
      <div class="sticky-actions"><button class="btn btn-soft" type="button">Annuler</button><button class="btn btn-primary" type="submit">${icon("save")} Enregistrer les modifications</button></div>
    </form>
  `;
}

function subscriptionPage() {
  return `
    ${recruiterTop("Mon abonnement", "Votre plan actuel et vos quotas")}
    <section class="panel"><h2>Plan Gratuit</h2><p>0 Ar · 2 offres disponibles ce mois-ci</p><div class="quota-bar"><span></span></div></section>
    <section class="section" style="padding-top:18px"><div class="pricing-grid">${plans.map(priceCard).join("")}</div></section>
  `;
}

function profilePage() {
  return `
    ${recruiterTop("Mon profil", "Paramètres du compte recruteur")}
    <form class="panel form-grid" data-save-form><div class="form-field"><label>Nom affiché</label><input class="input" value="Admin Recruteur"></div><div class="form-field"><label>Email professionnel</label><input class="input" value="rh-demo@novaly.mg"></div><div class="form-field"><label>Téléphone</label><input class="input" placeholder="+261 ..."></div><div class="form-field"><label>Notifications</label><select class="select"><option>Recevoir les candidatures par email</option><option>Résumé quotidien</option></select></div><div class="form-field full"><button class="btn btn-primary" type="submit">Sauvegarder</button></div></form>
  `;
}

function render() {
  const hash = location.hash || "#/";
  const path = hash.replace(/^#\/?/, "").split("?")[0] || "";
  let html;
  if (path === "") html = homePage();
  else if (path === "emploi") html = jobsPage();
  else if (path === "cdd") html = jobsPage("Emploi CDD");
  else if (path === "freelance") html = jobsPage("Freelance");
  else if (path === "stages") html = jobsPage("Offre de stage");
  else if (path === "offres-urgentes") html = jobsPage("Offres urgentes");
  else if (path.startsWith("annonces/")) html = jobDetailPage(path.split("/")[1]);
  else if (path === "entreprises") html = companiesPage();
  else if (path.startsWith("profil-entreprise/")) html = companyProfilePage(path.split("/")[1]);
  else if (path === "tarifs") html = pricingPage();
  else if (path === "inscription/candidat") html = authPage("candidat");
  else if (path === "inscription/recruteur") html = authPage("recruteur");
  else if (path.startsWith("recruteur/")) html = recruiterPage(path.replace("recruteur/", ""));
  else html = simplePage(path.split("/").map(capitalize).join(" "));
  app.innerHTML = html;
  document.body.classList.remove("menu-open");
  window.scrollTo(0, 0);
  bindInteractions();
}

function bindInteractions() {
  document.querySelector("[data-menu]")?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  document.querySelectorAll(".mobile-drawer a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  document.querySelector("[data-home-search]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q") || "";
    location.hash = `#/emploi?search=${encodeURIComponent(q)}`;
  });
  bindJobFilters();
  bindBilling();
  bindCvFilters();
  bindTableSearch();
  document.querySelectorAll("[data-save-form]").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("Enregistré dans la démo locale");
  }));
  document.querySelectorAll("[data-toast]").forEach((el) => el.addEventListener("click", () => showToast(el.dataset.toast || "Action simulée")));
  document.querySelectorAll("[data-save-candidate]").forEach((btn) => btn.addEventListener("click", () => {
    btn.textContent = btn.textContent.includes("Ajouté") ? "Ajouter à ma sélection" : "Ajouté à ma sélection";
    btn.classList.toggle("btn-primary");
    showToast("Sélection mise à jour");
  }));
  document.querySelectorAll("[data-contract-tabs] .tab-btn").forEach((btn) => btn.addEventListener("click", () => {
    document.querySelectorAll("[data-contract-tabs] .tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const contract = btn.dataset.contract;
    document.querySelectorAll("#homeJobs [data-job-card]").forEach((card) => {
      card.hidden = contract !== "Toutes" && card.dataset.contract !== contract;
    });
  }));
}

function bindJobFilters() {
  const list = document.querySelector("#jobsList");
  if (!list) return;
  const search = document.querySelector("#jobSearch");
  const sector = document.querySelector("#sectorFilter");
  const inputs = [...document.querySelectorAll("[data-job-filter]"), search, sector].filter(Boolean);
  const apply = () => {
    const q = (search?.value || "").toLowerCase();
    const selectedContracts = checkedValues("contract");
    const selectedCities = checkedValues("city");
    const sectorValue = sector?.value || "";
    let count = 0;
    document.querySelectorAll("#jobsList [data-job-card]").forEach((card) => {
      const matchesText = `${card.dataset.title} ${card.dataset.company} ${card.dataset.sector}`.toLowerCase().includes(q);
      const matchesContract = !selectedContracts.length || selectedContracts.includes(card.dataset.contract);
      const matchesCity = !selectedCities.length || selectedCities.includes(card.dataset.city);
      const matchesSector = !sectorValue || card.dataset.sector === sectorValue;
      const visible = matchesText && matchesContract && matchesCity && matchesSector;
      card.hidden = !visible;
      if (visible) count += 1;
    });
    document.querySelector("#jobCount").textContent = count;
    document.querySelector("#jobEmpty").hidden = count !== 0;
  };
  inputs.forEach((input) => input.addEventListener(input.tagName === "INPUT" && input.type !== "checkbox" ? "input" : "change", apply));
  document.querySelector("[data-clear-jobs]")?.addEventListener("click", () => {
    if (search) search.value = "";
    if (sector) sector.value = "";
    document.querySelectorAll("[data-job-filter]").forEach((i) => (i.checked = false));
    apply();
  });
  apply();
}

function bindBilling() {
  const toggle = document.querySelector("[data-billing]");
  if (!toggle) return;
  toggle.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    toggle.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    const quarterly = button.dataset.cycle === "quarterly";
    document.querySelectorAll("[data-price]").forEach((node) => {
      const monthly = Number(node.dataset.price);
      const value = quarterly ? Math.round(monthly * 3 * 0.85) : monthly;
      node.textContent = monthly === 0 ? "0 Ar" : `${formatPrice(value)}${quarterly ? " /trim." : " /mois"}`;
    });
  }));
}

function bindCvFilters() {
  const grid = document.querySelector("#cvGrid");
  if (!grid) return;
  const search = document.querySelector("#cvSearch");
  const city = document.querySelector("#cvCity");
  const apply = () => {
    const q = (search.value || "").toLowerCase();
    const cityValue = city.value;
    let count = 0;
    document.querySelectorAll("[data-cv-card]").forEach((card) => {
      const visible = (!q || card.dataset.text.toLowerCase().includes(q)) && (!cityValue || card.dataset.city === cityValue);
      card.hidden = !visible;
      if (visible) count += 1;
    });
    document.querySelector("#cvEmpty").hidden = count !== 0;
  };
  search.addEventListener("input", apply);
  city.addEventListener("change", apply);
}

function bindTableSearch() {
  const input = document.querySelector("[data-table-search]");
  if (!input) return;
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll("[data-search-row]").forEach((row) => {
      row.hidden = !row.textContent.toLowerCase().includes(q);
    });
  });
}

function checkedValues(type) {
  return [...document.querySelectorAll(`[data-job-filter="${type}"]:checked`)].map((i) => i.value);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function slugify(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

function formatPrice(value) {
  if (!value) return "0 Ar";
  return `${new Intl.NumberFormat("fr-FR").format(value)} Ar`;
}

window.addEventListener("hashchange", render);
if (!location.hash) location.hash = "#/";
render();
