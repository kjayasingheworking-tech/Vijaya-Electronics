import { useEffect, useMemo, useState } from "react";

const KEY = "admin_po_cart_v1";

export default function useAdminPOCart() {
  const [supplier, setSupplier] = useState(null); // { _id, name, email }
  const [items, setItems] = useState([]); // [{ product, name, unitPrice, quantity, lineTotal }]

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const { supplier, items } = JSON.parse(raw);
        setSupplier(supplier || null);
        setItems(Array.isArray(items) ? items : []);
      }
    } catch {}
  }, []);

  const save = (next) => {
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const clear = () => {
    setSupplier(null);
    setItems([]);
    save({ supplier: null, items: [] });
  };

  const addItem = (prod, qty = 1) => {
    if (!prod || !prod._id) return;

    if (supplier && supplier._id !== (prod.supplier?._id || prod.supplier)) {
      throw new Error("You can only add items from a single supplier per PO.");
    }

    const sObj = prod.supplier?._id
      ? prod.supplier
      : { _id: prod.supplier, name: prod?.supplier?.name, email: prod?.supplier?.email };
    const newSupplier = supplier || sObj;

    const idx = items.findIndex((it) => it.product === prod._id);
    let nextItems = [];
    if (idx === -1) {
      nextItems = [
        ...items,
        {
          product: prod._id,
          name: prod.name,
          unitPrice: Number(prod.unitPrice || 0),
          quantity: Number(qty || 1),
          lineTotal: Number(prod.unitPrice || 0) * Number(qty || 1),
        },
      ];
    } else {
      nextItems = items.map((it, i) =>
        i === idx
          ? {
              ...it,
              quantity: it.quantity + Number(qty || 1),
              lineTotal: (it.quantity + Number(qty || 1)) * it.unitPrice,
            }
          : it
      );
    }

    setSupplier(newSupplier);
    setItems(nextItems);
    save({ supplier: newSupplier, items: nextItems });
  };

  const updateQty = (productId, qty) => {
    const q = Math.max(1, Number(qty || 1));
    const next = items.map((it) =>
      it.product === productId ? { ...it, quantity: q, lineTotal: q * it.unitPrice } : it
    );
    setItems(next);
    save({ supplier, items: next });
  };

  const removeItem = (productId) => {
    const next = items.filter((it) => it.product !== productId);
    const nextSupplier = next.length ? supplier : null;
    setItems(next);
    setSupplier(nextSupplier);
    save({ supplier: nextSupplier, items: next });
  };

  const subTotal = useMemo(() => items.reduce((s, it) => s + it.lineTotal, 0), [items]);

  return { supplier, items, subTotal, addItem, updateQty, removeItem, clear };
}
