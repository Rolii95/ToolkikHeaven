declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  type ServeHandler = (request: Request) => Response | Promise<Response>
  interface ServeOptions {
    onError?: (error: unknown) => Response | Promise<Response>
  }

  export function serve(handler: ServeHandler, options?: ServeOptions): void
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js'
  export { createClient } from '@supabase/supabase-js'
}

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}
