import { router } from "./trpc";
import { contentRouter } from "./routers/content";
import { contentTypeRouter } from "./routers/content-type";
import { fieldRouter } from "./routers/field";
import { revisionRouter } from "./routers/revision";
import { userRouter } from "./routers/user";
import { pluginRouter } from "./routers/plugin";
import { mediaRouter } from "./routers/media";

export const appRouter = router({
  content: contentRouter,
  contentType: contentTypeRouter,
  field: fieldRouter,
  revision: revisionRouter,
  user: userRouter,
  plugin: pluginRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
