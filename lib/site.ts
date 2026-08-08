/** Canonical site origin for the rare server-only context where an
 * absolute URL can't be avoided -- currently just Next's `metadataBase`
 * (app/layout.tsx), used to resolve relative OpenGraph/Twitter image URLs.
 *
 * Deliberately NOT used for client-side navigation or the Copy Link share
 * affordance -- those always resolve a museum's real, currently-running
 * origin from the browser itself (`window.location.origin`, see
 * components/museum/CopyLinkButton.tsx), so "View Museum" and "Copy Link"
 * work correctly in local dev, any preview deployment, and production
 * without this value ever needing to be right.
 *
 * Configurable via NEXT_PUBLIC_SITE_URL (see .env.example); falls back to a
 * placeholder domain since this prototype has no deployed domain yet.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mymuseum.example.com";
