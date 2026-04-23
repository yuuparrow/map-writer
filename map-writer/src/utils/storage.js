const KEY = 'mapwriter_layers_v1'

export function saveLayers(layers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(layers))
  } catch (e) {
    console.warn('保存失敗:', e)
  }
}

export function loadLayers() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearLayers() {
  localStorage.removeItem(KEY)
}
