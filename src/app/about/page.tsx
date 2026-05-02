import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
import { addBasePath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Про мене — Лілія Кухарець",
  description: "Коротка біографія, творчий шлях, посилання на соцмережі та контакти.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Про Лілію Кухарець",
    description: "Біографія, творчий шлях, соцмережі та контакти Лілії Кухарець.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <section className={styles.about}>
      <div className={styles.inner}>
        <div>
          <h1 className={styles.title}>Про мене</h1>
          <p className={styles.text}>
            Привіт) Я - Лілія Кухарець, для вас просто Ліля.<br/>Амбасадорка ромапокаліптики, адептка культу ниття і фанатка котиків.<br/>
            Народилася в Житомирі, тому цілком імовірно, такої авторки не існує. А ще через це мова дебютної книги «Звичайна» сповнена фразами, слівцями та особливостями побудови речень, притаманних Житомирщині.
              <br/>За професією програмістка. Вдень пишу ігри, вночі - книги. <br/>Мої пристрасті - кава з апельсиновим соком попри гастрит, подорожі попри постійну втому і вигадування нових сюжетів попри недописаність старих, упс. Люблю перешкоди, як бачите.
              <br/>  І спілкування теж люблю, особливо щодо книг. Пишіть мені, поговоримо 💚
          </p>
        </div>
        <div className={styles.photo}>
          <Image
            className={styles.img}
            src={addBasePath("/images/photo_2025-09-21_20-57-11.jpg")}
            alt={"Лілія Кухарець"}
            width={360}
            height={540}
            sizes="(max-width: 780px) 70vw, 320px"
            priority
          />
        </div>
      </div>
    </section>
  );
}
