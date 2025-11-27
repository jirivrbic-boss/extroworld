import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
	productId: string;
	name: string;
	price: number;
	image?: string;
	priceId?: string;
	size?: string;
	quantity: number;
	inStock?: boolean;
};

type ShippingMethod = "zasilkovna" | "address";

type Discount = {
	code?: string;
	percent?: number; // 100 for full discount
};

type CartState = {
	items: CartItem[];
	shippingMethod: ShippingMethod;
	discount?: Discount;
	addItem: (item: CartItem) => void;
	removeItem: (productId: string, size?: string) => void;
	updateQuantity: (productId: string, size: string | undefined, quantity: number) => void;
	clear: () => void;
	setShipping: (method: ShippingMethod) => void;
	applyDiscount: (discount: Discount | undefined) => void;
	total: () => number;
};

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			shippingMethod: "zasilkovna",
			discount: undefined,
			addItem: (item) =>
				set((state) => {
					const existingIndex = state.items.findIndex(
						(i) => i.productId === item.productId && i.size === item.size
					);
					if (existingIndex >= 0) {
						const updated = [...state.items];
						updated[existingIndex] = {
							...updated[existingIndex],
							quantity: updated[existingIndex].quantity + item.quantity
						};
						return { items: updated };
					}
					return { items: [...state.items, item] };
				}),
			removeItem: (productId, size) =>
				set((state) => ({
					items: state.items.filter((i) => !(i.productId === productId && i.size === size))
				})),
			updateQuantity: (productId, size, quantity) =>
				set((state) => ({
					items: state.items.map((i) =>
						i.productId === productId && i.size === size ? { ...i, quantity } : i
					)
				})),
			clear: () => set({ items: [], discount: undefined }),
			setShipping: (method) => set({ shippingMethod: method }),
			applyDiscount: (discount) => set({ discount }),
			total: () => {
				const subtotal = get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
				const discount = get().discount?.percent ?? 0;
				const discounted =
					discount > 0 ? Math.max(0, subtotal * (1 - discount / 100)) : subtotal;
				// Zásilkovna - lze doplnit fixní cenu v budoucnu, zatím 0
				return Math.round(discounted);
			}
		}),
		{
			name: "extro-cart-v1",
			storage: createJSONStorage(() => localStorage),
			// aby starší struktury nepadaly
			partialize: (state) => ({
				items: state.items,
				shippingMethod: state.shippingMethod,
				discount: state.discount
			})
		}
	)
);


