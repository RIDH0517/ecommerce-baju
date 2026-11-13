"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  sizePurchased: string;
  comment: string;
  date: string;
}

export interface ProductData {
  id: string;
  code: string;
  name: string;
  category: "Outerwear" | "T-Shirts" | "Jackets" | "Shirts" | "Denim";
  collection: string;
  isNewDrop?: boolean;
  price: number;
  oldPrice?: number;
  discount?: string;
  stock: number;
  image: string;
  description: string;
  specs: string[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
  category: string;
}

export const PRODUCTS_DATA: ProductData[] = [
  {
    id: "uk-01",
    code: "UK-26-HD01",
    name: "Signature Boxy Heavyweight Hoodie — Obsidian",
    category: "Outerwear",
    collection: "Monolith Archive AW26",
    isNewDrop: true,
    price: 389000,
    oldPrice: 649000,
    discount: "40% OFF",
    stock: 12,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=900",
    description:
      "Siluet boxy fit berstruktur tegas menggunakan material 100% Australian Cotton Fleece 420 GSM. Dirancang tanpa tali serut (drawcord-free hood) untuk proporsi bahu jatuh yang bersih dan modern.",
    specs: [
      "420 GSM 100% Heavyweight Cotton Fleece",
      "Pre-shrunk & Garment Washed",
      "Double-layered structured hood",
      "Ribbing manset padat 2x2",
    ],
  },
  {
    id: "uk-02",
    code: "UK-26-TS02",
    name: "Architectural Drop-Shoulder Tee — Washed Charcoal",
    category: "T-Shirts",
    collection: "Essential Uniform",
    isNewDrop: true,
    price: 189000,
    oldPrice: 320000,
    discount: "41% OFF",
    stock: 28,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900",
    description:
      "Kaos esensial harian dengan kerah mock-neck rapat dan potongan boxy. Menggunakan katun combed 280 GSM yang memberikan drape tegas tanpa menerawang.",
    specs: [
      "280 GSM Combed Compact Cotton",
      "High-density collar rib 2.8 cm",
      "Pigment enzyme wash finish",
      "Relaxed boxy fit",
    ],
  },
  {
    id: "uk-03",
    code: "UK-26-JK03",
    name: "Raw Workwear Denim Chore Jacket — Indigo Rinse",
    category: "Jackets",
    collection: "Kyoto Workwear Capsule",
    isNewDrop: true,
    price: 549000,
    oldPrice: 899000,
    discount: "39% OFF",
    stock: 7,
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&q=80&w=900",
    description:
      "Jaket kerja kontemporer berbahan 13.5 oz Kaihara-inspired selvedge denim. Dilengkapi tiga saku utilitas depan dan kancing logam matte.",
    specs: [
      "13.5 oz Rigid Cotton Denim",
      "Contrast tonal stitching",
      "Custom matte gunmetal hardware",
      "Unlined breathable construction",
    ],
  },
  {
    id: "uk-04",
    code: "UK-26-SH04",
    name: "Relaxed Poplin Atelier Shirt — Bone White",
    category: "Shirts",
    collection: "Essential Uniform",
    isNewDrop: false,
    price: 279000,
    oldPrice: 499000,
    discount: "44% OFF",
    stock: 19,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=900",
    description:
      "Kemeja lengan panjang berpotongan longgar dengan tekstur katun poplin yang renyah. Sangat ideal digunakan sebagai outer berlapis maupun kemeja formal minimalis.",
    specs: [
      "100% Organic Crisp Cotton Poplin",
      "Mother-of-pearl tonal buttons",
      "Single chest patch pocket",
      "Curved gusset hem",
    ],
  },
  {
    id: "uk-05",
    code: "UK-26-DN05",
    name: "Wide-Leg Pleated Carpenter Denim — Vintage Black",
    category: "Denim",
    collection: "Kyoto Workwear Capsule",
    isNewDrop: true,
    price: 469000,
    oldPrice: 750000,
    discount: "37% OFF",
    stock: 9,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900",
    description:
      "Celana denim siluet lebar dengan detail lipit depan (front pleats) yang menggabungkan estetika tailoring klasik dan fungsionalitas streetwear.",
    specs: [
      "14 oz Sulphur-Dyed Black Denim",
      "Wide straight-leg cut",
      "YKK heavy-duty brass zipper",
      "Reinforced back pockets",
    ],
  },
  {
    id: "uk-06",
    code: "UK-26-OT06",
    name: "Technical Nylon Coach Windbreaker — Forest Slate",
    category: "Outerwear",
    collection: "Monolith Archive AW26",
    isNewDrop: false,
    price: 429000,
    oldPrice: 690000,
    discount: "38% OFF",
    stock: 15,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=900",
    description:
      "Jaket pelindung angin berbahan nilon taslan tahan cipratan air (water-repellent) dengan lapisan dalam jaring bernapas dan tali pengatur di bagian bawah.",
    specs: [
      "100% Crinkle Matte Nylon Taslan",
      "DWR Water-Repellent Coating",
      "Adjustable hem drawcord",
      "Raglan sleeve construction",
    ],
  },
];

const INITIAL_REVIEWS: Record<string, ReviewItem[]> = {
  "uk-01": [
    {
      id: "rev-1",
      userName: "Dimas Prakoso",
      rating: 5,
      sizePurchased: "L",
      comment: "Ketebalan kain 420 GSM-nya benar-benar terasa mewah dan jatuhnya pas di badan. Kualitas jahitan setara brand luar.",
      date: "18 Okt 2026",
    },
    {
      id: "rev-2",
      userName: "Kevin Wijaya",
      rating: 5,
      sizePurchased: "M",
      comment: "Cuttingan boxy-nya proporsional, bagian kupluk tegak dan tidak lemas.",
      date: "21 Okt 2026",
    },
  ],
  "uk-02": [
    {
      id: "rev-3",
      userName: "Raka Aditya",
      rating: 5,
      sizePurchased: "L",
      comment: "Kerahnya rapat dan tidak mudah melar setelah dicuci. Warna washed charcoal-nya sangat elegan.",
      date: "19 Okt 2026",
    },
  ],
};

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, delta: number) => void;
  totalPrice: number;
  totalItems: number;
  isLoggedIn: boolean;
  setLoggedInState: (status: boolean, email?: string) => void;
  userEmail: string;
  purchasedIds: string[];
  markAsPurchased: (productIds: string[]) => void;
  reviews: Record<string, ReviewItem[]>;
  addReview: (productId: string, rating: number, sizePurchased: string, comment: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("Pelanggan Terverifikasi");
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewItem[]>>(INITIAL_REVIEWS);

  const [toastProduct, setToastProduct] = useState<{
    name: string;
    size: string;
    image: string;
  } | null>(null);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("urbankamen_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedAuth = localStorage.getItem("urbankamen_logged_in");
      const hasCookie = document.cookie.includes("session_token=");
      if (savedAuth === "true" || hasCookie) {
        setIsLoggedIn(true);
      }

      const savedEmail = localStorage.getItem("urbankamen_user_email");
      if (savedEmail) setUserEmail(savedEmail);

      const savedPurchases = localStorage.getItem("urbankamen_purchased");
      if (savedPurchases) setPurchasedIds(JSON.parse(savedPurchases));

      const savedReviews = localStorage.getItem("urbankamen_reviews");
      if (savedReviews) setReviews(JSON.parse(savedReviews));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("urbankamen_cart", JSON.stringify(cart));
  }, [cart]);

  const setLoggedInState = (status: boolean, email?: string) => {
    setIsLoggedIn(status);
    if (status) {
      localStorage.setItem("urbankamen_logged_in", "true");
      if (email) {
        localStorage.setItem("urbankamen_user_email", email);
        setUserEmail(email);
      }
    } else {
      localStorage.removeItem("urbankamen_logged_in");
      localStorage.removeItem("urbankamen_user_email");
    }
  };

  const addToCart = (product: Omit<CartItem, "quantity">, qty = 1) => {
    const loggedInNow =
      isLoggedIn ||
      localStorage.getItem("urbankamen_logged_in") === "true" ||
      document.cookie.includes("session_token=");

    if (!loggedInNow) {
      router.push("/login");
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.id === product.id && i.size === product.size
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      return [...prev, { ...product, quantity: qty }];
    });

    setToastProduct({
      name: product.name,
      size: product.size,
      image: product.image,
    });

    setTimeout(() => {
      setToastProduct(null);
    }, 3500);
  };

  const removeFromCart = (id: string, size: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  };

  const updateQuantity = (id: string, size: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id && item.size === size) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      })
    );
  };

  const markAsPurchased = (productIds: string[]) => {
    setPurchasedIds((prev) => {
      const updated = Array.from(new Set([...prev, ...productIds]));
      localStorage.setItem("urbankamen_purchased", JSON.stringify(updated));
      return updated;
    });
  };

  const addReview = (
    productId: string,
    rating: number,
    sizePurchased: string,
    comment: string
  ) => {
    const displayName = userEmail.includes("@")
      ? userEmail.split("@")[0]
      : userEmail;

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      userName: displayName,
      rating,
      sizePurchased,
      comment,
      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    setReviews((prev) => {
      const currentList = prev[productId] || [];
      const updated = { ...prev, [productId]: [newReview, ...currentList] };
      localStorage.setItem("urbankamen_reviews", JSON.stringify(updated));
      return updated;
    });
  };

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalPrice,
        totalItems,
        isLoggedIn,
        setLoggedInState,
        userEmail,
        purchasedIds,
        markAsPurchased,
        reviews,
        addReview,
      }}
    >
      {children}

      {/* TOAST NOTIFICATION SAAT TAMBAH KE KERANJANG */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${
          toastProduct && !isCartOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`}
      >
        {toastProduct && (
          <div className="flex items-center space-x-4 bg-neutral-950 text-white p-3 pr-4 shadow-2xl border border-neutral-800 max-w-sm">
            <img
              src={toastProduct.image}
              alt={toastProduct.name}
              className="h-14 w-11 object-cover bg-neutral-900 flex-shrink-0"
            />
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-400">
                Added to Bag — Size {toastProduct.size}
              </p>
              <p className="text-xs font-semibold truncate mt-0.5 font-[Montserrat,sans-serif]">
                {toastProduct.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setToastProduct(null);
                setIsCartOpen(true);
              }}
              className="border border-neutral-700 hover:border-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors cursor-pointer flex-shrink-0"
            >
              View Bag
            </button>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart wajib digunakan di dalam CartProvider");
  return context;
};