// URL-only imports: the stylesheets are emitted as separate assets and attached when
// the app opens (or by the route that server-renders it), never to every page.
import spotifyStylesUrl from "./spotify/spotify.css?url";
import netflixStylesUrl from "./media-apps.css?url";
import { NETFLIX_BASE_PATH, SPOTIFY_BASE_PATH } from "../../lib/app-routes";

export const SPOTIFY_STYLES_URL: string = spotifyStylesUrl;
export const NETFLIX_STYLES_URL: string = netflixStylesUrl;

const ROUTE_STYLES: ReadonlyArray<readonly [prefix: string, href: string]> = [
  [SPOTIFY_BASE_PATH, SPOTIFY_STYLES_URL],
  [NETFLIX_BASE_PATH, NETFLIX_STYLES_URL],
];

/** Stylesheets for apps that the desktop shell server-renders on this route. */
export function appStylesForPath(pathname: string): string[] {
  return ROUTE_STYLES.filter(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)).map(
    ([, href]) => href,
  );
}
