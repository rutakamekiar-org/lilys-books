"use client";
import Image from "next/image";
import { useState, Fragment } from "react";
import {BookFormat, getFormat} from "@/lib/types";
import Drawer from "./PurchaseDrawer/Drawer";
import styles from "./BookDetail.module.css";
import GoodreadsRating from "./GoodreadsRating";
import GoodreadsButton from "./GoodreadsButton";
import { addBasePath } from "@/lib/paths";
import ExcerptDialog from "./ExcerptDialog";

import type { Product } from "@/models/Product";

export default function BookDetail({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [format, setFormat] = useState<BookFormat>("paper");
  const selected = product.items.find(f => getFormat(f) === format);
  const youtubeLink = product?.externalLinks?.find(x => x.type === 'youtube')
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

          {product && <GoodreadsRating product={product} compact />}

          {product.descriptionHtml && (
            <div className={styles.desc} dangerouslySetInnerHTML={{ __html: product.descriptionHtml}} />
          )}

          <div role="radiogroup" aria-label="Формат" className={styles.segmented}>
            {product.items.map(f => {
                const itemFormat = getFormat(f);
                return (
                    <label key={f.type}
                           className={`${styles.opt} ${format === itemFormat ? styles.active : ""} ${!f.isAvailable ? styles.disabled : ""}`}>
                        <input
                            type="radio"
                            name="format"
                            value={f.type}
                            checked={format === itemFormat}
                            disabled={!f.isAvailable}
                            onChange={() => setFormat(itemFormat)}
                        />
                        <span>{itemFormat === "paper" ? "Паперова" : "Електронна"} • {f.price} грн</span>
                    </label>
                );
            })}
          </div>

          <div className={styles.buybar}>
            <button className={styles.buy} disabled={!selected?.isAvailable} onClick={() => setOpen(true)}>
              {selected?.isAvailable ? `Купити — ${selected.price} грн` : "Немає в наявності"}
            </button>
            <small className={styles.hint}>Натисніть, щоб оформити замовлення</small>
            {product.ageRating && (
              <small className={styles.hint}>Вікове обмеження: {product.ageRating}</small>
            )}
          </div>

          {product.physicalDetails && (
            <section className={styles.specs} aria-labelledby="specs-title">
              <h2 id="specs-title">Характеристики</h2>
              <dl className={styles.specsGrid}>
                {[
                  { label: "Серія", value: product.physicalDetails.seriesName },
                  { label: "Видавництво", value: product.physicalDetails.publisher },
                  { label: "Кількість сторінок", value: product.physicalDetails.pages?.toString() },
                  { label: "Тип палітурки", value: product.physicalDetails.coverType },
                  { label: "Рік видання", value: product.physicalDetails.publicationYear?.toString() },
                  { label: "Розмір", value: product.physicalDetails.size },
                  { label: "Вага", value:`${product.physicalDetails.weight} г` },
                  { label: "Тип паперу", value: product.physicalDetails.paperType },
                  { label: "ISBN", value: product.physicalDetails.isbn },
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

      <Drawer open={open} onCloseAction={() => setOpen(false)} product={product} format={format} />
      {product.excerptHtml && (
        <ExcerptDialog open={excerptOpen} onClose={() => setExcerptOpen(false)} title={product.name} html={product.excerptHtml} />
      )}
    </section>
  );
}