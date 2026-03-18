/// <reference types="next" />
/// <reference types="next/image-types/global" />

// ============================================================================
// Auth.js type augmentation
// ============================================================================

import type { SessionUser } from "@nextpress/core/auth/auth-types";

declare module "next-auth" {
  interface Session {
    user: SessionUser & {
      id: string;
      email: string;
    };
  }

  interface User {
    id: string;
    displayName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    displayName?: string | null;
  }
}
