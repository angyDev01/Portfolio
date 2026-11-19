import { supabase } from '../lib/supabase'
import { directMessageSchema, getZodErrorMessage } from '../utils/security'
import type { ContactMessage, DirectMessagePayload } from '../types/database'
import { profileService } from './profileService'

export const contactService = {
  async submitDirectMessage(
    payload: DirectMessagePayload
  ): Promise<{ ok: boolean; message: string }> {
    const validation = directMessageSchema.safeParse(payload)
    if (!validation.success) {
      return {
        ok: false,
        message: getZodErrorMessage(validation.error),
      }
    }

    const cleanPayload = validation.data

    const profile = await profileService.getProfile()
    if (profile && profile.accept_direct_messages === false) {
      return {
        ok: false,
        message:
          'La réception de messages directs est momentanément suspendue. Veuillez me contacter par email.',
      }
    }

    try {
      const { error } = await supabase.from('contact_messages').insert([
        {
          name: cleanPayload.name,
          email: cleanPayload.email,
          phone: cleanPayload.phone,
          message: cleanPayload.message,
          is_read: false,
        },
      ])
      if (!error) {
        return {
          ok: true,
          message:
            'Votre message a été transmis directement sur le site. Je pourrai vous recontacter par email ou téléphone/WhatsApp.',
        }
      }
    } catch (err) {
      console.error('Error submitting direct message:', err)
    }

    return {
      ok: false,
      message: 'Impossible de transmettre votre message direct pour le moment. Veuillez réessayer.',
    }
  },

  async getAdminMessages(): Promise<{
    ok: boolean
    messages: ContactMessage[]
    unreadCount: number
  }> {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        const messages = data as ContactMessage[]
        const unreadCount = messages.filter((m) => !m.is_read).length
        return { ok: true, messages, unreadCount }
      }
    } catch (err) {
      console.error('Error fetching admin messages:', err)
    }

    return { ok: false, messages: [], unreadCount: 0 }
  },

  async setMessageReadStatus(
    id: string,
    is_read: boolean
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('contact_messages').update({ is_read }).eq('id', id)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour statut'
      return { ok: false, error: msg }
    }
  },

  async deleteMessage(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression message'
      return { ok: false, error: msg }
    }
  },
}
