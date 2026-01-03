import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

import FileUploadService from '../../utils/upload_file_service.js'
import {
  updateProfile,
  updateProfilePicture,
  updatePasswordValidator,
  deactivateAccountValidator,
} from '#validators/auth'
import { vineMessagesToString } from '../../utils/validation.js'

export default class AuthAccountController {
  public async profile({ response, auth }: HttpContext) {
    try {
      const user = auth.user

      return response.status(200).send({
        message: 'Account successfully updated.',
        serve: user?.serialize({
          fields: [
            'id',
            'firstName',
            'lastName',
            'email',
            'phoneNumber',
            'address',
            'gender',
            'dob',
            'photoProfile',
          ],
        }),
      })
    } catch (error: any) {
      if (error?.status === 422) {
        return response.status(422).send({
          message: vineMessagesToString(error),
          serve: error.messages,
        })
      }

      return response.status(500).send({
        message: error?.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }

  public async updateProfilePicture({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateProfilePicture)
      const user: User = auth.user as User

      const image = await FileUploadService.uploadFile(payload.image, { folder: 'profile', type: 'image' })
      user.photoProfile = image
      await user.save()

      return response.status(200).send({
        message: 'Profile picture successfully updated.',
        serve: true,
      })
    } catch (error: any) {
      if (error?.status === 422) {
        return response.status(422).send({
          message: vineMessagesToString(error),
          serve: error.messages,
        })
      }

      return response.status(500).send({
        message: error?.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }

  public async updateProfile({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateProfile)
      const user: User = auth.user as User

      if ((payload as any).image) {
        const image = await FileUploadService.uploadFile(request.file('image'), {
          folder: 'profile',
          type: 'image',
        })
        Object.assign(payload, { photoProfile: image })
      }

      user.merge(payload as any)
      await user.save()

      return response.status(200).send({
        message: 'Account successfully updated.',
        serve: true,
      })
    } catch (error: any) {
      if (error?.status === 422) {
        return response.status(422).send({
          message: vineMessagesToString(error),
          serve: error.messages,
        })
      }

      return response.status(500).send({
        message: error?.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }

  public async updatePassword({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(updatePasswordValidator)

      const isOldPasswordValid = await hash.verify(user.password, payload.old_password)
      if (!isOldPasswordValid) return response.badRequest({ message: 'Old password is incorrect' })

      if (payload.new_password !== payload.confirm_password) {
        return response.badRequest({ message: 'New password and confirmation do not match' })
      }

      user.password = payload.new_password
      await user.save()

      return response.ok({ message: 'Password updated successfully' })
    } catch (error) {
      console.error(error)
      return response.status(500).send({ message: 'Internal server error', serve: null })
    }
  }

  public async deactivateAccount({ auth, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(deactivateAccountValidator)

      if (!payload.confirm) {
        return response.badRequest({ message: 'Account deactivation cancelled by user.', serve: null })
      }

      const user = auth.user
      if (!user) return response.unauthorized({ message: 'Unauthorized', serve: null })

      await user.delete()

      const tokens = await User.accessTokens.all(user)
      for (const token of tokens) {
        await User.accessTokens.delete(user, token.identifier)
      }

      return response.ok({ message: 'Your account has been deactivated successfully.', serve: true })
    } catch (error) {
      console.error(error)
      return response.status(500).send({ message: 'Failed to deactivate account.', serve: null })
    }
  }
}
