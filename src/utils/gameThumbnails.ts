/**
 * Utility to provide authentic preschool illustrative thumbnails for all games.
 * Guarantees that no game ever displays an empty monochrome box with a single letter.
 */

export const PRESET_THUMBNAILS = {
  tim_chu_cai: '/assets/aistudio/game_thumb_tim_chu_cai.png',
  keo_tha: '/assets/aistudio/game_thumb_keo_tha.png',
  dua_xe: '/assets/aistudio/game_thumb_dua_xe.png',
  hinh_dang: '/assets/aistudio/game_thumb_hinh_dang.png',
  ai_nhanh_hon: '/assets/aistudio/game_thumb_ai_nhanh_hon.png',
  tim_dung_hinh: '/assets/aistudio/game_thumb_tim_dung_hinh.png',
  vong_quay: '/assets/aistudio/game_thumb_vong_quay.png',
};

export function getGameThumbnail(game?: {
  id?: string;
  title?: string;
  category?: string;
  coverImage?: string;
}): string {
  if (!game) return PRESET_THUMBNAILS.tim_chu_cai;

  if (game.coverImage && game.coverImage.trim() !== '') {
    return game.coverImage;
  }

  const id = (game.id || '').toLowerCase();
  const title = (game.title || '').toLowerCase();
  const category = (game.category || '').toLowerCase();

  // Match by ID
  if (id.includes('tim_chu_cai') || id.includes('chu_cai')) return PRESET_THUMBNAILS.tim_chu_cai;
  if (id.includes('keo_tha') || id.includes('drag')) return PRESET_THUMBNAILS.keo_tha;
  if (id.includes('dua_xe') || id.includes('dua_thuyen')) return PRESET_THUMBNAILS.dua_xe;
  if (id.includes('hinh_dang') || id.includes('shape')) return PRESET_THUMBNAILS.hinh_dang;
  if (id.includes('ai_nhanh_hon') || id.includes('speed')) return PRESET_THUMBNAILS.ai_nhanh_hon;
  if (id.includes('tim_dung_hinh') || id.includes('con_vat')) return PRESET_THUMBNAILS.tim_dung_hinh;
  if (id.includes('vong_quay')) return PRESET_THUMBNAILS.vong_quay;

  // Match by Title & Category
  if (
    title.includes('chữ cái') ||
    title.includes('tìm chữ') ||
    title.includes('chữ h') ||
    title.includes('chữ k') ||
    title.includes('chữ u') ||
    title.includes('chữ a') ||
    category.includes('chữ')
  ) {
    return PRESET_THUMBNAILS.tim_chu_cai;
  }

  if (
    title.includes('kéo thả') ||
    title.includes('ghép từ') ||
    title.includes('phân loại') ||
    title.includes('ô chữ') ||
    category.includes('phân loại')
  ) {
    return PRESET_THUMBNAILS.keo_tha;
  }

  if (
    title.includes('đua xe') ||
    title.includes('đua thuyền') ||
    title.includes('tri thức') ||
    title.includes('về đích')
  ) {
    return PRESET_THUMBNAILS.dua_xe;
  }

  if (
    title.includes('hình dạng') ||
    title.includes('hình tròn') ||
    title.includes('hình vuông') ||
    title.includes('hình học') ||
    category.includes('hình')
  ) {
    return PRESET_THUMBNAILS.hinh_dang;
  }

  if (
    title.includes('ai nhanh') ||
    title.includes('nhanh hơn') ||
    title.includes('đố vui') ||
    title.includes('phản xạ')
  ) {
    return PRESET_THUMBNAILS.ai_nhanh_hon;
  }

  if (
    title.includes('tìm đúng hình') ||
    title.includes('kính lúp') ||
    title.includes('con vật') ||
    title.includes('động vật') ||
    category.includes('vật')
  ) {
    return PRESET_THUMBNAILS.tim_dung_hinh;
  }

  if (
    title.includes('vòng quay') ||
    title.includes('may mắn') ||
    title.includes('quay số')
  ) {
    return PRESET_THUMBNAILS.vong_quay;
  }

  if (
    title.includes('số') ||
    title.includes('đếm') ||
    title.includes('toán') ||
    category.includes('số') ||
    category.includes('toán')
  ) {
    return PRESET_THUMBNAILS.hinh_dang;
  }

  // Consistent pleasant cycle across presets based on string hash
  const str = (game.title || '') + (game.id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const keys = Object.values(PRESET_THUMBNAILS);
  return keys[Math.abs(hash) % keys.length];
}
