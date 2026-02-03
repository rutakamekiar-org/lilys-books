"use client";

import React from "react";

export default function Contacts() {
  return (
    <section aria-labelledby="contacts-title" id="contacts">
      <h2 id="contacts-title" className="visuallyHidden">Контакти</h2>
      <ul className="socialLinks" aria-label="Зворотній зв'язок">
        <li>
          <a
            href="https://www.instagram.com/time4ice"
            target="_blank"
            rel="noopener"
            aria-label="Instagram"
          >
            <i className="fa-brands fa-instagram" aria-hidden="true"></i>
          </a>
        </li>
        <li>
          <a
            href="https://www.threads.com/@time4ice"
            target="_blank"
            rel="noopener"
            aria-label="Threads"
          >
            <i className="fa-brands fa-threads" aria-hidden="true"></i>
          </a>
        </li>
        <li>
          <a
            href="mailto:lillykukharets0325@gmail.com"
            aria-label="Email"
          >
            <i className="fa-solid fa-envelope" aria-hidden="true"></i>
          </a>
        </li>
        <li>
          <a
            href="https://www.goodreads.com/book/show/231547139"
            target="_blank"
            rel="noopener"
            aria-label="GoodReads"
          >
            <i className="fa-brands fa-goodreads" aria-hidden="true"></i>
          </a>
        </li>
        <li>
          <a
            href="https://www.amazon.com/%D0%97%D0%B2%D0%B8%D1%87%D0%B0%D0%B9%D0%BD%D0%B0-Ukrainian-%D0%9B%D1%96%D0%BB%D1%96%D1%8F-%D0%9A%D1%83%D1%85%D0%B0%D1%80%D0%B5%D1%86%D1%8C/dp/B0F5GF9SL9"
            target="_blank"
            rel="noopener"
            aria-label="Amazon"
          >
            <i className="fa-brands fa-amazon" aria-hidden="true"></i>
          </a>
        </li>
      </ul>
    </section>
  );
}
