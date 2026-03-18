import { router } from "./trpc";
import { contentRouter } from "./routers/content";
import { contentTypeRouter } from "./routers/content-type";
import { fieldRouter } from "./routers/field";
import { revisionRouter } from "./routers/revision";
import { userRouter } from "./routers/user";

export const appRouter = router({
  content: contentRouter,
  contentType: contentTypeRouter,
  field: fieldRouter,
  revision: revisionRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
