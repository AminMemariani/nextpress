import { router } from "./trpc";
import { contentRouter } from "./routers/content";
import { contentTypeRouter } from "./routers/content-type";
import { fieldRouter } from "./routers/field";
import { revisionRouter } from "./routers/revision";
import { userRouter } from "./routers/user";
import { pluginRouter } from "./routers/plugin";
import { mediaRouter } from "./routers/media";
import { searchRouter } from "./routers/search";
import { commentRouter } from "./routers/comment";
import { settingsRouter } from "./routers/settings";
import { menuRouter } from "./routers/menu";

export const appRouter = router({
  content: contentRouter,
  contentType: contentTypeRouter,
  field: fieldRouter,
  revision: revisionRouter,
  user: userRouter,
  plugin: pluginRouter,
  media: mediaRouter,
  search: searchRouter,
  comment: commentRouter,
  settings: settingsRouter,
  menu: menuRouter,
});

export type AppRouter = typeof appRouter;
