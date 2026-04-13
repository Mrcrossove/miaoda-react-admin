const missingSupabaseEnvMessage =
  'Supabase has been disabled in the self-hosted deployment. Do not use src/db/supabase.ts.';

function fail() {
  throw new Error(missingSupabaseEnvMessage);
}

const storageBucket = {
  upload: fail,
  getPublicUrl: fail,
};

const tableQuery = {
  select: fail,
  insert: fail,
  update: fail,
  delete: fail,
  eq: fail,
  order: fail,
  maybeSingle: fail,
};

export const supabase = {
  from: () => tableQuery,
  rpc: fail,
  functions: {
    invoke: fail,
  },
  storage: {
    from: () => storageBucket,
  },
};
