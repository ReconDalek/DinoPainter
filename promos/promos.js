// Offline fallback only. The live rotation is managed in the admin panel and
// served from /api/promos (D1). This list is used just when that API is
// unreachable.
const PROMOS = [
  {
    id: "server1",
    name: "Xavii ASA",
    image: "/promos/Xavii_ASA.png",
    link: "https://discord.gg/d2ShE3RDwq",
    impressions: 0,
    clicks: 0
  },
  {
    id: "server2",
    name: "TGP ASA",
    image: "/promos/TGP_ASA.webp",
    link: "https://discord.gg/4tpdPKBuHE",
    impressions: 0,
    clicks: 0
  },
  {
    id: "server3",
    name: "ExArk",
    image: "/promos/ExArk.webp",
    link: "https://discord.gg/NnxGD2wNZV",
    impressions: 0,
    clicks: 0
  }
];
