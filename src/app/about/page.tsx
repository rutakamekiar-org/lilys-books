import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
import { SITE_AUTHOR } from "@/lib/site";
import { absoluteUrl } from "@/lib/site.server";

const ABOUT_DESCRIPTION = "Коротка біографія, творчий шлях, посилання на соцмережі та контакти.";
const ABOUT_SOCIAL_IMAGE = absoluteUrl("/images/photo_2025-09-21_20-57-11.jpg");

export const metadata: Metadata = {
  title: "Про мене — Лілія Кухарець",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    locale: "uk_UA",
    title: "Про Лілію Кухарець",
    description: ABOUT_DESCRIPTION,
    url: "/about",
    images: [{ url: ABOUT_SOCIAL_IMAGE, alt: SITE_AUTHOR }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Про Лілію Кухарець",
    description: ABOUT_DESCRIPTION,
    images: [ABOUT_SOCIAL_IMAGE],
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
            src="/images/photo_2025-09-21_20-57-11.jpg"
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
