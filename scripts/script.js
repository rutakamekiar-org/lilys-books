document.addEventListener("DOMContentLoaded", () => {
  // === СТАН ===
  let currentType = "paper"; // 'paper' | 'digital'

  // === API ===
  const API_URL = "https://spicy-avrit-kukharets-021c9f66.koyeb.app";

  // === Drawer elements ===
  const drawer = document.getElementById("drawer_cart");
  const overlay = document.getElementById("drawer_overlay");
  const drawerContent = document.getElementById("drawer_content");
  const closeDrawerBtn = document.getElementById("close_drawer_btn");

  // === Loader ===
  const globalLoader = document.getElementById("global_loader");
  const showGlobalLoader = () => { globalLoader.style.display = "flex"; };
  const hideGlobalLoader = () => { globalLoader.style.display = "none"; };

  // === Radiogroup (головна) ===
  const mainTypeRadios = document.querySelectorAll('input[name="main_purchase_type"]');
  const mainChoiceCards = document.querySelectorAll('.choice-card');
  mainTypeRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      currentType = e.target.value;
      // візуальний active
      mainChoiceCards.forEach(card => {
        const input = card.querySelector('input[type="radio"]');
        card.classList.toggle('active', input.checked);
      });
      buyBtn.textContent = `Купити за ${priceByType(currentType)}`
    });
  });

  // === Кнопка Купити (на всю ширину) ===
  const buyBtn = document.getElementById("buy_button");
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      const checked = document.querySelector('input[name="main_purchase_type"]:checked');
      currentType = (checked?.value) || currentType || "paper";
      openDrawer(currentType);
    });
  }

  // === Drawer open/close ===
  const openDrawer = (type) => {
    currentType = type || currentType;
    populateDrawer(currentType);
    overlay.style.display = "block";
    drawer.classList.add("open");
  };
  const closeDrawer = () => {
    drawer.classList.remove("open");
    overlay.style.display = "none";
  };
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      e.preventDefault(); closeDrawer();
    }
  });

  // === Побудова контенту drawer (без внутрішнього перемикача) ===
  const priceByType = (t) => (t === "paper" ? "350 грн" : "200 грн");

  const populateDrawer = (type) => {
    currentType = type || currentType;

    let contentHTML = "";
    if (currentType === "paper") {
      contentHTML += `
        <div class="drawer-product-details">
          <img src="images/book.jpg" alt="Паперова версія" loading="lazy" />
          <h4>Звичайна: Паперова версія</h4>
          <p>${priceByType('paper')}</p>
        </div>
        <div class="drawer-purchase-button-container-checkout">
          <img src="images/monocheckout_button_black_normal.svg" id="drawer_purchase_paper" alt="Замовити" loading="lazy"/>
        </div>
      `;
    } else {
      contentHTML += `
        <div class="drawer-product-details">
          <img src="images/book.jpg" alt="Електронна версія" loading="lazy"/>
          <h4>Звичайна: Електронна версія</h4>
          <p>${priceByType('digital')}</p>
        </div>
        <div class="drawer-form-group">
          <label for="customer_email">Ваш email:</label>
          <input type="email" id="customer_email" placeholder="email@example.com" autocomplete="email" required />
        </div>
        <div class="drawer-form-group">
          <label for="customer_phone">Ваш телефон:</label>
          <input type="tel" id="customer_phone" placeholder="+380XXXXXXXXX" autocomplete="tel" required />
        </div>
        <div class="drawer-purchase-button-container">
          <img width="150" src="images/plata_dark_bg.svg" id="drawer_purchase_digital" alt="Замовити" loading="lazy"/>
        </div>
      `;
    }

    drawerContent.innerHTML = contentHTML;

    // Після рендера — навішуємо слухачі
    document.getElementById("drawer_purchase_paper")?.addEventListener("click", handlePaperPurchase);
    document.getElementById("drawer_purchase_digital")?.addEventListener("click", handleDigitalPurchase);
  };

  // === API helper ===
  const handleApiRequest = async (url, options) => {
    showGlobalLoader();
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (response.ok) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          alert("Не вдалося отримати посилання на оплату.");
          hideGlobalLoader();
        }
      } else {
        hideGlobalLoader();
        if (data.errors) {
          for (const field in data.errors) {
            if (Object.prototype.hasOwnProperty.call(data.errors, field)) {
              const errorMessage = data.errors[field][0];
              if (field === "CustomerEmail") {
                alert("Будь ласка, введіть дійсну адресу електронної пошти.");
              } else if (field === "CustomerPhone") {
                alert("Будь ласка, введіть дійсний номер телефону.");
              } else {
                alert(`Помилка: ${errorMessage}`);
              }
            }
          }
        } else {
          alert(data.title || "Виникла невідома помилка.");
        }
      }
    } catch (error) {
      console.error("POST помилка:", error);
      alert("Сервер зараз недоступний. Спробуйте ще раз за кілька хвилин.");
      hideGlobalLoader();
    }
  };

  // === Покупки ===
  const handlePaperPurchase = () => {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" }
      // body: JSON.stringify({ count: 1 }),
    };
    handleApiRequest(API_URL + "/api/checkout", options);
  };

  const handleDigitalPurchase = () => {
    const email = document.getElementById("customer_email")?.value?.trim();
    const phone = document.getElementById("customer_phone")?.value?.trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      alert("Будь ласка, введіть дійсну адресу електронної пошти.");
      return;
    }
    if (!phone || !/^\+?\d{10,14}$/.test(phone)) {
      alert("Будь ласка, введіть дійсний номер телефону.");
      return;
    }

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail: email,
        customerPhone: phone,
        productId: "c1f3c4a6-f4b1-4351-9b83-5b4b4be48896"
      })
    };
    handleApiRequest(API_URL + "/api/invoice", options);
  };
});
