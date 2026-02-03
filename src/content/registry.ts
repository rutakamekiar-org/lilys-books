import inaksha from "./books/inaksha";
import inakshaArt from "./books/inaksha-art";
import zvychajna from "./books/zvychajna";
import pid_shepit_snihu from "./books/pid_shepit_snihu";
import {ExternalLink} from "@/models/Product";

export interface StaticMetadata {
  descriptionHtml?: string;
  excerptHtml?: string;
  externalLinks?: ExternalLink[];
}

export const PRODUCT_METADATA: Record<string, StaticMetadata> = {
  "inaksha": {
    ...inaksha,
    externalLinks: []
  },
  "inaksha-art": {
    ...inakshaArt,
    externalLinks: []
  },
  "zvychajna": {
    ...zvychajna,
    externalLinks: [
      { type: "youtube", link: "https://www.youtube.com/watch?v=UznBnjro79c" },
      { type: "riga", link: "https://ua-books.eu/products/%D0%BA%D0%BD%D0%B8%D0%B3%D0%B0-%D0%B7%D0%B2%D0%B8%D1%87%D0%B0%D0%B9%D0%BD%D0%B0-%D0%BB%D1%96%D0%BB%D1%96%D1%8F-%D0%BA%D1%83%D1%85%D0%B0%D1%80%D0%B5%D1%86%D1%8C" }
    ]
  },
  "pid_shepit_snihu": {
    ...pid_shepit_snihu,
    externalLinks: [
      { type: "publisher", link: "https://bohdan-books.com/catalog/book/318531" }
    ]
  },
};
