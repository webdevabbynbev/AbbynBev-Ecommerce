import Setting from '#models/setting'

export type UpsertTextSettingResult = {
  setting: Setting
  action: 'CREATE' | 'UPDATE'
  old?: any
}

export class TextSettingService {
  public async getValue(key: string) {
    return Setting.query().select('value').where('key', key).first()
  }

  public async upsertValue(key: string, value: string): Promise<UpsertTextSettingResult> {
    const existing = await Setting.query().where('key', key).first()
    const old = existing?.toJSON()

    if (existing) {
      existing.merge({ value: value || '' })
      await existing.save()
      return { setting: existing, action: 'UPDATE', old }
    }

    const created = await Setting.create({
      key,
      group: key,
      value: value || '',
    })

    return { setting: created, action: 'CREATE' }
  }
}
