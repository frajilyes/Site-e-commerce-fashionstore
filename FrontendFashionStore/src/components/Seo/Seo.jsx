import { useLocation } from "react-router-dom";
import {
  DEFAULT_META,
  SITE_URL,
  resolveRouteMeta,
} from "../../seo/routeMeta";

const Seo = () => {
  const { pathname } = useLocation();
  const meta = resolveRouteMeta(pathname);
  const canonical = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={meta.robots ?? DEFAULT_META.robots} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </>
  );
};

export default Seo;
