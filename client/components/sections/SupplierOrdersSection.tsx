"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Article = {
  id: string;
  nom: string;
  quantite: number;
  referenceFournisseur: string | null;
  seuilAlerte: number;
};

type SupplierProfile = {
  id: string;
  nom: string;
  adresse: string | null;
};

type SupplierOrder = {
  id: string;
  fournisseur: string;
  statut: "en_cours" | "recue";
  createdAt?: string;
  updatedAt?: string;
  supplierId?: string | null;
  supplier?: { id: string; nom: string; adresse: string | null };
  items: Array<{ id: string; articleId: string; quantite: number }>;
};

export function SupplierOrdersSection() {
  const { role, hasAbility } = useAuth();
  const isSuperAdmin = role === "superAdmin";
  const canManageSupplierOrders = hasAbility("manageSupplierOrders");
  const canSubmitOrders = canManageSupplierOrders && !isSuperAdmin;

  /* ───────────── State base ───────────── */

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supplierName, setSupplierName] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<Record<string, number>>({});
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [modifiedOrders, setModifiedOrders] = useState<Set<string>>(new Set());

  /* ───────────── Fetch données ───────────── */

  useEffect(() => {
    setLoading(true);
    api
      .getArticles()
      .then((data) => {
        setArticles(data);
        setError(null);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Impossible de charger les articles",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!canManageSupplierOrders || isSuperAdmin) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    api
      .getSupplierOrders()
      .then((data) => {
        setOrders(data);
        setOrdersError(null);
      })
      .catch((err) =>
        setOrdersError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les commandes fournisseurs",
        ),
      )
      .finally(() => setOrdersLoading(false));
  }, [canManageSupplierOrders, isSuperAdmin]);

  useEffect(() => {
    if (!canManageSupplierOrders || isSuperAdmin) {
      setSuppliers([]);
      return;
    }
    setSuppliersLoading(true);
    api
      .getSuppliers()
      .then((data) => {
        setSuppliers(data);
        setSuppliersError(null);
      })
      .catch((err) =>
        setSuppliersError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les fournisseurs",
        ),
      )
      .finally(() => setSuppliersLoading(false));
  }, [canManageSupplierOrders, isSuperAdmin]);

  /* ───────────── Dérivés / mémo ───────────── */

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter(
      (article) =>
        article.nom.toLowerCase().includes(query) ||
        (article.referenceFournisseur ?? "").toLowerCase().includes(query),
    );
  }, [articles, search]);

  const selectedItems = useMemo(
    () =>
      articles
        .map((article) => ({
          articleId: article.id,
          quantite: quantities[article.id] ?? 0,
          article,
        }))
        .filter((item) => item.quantite > 0),
    [articles, quantities],
  );

  const selectedItemsCount = selectedItems.length;
  const selectedTotalQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantite,
    0,
  );

  const inProgressOrders = orders.filter(
    (order) => order.statut === "en_cours",
  );
  const receivedOrders = orders.filter((order) => order.statut === "recue");

  const resetSelection = () => setQuantities({});

  /* ───────────── Helpers formulaire ───────────── */

  const validateForm = () => {
    if (!supplierName.trim()) {
      setSubmitMessage("Le nom du fournisseur est requis.");
      return false;
    }
    if (selectedItems.length === 0) {
      setSubmitMessage("Choisissez au moins un produit à commander.");
      return false;
    }
    return true;
  };

  const handleAddSupplier = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!supplierName.trim()) {
      setSubmitMessage("Nom du fournisseur requis.");
      return;
    }

    const existing = suppliers.find(
      (s) =>
        s.nom === supplierName.trim() &&
        (s.adresse ?? "").trim() === supplierAddress.trim(),
    );
    if (existing) {
      setSelectedSupplierId(existing.id);
      setSubmitMessage("Fournisseur déjà enregistré, sélection mise à jour.");
      return;
    }

    const profile: SupplierProfile = {
      id: "",
      nom: supplierName.trim(),
      adresse: supplierAddress.trim(),
    };

    api
      .createSupplier({ nom: profile.nom, adresse: profile.adresse || null })
      .then((created) => {
        const enriched: SupplierProfile = {
          ...profile,
          id: created.id,
          adresse: created.adresse || "",
        };
        setSuppliers((prev) => [enriched, ...prev]);
        setSelectedSupplierId(created.id);
        setSubmitMessage("Fournisseur enregistré en base.");
      })
      .catch((err) => {
        setSubmitMessage(
          err instanceof Error
            ? err.message
            : "Impossible d'enregistrer le fournisseur",
        );
      });
  };

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (supplier) {
      setSupplierName(supplier.nom);
      setSupplierAddress(supplier.adresse ?? "");
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    if (selectedSupplierId === supplierId) {
      setSelectedSupplierId("");
      setSupplierName("");
      setSupplierAddress("");
    }
  };

  const handleCreateOrder = async () => {
    setSubmitMessage(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: {
        fournisseur: string;
        supplierId?: string;
        items: Array<{ articleId: string; quantite: number }>;
      } = {
        fournisseur:
          supplierAddress.trim() && !selectedSupplierId
            ? `${supplierName.trim()} — ${supplierAddress.trim()}`
            : supplierName.trim(),
        items: selectedItems.map((item) => ({
          articleId: item.articleId,
          quantite: item.quantite,
        })),
      };

      if (selectedSupplierId) payload.supplierId = selectedSupplierId;

      const created = await api.createSupplierOrder(payload);

      setSubmitMessage("Commande fournisseur créée avec succès.");
      setOrders((prev) => [
        {
          id: created.id,
          fournisseur: created.fournisseur,
          supplierId: created.supplierId,
          supplier: created.supplier,
          statut: "en_cours",
          createdAt: created.createdAt,
          items: created.items,
        },
        ...prev,
      ]);
      resetSelection();
    } catch (err) {
      setSubmitMessage(
        err instanceof Error
          ? err.message
          : "Impossible de créer la commande fournisseur",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateOrderPdf = (order: SupplierOrder) => {
    const doc = new jsPDF();
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const supplierLabel = order.supplier?.nom || order.fournisseur || "Fournisseur";
    const supplierAdresse = order.supplier?.adresse || "";

    doc.setFontSize(16);
    doc.text("Bon de commande fournisseur", 105, 18, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Date : ${formattedDate}`, 14, 28);
    doc.text(`Fournisseur : ${supplierLabel}`, 14, 35);
    if (supplierAdresse) {
      doc.text(`Adresse : ${supplierAdresse}`, 14, 42);
    }
    if (order.statut === "en_cours") {
      doc.text("Statut : En attente de réception", 14, 49);
    } else {
      doc.text("Statut : Reçue", 14, 49);
    }

    doc.setFontSize(12);
    doc.text("Articles", 14, 60);
    let y = 65;
    order.items.forEach((item, index) => {
      const label = articles.find((a) => a.id === item.articleId)?.nom ?? "Article";
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${label}`, 14, y);
      doc.setFontSize(10);
      doc.text(`Quantité: ${item.quantite}`, 14, y + 6);
      doc.line(14, y + 8, 196, y + 8);
      y += 14;
    });

    const safeName = supplierLabel.replace(/\s+/g, "-").toLowerCase();
    doc.save(`bon-commande-${safeName}.pdf`);
  };

  /* ───────────── Commandes (édition / statut) ───────────── */

  const handleMarkReceived = async (orderId: string) => {
    if (!window.confirm("Êtes-vous sûr de valider la réception de cette commande ?")) {
      return;
    }
    try {
      const updated = await api.updateSupplierOrder(orderId, { statut: "recue" });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)),
      );
    } catch (err) {
      setOrdersError(
        err instanceof Error
          ? err.message
          : "Impossible de valider la commande",
      );
    }
  };

  const startEditingOrder = (order: SupplierOrder) => {
    setEditingOrderId(order.id);
    const next: Record<string, number> = {};
    order.items.forEach((item) => {
      next[item.articleId] = item.quantite;
    });
    setEditingItems(next);
    setSubmitMessage(null);
  };

  const handleSaveOrderEdit = async (order: SupplierOrder) => {
    const items = Object.entries(editingItems)
      .map(([articleId, quantite]) => ({ articleId, quantite }))
      .filter((item) => item.quantite > 0);

    if (items.length === 0) {
      setSubmitMessage("Une commande doit contenir au moins un article.");
      return;
    }

    try {
      const updated = await api.updateSupplierOrder(order.id, { items });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)),
      );
      setModifiedOrders((prev) => new Set(prev).add(order.id));
      setEditingOrderId(null);
      setEditingItems({});
      setSubmitMessage("Commande mise à jour.");
    } catch (err) {
      setOrdersError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier la commande",
      );
    }
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  /* ───────────── JSX ───────────── */

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Commandes fournisseurs"
        title="Préparer un bon de commande"
        description="Sélectionnez les articles du stock, renseignez le fournisseur, générez un PDF et suivez vos commandes en cours."
      />

      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Fournisseur
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {supplierName.trim() || "Aucun fournisseur sélectionné"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Articles sélectionnés
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {selectedItemsCount}
          </p>
          {selectedItemsCount > 0 ? (
            <p className="text-xs text-slate-500">
              {selectedTotalQuantity} unités au total
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Commandes en cours
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {inProgressOrders.length}
          </p>
        </div>
      </div>

      {/* Layout 2 colonnes : gauche (préparation), droite (suivi) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Colonne gauche : fournisseur + sélection articles */}
        <div className="space-y-6">
          {/* Fournisseur */}
          <Card className="border-slate-200">
            <CardHeader
              title="Fournisseur"
              subtitle="Nom et adresse figureront sur le bon de commande"
              action={
                isSuperAdmin ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Superadmin : créez la commande via un rôle établissement
                  </span>
                ) : null
              }
            />
            <div className="space-y-3 px-4 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-700">
                  <span className="font-semibold">Mes fournisseurs</span>
                  <select
                    className="rounded-full border border-slate-200 px-2.5 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                    value={selectedSupplierId}
                    onChange={(event) =>
                      handleSelectSupplier(event.target.value)
                    }
                    disabled={!canManageSupplierOrders || isSuperAdmin}
                  >
                    <option value="">Sélectionner...</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.nom}
                      </option>
                    ))}
                  </select>
                  {selectedSupplierId ? (
                    <button
                      type="button"
                      className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                      onClick={() => handleDeleteSupplier(selectedSupplierId)}
                      disabled={!canManageSupplierOrders || isSuperAdmin}
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
                {suppliersLoading ? (
                  <span className="text-xs text-slate-500">Chargement...</span>
                ) : suppliersError ? (
                  <span className="text-xs text-rose-600">
                    {suppliersError}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Nom du fournisseur
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                    placeholder="Ex : Fournitures Duport"
                    value={supplierName}
                    onChange={(event) => setSupplierName(event.target.value)}
                    disabled={!canManageSupplierOrders || isSuperAdmin}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Adresse du fournisseur
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                    placeholder="Adresse, code postal, ville"
                    value={supplierAddress}
                    onChange={(event) =>
                      setSupplierAddress(event.target.value)
                    }
                    disabled={!canManageSupplierOrders || isSuperAdmin}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
              className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 disabled:opacity-50"
              onClick={() => handleAddSupplier()}
              disabled={!canManageSupplierOrders || isSuperAdmin}
            >
              Enregistrer ce fournisseur
            </button>
          </div>

              <p className="text-xs text-slate-500">
                Les commandes sont disponibles pour les rôles{" "}
                <span className="font-semibold">admin</span> /{" "}
                <span className="font-semibold">responsable</span> reliés à un
                établissement.
              </p>
              {submitMessage ? (
                <p className="text-sm text-slate-700">{submitMessage}</p>
              ) : null}
            </div>
          </Card>

          {/* Articles du stock */}
          <Card>
            <CardHeader
              title="Articles du stock"
              subtitle="Choisissez les quantités à commander"
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="search"
                      placeholder="Rechercher un produit ou une référence"
                      className="w-64 rounded-full border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      onClick={resetSelection}
                    >
                      Effacer les quantités
                    </button>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                    onClick={handleCreateOrder}
                    disabled={!canSubmitOrders || submitting}
                  >
                    {submitting ? "Création..." : "Créer la commande fournisseur"}
                  </button>
                </div>
              }
            />
            {loading ? (
              <p className="px-4 pb-4 text-sm text-slate-500">
                Chargement des articles...
              </p>
            ) : error ? (
              <p className="px-4 pb-4 text-sm text-rose-600">{error}</p>
            ) : filteredArticles.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-slate-500">
                Aucun article trouvé.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                <div className="grid items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-[1.5fr_minmax(0,1fr)] sm:text-xs">
                  <div className="sm:flex sm:items-center sm:gap-2">
                    <span>Produit</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2 sm:grid-cols-4">
                    <span className="text-center">Référence</span>
                    <span className="text-center">Stock</span>
                    <span className="text-center">Qté à commander</span>
                    <span className="hidden text-right sm:block">Seuil</span>
                  </div>
                </div>
                {filteredArticles
                  .slice()
                  .sort((a, b) => a.nom.localeCompare(b.nom))
                  .map((article) => {
                    const quantityValue = quantities[article.id] ?? 0;
                    const inAlert = article.quantite <= article.seuilAlerte;
                    return (
                      <div
                        key={article.id}
                        className={cn(
                          "grid items-center gap-2 px-4 py-2 sm:grid-cols-[1.5fr_minmax(0,1fr)]",
                          inAlert && "bg-amber-50/60",
                        )}
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">
                            {article.nom}
                          </p>
                          {inAlert ? (
                            <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                              Niveau d&apos;alerte (stock : {article.quantite},
                              seuil : {article.seuilAlerte})
                            </span>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2 sm:grid-cols-4">
                          <span className="text-center text-slate-600">
                            {article.referenceFournisseur ?? "—"}
                          </span>
                          <span className="text-center font-semibold text-slate-900">
                            {article.quantite}
                          </span>
                          <input
                            type="number"
                            min={0}
                            className="w-full rounded-full border border-slate-200 px-2 py-1 text-center focus:border-emerald-500/70 focus:outline-none"
                            value={quantityValue}
                            onChange={(event) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [article.id]: Math.max(
                                  0,
                                  Number(event.target.value),
                                ),
                              }))
                            }
                          />
                          <span className="hidden text-right text-slate-600 sm:block">
                            {article.seuilAlerte}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </div>

        {/* Colonne droite : commandes */}
        <Card className="border-slate-200">
          <CardHeader
            title="Commandes fournisseurs"
            subtitle="En cours et historique"
          />
          {isSuperAdmin ? (
            <p className="px-4 pb-4 text-sm text-slate-500">
              Connectez-vous avec un rôle établissement (admin ou responsable)
              pour consulter les commandes.
            </p>
          ) : ordersLoading ? (
            <p className="px-4 pb-4 text-sm text-slate-500">
              Chargement des commandes...
            </p>
          ) : ordersError ? (
            <p className="px-4 pb-4 text-sm text-rose-600">{ordersError}</p>
          ) : (
            <div className="grid gap-4 px-4 pb-4">
              {/* En cours */}
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      En attente
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Commandes en cours
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    {inProgressOrders.length}
                  </span>
                </div>
                {inProgressOrders.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucune commande en cours.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {inProgressOrders.map((order) => (
                      <li
                        key={order.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900">
                              {order.fournisseur}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.items.length} article(s)
                              {order.createdAt
                                ? ` • ${new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {modifiedOrders.has(order.id) ? (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                Modifiée
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                              onClick={() => handleGenerateOrderPdf(order)}
                            >
                              Télécharger le bon
                            </button>
                            {editingOrderId === order.id ? (
                              <button
                                type="button"
                                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                                onClick={() => handleSaveOrderEdit(order)}
                              >
                                Sauver
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                                onClick={() => startEditingOrder(order)}
                              >
                                Modifier
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                              onClick={() => handleMarkReceived(order.id)}
                            >
                              Valider la réception
                            </button>
                          </div>
                        </div>

                        {editingOrderId === order.id ? (
                          <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-xs"
                              >
                                <span className="text-slate-700">
                                  {articles.find(
                                    (a) => a.id === item.articleId,
                                  )?.nom ?? "Article"}
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-16 rounded-full border border-slate-200 px-2 py-1 text-center focus:border-emerald-500/70 focus:outline-none"
                                  value={
                                    editingItems[item.articleId] ??
                                    item.quantite
                                  }
                                  onChange={(event) =>
                                    setEditingItems((prev) => ({
                                      ...prev,
                                      [item.articleId]: Number(
                                        event.target.value,
                                      ),
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                                  onClick={() =>
                                    setEditingItems((prev) => {
                                      const next = { ...prev };
                                      delete next[item.articleId];
                                      return next;
                                    })
                                  }
                                >
                                  Retirer
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          className="text-xs font-semibold text-emerald-700 underline"
                          onClick={() => toggleExpanded(order.id)}
                        >
                          {expandedOrders.includes(order.id)
                            ? "Masquer le détail"
                            : "Voir le détail"}
                        </button>
                        {expandedOrders.includes(order.id) ? (
                          <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                            {order.items.map((item) => {
                              const label =
                                articles.find(
                                  (a) => a.id === item.articleId,
                                )?.nom ?? "Article";
                              return (
                                <li key={item.id}>
                                  {label} — {item.quantite}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Historique */}
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Historique
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Commandes reçues
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    {receivedOrders.length}
                  </span>
                </div>
                {receivedOrders.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucune commande reçue.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {receivedOrders.map((order) => (
                      <li
                        key={order.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">
                            {order.fournisseur}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.items.length} article(s)
                            {order.updatedAt
                              ? ` • Reçue le ${new Date(
                                  order.updatedAt,
                                ).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {modifiedOrders.has(order.id) ? (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                              Modifiée avant validation
                            </span>
                          ) : null}
                          <button
                            type="button"
                            className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                            onClick={() => handleGenerateOrderPdf(order)}
                          >
                            Télécharger le bon
                          </button>
                          <button
                            type="button"
                            className="font-semibold text-emerald-700 underline"
                            onClick={() => toggleExpanded(order.id)}
                          >
                            {expandedOrders.includes(order.id)
                              ? "Masquer le détail"
                              : "Voir le détail"}
                          </button>
                        </div>
                        {expandedOrders.includes(order.id) ? (
                          <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                            {order.items.map((item) => {
                              const label =
                                articles.find(
                                  (a) => a.id === item.articleId,
                                )?.nom ?? "Article";
                              return (
                                <li key={item.id}>
                                  {label} — {item.quantite}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
