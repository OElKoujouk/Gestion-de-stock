"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

type Article = {
  id: string;
  nom: string;
  quantite: number;
  referenceFournisseur: string | null;
  seuilAlerte: number;
  categorieId?: string | null;
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

  /*  State base  */

  const [articles, setArticles] = useState<Article[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; nom: string }>>([]);

  const [supplierName, setSupplierName] = useState("");
  const [supplierAddressLine, setSupplierAddressLine] = useState("");
  const [supplierZip, setSupplierZip] = useState("");
  const [supplierCity, setSupplierCity] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductReference, setNewProductReference] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<Record<string, number>>({});
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [modifiedOrders, setModifiedOrders] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  /*  Fetch données  */

  useEffect(() => {
    if (!canManageSupplierOrders || isSuperAdmin || !selectedSupplierId) {
      setArticles([]);
      setCategories([]);
      setCatalogError(null);
      setQuantities({});
      setCatalogMessage(null);
      return;
    }

    setCatalogLoading(true);
    Promise.all([
      api.getArticles({ ownerId: selectedSupplierId }),
      api.getCategories({ ownerId: selectedSupplierId }),
    ])
      .then(([articlesData, categoriesData]) => {
        setArticles(articlesData);
        setCategories(categoriesData);
        setCatalogError(null);
      })
      .catch((err) =>
        setCatalogError(
          err instanceof Error
            ? err.message
            : "Impossible de charger le catalogue du fournisseur",
        ),
      )
      .finally(() => setCatalogLoading(false));
  }, [canManageSupplierOrders, isSuperAdmin, selectedSupplierId]);

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

  /*  Dérivés / mémo  */

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesQuery =
        !query ||
        article.nom.toLowerCase().includes(query) ||
        (article.referenceFournisseur ?? "").toLowerCase().includes(query);
      const matchesCategory =
        !selectedCategoryId ||
        (selectedCategoryId === "none" && !article.categorieId) ||
        article.categorieId === selectedCategoryId;
      return matchesQuery && matchesCategory;
    });
  }, [articles, search, selectedCategoryId]);

  const categoryName = useCallback(
    (categoryId: string | null | undefined) => {
      if (!categoryId) return "Sans catégorie";
      const found = categories.find((c) => c.id === categoryId);
      return found?.nom ?? "Catégorie";
    },
    [categories],
  );

  const articlesByCategory = useMemo(() => {
    const groups = new Map<string, Article[]>();
    filteredArticles.forEach((article) => {
      const catId = article.categorieId ?? "none";
      if (!groups.has(catId)) groups.set(catId, []);
      groups.get(catId)!.push(article);
    });
    return Array.from(groups.entries()).map(([catId, list]) => ({
      id: catId,
      label: categoryName(catId === "none" ? null : catId),
      items: list,
    }));
  }, [filteredArticles, categoryName]);

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

  /*  Helpers formulaire  */

  const buildAddressText = (addressLine: string, zip: string, city: string) => {
    const zipCity = [zip.trim(), city.trim()].filter(Boolean).join(" ");
    return [addressLine.trim(), zipCity].filter(Boolean).join(" · ");
  };

  const parseAddressText = (value: string | null | undefined) => {
    const raw = (value ?? "").trim();
    if (!raw) return { address: "", zip: "", city: "" };
    const [line, zipCity] = raw.split("·").map((part) => part.trim());
    if (!zipCity) return { address: line ?? "", zip: "", city: "" };
    const [zip, ...cityParts] = zipCity.split(/\s+/);
    return { address: line ?? "", zip: zip ?? "", city: cityParts.join(" ").trim() };
  };

  const handleCreateSupplierCategory = () => {
    if (!selectedSupplierId || !newCategoryName.trim()) return;
    setCatalogMessage(null);
    api
      .createCategory({ nom: newCategoryName.trim(), ownerId: selectedSupplierId })
      .then((created) => {
        setCategories((prev) => [created, ...prev]);
        setNewCategoryName("");
        setCatalogMessage("Catégorie ajoutée au catalogue du fournisseur.");
      })
      .catch((err) =>
        setCatalogMessage(
          err instanceof Error
            ? err.message
            : "Impossible d'ajouter la catégorie pour ce fournisseur",
        ),
      );
  };

  const handleCreateSupplierArticle = () => {
    if (!selectedSupplierId || !newProductName.trim()) return;
    setCatalogMessage(null);
    api
      .createArticle({
        nom: newProductName.trim(),
        referenceFournisseur: newProductReference.trim(),
        categorieId: newProductCategoryId || null,
        quantite: 0,
        seuilAlerte: 0,
        ownerId: selectedSupplierId,
      })
      .then((created) => {
        setArticles((prev) => [created, ...prev]);
        setNewProductName("");
        setNewProductReference("");
        setNewProductCategoryId("");
        setCatalogMessage("Produit ajouté au stock du fournisseur.");
      })
      .catch((err) =>
        setCatalogMessage(
          err instanceof Error
            ? err.message
            : "Impossible d'ajouter le produit pour ce fournisseur",
        ),
      );
  };

  const handleDeleteSupplierArticle = async (articleId: string, articleName: string) => {
    if (!selectedSupplierId) return;
    if (!window.confirm(`Supprimer la référence « ${articleName} » de ce fournisseur ?`)) return;
    setCatalogMessage(null);
    try {
      await api.deleteArticle(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setQuantities((prev) => {
        const next = { ...prev };
        delete next[articleId];
        return next;
      });
      setCatalogMessage("Référence supprimée du catalogue du fournisseur.");
    } catch (err) {
      setCatalogMessage(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer cette référence fournisseur",
      );
    }
  };

  const handleDeleteSupplierCategory = async (categoryId: string, categoryName: string) => {
    if (!selectedSupplierId || categoryId === "none") return;
    if (!window.confirm(`Supprimer la catégorie « ${categoryName} » et replacer ses références en “Sans catégorie” ?`))
      return;
    setCatalogMessage(null);
    try {
      await api.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setArticles((prev) =>
        prev.map((a) => (a.categorieId === categoryId ? { ...a, categorieId: null } : a)),
      );
      if (selectedCategoryId === categoryId) setSelectedCategoryId("");
      setCatalogMessage("Catégorie supprimée. Références déplacées en “Sans catégorie”.");
    } catch (err) {
      setCatalogMessage(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer cette catégorie fournisseur",
      );
    }
  };

  const validateForm = () => {
    if (!supplierName.trim()) {
      setSubmitMessage("Le nom du fournisseur est requis.");
      return false;
    }
    if (!selectedSupplierId) {
      setSubmitMessage("Choisissez un fournisseur pour passer commande.");
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

    const addressText = buildAddressText(
      supplierAddressLine,
      supplierZip,
      supplierCity,
    );
    const normalizedName = supplierName.trim().toLowerCase();
    const normalizedAddress = addressText.trim().toLowerCase();

    const existing = suppliers.find(
      (s) =>
        s.nom.trim().toLowerCase() === normalizedName ||
        (normalizedAddress && (s.adresse ?? "").trim().toLowerCase() === normalizedAddress),
    );
    if (existing) {
      setSelectedSupplierId(existing.id);
      setSubmitMessage("Fournisseur déjà enregistré, sélection mise à jour.");
      const parsed = parseAddressText(existing.adresse);
      setSupplierAddressLine(parsed.address);
      setSupplierZip(parsed.zip);
      setSupplierCity(parsed.city);
      return;
    }

    const profile: SupplierProfile = {
      id: "",
      nom: supplierName.trim(),
      adresse: addressText,
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
      const parsed = parseAddressText(supplier.adresse);
      setSupplierAddressLine(parsed.address);
      setSupplierZip(parsed.zip);
      setSupplierCity(parsed.city);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!supplierId) return;
    if (!window.confirm("Supprimer définitivement ce fournisseur ?")) return;
    setSubmitMessage(null);
    try {
      await api.deleteSupplier(supplierId);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
      if (selectedSupplierId === supplierId) {
        setSelectedSupplierId("");
        setSupplierName("");
        setSupplierAddressLine("");
        setSupplierZip("");
        setSupplierCity("");
        setArticles([]);
        setCategories([]);
        setQuantities({});
        setCatalogMessage(null);
      }
      setSubmitMessage("Fournisseur supprimé.");
    } catch (err) {
      setSubmitMessage(
        err instanceof Error ? err.message : "Impossible de supprimer ce fournisseur",
      );
    }
  };

  const handleUpdateSupplier = () => {
    if (!selectedSupplierId) {
      setSubmitMessage("Sélectionnez un fournisseur à modifier.");
      return;
    }
    if (!supplierName.trim()) {
      setSubmitMessage("Nom du fournisseur requis.");
      return;
    }
    const normalizedName = supplierName.trim().toLowerCase();
    const normalizedAddress = buildAddressText(
      supplierAddressLine,
      supplierZip,
      supplierCity,
    )
      .trim()
      .toLowerCase();
    const duplicate = suppliers.find(
      (s) =>
        s.id !== selectedSupplierId &&
        (s.nom.trim().toLowerCase() === normalizedName ||
          (normalizedAddress && (s.adresse ?? "").trim().toLowerCase() === normalizedAddress)),
    );
    if (duplicate) {
      setSubmitMessage("Un fournisseur avec le même nom ou la même adresse existe déjà.");
      return;
    }
    const addressText = buildAddressText(
      supplierAddressLine,
      supplierZip,
      supplierCity,
    );
    api
      .updateSupplier(selectedSupplierId, {
        nom: supplierName.trim(),
        adresse: addressText || null,
      })
      .then((updated) => {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === updated.id ? { ...updated, adresse: addressText } : s,
          ),
        );
        setSubmitMessage("Fournisseur mis à jour.");
      })
      .catch((err) => {
        setSubmitMessage(err instanceof Error ? err.message : "Impossible de mettre à jour le fournisseur");
      });
  };

  const handleCreateOrder = async () => {
    setSubmitMessage(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const addressText = buildAddressText(
        supplierAddressLine,
        supplierZip,
        supplierCity,
      );
      const payload: {
        fournisseur: string;
        supplierId?: string;
        items: Array<{ articleId: string; quantite: number }>;
      } = {
        fournisseur:
          addressText.trim() && !selectedSupplierId
            ? `${supplierName.trim()} - ${addressText.trim()}`
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
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const M = 40; // marge
  const headerH = 72;
  const footerH = 36;

  const fontMain = "helvetica";

  const formatDate = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString("fr-FR");
  };

  const safeText = (v: unknown) => (v ?? "").toString();

  const supplierLabel = order.supplier?.nom || order.fournisseur || "Fournisseur";
  const supplierAddress =
    order.supplier?.adresse ||
    (() => {
      const parts = safeText(order.fournisseur).split(" - ");
      return parts.length > 1 ? parts.slice(1).join(" - ").trim() : "";
    })();

  const statusLabel = order.statut === "en_cours" ? "En attente de réception" : "Reçue";

  const rows = order.items.map((it, idx) => {
    const art = articles.find((a) => a.id === it.articleId);
    return {
      idx: String(idx + 1),
      nom: art?.nom ?? "Article",
      ref: art?.referenceFournisseur ?? "—",
      qty: String(it.quantite),
    };
  });

  const totalQty = order.items.reduce((sum, it) => sum + (Number(it.quantite) || 0), 0);

  const drawHeader = () => {
    // bandeau
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, headerH, "F");

    doc.setFont(fontMain, "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Bon de commande fournisseur", M, 42);

    doc.setFont(fontMain, "normal");
    doc.setFontSize(10);
    doc.text(`Date : ${formatDate(order.createdAt)}`, pageW - M, 28, { align: "right" });
    doc.text(`Statut : ${statusLabel}`, pageW - M, 44, { align: "right" });

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

  const drawSupplierBlock = (startY: number) => {
    const boxY = startY;
    const boxW = pageW - M * 2;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(M, boxY, boxW, 86, 10, 10, "FD");

    doc.setFont(fontMain, "bold");
    doc.setFontSize(11);
    doc.text("Fournisseur", M + 14, boxY + 22);

    doc.setFont(fontMain, "normal");
    doc.setFontSize(10);

    const supplierLines = doc.splitTextToSize(supplierLabel, boxW - 28);
    doc.text(supplierLines, M + 14, boxY + 40);

    if (supplierAddress) {
      const addrLines = doc.splitTextToSize(`Adresse : ${supplierAddress}`, boxW - 28);
      doc.setTextColor(71, 85, 105);
      doc.text(addrLines, M + 14, boxY + 58);
      doc.setTextColor(15, 23, 42);
    }

    return boxY + 86 + 16;
  };

  const col = {
    idx: { x: M, w: 34 },
    nom: { x: M + 34, w: 300 },
    ref: { x: M + 34 + 300, w: 140 },
    qty: { x: M + 34 + 300 + 140, w: pageW - M - (M + 34 + 300 + 140) },
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
    doc.text("Référence", col.ref.x + 10, y + 18);
    doc.text("Qté", col.qty.x + col.qty.w - 10, y + 18, { align: "right" });

    doc.setTextColor(15, 23, 42);
    doc.setFont(fontMain, "normal");
  };

  const lineH = 14;

  const drawRow = (y: number, r: { idx: string; nom: string; ref: string; qty: string }, zebra: boolean) => {
    const nomLines = doc.splitTextToSize(r.nom, col.nom.w - 20);
    const refLines = doc.splitTextToSize(r.ref, col.ref.w - 20);

    const rowLines = Math.max(nomLines.length, refLines.length, 1);
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
    doc.text(refLines, col.ref.x + 10, y + 18);
    doc.setTextColor(15, 23, 42);

    doc.setFont(fontMain, "bold");
    doc.text(r.qty, col.qty.x + col.qty.w - 10, y + 18, { align: "right" });
    doc.setFont(fontMain, "normal");

    return rowH;
  };

  const drawTotalsAndSign = (y: number) => {
    const boxW = pageW - M * 2;

    // Totaux
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(M, y, boxW, 54, 10, 10, "FD");

    doc.setFont(fontMain, "bold");
    doc.setFontSize(11);
    doc.text("Récapitulatif", M + 14, y + 22);

    doc.setFont(fontMain, "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nombre d'articles : ${rows.length}`, M + 14, y + 40);
    doc.text(`Quantité totale : ${totalQty}`, pageW - M - 14, y + 40, { align: "right" });
    doc.setTextColor(15, 23, 42);

    // Signatures
    const sY = y + 54 + 18;
    const half = (boxW - 16) / 2;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, sY, half, 70, 10, 10, "FD");
    doc.roundedRect(M + half + 16, sY, half, 70, 10, 10, "FD");

    doc.setFont(fontMain, "bold");
    doc.setFontSize(10);
    doc.text("Signature fournisseur", M + 14, sY + 20);
    doc.text("Signature réception", M + half + 16 + 14, sY + 20);

    doc.setFont(fontMain, "normal");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text("Nom + cachet", M + 14, sY + 38);
    doc.text("Nom + date", M + half + 16 + 14, sY + 38);
    doc.setTextColor(15, 23, 42);

    return sY + 70;
  };

  // ── Construction pages
  drawHeader();

  let y = headerH + 18;
  y = drawSupplierBlock(y);

  drawTableHeader(y);
  y += 28;

  rows.forEach((r, i) => {
    // si dépassement : nouvelle page + header + table header
    const previewNomLines = doc.splitTextToSize(r.nom, col.nom.w - 20);
    const previewRefLines = doc.splitTextToSize(r.ref, col.ref.w - 20);
    const rowLines = Math.max(previewNomLines.length, previewRefLines.length, 1);
    const rowH = Math.max(26, rowLines * lineH + 12);

    if (y + rowH > pageH - footerH - 140) {
      doc.addPage();
      drawHeader();
      y = headerH + 18;
      drawTableHeader(y);
      y += 28;
    }

    const usedH = drawRow(y, r, i % 2 === 1);
    y += usedH;
  });

  // Totaux + signatures (si pas la place : nouvelle page)
  if (y + 170 > pageH - footerH - 10) {
    doc.addPage();
    drawHeader();
    y = headerH + 18;
  }
  drawTotalsAndSign(y + 14);

  // Pied de page avec pagination (après génération)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    drawFooter(p, totalPages);
  }

  const safeName = supplierLabel.replace(/\s+/g, "-").replace(/[^\w-]/g, "").toLowerCase();
  doc.save(`bon-commande-${safeName || "fournisseur"}.pdf`);
};


  /*  Commandes (édition / statut)  */

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

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Supprimer définitivement cette commande fournisseur ?")) {
      return;
    }
    try {
      await api.deleteSupplierOrder(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Impossible de supprimer la commande",
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

  /*  JSX  */

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Commandes fournisseurs"
        title="Préparer un bon de commande"
        description="Chaque fournisseur a son catalogue dédié : références, catégories et quantités à commander. Préparez vos bons sans afficher les stocks internes."
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
                    disabled={!canManageSupplierOrders}
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
                      disabled={!canManageSupplierOrders}
                    >
                      Supprimer
                    </button>
                  ) : null}
                  {selectedSupplierId ? (
                    <button
                      type="button"
                      className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                      onClick={handleUpdateSupplier}
                      disabled={!canManageSupplierOrders}
                    >
                      Mettre à jour
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
                    disabled={!canManageSupplierOrders}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Adresse
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                      placeholder="12 rue des Fleurs"
                      value={supplierAddressLine}
                      onChange={(event) => setSupplierAddressLine(event.target.value)}
                      disabled={!canManageSupplierOrders}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Code postal
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                      placeholder="75000"
                      value={supplierZip}
                      onChange={(event) => setSupplierZip(event.target.value)}
                      disabled={!canManageSupplierOrders}
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-slate-700">
                  Ville
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                    placeholder="Paris"
                    value={supplierCity}
                    onChange={(event) => setSupplierCity(event.target.value)}
                    disabled={!canManageSupplierOrders}
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

          <Card>
            <CardHeader
              title="Catalogue du fournisseur"
              subtitle="Stock dédié, catégories et références spécifiques"
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="search"
                      placeholder="Rechercher une référence"
                      className="w-64 rounded-full border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <select
                      className="w-56 rounded-full border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-500/70 focus:outline-none"
                      value={selectedCategoryId}
                      onChange={(event) => setSelectedCategoryId(event.target.value)}
                    >
                      <option value="">Toutes les catégories</option>
                      <option value="none">Sans catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom}
                        </option>
                      ))}
                    </select>
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
                    disabled={!canSubmitOrders || submitting || !selectedSupplierId}
                  >
                    {submitting ? "Création..." : "Créer la commande fournisseur"}
                  </button>
                </div>
              }
            />
            {!selectedSupplierId ? (
              <p className="px-4 pb-4 text-sm text-slate-500">
                Sélectionnez un fournisseur pour accéder à son catalogue dédié.
              </p>
            ) : catalogLoading ? (
              <p className="px-4 pb-4 text-sm text-slate-500">
                Chargement du catalogue fournisseur...
              </p>
            ) : catalogError ? (
              <p className="px-4 pb-4 text-sm text-rose-600">{catalogError}</p>
            ) : filteredArticles.length === 0 ? (
              <div className="space-y-3 px-4 pb-4">
                <p className="text-sm text-slate-500">
                  Aucun article pour ce fournisseur. Ajoutez une catégorie puis des références.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Nouvelle catégorie</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        placeholder="Ex : Consommables"
                        disabled={!canSubmitOrders}
                      />
                      <button
                        type="button"
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        onClick={handleCreateSupplierCategory}
                        disabled={!canSubmitOrders || !newCategoryName.trim()}
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Nouvelle référence</p>
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={newProductName}
                        onChange={(event) => setNewProductName(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        placeholder="Nom du produit"
                        disabled={!canSubmitOrders}
                      />
                      <input
                        type="text"
                        value={newProductReference}
                        onChange={(event) => setNewProductReference(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        placeholder="Référence fournisseur"
                        disabled={!canSubmitOrders}
                      />
                      <select
                        value={newProductCategoryId}
                        onChange={(event) => setNewProductCategoryId(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        disabled={!canSubmitOrders}
                      >
                        <option value="">Sans catégorie</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nom}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        onClick={handleCreateSupplierArticle}
                        disabled={!canSubmitOrders || !newProductName.trim()}
                      >
                        Enregistrer la référence
                      </button>
                    </div>
                  </div>
                </div>
                {catalogMessage ? <p className="text-sm text-slate-700">{catalogMessage}</p> : null}
              </div>
            ) : (
              <div className="space-y-4 px-4 pb-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Nouvelle catégorie</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        placeholder="Ex : Consommables"
                        disabled={!canSubmitOrders}
                      />
                      <button
                        type="button"
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        onClick={handleCreateSupplierCategory}
                        disabled={!canSubmitOrders || !newCategoryName.trim()}
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Nouvelle référence</p>
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={newProductName}
                        onChange={(event) => setNewProductName(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        placeholder="Nom du produit"
                        disabled={!canSubmitOrders}
                      />
                      <input
                        type="text"
                        value={newProductReference}
                        onChange={(event) => setNewProductReference(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        placeholder="Référence fournisseur"
                        disabled={!canSubmitOrders}
                      />
                      <select
                        value={newProductCategoryId}
                        onChange={(event) => setNewProductCategoryId(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500/70 focus:outline-none"
                        disabled={!canSubmitOrders}
                      >
                        <option value="">Sans catégorie</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nom}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        onClick={handleCreateSupplierArticle}
                        disabled={!canSubmitOrders || !newProductName.trim()}
                      >
                        Enregistrer la référence
                      </button>
                    </div>
                  </div>
                </div>
                {catalogMessage ? <p className="text-sm text-slate-700">{catalogMessage}</p> : null}

                {articlesByCategory.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-slate-200 bg-white/60">
                    <div className="flex items-center justify-between px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{group.items.length} référence(s)</span>
                        {group.id !== "none" ? (
                          <button
                            type="button"
                            className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                            onClick={() => handleDeleteSupplierCategory(group.id, group.label)}
                          >
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 text-sm">
                      <div className="grid items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-[1.5fr_minmax(0,1fr)] sm:text-xs">
                        <div className="sm:flex sm:items-center sm:gap-2">
                          <span>Produit</span>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-3">
                          <span className="text-center">Référence</span>
                          <span className="text-center">Qté à commander</span>
                          <span className="hidden text-right sm:block">Actions</span>
                        </div>
                      </div>
                      {group.items
                        .slice()
                        .sort((a, b) => a.nom.localeCompare(b.nom))
                        .map((article) => {
                          const quantityValue = quantities[article.id] ?? 0;
                          return (
                            <div
                              key={article.id}
                              className="grid items-center gap-2 px-4 py-2 sm:grid-cols-[1.5fr_minmax(0,1fr)]"
                            >
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900">
                                  {article.nom}
                                </p>
                                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                  Référence dédiée au fournisseur
                                </span>
                              </div>
                              <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-3">
                                <span className="text-center text-slate-600">
                                  {article.referenceFournisseur ?? " - "}
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
                                <button
                                  type="button"
                                  className="hidden rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 sm:block"
                                  onClick={() => handleDeleteSupplierArticle(article.id, article.nom)}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
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
                                ? `  •  ${new Date(
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
                            <button
                              type="button"
                              className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              Supprimer
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
                            {order.items.map((item) => {
                              const linked = articles.find((a) => a.id === item.articleId);
                              const label = linked?.nom ?? "Article";
                              const ref = linked?.referenceFournisseur ?? "—";
                              return (
                                <div
                                  key={item.id}
                                  className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-xs"
                                >
                                  <span className="text-slate-700">
                                    {label} (réf. {ref})
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
                              );
                            })}
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
                              const linkedArticle = articles.find(
                                (a) => a.id === item.articleId,
                              );
                              const label = linkedArticle?.nom ?? "Article";
                              const ref = linkedArticle?.referenceFournisseur ?? "—";
                              return (
                                <li key={item.id}>
                                  {label} • Réf. {ref} • Qté {item.quantite}
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
                              ? `  •  Reçue le ${new Date(
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
                              const linkedArticle = articles.find(
                                (a) => a.id === item.articleId,
                              );
                              const label = linkedArticle?.nom ?? "Article";
                              const ref = linkedArticle?.referenceFournisseur ?? "—";
                              return (
                                <li key={item.id}>
                                  {label} • Réf. {ref} • Qté {item.quantite}
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
