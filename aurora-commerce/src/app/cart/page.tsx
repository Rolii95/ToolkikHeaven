import React from 'react';
import { useCart } from '../../lib/cart'; // Assuming you have a cart context or hook

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleQuantityChange = (id, quantity) => {
    updateQuantity(id, quantity);
  };

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <ul>
            {cartItems.map((item) => (
              <li key={item.id} className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg">{item.name}</h2>
                  <p>Price: ${item.price.toFixed(2)}</p>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                    className="border rounded p-1 w-16"
                  />
                </div>
                <button onClick={() => handleRemove(item.id)} className="text-red-500">
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <h2 className="text-xl font-bold">Total: ${totalPrice.toFixed(2)}</h2>
            <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;