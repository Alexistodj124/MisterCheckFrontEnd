import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInventory } from "../store/inventoryStore";
import { useClients } from "../store/clientStore";
import { useQuotes } from "../store/quoteStore";
import { usePermissions } from "../auth/PermissionsProvider";
import "./CotizacionNueva.css";

const DEFAULT_TEMPLATE = {
  name: "Plantilla base",
  headerTitle: "Proyectos y Multiservicios.",
  headerSubtitle: "Mister Check",
  accentColor: "#F58220",
  introText: "Por este medio le compartimos la propuesta economica de los servicios solicitados.",
  columns: [
    { key: "code", label: "Codigo", enabled: true },
    { key: "description", label: "Descripcion", enabled: true },
    { key: "unit", label: "Unidad", enabled: true },
    { key: "quantity", label: "Cantidad", enabled: true },
    { key: "unitPrice", label: "Precio unitario", enabled: true },
    { key: "total", label: "Total", enabled: true },
  ],
  terms: [
    "Forma de pago: Transferencia, efectivo o cheque de caja.",
    "Todo trabajo adicional se cotizara por separado para aprobacion previa.",
  ],
  footerEmail: "mistercheckguatemala@gmail.com",
  footerWhatsApp: "4748 8744",
  footerNote: "Cotizacion generada desde Mister Check.",
  closingName: "Carlos Solorzano",
  closingTitle: "Gerente de Proyectos",
};

function createId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.00";
  return num.toFixed(2);
}

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeCostRow(product) {
  return {
    id: createId("cost"),
    productId: product?.id || "",
    name: product?.name || "",
    unitCost: String(product?.cost ?? "0"),
    qty: "1",
  };
}

function makeLine() {
  return {
    id: createId("line"),
    code: "",
    title: "",
    description: "",
    unit: "",
    quantity: "1",
    unitPrice: "0",
  };
}

function makeSection() {
  return {
    id: createId("section"),
    title: "Nueva seccion",
    subtitle: "",
    showTotal: true,
    lines: [makeLine()],
  };
}

function totalLine(line) {
  const quantity = Number(line?.quantity) || 0;
  const unitPrice = Number(line?.unitPrice) || 0;
  return quantity * unitPrice;
}

function blankQuoteState(template) {
  return {
    clientName: "",
    projectDesc: "",
    attention: "",
    projectName: "",
    location: "Guatemala",
    quoteDate: todayIso(),
    deliveryDays: "7",
    taxRate: "12",
    showTax: true,
    internalNotes: "",
    costRows: [],
    sections: [makeSection()],
    templateId: "",
    templateDraft: clone(template || DEFAULT_TEMPLATE),
  };
}

function hydrateCostRows(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item) => ({
    id: createId("cost"),
    productId: item.productId || "",
    name: item.name || "",
    unitCost: String(item.unitCost ?? 0),
    qty: String(item.qty ?? 1),
  }));
}

function hydrateSections(presentation) {
  if (!Array.isArray(presentation) || presentation.length === 0) return [makeSection()];
  return presentation.map((section) => ({
    id: section.id || createId("section"),
    title: section.title || "Nueva seccion",
    subtitle: section.subtitle || "",
    showTotal: section.showTotal !== false,
    lines:
      Array.isArray(section.lines) && section.lines.length > 0
        ? section.lines.map((line) => ({
            id: line.id || createId("line"),
            code: line.code || "",
            title: line.title || "",
            description: line.description || "",
            unit: line.unit || "",
            quantity: String(line.quantity ?? 1),
            unitPrice: String(line.unitPrice ?? 0),
          }))
        : [makeLine()],
  }));
}

function ProductPickerModal({
  open,
  products,
  categories,
  selectedCategory,
  query,
  onCategoryChange,
  onQueryChange,
  onSelect,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pickerOverlay" role="presentation" onClick={onClose}>
      <div
        className="pickerModal"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar producto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pickerTop">
          <div>
            <div className="pickerTitle">Agregar material desde inventario</div>
            <p className="pickerSubtitle">Filtra por categoria, nombre o SKU.</p>
          </div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Cerrar">
            X
          </button>
        </div>

        <div className="pickerControls">
          <label className="field">
            <span className="fieldLabel">Categoria</span>
            <select
              className="fieldInput"
              value={selectedCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "Todas" : category}
                </option>
              ))}
            </select>
          </label>

          <label className="field pickerSearch">
            <span className="fieldLabel">Buscar</span>
            <input
              className="fieldInput"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Nombre, SKU o categoria"
              inputMode="search"
              autoFocus
            />
          </label>
        </div>

        <div className="pickerResults" aria-label="Resultados de productos">
          {products.length === 0 ? (
            <div className="empty pickerEmpty">No hay productos que coincidan.</div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="pickerItem"
                onClick={() => onSelect(product)}
              >
                <div className="pickerItemMain">
                  <span className="pickerItemName">{product.name}</span>
                  <span className="pickerItemMeta">SKU: {product.sku || "-"}</span>
                </div>
                <div className="pickerItemSide">
                  <span className="pickerItemCategory">{product.category || "Sin categoria"}</span>
                  <span className="pickerItemCost">Q {toMoney(product.cost)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function CotizacionNueva() {
  const navigate = useNavigate();
  const { quoteId } = useParams();
  const isEditing = Boolean(quoteId);
  const { can } = usePermissions();
  const canSaveQuote = isEditing ? can("quotes:update") : can("quotes:create");

  const { products } = useInventory();
  const { clients, addClient } = useClients();
  const {
    templates,
    addQuote,
    getQuote,
    updateQuote,
    createTemplate,
    updateTemplate,
    downloadQuotePdf,
  } = useQuotes();

  const [form, setForm] = useState(() => blankQuoteState(DEFAULT_TEMPLATE));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCategory, setPickerCategory] = useState("all");
  const [pickerQuery, setPickerQuery] = useState("");

  const clientByName = useMemo(() => {
    const map = new Map();
    clients.forEach((client) => map.set(normalize(client.name), client));
    return map;
  }, [clients]);

  const categories = useMemo(() => {
    const set = new Set(products.map((product) => product.category).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = normalize(pickerQuery);
    return products
      .filter((product) => (pickerCategory === "all" ? true : product.category === pickerCategory))
      .filter((product) => {
        if (!query) return true;
        return normalize(`${product.name} ${product.sku} ${product.category}`).includes(query);
      });
  }, [products, pickerCategory, pickerQuery]);

  useEffect(() => {
    if (isEditing) return;
    if (form.templateId || templates.length === 0) return;
    const defaultTemplate = templates.find((template) => template.isDefault) || templates[0];
    if (!defaultTemplate) return;
    setForm((prev) => ({
      ...prev,
      templateId: defaultTemplate.id,
      templateDraft: clone(defaultTemplate),
    }));
  }, [templates, isEditing, form.templateId]);

  useEffect(() => {
    if (!isEditing || !quoteId) return;
    let active = true;
    setLoadingQuote(true);
    setError("");
    getQuote(quoteId)
      .then((quote) => {
        if (!active || !quote) return;
        setForm({
          clientName: quote.clientName || "",
          projectDesc: quote.projectDesc || "",
          attention: quote.attention || "",
          projectName: quote.projectName || "",
          location: quote.location || "Guatemala",
          quoteDate: quote.quoteDate || todayIso(),
          deliveryDays: String(quote.deliveryDays ?? 7),
          taxRate: String(quote.taxRate ?? 12),
          showTax: quote.showTax !== false,
          internalNotes: quote.internalNotes || "",
          costRows: hydrateCostRows(quote.items),
          sections: hydrateSections(quote.presentation),
          templateId: quote.templateId || "",
          templateDraft: clone(quote.templateSnapshot || DEFAULT_TEMPLATE),
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(String(err?.message || "No se pudo cargar la cotizacion."));
      })
      .finally(() => {
        if (active) setLoadingQuote(false);
      });
    return () => {
      active = false;
    };
  }, [getQuote, isEditing, quoteId]);

  const internalTotal = useMemo(() => {
    return form.costRows.reduce((sum, row) => {
      const qty = Number(row.qty) || 0;
      const unitCost = Number(row.unitCost) || 0;
      return sum + qty * unitCost;
    }, 0);
  }, [form.costRows]);

  const clientSubtotal = useMemo(() => {
    return form.sections.reduce(
      (sum, section) =>
        sum + section.lines.reduce((lineSum, line) => lineSum + totalLine(line), 0),
      0
    );
  }, [form.sections]);

  const taxAmount = useMemo(() => {
    const rate = Number(form.taxRate) || 0;
    return form.showTax ? clientSubtotal * (rate / 100) : 0;
  }, [clientSubtotal, form.taxRate, form.showTax]);

  const grandTotal = useMemo(() => clientSubtotal + taxAmount, [clientSubtotal, taxAmount]);
  const marginEstimate = useMemo(() => grandTotal - internalTotal, [grandTotal, internalTotal]);

  const updateField = (key, value) => {
    setSuccess("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateCostRow = (rowId, patch) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      costRows: prev.costRows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));
  };

  const removeCostRow = (rowId) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      costRows: prev.costRows.filter((row) => row.id !== rowId),
    }));
  };

  const addManualCostRow = () => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      costRows: [...prev.costRows, makeCostRow()],
    }));
  };

  const addProductRow = (product) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      costRows: [...prev.costRows, makeCostRow(product)],
    }));
    setPickerOpen(false);
  };

  const updateSection = (sectionId, patch) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    }));
  };

  const removeSection = (sectionId) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  };

  const addSection = () => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, makeSection()],
    }));
  };

  const addLine = (sectionId) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? { ...section, lines: [...section.lines, makeLine()] }
          : section
      ),
    }));
  };

  const updateLine = (sectionId, lineId, patch) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lines: section.lines.map((line) =>
                line.id === lineId ? { ...line, ...patch } : line
              ),
            }
          : section
      ),
    }));
  };

  const removeLine = (sectionId, lineId) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lines: section.lines.filter((line) => line.id !== lineId),
            }
          : section
      ),
    }));
  };

  const updateTemplateField = (key, value) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      templateDraft: { ...prev.templateDraft, [key]: value },
    }));
  };

  const updateTemplateColumn = (key, patch) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      templateDraft: {
        ...prev.templateDraft,
        columns: (prev.templateDraft.columns || []).map((column) =>
          column.key === key ? { ...column, ...patch } : column
        ),
      },
    }));
  };

  const updateTemplateTerm = (index, value) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      templateDraft: {
        ...prev.templateDraft,
        terms: (prev.templateDraft.terms || []).map((term, termIndex) =>
          termIndex === index ? value : term
        ),
      },
    }));
  };

  const addTemplateTerm = () => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      templateDraft: {
        ...prev.templateDraft,
        terms: [...(prev.templateDraft.terms || []), ""],
      },
    }));
  };

  const removeTemplateTerm = (index) => {
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      templateDraft: {
        ...prev.templateDraft,
        terms: (prev.templateDraft.terms || []).filter((_, termIndex) => termIndex !== index),
      },
    }));
  };

  const handleTemplateSelection = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      templateId,
      templateDraft: clone(template),
    }));
  };

  const saveClientIfNeeded = async () => {
    const normalizedName = normalize(form.clientName);
    if (!normalizedName) return null;
    const existing = clientByName.get(normalizedName);
    if (existing) return existing;
    return addClient(form.clientName);
  };

  const buildPayload = (selectedClient) => {
    const clientName = form.clientName.trim();
    const projectDesc = form.projectDesc.trim();
    const deliveryDays = Number(form.deliveryDays);
    const taxRate = Number(form.taxRate);
    const cleanedSections = form.sections
      .map((section) => ({
        id: section.id,
        title: String(section.title || "").trim(),
        subtitle: String(section.subtitle || "").trim(),
        showTotal: section.showTotal !== false,
        lines: section.lines
          .map((line) => ({
            id: line.id,
            code: String(line.code || "").trim(),
            title: String(line.title || "").trim(),
            description: String(line.description || "").trim(),
            unit: String(line.unit || "").trim(),
            quantity: Number(line.quantity) || 0,
            unitPrice: Number(line.unitPrice) || 0,
          }))
          .filter((line) => line.title || line.description),
      }))
      .filter((section) => section.title || section.lines.length > 0);

    if (!clientName) throw new Error("Selecciona o escribe un cliente.");
    if (!projectDesc) throw new Error("Agrega una descripcion general del proyecto.");
    if (!Number.isFinite(deliveryDays) || deliveryDays <= 0) {
      throw new Error("El tiempo de entrega es invalido.");
    }
    if (!Number.isFinite(taxRate) || taxRate < 0) {
      throw new Error("El IVA es invalido.");
    }
    if (cleanedSections.length === 0 || cleanedSections.every((section) => section.lines.length === 0)) {
      throw new Error("Agrega al menos una linea visible para el cliente.");
    }

    const items = form.costRows
      .map((row) => ({
        productId: row.productId || null,
        name: String(row.name || "").trim(),
        unitCost: Number(row.unitCost) || 0,
        qty: Number(row.qty) || 0,
      }))
      .filter((row) => row.name && row.qty > 0);

    const matchedClient = selectedClient || clientByName.get(normalize(clientName));

    return {
      clientId: matchedClient?.id || null,
      clientName,
      attention: String(form.attention || "").trim(),
      projectName: String(form.projectName || "").trim(),
      location: String(form.location || "").trim(),
      quoteDate: form.quoteDate || todayIso(),
      currency: "Q",
      taxRate,
      showTax: Boolean(form.showTax),
      internalNotes: String(form.internalNotes || "").trim(),
      templateId: form.templateId || null,
      templateSnapshot: {
        ...clone(form.templateDraft),
        terms: (form.templateDraft.terms || []).map((term) => String(term || "").trim()).filter(Boolean),
      },
      projectDesc,
      deliveryDays,
      projectPrice: 0,
      items,
      presentation: cleanedSections,
    };
  };

  const onSaveQuote = async ({ download }) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const selectedClient = await saveClientIfNeeded();
      const payload = buildPayload(selectedClient);
      const saved = isEditing && quoteId ? await updateQuote(quoteId, payload) : await addQuote(payload);
      if (!saved?.id) throw new Error("No se pudo guardar la cotizacion.");
      setSuccess(download ? "Cotizacion guardada. Preparando PDF..." : "Cotizacion guardada correctamente.");
      if (!isEditing) {
        navigate(`/cotizaciones/${saved.id}`, { replace: true });
      }
      if (download) {
        await downloadQuotePdf(saved.id);
        setSuccess("Cotizacion guardada y PDF descargado.");
      }
    } catch (err) {
      setError(String(err?.message || "No se pudo guardar la cotizacion."));
    } finally {
      setSaving(false);
    }
  };

  const onCreateTemplate = async () => {
    setError("");
    setSuccess("");
    setTemplateBusy(true);
    try {
      const created = await createTemplate({ ...clone(form.templateDraft), isDefault: false });
      if (!created?.id) throw new Error("No se pudo crear la plantilla.");
      setForm((prev) => ({
        ...prev,
        templateId: created.id,
        templateDraft: clone(created),
      }));
      setSuccess(`Plantilla creada: ${created.name}.`);
    } catch (err) {
      setError(String(err?.message || "No se pudo crear la plantilla."));
    } finally {
      setTemplateBusy(false);
    }
  };

  const onUpdateSelectedTemplate = async () => {
    if (!form.templateId) {
      setError("Selecciona una plantilla para actualizarla.");
      return;
    }
    setError("");
    setSuccess("");
    setTemplateBusy(true);
    try {
      const updated = await updateTemplate(form.templateId, clone(form.templateDraft));
      if (!updated?.id) throw new Error("No se pudo actualizar la plantilla.");
      setForm((prev) => ({
        ...prev,
        templateDraft: clone(updated),
      }));
      setSuccess(`Plantilla actualizada para futuras cotizaciones: ${updated.name}.`);
    } catch (err) {
      setError(String(err?.message || "No se pudo actualizar la plantilla."));
    } finally {
      setTemplateBusy(false);
    }
  };

  return (
    <section className="q">
      <header className="qHeader">
        <div>
          <h1 className="qTitle">{isEditing ? "Editar cotizacion" : "Nueva cotizacion"}</h1>
          <p className="qSubtitle">
            Separa costos internos de la propuesta visible para el cliente, edita la plantilla y
            descarga el PDF en el mismo flujo.
          </p>
        </div>
      </header>

      {loadingQuote ? <div className="qCard">Cargando cotizacion...</div> : null}

      {!loadingQuote ? (
        <div className="quoteEditor">
          <aside className="quoteSide">
            <div className="qCard summaryCard">
              <div className="qCardTitle">Resumen economico</div>
              <div className="summaryRows">
                <div className="summaryRow">
                  <span>Costos internos</span>
                  <strong>Q {toMoney(internalTotal)}</strong>
                </div>
                <div className="summaryRow">
                  <span>Subtotal cliente</span>
                  <strong>Q {toMoney(clientSubtotal)}</strong>
                </div>
                <div className="summaryRow">
                  <span>IVA</span>
                  <div className="summaryInline">
                    <input
                      className="fieldInput smallInput"
                      inputMode="decimal"
                      value={form.taxRate}
                      onChange={(event) => updateField("taxRate", event.target.value)}
                    />
                    <label className="fieldCheck inlineCheck">
                      <input
                        type="checkbox"
                        checked={form.showTax}
                        onChange={(event) => updateField("showTax", event.target.checked)}
                      />
                      <span>Mostrar</span>
                    </label>
                  </div>
                </div>
                <div className="summaryRow summaryStrong">
                  <span>Total cliente</span>
                  <strong>Q {toMoney(grandTotal)}</strong>
                </div>
                <div className={`summaryRow ${marginEstimate < 0 ? "negative" : "positive"}`}>
                  <span>Margen estimado</span>
                  <strong>Q {toMoney(marginEstimate)}</strong>
                </div>
              </div>

              {error ? <div className="error">{error}</div> : null}
              {success ? <div className="success">{success}</div> : null}

              <div className="actions actionsStack">
                {canSaveQuote && (
                  <button type="button" className="btnGhost" onClick={() => onSaveQuote({ download: false })} disabled={saving}>
                    {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar cotizacion"}
                  </button>
                )}
                {canSaveQuote && (
                  <button type="button" className="btn" onClick={() => onSaveQuote({ download: true })} disabled={saving}>
                    {saving ? "Procesando..." : "Guardar y descargar PDF"}
                  </button>
                )}
              </div>
            </div>

            <div className="qCard templateCard">
              <div className="qCardTop">
                <div>
                  <div className="qCardTitle">Plantilla del PDF</div>
                  <div className="qCardSub">
                    Guarda cambios solo en esta cotizacion o actualiza una plantilla para futuras.
                  </div>
                </div>
                <button
                  type="button"
                  className="btnGhost smallBtn"
                  onClick={() => setTemplateExpanded((prev) => !prev)}
                >
                  {templateExpanded ? "Ocultar editor" : "Editar plantilla"}
                </button>
              </div>

              <label className="field">
                <span className="fieldLabel">Plantilla guardada</span>
                <select
                  className="fieldInput"
                  value={form.templateId}
                  onChange={(event) => handleTemplateSelection(event.target.value)}
                >
                  <option value="">Usar snapshot actual</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}{template.isDefault ? " (base)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              {!templateExpanded ? (
                <div className="templateCollapsedNote">
                  <div>
                    <strong>{form.templateDraft.name || "Plantilla actual"}</strong>
                    <p>
                      {form.templateDraft.headerTitle || "Sin titulo"}
                    </p>
                  </div>
                  <div className="templateActions compactActions">
                    {can("quote-templates:create") && (
                      <button type="button" className="btnGhost" onClick={onCreateTemplate} disabled={templateBusy}>
                        Guardar nueva
                      </button>
                    )}
                    {can("quote-templates:update") && (
                      <button
                        type="button"
                        className="btnGhost"
                        onClick={onUpdateSelectedTemplate}
                        disabled={templateBusy || !form.templateId}
                      >
                        Actualizar seleccionada
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

              {templateExpanded ? (
                <>
                  <div className="templateEditor">
                    <div className="qGrid2">
                      <label className="field">
                        <span className="fieldLabel">Nombre de plantilla</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.name || ""}
                          onChange={(event) => updateTemplateField("name", event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span className="fieldLabel">Color principal</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.accentColor || "#F58220"}
                          onChange={(event) => updateTemplateField("accentColor", event.target.value)}
                          placeholder="#F58220"
                        />
                      </label>
                    </div>

                    <div className="qGrid2">
                      <label className="field">
                        <span className="fieldLabel">Titulo</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.headerTitle || ""}
                          onChange={(event) => updateTemplateField("headerTitle", event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span className="fieldLabel">Subtitulo</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.headerSubtitle || ""}
                          onChange={(event) => updateTemplateField("headerSubtitle", event.target.value)}
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span className="fieldLabel">Texto introductorio</span>
                      <textarea
                        className="fieldText"
                        rows={3}
                        value={form.templateDraft.introText || ""}
                        onChange={(event) => updateTemplateField("introText", event.target.value)}
                      />
                    </label>

                    <div className="subCard">
                      <div className="subCardTitle">Columnas visibles</div>
                      <div className="columnList">
                        {(form.templateDraft.columns || []).map((column) => (
                          <div key={column.key} className="columnRow">
                            <label className="columnToggle">
                              <input
                                type="checkbox"
                                checked={column.enabled !== false}
                                onChange={(event) =>
                                  updateTemplateColumn(column.key, { enabled: event.target.checked })
                                }
                              />
                              <span>{column.key}</span>
                            </label>
                            <input
                              className="fieldInput"
                              value={column.label || ""}
                              onChange={(event) =>
                                updateTemplateColumn(column.key, { label: event.target.value })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="subCard">
                      <div className="subCardTop">
                        <div className="subCardTitle">Terminos</div>
                        <button type="button" className="btnGhost smallBtn" onClick={addTemplateTerm}>
                          Agregar termino
                        </button>
                      </div>
                      <div className="termList">
                        {(form.templateDraft.terms || []).map((term, index) => (
                          <div key={`term-${index}`} className="termRow">
                            <textarea
                              className="fieldText compactText"
                              rows={2}
                              value={term}
                              onChange={(event) => updateTemplateTerm(index, event.target.value)}
                            />
                            <button
                              type="button"
                              className="iconBtn"
                              onClick={() => removeTemplateTerm(index)}
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="qGrid2">
                      <label className="field">
                        <span className="fieldLabel">Email footer</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.footerEmail || ""}
                          onChange={(event) => updateTemplateField("footerEmail", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span className="fieldLabel">WhatsApp footer</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.footerWhatsApp || ""}
                          onChange={(event) => updateTemplateField("footerWhatsApp", event.target.value)}
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span className="fieldLabel">Nota de footer</span>
                      <textarea
                        className="fieldText"
                        rows={2}
                        value={form.templateDraft.footerNote || ""}
                        onChange={(event) => updateTemplateField("footerNote", event.target.value)}
                      />
                    </label>

                    <div className="qGrid2">
                      <label className="field">
                        <span className="fieldLabel">Firma nombre</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.closingName || ""}
                          onChange={(event) => updateTemplateField("closingName", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span className="fieldLabel">Firma cargo</span>
                        <input
                          className="fieldInput"
                          value={form.templateDraft.closingTitle || ""}
                          onChange={(event) => updateTemplateField("closingTitle", event.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="templateActions">
                    {can("quote-templates:create") && (
                      <button type="button" className="btnGhost" onClick={onCreateTemplate} disabled={templateBusy}>
                        Guardar como nueva plantilla
                      </button>
                    )}
                    {can("quote-templates:update") && (
                      <button
                        type="button"
                        className="btnGhost"
                        onClick={onUpdateSelectedTemplate}
                        disabled={templateBusy || !form.templateId}
                      >
                        Actualizar plantilla seleccionada
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </aside>

          <div className="quoteMain">
            <div className="qCard">
              <div className="qCardTitle">Datos generales</div>
              <div className="qGrid2">
                <label className="field">
                  <span className="fieldLabel">Cliente</span>
                  <input
                    className="fieldInput"
                    list="client-list"
                    value={form.clientName}
                    onChange={(event) => updateField("clientName", event.target.value)}
                    placeholder="Escribe o selecciona un cliente"
                  />
                  <datalist id="client-list">
                    {clients.map((client) => (
                      <option key={client.id} value={client.name} />
                    ))}
                  </datalist>
                </label>

                <label className="field">
                  <span className="fieldLabel">Atencion</span>
                  <input
                    className="fieldInput"
                    value={form.attention}
                    onChange={(event) => updateField("attention", event.target.value)}
                    placeholder="Ej: Leslie Garcia"
                  />
                </label>

                <label className="field">
                  <span className="fieldLabel">Nombre del proyecto</span>
                  <input
                    className="fieldInput"
                    value={form.projectName}
                    onChange={(event) => updateField("projectName", event.target.value)}
                    placeholder="Ej: Impermeabilizacion de terraza"
                  />
                </label>

                <label className="field">
                  <span className="fieldLabel">Ubicacion</span>
                  <input
                    className="fieldInput"
                    value={form.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    placeholder="Ej: Guatemala"
                  />
                </label>

                <label className="field">
                  <span className="fieldLabel">Fecha de cotizacion</span>
                  <input
                    className="fieldInput"
                    type="date"
                    value={form.quoteDate}
                    onChange={(event) => updateField("quoteDate", event.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="fieldLabel">Tiempo de entrega (dias)</span>
                  <input
                    className="fieldInput"
                    inputMode="numeric"
                    value={form.deliveryDays}
                    onChange={(event) => updateField("deliveryDays", event.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span className="fieldLabel">Descripcion general / alcance</span>
                <textarea
                  className="fieldText"
                  rows={4}
                  value={form.projectDesc}
                  onChange={(event) => updateField("projectDesc", event.target.value)}
                  placeholder="Resumen interno del alcance del proyecto"
                />
              </label>

              <label className="field">
                <span className="fieldLabel">Notas internas</span>
                <textarea
                  className="fieldText"
                  rows={3}
                  value={form.internalNotes}
                  onChange={(event) => updateField("internalNotes", event.target.value)}
                  placeholder="Estas notas no se muestran en el PDF del cliente"
                />
              </label>
            </div>

            <div className="qCard">
              <div className="qCardTop">
                <div>
                  <div className="qCardTitle">Costos internos</div>
                  <div className="qCardSub">Materiales y costos ocultos del PDF cliente.</div>
                </div>
                <div className="inlineActions">
                  <button type="button" className="btnGhost" onClick={addManualCostRow}>
                    Agregar manual
                  </button>
                  <button type="button" className="btn" onClick={() => setPickerOpen(true)}>
                    Agregar desde inventario
                  </button>
                </div>
              </div>

              {form.costRows.length === 0 ? (
                <div className="empty">No hay costos internos agregados todavia.</div>
              ) : (
                <div className="matrixScroll">
                  <div className="matrix">
                    <div className="matrixHead costGrid">
                      <div>Material o costo</div>
                      <div>Costo unitario</div>
                      <div>Cantidad</div>
                      <div>Total</div>
                      <div />
                    </div>
                    {form.costRows.map((row) => {
                      const total = (Number(row.qty) || 0) * (Number(row.unitCost) || 0);
                      return (
                        <div key={row.id} className="matrixRow costGrid">
                          <input
                            className="fieldInput"
                            value={row.name}
                            onChange={(event) => updateCostRow(row.id, { name: event.target.value })}
                            placeholder="Nombre interno"
                          />
                          <input
                            className="fieldInput"
                            inputMode="decimal"
                            value={row.unitCost}
                            onChange={(event) => updateCostRow(row.id, { unitCost: event.target.value })}
                          />
                          <input
                            className="fieldInput"
                            inputMode="decimal"
                            value={row.qty}
                            onChange={(event) => updateCostRow(row.id, { qty: event.target.value })}
                          />
                          <div className="valueCell">Q {toMoney(total)}</div>
                          <button type="button" className="iconBtn" onClick={() => removeCostRow(row.id)}>
                            X
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="qCard">
              <div className="qCardTop">
                <div>
                  <div className="qCardTitle">Propuesta visible para el cliente</div>
                  <div className="qCardSub">Estas lineas son las que saldran en el PDF.</div>
                </div>
                <button type="button" className="btn" onClick={addSection}>
                  Agregar seccion
                </button>
              </div>

              <div className="sectionList">
                {form.sections.map((section, sectionIndex) => {
                  const sectionTotal = section.lines.reduce((sum, line) => sum + totalLine(line), 0);
                  return (
                    <div key={section.id} className="sectionCard">
                      <div className="sectionTop">
                        <div className="sectionTitleRow">
                          <span className="sectionBadge">Seccion {sectionIndex + 1}</span>
                          <button type="button" className="btnGhost smallBtn" onClick={() => addLine(section.id)}>
                            Agregar linea
                          </button>
                          {form.sections.length > 1 ? (
                            <button
                              type="button"
                              className="btnGhost smallBtn dangerBtn"
                              onClick={() => removeSection(section.id)}
                            >
                              Eliminar seccion
                            </button>
                          ) : null}
                        </div>
                        <div className="sectionTotal">Total seccion: Q {toMoney(sectionTotal)}</div>
                      </div>

                      <div className="qGrid2">
                        <label className="field">
                          <span className="fieldLabel">Titulo</span>
                          <input
                            className="fieldInput"
                            value={section.title}
                            onChange={(event) => updateSection(section.id, { title: event.target.value })}
                          />
                        </label>
                        <label className="field fieldCheck">
                          <span className="fieldLabel">Mostrar total de seccion</span>
                          <input
                            type="checkbox"
                            checked={section.showTotal !== false}
                            onChange={(event) => updateSection(section.id, { showTotal: event.target.checked })}
                          />
                        </label>
                      </div>

                      <label className="field">
                        <span className="fieldLabel">Subtitulo opcional</span>
                        <input
                          className="fieldInput"
                          value={section.subtitle}
                          onChange={(event) => updateSection(section.id, { subtitle: event.target.value })}
                          placeholder="Ej: MONOLIT PETAPA ZONA 12"
                        />
                      </label>

                      <div className="matrixScroll">
                        <div className="matrix">
                          <div className="matrixHead clientGrid">
                            <div>Codigo</div>
                            <div>Titulo</div>
                            <div>Descripcion</div>
                            <div>Unidad</div>
                            <div>Cantidad</div>
                            <div>Precio</div>
                            <div>Total</div>
                            <div />
                          </div>
                          {section.lines.map((line) => {
                            const total = totalLine(line);
                            return (
                              <div key={line.id} className="matrixRow clientGrid">
                                <input
                                  className="fieldInput"
                                  value={line.code}
                                  onChange={(event) => updateLine(section.id, line.id, { code: event.target.value })}
                                  placeholder="1.01"
                                />
                                <input
                                  className="fieldInput"
                                  value={line.title}
                                  onChange={(event) => updateLine(section.id, line.id, { title: event.target.value })}
                                  placeholder="Nombre comercial"
                                />
                                <textarea
                                  className="fieldText compactText"
                                  rows={2}
                                  value={line.description}
                                  onChange={(event) =>
                                    updateLine(section.id, line.id, { description: event.target.value })
                                  }
                                  placeholder="Descripcion para el cliente"
                                />
                                <input
                                  className="fieldInput"
                                  value={line.unit}
                                  onChange={(event) => updateLine(section.id, line.id, { unit: event.target.value })}
                                  placeholder="m2"
                                />
                                <input
                                  className="fieldInput"
                                  inputMode="decimal"
                                  value={line.quantity}
                                  onChange={(event) =>
                                    updateLine(section.id, line.id, { quantity: event.target.value })
                                  }
                                />
                                <input
                                  className="fieldInput"
                                  inputMode="decimal"
                                  value={line.unitPrice}
                                  onChange={(event) =>
                                    updateLine(section.id, line.id, { unitPrice: event.target.value })
                                  }
                                />
                                <div className="valueCell">Q {toMoney(total)}</div>
                                <button type="button" className="iconBtn" onClick={() => removeLine(section.id, line.id)}>
                                  X
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ProductPickerModal
        open={pickerOpen}
        products={filteredProducts}
        categories={categories}
        selectedCategory={pickerCategory}
        query={pickerQuery}
        onCategoryChange={setPickerCategory}
        onQueryChange={setPickerQuery}
        onSelect={addProductRow}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  );
}
