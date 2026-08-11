export const openCashOfferCTA = () => {
  if (window.matchMedia("(min-width: 768px)").matches) {
    document.getElementById("about-cta")?.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    window.dispatchEvent(new CustomEvent("sticky_cta_open"));
  }
};
