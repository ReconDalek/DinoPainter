// data/gallery.js
// Curated showcase of creature colour designs.
//
// Each entry:
//   id      - stable slug, used in the /design.html?id= permalink
//   dino    - a key from DINOS
//   title   - display name for the design
//   preset  - (optional) a key from PRESETS, laid across the creature's regions
//   colors  - (optional) explicit { regionIndex: colourID } map (wins over preset)
//   blurb   - one-line description shown on the design page
//   credit  - who made it
//
// To add a community submission: drop a new object at the top of the list.
const GALLERY = [
  {
    id: "molten-rex",
    dino: "rex",
    title: "Molten Rex",
    preset: "lava",
    blurb: "A Rex glowing like cooling magma — charcoal body with searing orange seams.",
    credit: "DinoPainter"
  },
  {
    id: "abyssal-spino",
    dino: "spino",
    title: "Abyssal Spino",
    preset: "ocean",
    blurb: "Deep-water blues fading across the sail of a Spinosaurus.",
    credit: "DinoPainter"
  },
  {
    id: "neon-raptor",
    dino: "raptor",
    title: "Neon Raptor",
    preset: "neon",
    blurb: "High-visibility pack raptor built for a modded PvP arena.",
    credit: "DinoPainter"
  },
  {
    id: "frostbite-direwolf",
    dino: "direwolf",
    title: "Frostbite Direwolf",
    preset: "frost",
    blurb: "Pale blues and white for a snow-map alpha wolf.",
    credit: "DinoPainter"
  },
  {
    id: "goldenhour-argentavis",
    dino: "argentavis",
    title: "Golden Hour Argy",
    preset: "sunset",
    blurb: "Warm sunset gradient across wings and body — a clean flyer skin.",
    credit: "DinoPainter"
  },
  {
    id: "voidscale-rockdrake",
    dino: "rock_drake",
    title: "Voidscale Rock Drake",
    preset: "shadow",
    blurb: "Near-black plumage with a faint violet sheen for Aberration runs.",
    credit: "DinoPainter"
  },
  {
    id: "toxic-therizino",
    dino: "carnotaurus",
    title: "Toxic Carno",
    preset: "toxic",
    blurb: "Acid greens over a dark hide — reads well at a distance.",
    credit: "DinoPainter"
  },
  {
    id: "royal-giga",
    dino: "giganotosaurus",
    title: "Royal Giga",
    preset: "royal",
    blurb: "Deep purples and gold for a boss-fight centrepiece.",
    credit: "DinoPainter"
  },
  {
    id: "arcticops-yuty",
    dino: "yutyrannus",
    title: "Arctic Ops Yuty",
    preset: "tundra",
    blurb: "Muted greys and ice tones — a subtle courage-buffer skin.",
    credit: "DinoPainter"
  },
  {
    id: "emberwing-pteranodon",
    dino: "pteranodon",
    title: "Emberwing Ptera",
    preset: "dragonfire",
    blurb: "Full six-region fire scheme on the classic starter flyer.",
    credit: "DinoPainter"
  },
  {
    id: "jungle-stego",
    dino: "stegosaurus",
    title: "Canopy Stego",
    preset: "jungle_deep",
    blurb: "Layered greens for a natural jungle-map look.",
    credit: "DinoPainter"
  },
  {
    id: "vaporwave-managarmr",
    dino: "managarmr",
    title: "Vaporwave Mana",
    preset: "vaporwave",
    blurb: "Pink and cyan pastels — a fan-favourite aesthetic build.",
    credit: "DinoPainter"
  },
  {
    id: "warpaint-allosaurus",
    dino: "allosaurus",
    title: "Warpaint Allo",
    preset: "autumn",
    blurb: "Earthy reds and browns for a pack-hunter tribe theme.",
    credit: "DinoPainter"
  },
  {
    id: "galaxy-thylacoleo",
    dino: "thylacoleo",
    title: "Galaxy Thyla",
    preset: "galaxy",
    blurb: "Cosmic blues and purples on the tree-cat.",
    credit: "DinoPainter"
  },
  {
    id: "classic-dodo",
    dino: "dodo",
    title: "Bubblegum Dodo",
    preset: "bubblegum",
    blurb: "Because someone always paints the Dodo.",
    credit: "DinoPainter"
  }
];
