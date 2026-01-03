import emitter from '@adonisjs/core/services/emitter'

export type ActivityLogPayload = {
  roleName?: string
  userName?: string
  activity: string
  menu: string
  data?: any
}

export class ActivityLogService {
  public static async log(payload: ActivityLogPayload) {
    await (emitter as any).emit('set:activity-log', payload)
  }
}
