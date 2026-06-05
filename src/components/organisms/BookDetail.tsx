"use client";
import Image from "next/image";
import { useState, Fragment, useEffect, useRef } from "react";
import {BookFormat, getFormat} from "@/lib/types";
import styles from "./BookDetail.module.css";
import ImageCarousel from "@/components/organisms/ImageCarousel";
import GoodreadsRating from "@/components/molecules/GoodreadsRating";
import GoodreadsButton from "@/components/molecules/GoodreadsButton";
import { addBasePath } from "@/lib/paths";
import ExcerptDialog from "@/components/molecules/ExcerptDialog";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";

import type { Product } from "@/models/Product";
import {getPrice, getProductItemDisplayLabel} from "@/lib/product-item.helper";
import PriceText from "@/components/atoms/PriceText";
import { useProducts } from "@/components/molecules/ProductsProvider";
import SuggestionDialog from "@/components/molecules/SuggestionDialog";

export default function BookDetail({ product: staticProduct }: { product: Product }) {
  const { products } = useProducts();
  const liveProduct = products.find(p => p.id === staticProduct.id);
  
  // Merge live data (prices, availability) with static rich content (excerpts)
  // We explicitly preserve rich content from staticProduct
  const product = liveProduct 
    ? { 
        ...staticProduct, 
        ...liveProduct, 
        descriptionHtml: staticProduct.descriptionHtml || liveProduct.descriptionHtml,
        imageUrls: staticProduct.imageUrls || liveProduct.imageUrls,
        externalLinks: liveProduct.externalLinks ?? staticProduct.externalLinks,
        hasExcerpt: staticProduct.hasExcerpt || liveProduct.hasExcerpt 
      }
    : staticProduct;
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
    const descriptionRef = useRef<HTMLDivElement | null>(null);
  const [format, setFormat] = useState<BookFormat>("paper");
  const { addItem, isInCart, openCart } = useCart();

  const suggestedProduct = products.find(p => p.slug === 'inaksha-art');

  const checkSuggestion = (addedProduct: Product, addedFormat: BookFormat) => {
      if ((addedProduct.slug === 'zvychajna-and-inaksha' || addedProduct.slug === 'inaksha') && addedFormat === 'paper' && suggestedProduct) {
          const artItemId = suggestedProduct.items[0]?.id;
          if (artItemId && !isInCart(artItemId)) {
              setSuggestionOpen(true);
              return true;
          }
      }
      return false;
  };

  const selected = product.items.find(f => getFormat(f) === format);
  const itemInCart = selected ? isInCart(selected.id) : false;
  const handleBuyNow = () => {
    if (!selected) return;
    if (!isInCart(selected.id)) {
      const wasAdded = addItem(product, selected.id, format, 1);
      if (wasAdded) {
        notify.success(`"${product.name}" додано до кошика`);
      }
    }
    if (!checkSuggestion(product, format)) {
      openCart();
    }
  };

  const handleAddToCart = () => {
    if (!selected) return;
    if (isInCart(selected.id)) {
      openCart();
    } else {
      const wasAdded = addItem(product, selected.id, format, 1);
      if (wasAdded) {
        notify.success(`"${product.name}" додано до кошика`);
      }
      checkSuggestion(product, format);
    }
  };
  const externalLinks = product?.externalLinks || []
  const descriptionId = `book-description-${product.slug}`;
  const descriptionTitleId = `${descriptionId}-title`;

    useEffect(() => {
        const node = descriptionRef.current;
        if (!node) {
            setIsDescriptionOverflowing(false);
            return;
        }

        const measureOverflow = () => {
            const computed = window.getComputedStyle(node);
            const lineHeight = Number.parseFloat(computed.lineHeight);
            const collapsedLines = Number.parseFloat(computed.getPropertyValue("--desc-collapsed-lines")) || 6;

            if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
                setIsDescriptionOverflowing(false);
                return;
            }

            const collapsedHeight = lineHeight * collapsedLines;
            setIsDescriptionOverflowing(node.scrollHeight > collapsedHeight + 2);
        };

        measureOverflow();

        const observer = new ResizeObserver(() => {
            measureOverflow();
        });
        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [product.descriptionHtml]);

  const renderCoverActions = (className: string, keyPrefix: string) => (
      <div className={className}>
          {product && <GoodreadsButton product={product}/>}
          {product.hasExcerpt && (
              <button type="button" className={styles.excerptBtn} onClick={() => setExcerptOpen(true)}>
                  <i className="fa-solid fa-book-open" aria-hidden="true"></i>
                  <span>Читати уривок</span>
              </button>
          )}
          {externalLinks.map((link, idx) => (
              <a key={`${keyPrefix}-${idx}`} className={styles.excerptBtn} target="_blank" rel="noopener" href={link.url}>
                  <i className={link.icon} aria-hidden="true"></i>
                  <span>{link.label}</span>
              </a>
          ))}
      </div>
  );
  let buyText
    if (selected?.isAvailable) {
        buyText = <PriceText label={'Купити — '} productItem={selected}/>
    } else if (selected?.canPreorder) {
        buyText = <PriceText label={'Передзамовити — '} productItem={selected}/>
    } else {
        buyText = <>Немає в наявності</>;
    }
    return (
      <section className={styles.wrap}>
          <div className={styles.grid}>
              <div className={styles.summary}>
                  <h1 className={styles.titleRow}>
                      <span className={styles.titleText}>{product.name}</span>
                  </h1>

                  {product && <GoodreadsRating product={product} compact/>}
              </div>
              <div className={styles.cover}>
                  <div className={styles.coverMedia}>
                      {product.ageRating && (
                          <span
                              className={`${styles.ageBadge} ${styles["age" + product.ageRating.replace("+", "p")]}`}
                              aria-label={`Вікове обмеження: ${product.ageRating}`}
                              title={`Вікове обмеження: ${product.ageRating}`}
                          >
                              {product.ageRating}
                          </span>
                      )}
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                          <ImageCarousel
                              images={product.imageUrls.map(url => addBasePath(url))}
                              alt={product.name}
                              sizes="(max-width: 480px) 220px, (max-width: 960px) 280px, 320px"
                              className={styles.carousel}
                              navInside={true}
                          />
                      ) : (
                          <Image src={addBasePath(product.imageUrl)} alt={product.name} width={320} height={480}/>
                      )}
                  </div>
                  {renderCoverActions(`${styles.coverActions} ${styles.desktopCoverActions}`, "desktop")}
              </div>
              <div className={styles.content}>
                  <div className={styles.detailBody}>
                      <div className={styles.purchasePanel}>
                          {product.items.length > 1 && (
                              <div role="radiogroup" aria-label="Формат" className={styles.segmented}>
                                  {product.items.map(f => {
                                      const itemFormat = getFormat(f);
                                      const isDisabled = !f.isAvailable && !f.canPreorder;
                                      return (
                                          <label key={f.type}
                                                 className={`${styles.opt} ${format === itemFormat ? styles.active : ""} ${isDisabled ? styles.disabled : ""}`}>
                                              <input
                                                  type="radio"
                                                  name="format"
                                                  value={f.type}
                                                  checked={format === itemFormat}
                                                  disabled={isDisabled}
                                                  onChange={() => setFormat(itemFormat)}
                                              />
                                          <span>{getProductItemDisplayLabel(product, f)} • {getPrice(f)} грн</span>
                                          </label>
                                      );
                                  })}
                              </div>
                          )
                          }

                          <div className={styles.buybar}>
                              <div className={styles.buyButtons}>
                                <button className={styles.buy} disabled={!selected?.isAvailable && !selected?.canPreorder}
                                        onClick={handleBuyNow}>
                                    {buyText}
                                </button>
                                <button
                                  className={`${styles.addToCart} ${itemInCart ? styles.inCart : ""}`}
                                  disabled={!selected?.isAvailable && !selected?.canPreorder}
                                  onClick={handleAddToCart}
                                  aria-label={itemInCart ? "Вже в кошику" : "Додати в кошик"}
                                  title={itemInCart ? "Вже в кошику" : "Додати в кошик"}>
                                    <i className={itemInCart ? "fas fa-check" : "fas fa-cart-plus"} aria-hidden="true"></i>
                                    <span className={styles.addToCartText}>
                                        {itemInCart ? "У кошику" : "Додати в кошик"}
                                    </span>
                                </button>
                              </div>
                              <small className={styles.hint}>
                                {itemInCart ? "Товар вже в кошику" : "Купити зараз або додати до кошика"}
                              </small>
                              {selected?.note && (
                                  <small className={styles.hint}>{selected.note}</small>
                              )}
                              {product.ageRating && (
                                  <small className={styles.hint}>Вікове обмеження: {product.ageRating}</small>
                              )}

                          </div>
                      </div>

                      {product.descriptionHtml && (
                          <section className={styles.descriptionPanel} aria-labelledby={descriptionTitleId}>
                              <h2 id={descriptionTitleId}>Опис</h2>
                              <div
                                  id={descriptionId}
                                  ref={descriptionRef}
                                  className={`${styles.desc} ${descriptionExpanded || !isDescriptionOverflowing ? styles.descExpanded : styles.descCollapsed}`}
                                  dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
                              />
                              {isDescriptionOverflowing && (
                                  <button
                                      type="button"
                                      className={styles.descriptionToggle}
                                      aria-expanded={descriptionExpanded}
                                      aria-controls={descriptionId}
                                      onClick={() => setDescriptionExpanded(expanded => !expanded)}
                                  >
                                      {descriptionExpanded ? "Згорнути ↑" : "Читати далі ↓"}
                                  </button>
                              )}
                          </section>
                      )}

                      {renderCoverActions(`${styles.coverActions} ${styles.mobileCoverActions}`, "mobile")}

                      {product.physicalDetails && (
                          <section className={styles.specs} aria-labelledby="specs-title">
                              <h2 id="specs-title">Характеристики</h2>
                              <dl className={styles.specsGrid}>
                                  {[
                                      {label: "Автор(и)", value: product.author},
                                      {label: "Серія", value: product.physicalDetails.seriesName},
                                      {label: "Видавництво", value: product.physicalDetails.publisher},
                                      {label: "Кількість сторінок", value: product.physicalDetails.pages?.toString()},
                                      {label: "Тип палітурки", value: product.physicalDetails.coverType},
                                      {label: "Рік видання", value: product.physicalDetails.publicationYear?.toString()},
                                      {label: "Розмір", value: product.physicalDetails.size},
                                      {
                                          label: "Вага",
                                          value: product.physicalDetails.weight ? `${product.physicalDetails.weight} г` : null
                                      },
                                      {label: "Тип паперу", value: product.physicalDetails.paperType},
                                      {label: "ISBN", value: product.physicalDetails.isbn},
                                  ]
                                      .filter(i => !!i.value)
                                      .map((i, idx) => (
                                          <Fragment key={i.label || idx}>
                                              <dt className={styles.specsTerm}>{i.label}</dt>
                                              <dd className={styles.specsDef}>{i.value as string}</dd>
                                          </Fragment>
                                      ))}
                              </dl>
                          </section>
                      )}
                  </div>
              </div>
          </div>

          {product.hasExcerpt && (
              <ExcerptDialog open={excerptOpen} onClose={() => setExcerptOpen(false)} title={product.name}
                             slug={product.slug}/>
          )}
          {suggestedProduct && (
              <SuggestionDialog
                  open={suggestionOpen}
                  onClose={() => setSuggestionOpen(false)}
                  suggestedProduct={suggestedProduct}
              />
          )}
      </section>
  );
}
