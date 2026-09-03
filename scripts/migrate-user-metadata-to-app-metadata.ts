import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}


const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function migrate() {
  console.log("Starting migration: user_metadata.tenant_id -> app_metadata.tenant_id...");

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    console.error("Error listing users:", error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users to check.`);

  let updatedCount = 0;
  for (const user of users) {
    const userMetadataTenant = user.user_metadata?.tenant_id;
    const currentAppMetadataTenant = user.app_metadata?.tenant_id;

    if (userMetadataTenant && !currentAppMetadataTenant) {
      console.log(`Migrating user ${user.email} (${user.id}): setting app_metadata.tenant_id = "${userMetadataTenant}"`);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          app_metadata: {
            ...user.app_metadata,
            tenant_id: userMetadataTenant,
          },
        }
      );

      if (updateError) {
        console.error(`Failed to update user ${user.id}:`, updateError);
      } else {
        updatedCount++;
      }
    } else if (currentAppMetadataTenant) {
      console.log(`User ${user.email} already has app_metadata.tenant_id = "${currentAppMetadataTenant}". Skipping.`);
    } else {
      console.log(`User ${user.email} has no tenant_id in user_metadata. Skipping.`);
    }
  }

  console.log(`Migration complete. Successfully updated ${updatedCount} users.`);
}

migrate().catch(console.error);
