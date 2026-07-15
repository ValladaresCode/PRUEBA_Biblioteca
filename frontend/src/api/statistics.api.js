import { statisticsApi } from './http'

export function getStatistics() {
  return statisticsApi.get('/statistics')
}
