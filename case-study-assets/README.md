# Case study capture plan

Guidance for turning this prototype into a UX case study. Nothing in this folder is auto-generated -- it's a shot list to work through manually with the app running (`npm run dev`, or `npm run build && npm run start` for production-accurate visuals).

General settings: capture at 1440×900 for desktop shots (matches the sizes used during development/QA) and 390×844 for mobile shots. Use two side-by-side browser windows for anything involving multiplayer. Wait a couple of seconds after navigation before capturing so 3D textures/fonts finish loading.

## Shot list

1. **Landing-page hero** -- `/`, top of page. Wait ~3-5s for the 3D preview panel to finish loading avatars and artwork before capturing.
2. **Artist profile** -- `/artist/iris-calloway`, full page (or at least the profile header + museum-preview card).
3. **Avatar editor** -- `/avatar`. Try capturing mid-interaction (e.g. hovering a hairstyle option) as well as the resting state.
4. **Third-person museum** -- `/museum/demo-artist`, standing a few steps in from spawn with 2-3 artworks visible on the walls.
5. **Two live visitors together** -- open `/museum/demo-artist` in two windows, move one avatar into view of the other, capture both windows (side by side, or one window showing the remote avatar).
6. **Artwork interaction prompt** -- walk up to any frame until "Press E to view" appears; capture before pressing E.
7. **Focused artwork view** -- press E on any piece; capture the open dialog with title/artist/year/medium/description visible.
8. **Sequential artwork navigation** -- with the dialog open, capture the "N of 8" indicator, ideally alongside the Previous/Next buttons.
9. **Artwork grid (accessibility mode)** -- either `/artist/iris-calloway#grid` or the museum's Controls panel → "Switch to accessible grid view".
10. **Mobile layouts** -- 390px width captures of the landing page, artist profile, avatar editor, and create-museum form (full page, scrolling as needed).
11. **Museum floor plan variety** -- walk from the Entrance Hall through the doorway into the Main Gallery (Museum Blue) to show the room-to-room reveal, plus one shot each of the West Wing (sage), East Wing (terracotta), and the Far Room (charcoal) to show the theme variety.
12. **Create-your-own flow** -- `/create` with a couple of pieces uploaded and filled in, plus the success screen showing the generated shareable link.

## Notes for the case study write-up

- Don't present any of the "How this was verified" checks in the README as user research or usability testing -- they're engineering/QA checks (build, lint, multiplayer protocol, accessibility mechanics, responsive overflow), not evidence about real users.
- If you run actual usability sessions or gather real feedback later, that's the place to add findings -- there are none baked into this repo to misrepresent.
- The artwork shown throughout is original placeholder work (see the README's "Artwork assets" section) -- say so plainly in the case study rather than presenting it as a real artist's portfolio.
