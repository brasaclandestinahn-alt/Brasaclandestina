declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_GA_ID?: string;
    NEXT_PUBLIC_WA_NUMBER?: string;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};
