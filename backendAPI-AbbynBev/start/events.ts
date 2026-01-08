import emitter from '@adonisjs/core/services/emitter'
import ActivityLog from '#models/activity_log'

emitter.on('set_activity_log', async (payload) => {
  try {
    const activityLog = new ActivityLog()

    activityLog.roleName = payload.roleName
    activityLog.userName = payload.userName
    activityLog.activity = payload.activity
    activityLog.menu = payload.menu
    activityLog.data = payload.data

    await activityLog.save()
  } catch (error) {
    console.error('Failed to save activity log:', error)
  }
})
