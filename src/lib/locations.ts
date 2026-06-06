export interface Photo {
  src: string;
  alt: string;
  w: number;
  h: number;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  description: string;
  photos: Photo[];
}

export const locations: Location[] = [
  {
    id: "phu-quy",
    name: "Phú Quý",
    slug: "phu-quy",
    description: "Island life at its most untouched — turquoise water, fishing boats, and red-rock cliffs.",
    photos: [
      { src: "/assets/photos/img-portfolio/photo-1.jpg", alt: "Phú Quý — photo 1", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-2.jpg", alt: "Phú Quý — photo 2", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-4.jpg", alt: "Phú Quý — photo 3", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-6.jpg", alt: "Phú Quý — photo 4", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-3.jpg", alt: "Phú Quý — photo 5", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-7.jpg", alt: "Phú Quý — photo 6", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-8.jpg", alt: "Phú Quý — photo 7", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-9.jpg", alt: "Phú Quý — photo 8", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-10.jpg", alt: "Phú Quý — photo 9", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-16.jpg", alt: "Phú Quý — photo 10", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-17.jpg", alt: "Phú Quý — photo 11", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-18.jpg", alt: "Phú Quý — photo 12", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-19.jpg", alt: "Phú Quý — photo 13", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-20.jpg", alt: "Phú Quý — photo 14", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-21.jpg", alt: "Phú Quý — photo 15", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-22.jpg", alt: "Phú Quý — photo 16", w: 1920, h: 1280 },
    ],
  },
  {
    id: "phu-yen",
    name: "Phú Yên",
    slug: "phu-yen",
    description: "Golden hour on Gành Đá Đĩa, winding roads along the coast, and the bluest sky.",
    photos: [
      { src: "/assets/photos/img-portfolio/photo-5.jpg", alt: "Phú Yên — photo 1", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-13.jpg", alt: "Phú Yên — photo 2", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-11.jpg", alt: "Phú Yên — photo 3", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-12.jpg", alt: "Phú Yên — photo 4", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-4.jpg", alt: "Phú Yên — photo 5", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-6.jpg", alt: "Phú Yên — photo 6", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-7.jpg", alt: "Phú Yên — photo 7", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-8.jpg", alt: "Phú Yên — photo 8", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-9.jpg", alt: "Phú Yên — photo 9", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-10.jpg", alt: "Phú Yên — photo 10", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-23.jpg", alt: "Phú Yên — photo 11", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-24.jpg", alt: "Phú Yên — photo 12", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-25.jpg", alt: "Phú Yên — photo 13", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-26.jpg", alt: "Phú Yên — photo 14", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-27.jpg", alt: "Phú Yên — photo 15", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-28.jpg", alt: "Phú Yên — photo 16", w: 1280, h: 1920 },
    ],
  },
  {
    id: "quy-nhon",
    name: "Quy Nhơn",
    slug: "quy-nhon",
    description: "Hidden beaches, Cham towers at dusk, and long stretches of empty white sand.",
    photos: [
      { src: "/assets/photos/img-portfolio/photo-14.jpg", alt: "Quy Nhơn — photo 1", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-15.jpg", alt: "Quy Nhơn — photo 2", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-11.jpg", alt: "Quy Nhơn — photo 3", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-12.jpg", alt: "Quy Nhơn — photo 4", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-1.jpg", alt: "Quy Nhơn — photo 5", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-2.jpg", alt: "Quy Nhơn — photo 6", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-4.jpg", alt: "Quy Nhơn — photo 7", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-6.jpg", alt: "Quy Nhơn — photo 8", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-29.jpg", alt: "Quy Nhơn — photo 9", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-30.jpg", alt: "Quy Nhơn — photo 10", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-31.jpg", alt: "Quy Nhơn — photo 11", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-32.jpg", alt: "Quy Nhơn — photo 12", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-33.jpg", alt: "Quy Nhơn — photo 13", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-34.jpg", alt: "Quy Nhơn — photo 14", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-35.jpg", alt: "Quy Nhơn — photo 15", w: 1920, h: 1280 },
    ],
  },
  {
    id: "da-lat",
    name: "Đà Lạt",
    slug: "da-lat",
    description: "Pine forests in the mist, flower fields, and the cool air of Vietnam's highland city.",
    photos: [
      { src: "/assets/photos/img-portfolio/photo-3.jpg", alt: "Đà Lạt — photo 1", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-5.jpg", alt: "Đà Lạt — photo 2", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-13.jpg", alt: "Đà Lạt — photo 3", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-7.jpg", alt: "Đà Lạt — photo 4", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-8.jpg", alt: "Đà Lạt — photo 5", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-9.jpg", alt: "Đà Lạt — photo 6", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-36.jpg", alt: "Đà Lạt — photo 7", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-37.jpg", alt: "Đà Lạt — photo 8", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-38.jpg", alt: "Đà Lạt — photo 9", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-39.jpg", alt: "Đà Lạt — photo 10", w: 1280, h: 1920 },
      { src: "/assets/photos/img-portfolio/photo-40.jpg", alt: "Đà Lạt — photo 11", w: 1920, h: 1280 },
      { src: "/assets/photos/img-portfolio/photo-41.jpg", alt: "Đà Lạt — photo 12", w: 1920, h: 1279 },
    ],
  },
];
