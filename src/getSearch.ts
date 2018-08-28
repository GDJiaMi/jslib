import qs from 'qs'

export default function getSearch(search: string) {
  search = search.startsWith('?') ? search.slice(1) : search
  return qs.parse(search)
}
