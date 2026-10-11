//import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { createSupabaseProfileCatalogRepository } from "./repositories/supabase-profile-catalog.repository";
import { createProfileCatalogService } from "./services/profile-catalog.service";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function main(): Promise<void> {
  const client = createClient<Database>(requireEnvironmentVariable("EXPO_PUBLIC_SUPABASE_URL"), requireEnvironmentVariable("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const email = requireEnvironmentVariable("RANKED_TEST_EMAIL");
  const password = requireEnvironmentVariable("RANKED_TEST_PASSWORD");
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed: ${error.message}`);

  try {
    const repository = createSupabaseProfileCatalogRepository(client);
    const service = createProfileCatalogService(repository);
    const profile = await service.getEffectiveProfile("schema:Movie");
    console.log(profile.profileVersions);
    console.table(profile.fields.map(field => ({ property: field.propertyId, definedOn: field.definedOn, sources: field.sourceBindings.map(binding => binding.sourcePropertyId).join(", ") })));
  } finally {
    await client.auth.signOut({ scope: "local" });
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Profile check failed.");
  process.exitCode = 1;
});
