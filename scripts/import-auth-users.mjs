#!/usr/bin/env node
/**
 * Import Supabase Auth users into Firebase Auth
 * 
 * Prerequisites:
 *   - Run migrate-to-firebase.mjs first to generate auth-users-export.json
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var
 *
 * Usage:
 *   node scripts/import-auth-users.mjs
 *
 * NOTE: Passwords cannot be migrated from Supabase. Users will need to
 * use "Forgot Password" to set a new password in Firebase Auth.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

admin.initializeApp();

async function main() {
    console.log('🔑 Importing auth users into Firebase...\n');

    let users;
    try {
        const raw = readFileSync('scripts/auth-users-export.json', 'utf-8');
        users = JSON.parse(raw);
    } catch {
        console.error('❌ Could not read scripts/auth-users-export.json');
        console.error('   Run migrate-to-firebase.mjs first.');
        process.exit(1);
    }

    console.log(`📄 Found ${users.length} users to import\n`);

    let imported = 0;
    let skipped = 0;

    for (const u of users) {
        try {
            await admin.auth().createUser({
                uid: u.uid,
                email: u.email,
                emailVerified: u.email_verified,
                displayName: u.display_name,
            });
            console.log(`  ✅ ${u.email}`);
            imported++;
        } catch (err) {
            if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
                console.log(`  ⏭️  ${u.email} (already exists)`);
                skipped++;
            } else {
                console.error(`  ❌ ${u.email}: ${err.message}`);
            }
        }
    }

    console.log(`\n✅ Import complete: ${imported} imported, ${skipped} skipped`);
    console.log('\n⚠️  NOTE: Passwords were NOT migrated — users must use');
    console.log('   "Forgot Password" to set new credentials.');
}

main().catch(console.error);
