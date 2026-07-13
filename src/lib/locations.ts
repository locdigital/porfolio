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
    description: "Island life at its most untouched --- turquoise water, fishing boats, and red-rock cliffs.",
    photos: [
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hPHpTTj6stjCAvHqacRQKpwg5kVIlTiJY6SnW", alt: "Phú Quý --- photo 1", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hiN8pR7wbmU9pOiYE6G824a0BWCXcl37yufzH", alt: "Phú Quý --- photo 2", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hilCFGvzwbmU9pOiYE6G824a0BWCXcl37yufz", alt: "Phú Quý --- photo 3", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hW0XZEXC2QiOP6pqzN9dESsBlGD0KV7FZvL2C", alt: "Phú Quý --- photo 4", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hRJwFH0xhAX3dzFvPH6M2nYmLcSEDt9j8BQye", alt: "Phú Quý --- photo 5", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hKaZ3StvWeLQqSKNwarCDg0EFydvVs3BXGZR5", alt: "Phú Quý --- photo 6", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hV4CzSTiW6tUiNOoXB108SdsMHZayFfJrLGkP", alt: "Phú Quý --- photo 7", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hUs5SfWrYtE95AXOuIBLNQ3GyKFm2qSCfe1MP", alt: "Phú Quý --- photo 8", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hJVll2aCKGPnLEw4QeZijRaqKpHdbcxS3TC1I", alt: "Phú Quý --- photo 9", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hHCrTBIeQp1bPln5ZfBa2gk4uX9OGVzCi6Fvh", alt: "Phú Quý --- photo 10", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hlO2VUUIVosc2meTERZLnJqOQNKtDhCdYfW5b", alt: "Phú Quý --- photo 11", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hGGEMa7BcjrVF5sU9WdBP1Zmn2bOHaiQSKAwk", alt: "Phú Quý --- photo 12", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59h4W7KEUt2SauPZhDd1JkterOsqjvc6In5YK9L", alt: "Phú Quý --- photo 13", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hnelFc7J5TFbsKzkHujxQqSNBdEect3LIpPhg", alt: "Phú Quý --- photo 14", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59h3Eob5mDasckjKiLzdrWVS5CtlQufPeYbDvX6", alt: "Phú Quý --- photo 15", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59h7GjvhS54ylS30dX98IkbwjPC6iqWEvHMFax2", alt: "Phú Quý --- photo 16", w: 1920, h: 1280 },
    ],
  },
  {
    id: "phu-yen",
    name: "Phú Yên",
    slug: "phu-yen",
    description: "Golden hour on Gành Đá Đĩa, winding roads along the coast, and the bluest sky.",
    photos: [
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hUni2CYtE95AXOuIBLNQ3GyKFm2qSCfe1MP64", alt: "Phú Yên --- photo 1", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hMe6TXEU15DKkGrxHn3sZOlpRXP4veiquwVQB", alt: "Phú Yên --- photo 2", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hDhfs3074Q021dYenszMLNrbPgXCUpWoif9D4", alt: "Phú Yên --- photo 3", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hJ1yejlKGPnLEw4QeZijRaqKpHdbcxS3TC1I7", alt: "Phú Yên --- photo 4", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hilCFGvzwbmU9pOiYE6G824a0BWCXcl37yufz", alt: "Phú Yên --- photo 5", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hW0XZEXC2QiOP6pqzN9dESsBlGD0KV7FZvL2C", alt: "Phú Yên --- photo 6", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hKaZ3StvWeLQqSKNwarCDg0EFydvVs3BXGZR5", alt: "Phú Yên --- photo 7", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hV4CzSTiW6tUiNOoXB108SdsMHZayFfJrLGkP", alt: "Phú Yên --- photo 8", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hUs5SfWrYtE95AXOuIBLNQ3GyKFm2qSCfe1MP", alt: "Phú Yên --- photo 9", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hJVll2aCKGPnLEw4QeZijRaqKpHdbcxS3TC1I", alt: "Phú Yên --- photo 10", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hHfaU2DeQp1bPln5ZfBa2gk4uX9OGVzCi6Fvh", alt: "Phú Yên --- photo 11", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hjHITg94KrOISaFPdMJw9ClQ8qRiYZespBUGb", alt: "Phú Yên --- photo 12", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hTXqw6Dl2OjWmzQ4oDLka9nlegFi1h3xyH6Zw", alt: "Phú Yên --- photo 13", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hzaRrjkNrQN89V1S2GcyZlRdnh3U0J4kfWYAX", alt: "Phú Yên --- photo 14", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hWeBqb32QiOP6pqzN9dESsBlGD0KV7FZvL2Cr", alt: "Phú Yên --- photo 15", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hIGEETWlPNf9shR3SkuyHBoXviJTb1wmZFOjM", alt: "Phú Yên --- photo 16", w: 1280, h: 1920 },
    ],
  },
  {
    id: "quy-nhon",
    name: "Quy Nhơn",
    slug: "quy-nhon",
    description: "Hidden beaches, Cham towers at dusk, and long stretches of empty white sand.",
    photos: [
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59h7sxN4c54ylS30dX98IkbwjPC6iqWEvHMFax2", alt: "Quy Nhơn --- photo 1", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hboZJitkAEiMVyIw93QvFdHjfCaP5rqRXL4bO", alt: "Quy Nhơn --- photo 2", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hDhfs3074Q021dYenszMLNrbPgXCUpWoif9D4", alt: "Quy Nhơn --- photo 3", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hJ1yejlKGPnLEw4QeZijRaqKpHdbcxS3TC1I7", alt: "Quy Nhơn --- photo 4", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hPHpTTj6stjCAvHqacRQKpwg5kVIlTiJY6SnW", alt: "Quy Nhơn --- photo 5", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hiN8pR7wbmU9pOiYE6G824a0BWCXcl37yufzH", alt: "Quy Nhơn --- photo 6", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hilCFGvzwbmU9pOiYE6G824a0BWCXcl37yufz", alt: "Quy Nhơn --- photo 7", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hW0XZEXC2QiOP6pqzN9dESsBlGD0KV7FZvL2C", alt: "Quy Nhơn --- photo 8", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hZXz81DsiYJsWR4ITvHoQh9ASwb7rDt13X8jq", alt: "Quy Nhơn --- photo 9", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hjMFy5794KrOISaFPdMJw9ClQ8qRiYZespBUG", alt: "Quy Nhơn --- photo 10", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hiUHq23wbmU9pOiYE6G824a0BWCXcl37yufzH", alt: "Quy Nhơn --- photo 11", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hHpUAk1eQp1bPln5ZfBa2gk4uX9OGVzCi6Fvh", alt: "Quy Nhơn --- photo 12", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hKRf3IuvWeLQqSKNwarCDg0EFydvVs3BXGZR5", alt: "Quy Nhơn --- photo 13", w: 1280, h: 1920 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hDe2T9r4Q021dYenszMLNrbPgXCUpWoif9D4l", alt: "Quy Nhơn --- photo 14", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hX881hg4StspGgq204jCZLK86PEcraN5Bviwm", alt: "Quy Nhơn --- photo 15", w: 1920, h: 1280 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hIyNcxnWlPNf9shR3SkuyHBoXviJTb1wmZFOj", alt: "Quy Nhơn --- photo 16", w: 4032, h: 6048 },
    ],
  },
  {
    id: "da-lat",
    name: "Đà Lạt",
    slug: "da-lat",
    description: "Pine forests in the mist, flower fields, and the cool air of Vietnam's highland city.",
    photos: [
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59han9lzmyOH490TilXyexRchUNGmAMZLwKkFvI", alt: "Đà Lạt --- photo 1", w: 4032, h: 6048 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hwIAk7zhTQDH0hL5Ild1c8EfBpZCgP4y2MATX", alt: "Đà Lạt --- photo 2", w: 2636, h: 3248 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hJjw2NUKGPnLEw4QeZijRaqKpHdbcxS3TC1I7", alt: "Đà Lạt --- photo 3", w: 4032, h: 6048 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59h5K2zv5enzPCHf8h9G7Slp6scrUVuR10JngFB", alt: "Đà Lạt --- photo 4", w: 4032, h: 6048 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59h6IH6b6Mgx3rw7LHmJhekT2K4Uy81ajfobtSv", alt: "Đà Lạt --- photo 5", w: 3103, h: 4655 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hwgzxfZTQDH0hL5Ild1c8EfBpZCgP4y2MATXV", alt: "Đà Lạt --- photo 6", w: 4032, h: 6048 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hvDNQQMVakbn1yzps80IBrPeT6cf5toMx9Zuj", alt: "Đà Lạt --- photo 7", w: 4032, h: 6048 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hfJJXL6PFsdIMAkx05cnwWRQUPCSG96p2NyK4", alt: "Đà Lạt --- photo 8", w: 4032, h: 6048 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hjZCZm294KrOISaFPdMJw9ClQ8qRiYZespBUG", alt: "Đà Lạt --- photo 9", w: 6048, h: 4032 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hUsRSeMtYtE95AXOuIBLNQ3GyKFm2qSCfe1MP", alt: "Đà Lạt --- photo 10", w: 4032, h: 6048 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hvQpylaVakbn1yzps80IBrPeT6cf5toMx9Zuj", alt: "Đà Lạt --- photo 11", w: 6048, h: 4032 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hze8km6NrQN89V1S2GcyZlRdnh3U0J4kfWYAX", alt: "Đà Lạt --- photo 12", w: 6048, h: 4032 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hifeCJHwbmU9pOiYE6G824a0BWCXcl37yufzH", alt: "Đà Lạt --- photo 13", w: 665, h: 1184 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hipZnXNwbmU9pOiYE6G824a0BWCXcl37yufzH", alt: "Đà Lạt --- photo 14", w: 3368, h: 6000 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hbQBtISkAEiMVyIw93QvFdHjfCaP5rqRXL4bO", alt: "Đà Lạt --- photo 15", w: 6000, h: 3368 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hN6uE9Uhf7Rf1o6cym3JxPheDqvCUXEKpSOBr", alt: "Đà Lạt --- photo 16", w: 1437, h: 2560 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hl0erRDIVosc2meTERZLnJqOQNKtDhCdYfW5b", alt: "Đà Lạt --- photo 17", w: 1437, h: 2560 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hJVAJ10UKGPnLEw4QeZijRaqKpHdbcxS3TC1I", alt: "Đà Lạt --- photo 18", w: 1437, h: 2560 },
      { src: "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hBgRol53shUYKSXcxweBJqFof4TbyZjL93Ou1", alt: "Đà Lạt --- photo 19", w: 3368, h: 6000 },
    ],
  },
  {
    id: "ha-giang",
    name: "Hà Giang",
    slug: "ha-giang",
    description: "",
    photos: [],
  },
  {
    id: "ha-noi",
    name: "Hà Nội",
    slug: "ha-noi",
    description: "",
    photos: [],
  },
  {
    id: "binh-phuoc",
    name: "Bình Phước",
    slug: "binh-phuoc",
    description: "",
    photos: [],
  },
  {
    id: "ho-chi-minh-city",
    name: "H- Chí Minh City",
    slug: "ho-chi-minh-city",
    description: "",
    photos: [],
  },
  {
    id: "my-tho",
    name: "Mỹ Tho",
    slug: "my-tho",
    description: "",
    photos: [],
  },
];
