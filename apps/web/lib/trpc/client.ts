"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@nextpress/api";

export const trpc = createTRPCReact<AppRouter>();
