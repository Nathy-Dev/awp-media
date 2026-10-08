import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useNavDrawer } from "../lib/useNavDrawer";

/**
 * Shell shared by every route: header, page body, footer.
 *
 * The footer sits inside `.main-content` because the ported stylesheet styles it
 * that way — `.main-content.blur` dims the whole page behind the nav drawer,
 * footer included.
 */
export function Layout() {
  const drawer = useNavDrawer();

  return (
    <>
      <Header drawer={drawer} />

      <div className={`main-content${drawer.open ? " blur" : ""}`}>
        <Outlet />
        <Footer />
      </div>

      <ScrollRestoration />
    </>
  );
}
