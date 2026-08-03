let lastUpdatedAt = null;

/**
 * Placeholder for the background sync that pulls Agent-CRM activity into the
 * local tables (records, interactions, callbacks, audits). Wire it up to a
 * scheduler (node-cron / setInterval) from main.js once the CRM source is known.
 */
export async function runSync() {
  // TODO: pull recent Agent-CRM data and upsert into db.Record / db.Interaction.
  lastUpdatedAt = new Date();
}

export const syncService = {
  runSync,
  lastUpdatedMinutesAgo() {
    if (!lastUpdatedAt) return null;
    return Math.max(0, Math.round((Date.now() - lastUpdatedAt.getTime()) / 60000));
  },
};
