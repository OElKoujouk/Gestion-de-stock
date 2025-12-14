import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type EstablishmentOption = { id: string; nom: string };
type Article = {
  id: string;
  nom: string;
  quantite: number;
  referenceFournisseur?: string | null;
  seuilAlerte: number;
  categorieId?: string | null;
};
type Category = { id: string; nom: string };

export function ProductsSection() {
  const { role } = useAuth();
  const isSuperAdmin = role === "superAdmin";

  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [establishmentsLoading, setEstablishmentsLoading] = useState(false);
  const [establishmentsError, setEstablishmentsError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const targetTenantId = isSuperAdmin ? selectedTenantId || "" : undefined;
  const canLoadInventory = !isSuperAdmin || Boolean(targetTenantId);

  useEffect(() => {
    if (!isSuperAdmin) {
      setEstablishments([]);
      setSelectedTenantId("");
      setEstablishmentsLoading(false);
      setEstablishmentsError(null);
      return;
    }

    setEstablishmentsLoading(true);
    api
      .getEstablishments()
      .then((data) => {
        const options = data.map((item) => ({ id: item.id, nom: item.nom }));
        setEstablishments(options);
        setEstablishmentsError(null);
        setSelectedTenantId((prev) =>
          prev && options.some((opt) => opt.id === prev) ? prev : options[0]?.id ?? "",
        );
      })
      .catch((err) =>
        setEstablishmentsError(
          err instanceof Error ? err.message : "Impossible de charger les établissements",
        ),
      )
      .finally(() => setEstablishmentsLoading(false));
  }, [isSuperAdmin]);

  const fetchArticles = async (tenantId?: string) => {
    setArticlesLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tenantId) params.etablissementId = tenantId;
      const data = await api.getArticles(Object.keys(params).length ? params : undefined);
      setArticles(data);
      setArticlesError(null);
    } catch (err) {
      setArticlesError(
        err instanceof Error ? err.message : "Impossible de charger le stock",
      );
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchCategories = async (tenantId?: string) => {
    setCategoriesLoading(true);
    try {
      const data = await api.getCategories(tenantId ? { etablissementId: tenantId } : undefined);
      setCategories(data);
      setCategoriesError(null);
    } catch (err) {
      setCategoriesError(
        err instanceof Error ? err.message : "Impossible de charger les catégories",
      );
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (!canLoadInventory) {
      setArticles([]);
      setArticlesLoading(false);
      return;
    }
    void fetchCategories(targetTenantId);
    void fetchArticles(targetTenantId);
  }, [canLoadInventory, targetTenantId]);

  const filteredArticles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return articles
      .filter((article) => {
        if (showOnlyAlerts && article.quantite > article.seuilAlerte) return false;
        if (selectedCategoryId === "none" && article.categorieId) return false;
        if (selectedCategoryId && selectedCategoryId !== "none" && article.categorieId !== selectedCategoryId)
          return false;
        if (!query) return true;
        return (
          article.nom.toLowerCase().includes(query) ||
          (article.referenceFournisseur ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [articles, searchTerm, showOnlyAlerts, selectedCategoryId]);

  const alertCount = useMemo(
    () => articles.filter((article) => article.quantite <= article.seuilAlerte).length,
    [articles],
  );
  const totalQuantity = useMemo(
    () => articles.reduce((sum, article) => sum + (article.quantite || 0), 0),
    [articles],
  );

  const categoryLabel = useCallback(
    (categoryId?: string | null) => {
      if (!categoryId) return "Sans catégorie";
      return categories.find((c) => c.id === categoryId)?.nom ?? "Catégorie inconnue";
    },
    [categories],
  );

  const articlesByCategory = useMemo(() => {
    const groups = new Map<string, { id: string; nom: string; items: Article[] }>();
    const ensure = (id: string, nom: string) => {
      if (!groups.has(id)) groups.set(id, { id, nom, items: [] });
      return groups.get(id)!;
    };

    categories.forEach((cat) => ensure(cat.id, cat.nom));
    ensure("none", "Sans catégorie");

    articles.forEach((article) => {
      const bucket = article.categorieId
        ? ensure(article.categorieId, categoryLabel(article.categorieId))
        : ensure("none", "Sans catégorie");
      bucket.items.push(article);
    });

    return Array.from(groups.values()).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [articles, categories, categoryLabel]);

  const handleDownloadInventory = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const M = 40;
    const headerH = 72;
    const footerH = 36;
    const fontMain = "helvetica";

    const formatDate = () => new Date().toLocaleDateString("fr-FR");

    const rows = articles
      .slice()
      .sort((a, b) => {
        const catA = categoryLabel(a.categorieId);
        const catB = categoryLabel(b.categorieId);
        if (catA !== catB) return catA.localeCompare(catB);
        return a.nom.localeCompare(b.nom);
      })
      .map((article, idx) => ({
        idx: String(idx + 1),
        nom: article.nom,
        cat: categoryLabel(article.categorieId),
        ref: article.referenceFournisseur?.trim() || "—",
        qty: String(article.quantite),
        seuil: String(article.seuilAlerte),
      }));

    const drawHeader = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, headerH, "F");

      doc.setFont(fontMain, "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Inventaire de l'établissement", M, 42);

      doc.setFont(fontMain, "normal");
      doc.setFontSize(10);
      doc.text(`Date : ${formatDate()}`, pageW - M, 28, { align: "right" });
      doc.text(`Références : ${articles.length}`, pageW - M, 44, { align: "right" });

      doc.setTextColor(15, 23, 42);
    };

    const drawFooter = (pageNumber: number, totalPages: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.line(M, pageH - footerH, pageW - M, pageH - footerH);

      doc.setFont(fontMain, "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${pageNumber} / ${totalPages}`, pageW - M, pageH - 14, { align: "right" });
      doc.setTextColor(15, 23, 42);
    };

    const drawSummary = (startY: number) => {
      const boxW = pageW - M * 2;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(M, startY, boxW, 96, 10, 10, "FD");

      doc.setFont(fontMain, "bold");
      doc.setFontSize(11);
      doc.text("Synthèse", M + 14, startY + 20);

      doc.setFont(fontMain, "normal");
      doc.setFontSize(10);
      const stats = [
        `Références : ${articles.length}`,
        `Quantité totale : ${totalQuantity}`,
        `Alertes : ${alertCount}`,
      ];
      stats.forEach((line, i) => {
        doc.text(line, M + 14, startY + 40 + i * 16);
      });

      return startY + 96 + 18;
    };

    const col = {
      idx: { x: M, w: 32 },
      nom: { x: M + 32, w: 220 },
      cat: { x: M + 32 + 220, w: 150 },
      ref: { x: M + 32 + 220 + 150, w: 140 },
      qty: { x: M + 32 + 220 + 150 + 140, w: 60 },
      seuil: { x: M + 32 + 220 + 150 + 140 + 60, w: pageW - M - (M + 32 + 220 + 150 + 140 + 60) },
    };

    const drawTableHeader = (y: number) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.rect(M, y, pageW - M * 2, 28, "FD");

      doc.setFont(fontMain, "bold");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);

      doc.text("#", col.idx.x + 10, y + 18);
      doc.text("Produit", col.nom.x + 10, y + 18);
      doc.text("Catégorie", col.cat.x + 10, y + 18);
      doc.text("Référence", col.ref.x + 10, y + 18);
      doc.text("Qté", col.qty.x + col.qty.w - 10, y + 18, { align: "right" });
      doc.text("Seuil", col.seuil.x + col.seuil.w - 10, y + 18, { align: "right" });

      doc.setTextColor(15, 23, 42);
      doc.setFont(fontMain, "normal");
    };

    const lineH = 14;
    const drawRow = (
      y: number,
      r: { idx: string; nom: string; cat: string; ref: string; qty: string; seuil: string },
      zebra: boolean,
    ) => {
      const nomLines = doc.splitTextToSize(r.nom, col.nom.w - 20);
      const catLines = doc.splitTextToSize(r.cat, col.cat.w - 20);
      const refLines = doc.splitTextToSize(r.ref, col.ref.w - 20);

      const rowLines = Math.max(nomLines.length, catLines.length, refLines.length, 1);
      const rowH = Math.max(26, rowLines * lineH + 12);

      if (zebra) {
        doc.setFillColor(252, 252, 253);
        doc.rect(M, y, pageW - M * 2, rowH, "F");
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(M, y + rowH, pageW - M, y + rowH);

      doc.setFontSize(10);
      doc.text(r.idx, col.idx.x + 10, y + 18);

      doc.text(nomLines, col.nom.x + 10, y + 18);
      doc.setTextColor(71, 85, 105);
      doc.text(catLines, col.cat.x + 10, y + 18);
      doc.text(refLines, col.ref.x + 10, y + 18);
      doc.setTextColor(15, 23, 42);

      doc.setFont(fontMain, "bold");
      doc.text(r.qty, col.qty.x + col.qty.w - 10, y + 18, { align: "right" });
      doc.text(r.seuil, col.seuil.x + col.seuil.w - 10, y + 18, { align: "right" });
      doc.setFont(fontMain, "normal");

      return rowH;
    };

    drawHeader();
    let y = drawSummary(headerH + 12);
    drawTableHeader(y);
    y += 32;

    rows.forEach((row, idx) => {
      if (y > pageH - footerH - 40) {
        drawFooter(doc.getCurrentPageInfo().pageNumber, doc.getNumberOfPages());
        doc.addPage();
        drawHeader();
        y = headerH + 20;
        drawTableHeader(y);
        y += 32;
      }
      const rowH = drawRow(y, row, idx % 2 === 1);
      y += rowH;
    });

    drawFooter(doc.getCurrentPageInfo().pageNumber, doc.getNumberOfPages());
    doc.save("inventaire.pdf");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Stocks"
        title={isSuperAdmin ? "Stock par établissement" : "Stock de l'établissement"}
        description="Vue simplifiée du stock : uniquement les références disponibles et leurs niveaux. Toutes les actions de gestion sont retirées pour se concentrer sur la lecture."
      />

      {isSuperAdmin ? (
        <Card>
          <CardHeader
            title="Établissement cible"
            subtitle="Sélectionnez l'établissement dont vous souhaitez consulter les stocks"
          />
          {establishmentsLoading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : establishmentsError ? (
            <p className="text-sm text-rose-600">{establishmentsError}</p>
          ) : establishments.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun établissement disponible.</p>
          ) : (
            <select
              className="mt-3 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
              value={selectedTenantId}
              onChange={(event) => setSelectedTenantId(event.target.value)}
            >
              {establishments.map((etab) => (
                <option key={etab.id} value={etab.id}>
                  {etab.nom}
                </option>
              ))}
            </select>
          )}
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Liste des stocks"
          subtitle="Références disponibles, quantités et alertes"
          action={
            canLoadInventory ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Recherche produit ou ref."
                    className="w-40 rounded-full border-none px-2 py-1 text-xs outline-none focus:ring-0 sm:w-56"
                  />
                </div>
                <select
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:border-emerald-500/70 focus:outline-none"
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  disabled={categoriesLoading}
                >
                  <option value="">Toutes les catégories</option>
                  <option value="none">Sans catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={showOnlyAlerts}
                    onChange={(event) => setShowOnlyAlerts(event.target.checked)}
                  />
                  Alertes uniquement
                </label>
                <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-700">
                  {filteredArticles.length} référence(s) • {alertCount} alerte(s)
                </span>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white hover:bg-slate-800"
                  onClick={handleDownloadInventory}
                  disabled={articles.length === 0}
                >
                  Télécharger l&apos;inventaire (PDF)
                </button>
              </div>
            ) : undefined
          }
        />

        {articlesLoading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : articlesError ? (
          <p className="text-sm text-rose-600">{articlesError}</p>
        ) : !canLoadInventory ? (
          <p className="text-sm text-slate-500">Sélectionnez un établissement pour afficher le stock.</p>
        ) : filteredArticles.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune référence dans le stock.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <div className="min-w-full space-y-4 text-sm md:min-w-[640px]">
              {articlesByCategory.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-slate-50/60 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Catégorie
                        </p>
                        <p className="text-sm font-semibold text-slate-900">{group.nom}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {group.items.length} référence(s)
                      </span>
                    </div>
                    <div className="grid items-center gap-2 border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs md:grid-cols-[2fr_1.1fr_0.8fr_0.8fr]">
                      <span>Produit</span>
                      <span className="text-center">Référence fournisseur</span>
                      <span className="text-center">Quantité</span>
                      <span className="text-center">Seuil</span>
                    </div>
                    {group.items
                      .slice()
                      .sort((a, b) => a.nom.localeCompare(b.nom))
                      .map((article) => {
                        const inAlert = article.quantite <= article.seuilAlerte;
                        return (
                          <div
                            key={article.id}
                            className={cn(
                              "grid items-center gap-2 border-b border-slate-100 px-3 py-2 md:grid-cols-[2fr_1.1fr_0.8fr_0.8fr]",
                              inAlert && "bg-amber-50/60",
                            )}
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{article.nom}</p>
                              {inAlert ? (
                                <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                                  Niveau d&apos;alerte atteint
                                </span>
                              ) : null}
                            </div>
                            <p className="text-center text-slate-600">
                              {article.referenceFournisseur?.trim() || "—"}
                            </p>
                            <span className="text-center font-semibold text-slate-900">
                              {article.quantite}
                            </span>
                            <span className="text-center text-slate-700">{article.seuilAlerte}</span>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Catégories"
          subtitle={
            categoriesLoading
              ? "Chargement des catégories..."
              : categoriesError
                ? categoriesError
                : "Répartition des références par catégorie"
          }
        />
        {categoriesError ? null : articlesByCategory.every((cat) => cat.items.length === 0) ? (
          <p className="px-3 pb-3 text-sm text-slate-500">Aucune catégorie pour cet établissement.</p>
        ) : (
          <div className="grid gap-3 px-3 pb-3 sm:grid-cols-2 md:grid-cols-3">
            {articlesByCategory.map((cat) => (
              <div
                key={cat.id}
                className="space-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {cat.nom}
                  <span className="ml-2 text-xs font-medium text-slate-500">
                    ({cat.items.length} ref.)
                  </span>
                </p>
                {cat.items.length === 0 ? (
                  <p className="text-xs text-slate-500">Aucun produit dans cette catégorie.</p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {cat.items
                      .slice()
                      .sort((a, b) => a.nom.localeCompare(b.nom))
                      .slice(0, 5)
                      .map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span className="truncate">{item.nom}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {item.referenceFournisseur?.trim() || "—"}
                          </span>
                        </li>
                      ))}
                    {cat.items.length > 5 ? (
                      <li className="text-[11px] font-semibold text-slate-500">
                        + {cat.items.length - 5} autre(s) référence(s)
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
