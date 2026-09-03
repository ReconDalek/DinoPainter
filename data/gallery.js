// data/gallery.js
// The gallery is now entirely member-submitted: designs come from the API
// (/api/designs, approved in the admin panel). This list is kept only as an
// optional curated seed — add entries here to pin featured designs.
//
// Entry shape:
//   { id, dino, title, preset | colors, blurb, credit }
//   - preset: a key from PRESETS, laid across the creature's regions
//   - colors: explicit { regionIndex: colourID } (wins over preset)
const GALLERY = [];
