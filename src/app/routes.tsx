import { createBrowserRouter } from "react-router";
import { VideoCollectionWrapper } from "./components/VideoCollectionWrapper";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: VideoCollectionWrapper,
  },
  {
    path: "/:slug",
    Component: VideoCollectionWrapper,
  },
]);
