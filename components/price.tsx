import type { Price, Service } from "@/content/types";
import { formatPrice } from "@/lib/format";

export function PriceValue({ price, style }: { price: Price; style?: "plus" | "from" }) {
  const value = formatPrice(price, style);
  return price.confirmed === false ? <span className="price-pending">{value}</span> : <>{value}</>;
}

export function ServicePriceLine({ service }: { service: Service }) {
  const price = service.prices?.find(({ label }) => label === service.homePriceLabel);
  return <>{service.homeLine}{price && <> <PriceValue price={price} style="from" /></>}</>;
}

export function ServiceStartingPriceLine({ service }: { service: Service }) {
  // Category starting prices exclude hourly/fixed rates and unconfirmed offers.
  const price = service.prices
    ?.filter((item) => item.confirmed !== false && !item.fixed && !item.unit)
    .sort((a, b) => a.from - b.from)[0];
  return <>{service.name}{price && <> <PriceValue price={price} style="from" /></>}</>;
}
