import env from '#start/env'
import OpenAI from 'openai'

export type ProductMeta = {
  metaTitle: string
  metaDescription: string
  metaKeywords: string
}

export class SeoMetaService {
  private client(): OpenAI {
    return new OpenAI({ apiKey: env.get('OPENAI_API_KEY') })
  }

  private extractJson(text: string): any {
    const raw = String(text || '').trim()
    if (!raw) return {}

    try {
      return JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return JSON.parse(match[0])
        } catch {
          return {}
        }
      }
      return {}
    }
  }

  async generateProductMeta(input: {
    productName: string
    productDescription: string
  }): Promise<ProductMeta | null> {
    const { productName, productDescription } = input
    if (!productName || !productDescription) return null

    const apiKey = env.get('OPENAI_API_KEY')
    if (!apiKey) return null

    const prompt = `
Generate SEO meta tags for the following product with Indonesian language:
Product Name: ${productName}
Product Description: ${productDescription}

Provide the result in this JSON format:
{
  "metaTitle": "SEO optimized title",
  "metaDescription": "SEO optimized description",
  "metaKeywords": "comma-separated keywords"
}
    `.trim()

    try {
      const completion = await this.client().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      })

      const content = completion.choices[0]?.message?.content || ''
      const parsed = this.extractJson(content)

      const metaTitle = String(parsed.metaTitle || '').trim()
      const metaDescription = String(parsed.metaDescription || '').trim()
      const metaKeywords = String(parsed.metaKeywords || '').trim()

      if (!metaTitle && !metaDescription && !metaKeywords) return null
      return { metaTitle, metaDescription, metaKeywords }
    } catch (error) {
      console.error('Error generating meta tags:', error)
      return null
    }
  }
}
