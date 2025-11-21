"use client";
import type { Metadata } from "next";
import {useEffect, useState} from "react";
import type {Product} from "@/models/Product";
import {getProducts} from "@/lib/api";

// const API_URL = "https://localhost:7213";
const API_URL = "https://api.zvychajna.pp.ua";

export default function TestPage() {
    const [svg, setSvg] = useState<string>("");
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    useEffect(() => {
        getProducts().catch(() => []).then(products => setProducts(products));
    }, []);

    const fetchQr = async (productItemId: string, price?: number, details?: string) => {
        const params = new URLSearchParams({
            productItemId: productItemId,
        });
        if (price !== undefined && !Number.isNaN(price)) {
            params.set("price", String(price));
        }
        if (details && details.trim() !== "") {
            params.set("details", details.trim());
        }
        const res = await fetch(`${API_URL}/api/invoice/offline?${params.toString()}`, {
            headers: { Accept: "image/svg+xml" }
        });
        const svgText = await res.text();
        setSvg(svgText);
    };

    const priceNumber = Number(price);
    const canFetch = Boolean(selectedItemId) && price.trim() !== "" && !Number.isNaN(priceNumber) && priceNumber >= 0;
    return (
        <div className="testPage">
            <h1>Product items</h1>

            <div className="formWrap" style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 520 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>Select product item</span>
                    <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
                    >
                        <option value="">-- choose an item --</option>
                        {products.flatMap((p) => (
                            p.items ? p.items.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            )) : []
                        ))}
                    </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>Enter price</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.01}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Price"
                        style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", maxWidth: 220 }}
                    />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>Description (optional)</span>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description"
                        style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", maxWidth: 520 }}
                    />
                </label>

                <div className="btnRow">
                    <button
                        onClick={() => canFetch && fetchQr(String(selectedItemId), priceNumber, description)}
                        disabled={!canFetch}
                        style={{
                            padding: "8px 16px",
                            background: canFetch ? "#0070f3" : "#9bbcf5",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: canFetch ? "pointer" : "not-allowed",
                            flex: 1
                        }}
                    >
                        Fetch QR
                    </button>
                    <button
                        onClick={() => setSvg("")}
                        disabled={!canFetch}
                        style={{
                            padding: "8px 16px",
                            background: canFetch ? "#0070f3" : "#9bbcf5",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: canFetch ? "pointer" : "not-allowed",
                            flex: 1
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="qrWrap">
                <div
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            </div>

            <style jsx>{`
              .testPage { padding: 40px; }
              .formWrap { max-width: 520px; }
              .btnRow { display: flex; gap: 12px; }
              .qrWrap { margin-top: 20px; display: flex; justify-content: center; }
              /* Make injected SVG responsive on all screens */
              .qrWrap :global(svg) {
                width: 100% !important;
                height: auto !important;
                max-width: 360px;
                display: block;
              }
              /* Keep strokes readable if the SVG uses strokes */
              .qrWrap :global(svg [stroke]) { vector-effect: non-scaling-stroke; }

              @media (max-width: 480px) {
                .testPage { padding: 16px; }
                .formWrap { max-width: 100%; }
                .formWrap :global(select),
                .formWrap :global(input),
                .formWrap :global(button) {
                  width: 100%;
                  box-sizing: border-box;
                }
                .btnRow { flex-direction: column; }
                .qrWrap { margin-top: 16px; }
                .qrWrap :global(svg) { max-width: 100%; }
              }
            `}</style>
        </div>
    );
}