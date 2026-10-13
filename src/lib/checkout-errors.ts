export type CheckoutField = "firstName" | "lastName" | "email" | "phone" | "department" | "orderNote";

export const checkoutFieldLabels: Record<CheckoutField, string> = {
  firstName: "Ім’я", lastName: "Прізвище", email: "Email", phone: "Телефон",
  department: "Відділення Нової Пошти", orderNote: "Коментар до замовлення",
};

export interface CheckoutFailure {
  kind: "rejected" | "temporary";
  fields: Partial<Record<CheckoutField, string>>;
  items: Record<string, string>;
  cart?: string;
  promo?: string;
  unknown: boolean;
}

const fieldPaths: Record<string, CheckoutField> = {
  "customer.firstname": "firstName", "customer.lastname": "lastName",
  "customer.email": "email", "customer.phone": "phone", "customer.department": "department",
  "customer.department.id": "department", "customer.department.shortname": "department",
  "customer.department.address": "department", ordernote: "orderNote",
};

const fieldMessages: Record<CheckoutField, string> = {
  firstName: "Перевірте ім’я: воно обов’язкове та має містити до 100 символів.",
  lastName: "Перевірте прізвище: воно обов’язкове та має містити до 100 символів.",
  email: "Перевірте адресу email: вкажіть дійсну адресу до 320 символів.",
  phone: "Перевірте телефон: введіть від 10 до 14 цифр.",
  department: "Оберіть інше відділення Нової Пошти та перевірте адресу доставки.",
  orderNote: "Перевірте коментар до замовлення: до 500 символів.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Interpret only known paths. Server titles, messages, details and unknown paths
 * never become customer-facing text. Item indices refer to the submitted cart. */
export function getCheckoutFailure(error: unknown, submittedItems: readonly { itemId: string; format: "paper" | "digital" }[]): CheckoutFailure {
  const status = isRecord(error) ? error.status : undefined;
  const failure: CheckoutFailure = { kind: typeof status === "number" && status >= 400 && status < 500 ? "rejected" : "temporary", fields: {}, items: {}, unknown: false };
  const details = isRecord(error) && isRecord(error.details) ? error.details : undefined;
  const errors = details && isRecord(details.errors) ? details.errors : undefined;
  if (status !== 400 || !errors || Object.keys(errors).length === 0) {
    failure.unknown = failure.kind === "rejected";
    return failure;
  }
  const hasPhysical = submittedItems.some(item => item.format === "paper");
  for (const [rawPath, messages] of Object.entries(errors)) {
    if (!Array.isArray(messages) || !messages.some(message => typeof message === "string" && message.trim())) {
      failure.unknown = true;
      continue;
    }
    const path = rawPath.toLowerCase().replace(/^\$\./, "").replace(/^request\./, "");
    const field = Object.hasOwn(fieldPaths, path) ? fieldPaths[path] : undefined;
    if (field && (hasPhysical || (field !== "phone" && field !== "department"))) {
      failure.fields[field] = fieldMessages[field];
      continue;
    }
    const itemMatch = /^items\[(\d+)\](?:\.(productid|quantity))?$/.exec(path);
    const item = itemMatch && submittedItems[Number(itemMatch[1])];
    if (item) {
      failure.items[item.itemId] = itemMatch[2] === "quantity"
        ? "Перевірте кількість цього товару в кошику."
        : "Перевірте доступність цього товару: змініть або видаліть його з кошика.";
    } else if (path === "items") {
      failure.cart = "Перевірте склад і кількість товарів у кошику.";
    } else if (path === "promocode") {
      failure.promo = "Перевірте або видаліть промокод у кошику.";
    } else {
      failure.unknown = true;
    }
  }
  return failure;
}
