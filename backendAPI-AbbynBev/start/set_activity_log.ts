import emitter from '@adonisjs/core/services/emitter'
import ActivityLog from '#models/activity_log'

interface ActivityLogPayload {
  roleName: string
  userName: string
  activity: string
  menu: string
  data: any
}

// @ts-ignore
emitter.on('set:activity-log', async function (payload: ActivityLogPayload) {
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
