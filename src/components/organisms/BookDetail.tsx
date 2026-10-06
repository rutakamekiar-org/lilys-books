"use client";
import Icon, { ExternalLinkIcon } from "@/components/atoms/Icon";
import Image from "next/image";

import { useState, Fragment, useEffect, useRef } from "react";
import {BookFormat, getFormat} from "@/lib/types";
import styles from "./BookDetail.module.css";
import ImageCarousel from "@/components/organisms/ImageCarousel";
import GoodreadsRating from "@/components/molecules/GoodreadsRating";
import GoodreadsButton from "@/components/molecules/GoodreadsButton";
import BookGallery from "@/components/molecules/BookGallery";
import ExcerptDialog from "@/components/molecules/ExcerptDialog";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";
import { getProductGalleryImages } from "@/lib/product-gallery";

import type { Product } from "@/models/Product";
import {getPrice, getProductItemDisplayLabel} from "@/lib/product-item.helper";
import PriceText from "@/components/atoms/PriceText";
import { useProducts } from "@/components/molecules/ProductsProvider";
import SuggestionDialog from "@/components/molecules/SuggestionDialog";

const COVER_SIZES = "(max-width: 380px) 104px, (max-width: 640px) 112px, (max-width: 960px) clamp(220px, 48vw, 280px), 340px";

export default function BookDetail({ product: staticProduct }: { product: Product }) {
  const { products, refreshProduct } = useProducts();
  const [freshProduct, setFreshProduct] = useState<Product | null>(null);
  
  const currentFreshProduct = freshProduct?.slug === staticProduct.slug ? freshProduct : null;
  const product = currentFreshProduct ?? staticProduct;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
    const descriptionRef = useRef<HTMLDivElement | null>(null);
  const [format, setFormat] = useState<BookFormat>("paper");
  const { addItem, isInCart, openCart } = useCart();

  const suggestedProduct = products.find(p => p.slug === 'inaksha-art');

  useEffect(() => {
    let cancelled = false;

    const loadFreshProduct = async () => {
      const latestProduct = await refreshProduct(staticProduct.slug);
      if (!cancelled && latestProduct) {
        setFreshProduct(latestProduct);
      }
    };

    setFreshProduct(null);
    void loadFreshProduct();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadFreshProduct();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshProduct, staticProduct.slug]);

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
    const isMobilePurchase = window.matchMedia("(max-width: 640px)").matches;
    if (isMobilePurchase && isInCart(selected.id)) {
      openCart(selected.id);
      return;
    }
    if (!isInCart(selected.id)) {
      addItem(product, selected.id, format, 1);
    }
    if (isMobilePurchase || !checkSuggestion(product, format)) {
      openCart(selected.id);
    }
  };

  const handleAddToCart = () => {
    if (!selected) return;
    if (!isInCart(selected.id)) {
      const wasAdded = addItem(product, selected.id, format, 1);
      if (wasAdded) {
        notify.success(`"${product.name}" додано до кошика`);
      }

    }
  };
  const galleryImages = getProductGalleryImages(product.imageUrl, product.imageUrls);
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
    }, [product.description]);

  const renderExcerptAction = () => (
      <button type="button" className={styles.excerptBtn} onClick={() => setExcerptOpen(true)}>
          <Icon name="book-open" />
          <span>Читати уривок</span>
      </button>
  );
  const renderCoverActions = (className: string, keyPrefix: string, includeExcerpt = true) => (
      <div className={className}>
          {product && <GoodreadsButton product={product}/>}
          {includeExcerpt && product.hasExcerpt && renderExcerptAction()}
          {externalLinks.map((link, idx) => (
              <a key={`${keyPrefix}-${idx}`} className={styles.excerptBtn} target="_blank" rel="noopener" href={link.url}>
                  <ExternalLinkIcon icon={link.icon} />
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
                  {product.hasExcerpt && <div className={styles.mobileExcerptAction}>{renderExcerptAction()}</div>}
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
                      <button type="button" className={styles.mobileCoverPreview} aria-label={`Відкрити зображення книги: ${product.name}`} onClick={() => setGalleryOpen(true)}>
                          <Image src={product.imageUrl} alt={product.name} width={320} height={480} sizes={COVER_SIZES} loading="eager" fetchPriority="high" />
                          <span className={styles.coverZoom} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6" /><path d="M14.5 14.5 21 21M10 7v6M7 10h6" /></svg></span>
                      </button>
                      <div className={styles.desktopCoverMedia}>
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                          <ImageCarousel
                              images={product.imageUrls}
                              alt={product.name}
                              sizes={COVER_SIZES}
                              className={styles.carousel}
                              navInside={true}
                              priorityFirstImage
                          />
                      ) : (
                          <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={320}
                              height={480}
                              sizes={COVER_SIZES}
                              loading="eager"
                              fetchPriority="high"
                          />
                      )}
                      </div>
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
                                    <span className={styles.desktopBuyText}>{buyText}</span>
                                    <span className={styles.mobileBuyText}>{itemInCart ? "Переглянути кошик" : buyText}</span>
                                </button>
                                <button
                                  className={`${styles.addToCart} ${itemInCart ? styles.inCart : ""}`}
                                  disabled={!selected?.isAvailable && !selected?.canPreorder}
                                  onClick={handleAddToCart}
                                  aria-label={itemInCart ? "Вже в кошику" : "Додати в кошик"}
                                  title={itemInCart ? "Вже в кошику" : "Додати в кошик"}
                                  aria-pressed={itemInCart}>
                                    <Icon name={itemInCart ? "check" : "cart-plus"} />
                                    <span className={styles.addToCartText}>
                                        {itemInCart ? "У кошику" : "Додати в кошик"}
                                    </span>
                                </button>
                              </div>

                              {selected?.note && (
                                  <small className={styles.hint}>{selected.note}</small>
                              )}
                              {product.ageRating && (
                                  <small className={styles.hint}>Вікове обмеження: {product.ageRating}</small>
                              )}

                          </div>
                      </div>

                      {product.description && (
                          <section className={styles.descriptionPanel} aria-labelledby={descriptionTitleId}>
                              <h2 id={descriptionTitleId}>Опис</h2>
                              <div
                                  id={descriptionId}
                                  ref={descriptionRef}
                                  className={`${styles.desc} ${descriptionExpanded || !isDescriptionOverflowing ? styles.descExpanded : styles.descCollapsed}`}
                              >
                                  {product.description}
                              </div>
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

                      {renderCoverActions(`${styles.coverActions} ${styles.mobileCoverActions}`, "mobile", false)}

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

          <BookGallery key={product.slug} open={galleryOpen} onClose={() => setGalleryOpen(false)} images={galleryImages} title={product.name} />
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
