import type { MenuItem, MenuCategory } from "./types";

/** Fallback jika foto gagal dimuat — gambar mangkuk SVG inline */
export const IMG_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#1c3b2e"/><g stroke="#f3cd6f" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(325,225) scale(6.2)"><path d="M4 12.5h16c0 3.6-2.4 6.4-5.6 7.3l.1 1.2H9.5l.1-1.2C6.4 18.9 4 16.1 4 12.5Z"/><path d="M9 9.2c-.9-1-.9-2.1 0-3.2"/><path d="M12.5 9.2c-.9-1-.9-2.1 0-3.2"/><path d="M16 9.2c-.9-1-.9-2.1 0-3.2"/></g></svg>`
  );

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: "makanan", name: "Makanan Utama", category: "makanan", icon: "🍛", order: 1 },
  { id: "camilan", name: "Camilan", category: "camilan", icon: "🍢", order: 2 },
  { id: "dessert", name: "Dessert", category: "dessert", icon: "🍰", order: 3 },
  { id: "minuman", name: "Minuman", category: "minuman", icon: "🥤", order: 4 },
  { id: "lainnya", name: "Lainnya", category: "lainnya", icon: "🍽️", order: 5 },
];

export const MENU: MenuItem[] = [
  {
    id: "nasi-goreng",
    name: "Nasi Goreng Kampung",
    category: "makanan",
    price: 28000,
    desc: "Digoreng di atas bara arang, telur ceplok, ayam suwir, dan kerupuk kanji.",
    img: "https://image.qwenlm.ai/generated-images/4fb6d4a0-6b61-4715-b126-8eb070a9d94a/_result.png",
    popular: true,
    spicy: true,
    available: true,
  },
  {
    id: "sate-ayam",
    name: "Sate Ayam Madura",
    category: "makanan",
    price: 25000,
    desc: "10 tusuk sate bumbu kacang tanah sangrai, lontong, kecap, dan bawang goreng.",
    img: "https://image.qwenlm.ai/generated-images/7f310c1a-cc3e-4636-bc02-444fc9b4d94d/_result.png",
    popular: true,
    available: true,
  },
  {
    id: "rendang",
    name: "Rendang Sapi",
    category: "makanan",
    price: 38000,
    desc: "Dimasak 6 jam dengan santan kental dan rempah lengkap. Pedas hangat.",
    img: "https://image.qwenlm.ai/generated-images/7aff203b-d056-49ac-9420-4a33301f8654/_result.png",
    popular: true,
    spicy: true,
    available: true,
  },
  {
    id: "mie-goreng",
    name: "Mie Goreng Jawa",
    category: "makanan",
    price: 26000,
    desc: "Mie telur, kol, suwiran ayam kampung, telur orak-arik, taburan bawang goreng.",
    img: "https://image.qwenlm.ai/generated-images/b38cc465-77a2-45df-a658-6bc4edd642ed/_result.png",
    available: true,
  },
  {
    id: "gado-gado",
    name: "Gado-Gado Siram",
    category: "makanan",
    price: 22000,
    desc: "Sayur segar disiram saus kacang ulek, tahu, telur rebus, dan emping.",
    img: "https://image.qwenlm.ai/generated-images/1c17ba4b-5023-45d5-a4a5-c3b21c76b018/_result.png",
    available: true,
  },
  {
    id: "pisang-goreng",
    name: "Pisang Goreng Keju",
    category: "camilan",
    price: 16000,
    desc: "Pisang raja crispy, taburan keju cheddar parut, dan saus cokelat.",
    img: "https://image.qwenlm.ai/generated-images/34078c6f-b39a-4f88-8f18-db0d43242ec4/_result.png",
    available: true,
  },
  {
    id: "lumpia",
    name: "Lumpia Semarang",
    category: "camilan",
    price: 18000,
    desc: "Lumpia isi rebung dan udang, disajikan dengan saus asam manis.",
    img: "https://image.qwenlm.ai/generated-images/a8f2c3d1-9e4b-4c5a-b6d7-e8f9a0b1c2d3/_result.png",
    available: true,
  },
  {
    id: "es-campur",
    name: "Es Campur Spesial",
    category: "dessert",
    price: 20000,
    desc: "Campuran buah segar, cincau, nata de coco, susu, dan sirup.",
    img: "https://image.qwenlm.ai/generated-images/b9c3d4e2-0f5a-4d6b-c7e8-f9a0b1c2d3e4/_result.png",
    popular: true,
    available: true,
  },
  {
    id: "puding-mangga",
    name: "Puding Mangga",
    category: "dessert",
    price: 18000,
    desc: "Puding lembut dengan saus mangga asli dan whipped cream.",
    img: "https://image.qwenlm.ai/generated-images/c0d4e5f3-1a6b-4e7c-d8f9-a0b1c2d3e4f5/_result.png",
    available: true,
  },
  {
    id: "es-cendol",
    name: "Es Cendol Gula Aren",
    category: "minuman",
    price: 15000,
    desc: "Cendol pandan, santan segar, dan gula aren asli Banjarnegara.",
    img: "https://image.qwenlm.ai/generated-images/e1922df9-743a-44d3-9392-9456c2517528/_result.png",
    popular: true,
    available: true,
  },
  {
    id: "kopi",
    name: "Kopi Tubruk",
    category: "minuman",
    price: 12000,
    desc: "Robusta Temanggung diseduh tubruk, kental dan legit. Manis sesuai selera.",
    img: "https://image.qwenlm.ai/generated-images/cd6c7e25-9b8f-4d5d-bae8-50025372070f/_result.png",
    available: true,
  },
  {
    id: "es-jeruk",
    name: "Es Jeruk Peras",
    category: "minuman",
    price: 13000,
    desc: "Jeruk peras segar diperas dadakan, tanpa pengawet dan pemanis buatan.",
    img: "https://image.qwenlm.ai/generated-images/f065915d-7374-4f55-9d9b-966702ac50ed/_result.png",
    available: true,
  },
  {
    id: "teh-hangat",
    name: "Teh Hangat",
    category: "minuman",
    price: 8000,
    desc: "Teh melati hangat, nyaman di perut.",
    img: "https://image.qwenlm.ai/generated-images/d1e5f6a4-2b7c-4f8d-e9a0-b1c2d3e4f5a6/_result.png",
    available: true,
  },
];

export const CATEGORY_LABEL: Record<string, string> = {
  semua: "Semua",
  makanan: "Makanan",
  minuman: "Minuman",
  camilan: "Camilan",
  dessert: "Dessert",
  lainnya: "Lainnya",
};
