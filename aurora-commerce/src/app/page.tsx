import React from 'react';
import ProductGrid from '../components/ProductGrid';

const HomePage = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to Aurora Commerce</h1>
      <p className="text-lg mb-4">Your one-stop shop for all your needs!</p>
      <ProductGrid />
    </main>
  );
};

export default HomePage;