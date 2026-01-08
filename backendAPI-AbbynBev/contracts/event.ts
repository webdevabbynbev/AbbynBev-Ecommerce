declare module '@adonisjs/core/types' {
  interface EventsList {
    set_activity_log: {
      roleName?: string
      userName?: string
      activity: string
      menu?: string
      data?: any
    }
  }
}
