import type { ProductItem} from "@/models/Product";
import styles from "./PriceText.module.css";

export default function PriceText({ productItem,label }: { productItem: ProductItem, label: string }) {
    return (
        <>{label}
            {productItem.discountPrice &&
                <span className={styles.priceBlock}>
                    <del className={styles.oldPrice}>{productItem.price}</del>
                    <span className={styles.price}>{productItem.discountPrice} грн</span>
                </span>
            || `${productItem.price} грн`
            }
        </>
    );
}