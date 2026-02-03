"use client";
import Image from "next/image";
import { useState, Fragment } from "react";
import {BookFormat, getFormat} from "@/lib/types";
import styles from "./BookDetail.module.css";
import GoodreadsRating from "@/components/molecules/GoodreadsRating";
import GoodreadsButton from "@/components/molecules/GoodreadsButton";
import { addBasePath } from "@/lib/paths";
import ExcerptDialog from "@/components/molecules/ExcerptDialog";
import { useCart } from "@/components/molecules/CartProvider";
import notify from "@/lib/toast";

import type { Product } from "@/models/Product";
import {getPrice} from "@/lib/product-item.helper";
import PriceText from "@/components/atoms/PriceText";

export default function BookDetail({ product }: { product: Product }) {
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [format, setFormat] = useState<BookFormat>("paper");
  const { addItem, isInCart, openCart } = useCart();
  const selected = product.items.find(f => getFormat(f) === format);
  const itemInCart = selected ? isInCart(selected.id) : false;
  const handleBuyNow = () => {
    if (!selected) return;
    const wasAdded = addItem(product, selected.id, format, 1);
    if (wasAdded) {
        notify.success(`"${product.name}" додано до кошика`);
    } else {
        notify.info(`"${product.name}" вже в кошику`);
    }
    openCart();
  };

  const handleAddToCart = () => {
    if (!selected) return;
    const wasAdded = addItem(product, selected.id, format, 1);
    if (wasAdded) {
        notify.success(`"${product.name}" додано до кошика`);
    } else {
        notify.info(`"${product.name}" вже в кошику`);
    }
  };
  const youtubeLink = product?.externalLinks?.find(x => x.type === 'youtube')
  const publisherLink = product?.externalLinks?.find(x => x.type === 'publisher')
  const rigaLink = product?.externalLinks?.find(x => x.type === 'riga')
    let buyText;

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
              <div className={styles.cover}>
                  <Image src={addBasePath(product.imageUrl)} alt={product.name} width={320} height={480}/>
                  {product && <GoodreadsButton product={product}/>}
                  {product.excerptHtml && (
                      <a type="button" className={styles.excerptBtn} onClick={() => setExcerptOpen(true)}>
                          <i className="fa-solid fa-book-open"></i>
                          <span>Читати уривок</span>
                      </a>
                  )}
                  {youtubeLink && (
                      <a className={styles.excerptBtn} target="_blank" rel="noopener" href={youtubeLink.link}>
                          <i className="fa-brands fa-youtube"></i>
                          <span>Слухати уривок</span>
                      </a>
                  )}
                  {publisherLink && (
                      <a className={styles.excerptBtn} target="_blank" rel="noopener" href={publisherLink.link}>
                          <i className="fa-solid fa-book"></i>
                          <span>На сайт видавництва</span>
                      </a>
                  )}
                  {rigaLink && (
                      <a className={styles.excerptBtn} target="_blank" rel="noopener" href={rigaLink.link}>
                          <i className="fa-solid fa-book"></i>
                          <span>Книгарня в Європі</span>
                      </a>
                  )}
              </div>
              <div className={styles.content}>
                  <h1 className={styles.titleRow}>
                      {product.name}
                      {product.ageRating && (
                          <span
                              className={`${styles.ageBadge} ${styles["age" + product.ageRating.replace("+", "p")]}`}
                              aria-label={`Вікове обмеження: ${product.ageRating}`}
                              title={`Вікове обмеження: ${product.ageRating}`}
                          >
                {product.ageRating}
              </span>
                      )}
                  </h1>

                  {product && <GoodreadsRating product={product} compact/>}

                  {product.descriptionHtml && (
                      <div className={styles.desc} dangerouslySetInnerHTML={{__html: product.descriptionHtml}}/>
                  )}

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
                                      <span>{itemFormat === "paper" ? "Паперова" : "Електронна"} • {getPrice(f)} грн</span>
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
                          title={itemInCart ? "Вже в кошику" : "Додати до кошика"}>
                            <i className={itemInCart ? "fas fa-check" : "fas fa-cart-plus"}></i>
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

          {product.excerptHtml && (
              <ExcerptDialog open={excerptOpen} onClose={() => setExcerptOpen(false)} title={product.name}
                             html={product.excerptHtml}/>
          )}
      </section>
  );
}