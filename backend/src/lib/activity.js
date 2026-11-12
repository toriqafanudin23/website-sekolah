import { db } from '../supabase.js'

/** Catat aktivitas admin untuk panel Aktivitas. Kegagalan mencatat tidak boleh menggagalkan permintaan. */
export async function logActivity(user, action, entity, entityId) {
  try {
    const { error } = await db().from('activity_logs').insert({ admin_id: user.id, action, entity, entity_id: entityId ?? null })
    if (error) console.error('[activity]', error.message)
  } catch (error) {
    console.error('[activity]', error.message)
  }
}
