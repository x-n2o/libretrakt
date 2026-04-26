import { handleRequest } from "../src/router.js";
import type { Env } from "../src/types.js";

export const onRequest: PagesFunction<Env> = (context) => {
  return handleRequest(context.request, context.env, context);
};
