#!/usr/bin/env node
/**
 * Migration Script: Supabase → Firebase
 * 
 * This script exports data from Supabase and imports it into Firestore.
 * It also exports Supabase Auth users for import into Firebase Auth.
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js firebase-admin
 *
 * Usage:
 *   1. Set environment variables (see below)
 *   2. Run: node scripts/migrate-to-firebase.mjs
 *
 * Environment Variables:
 *   SUPABASE_URL          - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY  - Supabase service role key (NOT anon key)
 *   GOOGLE_APPLICATION_CREDENTIALS - Path to Firebase service account JSON
 */

import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    console.error('   Set them as environment variables before running.');
    process.exit(1);
}

// Initialize Supabase (service role for full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS)
admin.initializeApp();
const db = admin.firestore();

// ──────────────────────────────────────────────
// Table → Collection mapping
// Supabase snake_case → Firestore camelCase
// ──────────────────────────────────────────────

const TABLE_MAP = {
    'profiles': 'profiles',               // keep same, uses user UID as doc id
    'conversation_transcripts': 'conversationTranscripts',
    'voice_calls': 'voiceCalls',
    'jobs': 'jobs',
    'work_hours': 'workHours',
    'mileage_logs': 'mileageLogs',
    'van_inventory': 'vanInventory',
    'quotes': 'quotes',
    'invoices': 'invoices',
    'cp12_records': 'cp12Records',
    'job_photos': 'jobPhotos',
    'photo_analyses': 'photoAnalyses',
    'shared_documents': 'sharedDocuments',
    'regulation_chunks': 'regulationChunks',
};

// ──────────────────────────────────────────────
// Migration Functions
// ──────────────────────────────────────────────

async function migrateTable(supabaseTable, firestoreCollection, options = {}) {
    const { useIdAsDocId = false, idField = 'id' } = options;

    console.log(`\n📦 Migrating: ${supabaseTable} → ${firestoreCollection}`);

    const { data, error } = await supabase
        .from(supabaseTable)
        .select('*');

    if (error) {
        console.error(`   ❌ Error fetching ${supabaseTable}:`, error.message);
        return 0;
    }

    if (!data || data.length === 0) {
        console.log(`   ⚠️  No data found in ${supabaseTable}`);
        return 0;
    }

    console.log(`   📄 Found ${data.length} records`);

    const batch = db.batch();
    let count = 0;

    for (const row of data) {
        const docRef = useIdAsDocId
            ? db.collection(firestoreCollection).doc(String(row[idField]))
            : db.collection(firestoreCollection).doc();

        // Remove the id field from data (Firestore uses the doc ID)
        const { id, ...docData } = row;
        batch.set(docRef, docData);
        count++;

        // Firestore batch limit is 500
        if (count % 500 === 0) {
            await batch.commit();
            console.log(`   ✅ Committed batch (${count} so far)`);
        }
    }

    if (count % 500 !== 0) {
        await batch.commit();
    }

    console.log(`   ✅ Migrated ${count} records`);
    return count;
}

async function exportAuthUsers() {
    console.log('\n👤 Exporting Supabase Auth users...');

    // Use Supabase Admin API to list users
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('   ❌ Error fetching users:', error.message);
        return;
    }

    const users = data?.users || [];
    console.log(`   📄 Found ${users.length} auth users`);

    if (users.length === 0) return;

    // Export to file for Firebase Auth import
    const exportData = users.map(u => ({
        uid: u.id,                          // Preserve Supabase UID
        email: u.email,
        email_verified: u.email_confirmed_at != null,
        display_name: u.user_metadata?.display_name || u.email?.split('@')[0] || '',
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
    }));

    const exportPath = new URL('./auth-users-export.json', import.meta.url).pathname;
    writeFileSync(
        exportPath,
        JSON.stringify(exportData, null, 2)
    );

    console.log(`   ✅ Exported ${users.length} users to scripts/auth-users-export.json`);
    console.log('   ℹ️  To import into Firebase Auth, use:');
    console.log('      node scripts/import-auth-users.mjs');
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
    console.log('🔥 Gas Genie Migration: Supabase → Firebase');
    console.log('═'.repeat(50));

    let totalRecords = 0;

    // Migrate profiles (use user id as document ID to preserve references)
    totalRecords += await migrateTable('profiles', 'profiles', {
        useIdAsDocId: true,
    });

    // Migrate all other tables
    for (const [sbTable, fsCollection] of Object.entries(TABLE_MAP)) {
        if (sbTable === 'profiles') continue; // Already done
        totalRecords += await migrateTable(sbTable, fsCollection);
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`✅ Data migration complete! ${totalRecords} total records migrated.`);

    // Export auth users
    await exportAuthUsers();

    console.log('\n🎉 Migration finished!');
    console.log('\nNext steps:');
    console.log('  1. Import auth users with: node scripts/import-auth-users.mjs');
    console.log('  2. Deploy Cloud Functions: cd functions && npm run deploy');
    console.log('  3. Set Cloud Function secrets:');
    console.log('     firebase functions:secrets:set GEMINI_API_KEY');
    console.log('     firebase functions:secrets:set PINECONE_API_KEY');
    console.log('  4. Update Vercel env vars with Firebase config');
}

main().catch(console.error);
