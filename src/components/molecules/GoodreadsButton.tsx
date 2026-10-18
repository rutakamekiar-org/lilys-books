import Icon from "@/components/atoms/Icon";
import Button from "@/components/atoms/Button";
import { getExternalBookRatingType, type Product } from "@/models/Product";

function getGoodreadsUrl(product: Product): string | undefined {
  const rating = product.externalBookRatings.find(x => getExternalBookRatingType(x) === "goodreads");
  return rating?.externalId ? `https://www.goodreads.com/book/show/${rating.externalId}` : undefined;
}

// "Reviews on Goodreads" link, shown under the cover in BookDetail and by GoodreadsRating.
// Uses only the rating embedded in the Product; renders nothing without a Goodreads id.
export default function GoodreadsButton({ product, fullWidth, className }: { product: Product; fullWidth?: boolean; className?: string }) {
  const url = getGoodreadsUrl(product);
  if (!url) return null;

  return (
    <Button
      variant="secondary"
      fullWidth={fullWidth}
      className={className}
      href={url}
      target="_blank"
      rel="noopener"
      aria-label="Перейти на сторінку книги на Goodreads"
    >
      <Icon name="goodreads" />
      <span>Відгуки на Goodreads</span>
    </Button>
  );
}
