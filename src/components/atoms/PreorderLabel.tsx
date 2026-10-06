import type { ProductItem } from "@/models/Product";
import { isPreorder } from "@/lib/product-item.helper";
import styles from "./PreorderLabel.module.css";

export default function PreorderLabel({ item }: { item?: ProductItem }) {
  return isPreorder(item) ? <span className={styles.label}>Передзамовлення</span> : null;
}
