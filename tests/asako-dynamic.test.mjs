import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");

function renderRoute(hash) {
  const app = { innerHTML: "" };
  const emptyList = [];
  const toast = {
    classList: {
      add() {},
      remove() {},
    },
    textContent: "",
  };
  const documentStub = {
    body: {
      classList: {
        add() {},
        remove() {},
        toggle() {},
      },
    },
    querySelector(selector) {
      if (selector === "#app") return app;
      if (selector === "#toast") return toast;
      return null;
    },
    querySelectorAll() {
      return emptyList;
    },
  };
  const context = {
    app,
    console,
    clearTimeout,
    document: documentStub,
    FormData: class FormDataStub {},
    Intl,
    location: { hash },
    setTimeout,
    URLSearchParams,
    window: {
      addEventListener() {},
      scrollTo() {},
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "app.js" });
  return app.innerHTML;
}

function includesAll(html, labels) {
  for (const label of labels) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
}

{
  const html = renderRoute("#/");
  includesAll(html, ["Derniers jours pour postuler", "Asako Pro", "data-sticky-deadlines", "data-sticky-pro"]);
}

{
  const html = renderRoute("#/recruteur/offres");
  includesAll(html, ["Aucune offre", "0 offres affichées", "Plan Gratuit · 0/2 offres utilisées"]);
  assert.doesNotMatch(html, /Développeur Frontend/);
}

{
  const html = renderRoute("#/recruteur/offres/nouvelle");
  includesAll(html, ["Je rédige mon offre", "Générer avec l'IA", "Commencer la rédaction", "Générer mon offre"]);
}

{
  const html = renderRoute("#/recruteur/offres/nouvelle?method=manual");
  includesAll(html, ["Changer de méthode", "Fourchette de salaire mensuel", "Votre référence interne", "Options de visibilité", "Publier l'offre"]);
}

{
  const html = renderRoute("#/recruteur/cvtheque");
  includesAll(html, ["Recherche libre", "Matcher par offre", "Accès limité à la CVthèque", "RECHERCHES POPULAIRES"]);
}

{
  const html = renderRoute("#/recruteur/abonnement");
  includesAll(html, ["Quotas restants", "Mensuel", "Trimestriel", "Historique des transactions"]);
}

console.log("asako dynamic smoke tests passed");
