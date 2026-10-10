import { site } from "@/content/site";
import { services } from "@/content/services";
import { HeaderNavigation } from "@/components/header-navigation";

export function Header() {
  return (
    <HeaderNavigation
      name={site.name}
      phone={site.phone}
      phoneHref={site.phoneHref}
      services={services.map(({ name, slug }) => ({ label: name, href: `/services/${slug}` }))}
    />
  );
}
