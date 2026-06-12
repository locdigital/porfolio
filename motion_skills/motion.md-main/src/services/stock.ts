import { createApi } from 'unsplash-js'
import nodeFetch from 'node-fetch'
import axios from 'axios'
import { StockConfig } from './index'

export class StockService {
  private unsplash
  private storyblocksApiKey: string

  constructor(config: StockConfig) {
    if (!config.unsplashAccessKey) {
      throw new Error('Unsplash access key is required')
    }
    if (!config.storyblocksApiKey) {
      throw new Error('Storyblocks API key is required')
    }

    this.unsplash = createApi({
      accessKey: config.unsplashAccessKey,
      fetch: nodeFetch as any,
    })
    this.storyblocksApiKey = config.storyblocksApiKey
  }

  async getVideo(query: string, quality: '4k' | 'hd' | 'preview' = '4k') {
    try {
      const response = await axios.get('https://api.storyblocks.com/api/v1/video/search', {
        params: {
          query,
          page: 1,
          per_page: 1,
          keywords: query,
          content_type: quality,
        },
        headers: {
          Authorization: `Bearer ${this.storyblocksApiKey}`,
        },
      })

      if (!response.data.results?.length) {
        throw new Error('No videos found')
      }

      return {
        url: response.data.results[0].url,
        preview: response.data.results[0].preview_url,
        thumbnail: response.data.results[0].thumbnail_url,
        title: response.data.results[0].title,
        duration: response.data.results[0].duration,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch video: ${error.message}`)
      }
      throw new Error('Failed to fetch video: Unknown error')
    }
  }

  async getImage(query: string, quality: 'regular' | 'full' | 'thumb' = 'regular') {
    try {
      const result = await this.unsplash.search.getPhotos({
        query,
        perPage: 1,
        orientation: 'landscape',
      })

      if (!result.response?.results?.length) {
        throw new Error('No images found')
      }

      const photo = result.response.results[0]
      return {
        url: photo.urls[quality],
        credit: `Photo by ${photo.user.name} on Unsplash`,
        title: photo.description || photo.alt_description || query,
        width: photo.width,
        height: photo.height,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch image: ${error.message}`)
      }
      throw new Error('Failed to fetch image: Unknown error')
    }
  }
}
